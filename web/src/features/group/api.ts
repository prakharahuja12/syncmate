import { apiClient } from '../../lib/api';
import { ApiResponse, Group, GroupPreview } from '../../types/api';

export const groupApi = {
  async getMyGroup(): Promise<Group> {
    const res = await apiClient.get<ApiResponse<Group>>('/groups/me');
    return res.data.data;
  },

  async createGroup(name: string): Promise<Group> {
    const res = await apiClient.post<ApiResponse<Group>>('/groups', { name });
    return res.data.data;
  },

  async previewInvite(code: string): Promise<GroupPreview> {
    const res = await apiClient.get<ApiResponse<GroupPreview>>(`/groups/invite/${code}/preview`);
    return res.data.data;
  },

  async joinGroup(code: string): Promise<Group> {
    const res = await apiClient.post<ApiResponse<Group>>('/groups/join', { code });
    return res.data.data;
  },

  async updateGroupName(groupId: string, name: string): Promise<Group> {
    const res = await apiClient.patch<ApiResponse<Group>>(`/groups/${groupId}`, { name });
    return res.data.data;
  },

  async regenerateInvite(groupId: string): Promise<{ inviteCode: string }> {
    const res = await apiClient.post<ApiResponse<{ inviteCode: string }>>(`/groups/${groupId}/invite/regenerate`);
    return res.data.data;
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },

  async transferOwnership(groupId: string, userId: string): Promise<Group> {
    const res = await apiClient.post<ApiResponse<Group>>(`/groups/${groupId}/transfer-owner`, { userId });
    return res.data.data;
  },

  async leaveGroup(groupId: string): Promise<void> {
    await apiClient.post(`/groups/${groupId}/leave`);
  },

  async deleteGroup(groupId: string): Promise<void> {
    await apiClient.delete(`/groups/${groupId}`);
  },
};

