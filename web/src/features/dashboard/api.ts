import { apiClient } from '../../lib/api';
import { ApiResponse, DashboardResponse } from '../../types/api';

export const dashboardApi = {
  async getDashboard(groupId: string): Promise<DashboardResponse> {
    const res = await apiClient.get<ApiResponse<DashboardResponse>>(`/groups/${groupId}/dashboard`);
    return res.data.data;
  },
};

