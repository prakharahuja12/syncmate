import { apiClient } from '../../lib/api';
import {
  ApiResponse,
  User,
  UserSettings,
  GoogleIntegrationStatus,
  GooglePreferences,
} from '../../types/api';

export interface UpdateUserInput {
  name?: string;
  avatarColor?: string;
  timezone?: string;
  settings?: UserSettings;
}

export const settingsApi = {
  async updateUser(data: UpdateUserInput): Promise<User> {
    const res = await apiClient.patch<ApiResponse<User>>('/users/me', data);
    return res.data.data;
  },

  async getGoogleStatus(): Promise<GoogleIntegrationStatus> {
    const res = await apiClient.get<ApiResponse<GoogleIntegrationStatus>>(
      '/integrations/google/status'
    );
    return res.data.data;
  },

  async getGoogleAuthUrl(): Promise<string> {
    const res = await apiClient.get<ApiResponse<{ url: string }>>(
      '/integrations/google/auth-url',
      { params: { platform: 'mobile' } }
    );
    return res.data.data.url;
  },

  async updateGooglePreferences(preferences: Partial<GooglePreferences>): Promise<GooglePreferences> {
    const res = await apiClient.patch<ApiResponse<GooglePreferences>>(
      '/integrations/google/preferences',
      preferences
    );
    return res.data.data;
  },

  async syncGoogleNow(): Promise<void> {
    await apiClient.post('/integrations/google/sync-now');
  },

  async disconnectGoogle(removeEvents = false): Promise<void> {
    await apiClient.delete('/integrations/google', {
      params: { removeEvents },
    });
  },
};

