import { apiClient } from '../../lib/api';
import {
  ApiResponse,
  NotificationItem,
  NotificationUnreadCountResponse,
} from '../../types/api';

export interface GetNotificationsParams {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export const notificationsApi = {
  async getNotifications(params?: GetNotificationsParams): Promise<NotificationItem[]> {
    const res = await apiClient.get<ApiResponse<NotificationItem[]>>('/notifications', {
      params,
    });
    return res.data.data;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<NotificationUnreadCountResponse>>(
      '/notifications/unread-count'
    );
    return res.data.data.unreadCount;
  },
};

