import { apiClient } from '../../lib/api';
import { ApiResponse, AuthResponse, AuthMeResponse, RefreshResponse } from '../../types/api';
import { LoginFormData, SignupFormData } from './schema';
import { secureStorage } from '../../lib/secureStorage';

export const authApi = {
  async signup(data: SignupFormData): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', data);
    return res.data.data;
  },

  async login(data: LoginFormData): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  async getMe(accessToken?: string): Promise<AuthMeResponse> {
    const res = await apiClient.get<ApiResponse<AuthMeResponse>>('/auth/me', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {}
  },
};

