import { apiClient } from '../../lib/api';
import {
  ApiResponse,
  User,
  GoogleIntegrationStatus,
  GooglePreferences,
} from '../../types/api';

export interface UpdateProfilePayload {
  name?: string;
  avatarColor?: string;
  timezone?: string;
}

export const settingsApi = {
  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<User>>('/users/me');
    return res.data.data;
  },

  async updateProfile(data: UpdateProfilePayload): Promise<User> {
    const res = await apiClient.patch<ApiResponse<User>>('/users/me', data);
    return res.data.data;
  },

  async getGoogleStatus(): Promise<GoogleIntegrationStatus> {
    const res = await apiClient.get<ApiResponse<GoogleIntegrationStatus>>(
      '/integrations/google/status'
    );
    return res.data.data;
  },

  async getGoogleAuthUrl(platform = 'web'): Promise<{ url: string }> {
    const res = await apiClient.get<ApiResponse<{ url: string }>>(
      '/integrations/google/auth-url',
      {
        params: { platform },
      }
    );
    return res.data.data;
  },

  async updateGooglePreferences(
    preferences: Partial<GooglePreferences>
  ): Promise<GooglePreferences> {
    const res = await apiClient.patch<ApiResponse<GooglePreferences>>(
      '/integrations/google/preferences',
      preferences
    );
    return res.data.data;
  },

  async syncGoogleNow(): Promise<{ syncedCount: number }> {
    const res = await apiClient.post<ApiResponse<{ syncedCount: number }>>(
      '/integrations/google/sync-now'
    );
    return res.data.data;
  },

  async disconnectGoogle(removeEvents = false): Promise<void> {
    await apiClient.delete('/integrations/google', {
      params: { removeEvents },
    });
  },
};
