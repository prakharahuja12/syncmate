import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import axios from 'axios';
import { queryClient } from './lib/queryClient';
import { router } from './router';
import { useAuthStore } from './stores/authStore';
import { useUiStore } from './stores/uiStore';
import { tokenStorage } from './lib/tokenStorage';
import { API_BASE_URL } from './lib/constants';
import { authApi } from './features/auth/api';
import { RefreshResponse } from './types/api';

export const App: React.FC = () => {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setIsBootstrapping = useAuthStore((s) => s.setIsBootstrapping);
  const theme = useUiStore((s) => s.theme);

  // Apply theme class to document element
  React.useEffect(() => {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Session bootstrap
  React.useEffect(() => {
    const bootstrap = async () => {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        clearSession();
        return;
      }

      try {
        // Exchange refresh token for fresh access token
        const refreshRes = await axios.post<{ success: boolean; data: RefreshResponse }>(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = refreshRes.data.data;
        useAuthStore.getState().setAccessToken(accessToken);
        tokenStorage.setRefreshToken(newRefreshToken);

        // Fetch current user and group profile
        const meRes = await authApi.getMe();
        setSession(meRes.user, meRes.group, accessToken, newRefreshToken);
      } catch (err) {
        clearSession();
      }
    };

    bootstrap();
  }, [setSession, clearSession, setIsBootstrapping]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
};

