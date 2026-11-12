import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from './api';
import { disconnectSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';

/**
 * Shared sign-out hook: revokes backend refresh token, disconnects Socket.IO,
 * clears cached React Query data and auth store, and redirects to /login.
 */
export const useSignOut = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  return React.useCallback(async () => {
    await authApi.logout();
    disconnectSocket();
    queryClient.clear();
    clearSession();
    toast.success('Signed out');
    navigate('/login');
  }, [clearSession, navigate, queryClient]);
};
