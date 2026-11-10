import { create } from 'zustand';
import { User, Group } from '../types/api';
import { secureStorage } from '../lib/secureStorage';

interface AuthState {
  user: User | null;
  group: Group | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setUser: (user: User | null) => void;
  setGroup: (group: Group | null) => void;
  setSession: (user: User, group: Group | null, accessToken: string, refreshToken: string) => Promise<void>;
  clearSession: () => Promise<void>;
  setIsBootstrapping: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  group: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setGroup: (group) => set({ group }),

  setSession: async (user, group, accessToken, refreshToken) => {
    await secureStorage.setAccessToken(accessToken);
    await secureStorage.setRefreshToken(refreshToken);
    set({ user, group, isAuthenticated: true, isBootstrapping: false });
  },

  clearSession: async () => {
    await secureStorage.clearTokens();
    set({ user: null, group: null, isAuthenticated: false, isBootstrapping: false });
  },

  setIsBootstrapping: (val) => set({ isBootstrapping: val }),
}));

