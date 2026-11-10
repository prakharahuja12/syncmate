import { apiClient } from '../../lib/api';
import { ApiResponse, NotificationItem, NotificationUnreadCountResponse } from '../../types/api';

export const notificationsApi = {
  async getNotifications(unread?: boolean, page = 1, limit = 20): Promise<NotificationItem[]> {
    const res = await apiClient.get<ApiResponse<NotificationItem[]>>('/notifications', {
      params: { unread, page, limit },
    });
    return res.data.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<NotificationUnreadCountResponse>>(
      '/notifications/unread-count'
    );
    return res.data.data.unreadCount;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/read-all');
  },
};

