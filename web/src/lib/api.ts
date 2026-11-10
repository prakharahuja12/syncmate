import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './constants';
import { tokenStorage } from './tokenStorage';
import { useAuthStore } from '../stores/authStore';
import { ApiErrorDetail, ApiErrorResponse, RefreshResponse } from '../types/api';

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: ApiErrorDetail[];

  constructor(message: string, code = 'INTERNAL', statusCode = 500, details?: ApiErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/signup') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        const errorData = error.response.data?.error;
        return Promise.reject(
          new ApiError(
            errorData?.message || 'Authentication failed',
            errorData?.code || 'UNAUTHORIZED',
            401,
            errorData?.details
          )
        );
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const refreshRes = await axios.post<{ success: boolean; data: RefreshResponse }>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshRes.data.data;
        useAuthStore.getState().setAccessToken(newAccessToken);
        tokenStorage.setRefreshToken(newRefreshToken);

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().clearSession();
        return Promise.reject(
          new ApiError('Session expired. Please log in again.', 'TOKEN_EXPIRED', 401)
        );
      } finally {
        isRefreshing = false;
      }
    }

    const errorData = error.response?.data?.error;
    const statusCode = error.response?.status || 500;
    const message = errorData?.message || error.message || 'An unexpected error occurred';
    const code = errorData?.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL');

    return Promise.reject(new ApiError(message, code, statusCode, errorData?.details));
  }
);

