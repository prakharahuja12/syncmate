import { apiClient } from '../../lib/api';
import { ApiResponse, DashboardResponse, ActivityItem } from '../../types/api';

export const dashboardApi = {
  async getDashboard(groupId: string): Promise<DashboardResponse> {
    const res = await apiClient.get<ApiResponse<DashboardResponse>>(
      `/groups/${groupId}/dashboard`
    );
    return res.data.data;
  },

  async getActivity(groupId: string, page = 1, limit = 20): Promise<ActivityItem[]> {
    const res = await apiClient.get<ApiResponse<ActivityItem[]>>(
      `/groups/${groupId}/activity`,
      { params: { page, limit } }
    );
    return res.data.data;
  },
};

