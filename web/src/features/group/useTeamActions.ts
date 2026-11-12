import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../../stores/authStore';
import { disconnectSocket, initSocket } from '../../lib/socket';
import { authApi } from '../auth/api';
import { groupApi } from './api';
import { Group } from '../../types/api';

/**
 * Shared hook to activate, switch, or refresh the active team workspace cleanly:
 * updates Zustand store, reconnects Socket.IO to the new team room, and invalidates scoped queries.
 */
export const useTeamActions = () => {
  const queryClient = useQueryClient();

  const invalidateTeamQueries = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['group'] }),
      queryClient.invalidateQueries({ queryKey: ['groups'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['watchlist'] }),
      queryClient.invalidateQueries({ queryKey: ['activity'] }),
    ]);
  }, [queryClient]);

  const applyActiveGroup = React.useCallback(
    async (group: Group, toastMessage?: string) => {
      const state = useAuthStore.getState();
      state.setGroup(group);
      if (state.user) {
        const nextGroupIds = Array.from(
          new Set([...(state.user.groupIds || []), group.id])
        );
        state.setUser({
          ...state.user,
          groupId: group.id,
          groupIds: nextGroupIds,
        });
      }

      disconnectSocket();
      initSocket();
      await invalidateTeamQueries();

      if (toastMessage) {
        toast.success(toastMessage);
      }
    },
    [invalidateTeamQueries]
  );

  const switchToTeam = React.useCallback(
    async (groupId: string) => {
      const switched = await groupApi.switchGroup(groupId);
      await applyActiveGroup(switched, `Switched to "${switched.name}"`);
      return switched;
    },
    [applyActiveGroup]
  );

  const syncAfterMembershipRemoval = React.useCallback(
    async (fallbackMessage: string) => {
      const meRes = await authApi.getMe();
      useAuthStore.getState().setUser(meRes.user);
      useAuthStore.getState().setGroup(meRes.group);

      disconnectSocket();
      if (meRes.group) {
        initSocket();
      }
      await invalidateTeamQueries();

      if (meRes.group) {
        toast.info(`Switched active team to "${meRes.group.name}"`);
      } else {
        toast.info(fallbackMessage);
      }
      return meRes.group;
    },
    [invalidateTeamQueries]
  );

  return {
    applyActiveGroup,
    switchToTeam,
    syncAfterMembershipRemoval,
    invalidateTeamQueries,
  };
};

