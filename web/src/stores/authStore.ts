import { create } from 'zustand';
import { User, Group } from '../types/api';
import { tokenStorage } from '../lib/tokenStorage';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  group: Group | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setSession: (user: User, group: Group | null, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setGroup: (group: Group | null) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
  setIsBootstrapping: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  group: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setSession: (user, group, accessToken, refreshToken) => {
    tokenStorage.setRefreshToken(refreshToken);
    set({ user, group, accessToken, isAuthenticated: true, isBootstrapping: false });
  },

  setAccessToken: (accessToken) => set({ accessToken }),
  setGroup: (group) => set({ group }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearSession: () => {
    tokenStorage.clearRefreshToken();
    set({ user: null, group: null, accessToken: null, isAuthenticated: false, isBootstrapping: false });
  },

  setIsBootstrapping: (val) => set({ isBootstrapping: val }),
}));

