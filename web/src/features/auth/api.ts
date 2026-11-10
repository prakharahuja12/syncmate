import { apiClient } from '../../lib/api';
import { ApiResponse, AuthResponse, AuthMeResponse } from '../../types/api';
import { LoginFormData, SignupFormData } from './schema';
import { tokenStorage } from '../../lib/tokenStorage';

export const authApi = {
  async signup(data: SignupFormData): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', data);
    return res.data.data;
  },

  async login(data: LoginFormData): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  async getMe(): Promise<AuthMeResponse> {
    const res = await apiClient.get<ApiResponse<AuthMeResponse>>('/auth/me');
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch {}
  },
};
