import { apiClient } from '../../lib/api';
import { ApiResponse, WatchlistResponse, ParticipationStatus } from '../../types/api';

export interface GetWatchlistParams {
  scope?: 'all' | 'mine' | 'group';
  status?: ParticipationStatus;
  sort?: 'registrationClose' | 'startAt' | 'createdAt';
}

export const watchlistApi = {
  async getWatchlist(groupId: string, params?: GetWatchlistParams): Promise<WatchlistResponse> {
    const res = await apiClient.get<ApiResponse<WatchlistResponse>>(`/groups/${groupId}/watchlist`, {
      params,
    });
    return res.data.data;
  },
};

