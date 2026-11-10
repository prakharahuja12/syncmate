import { create } from 'zustand';

interface UiState {
  themePreference: 'light' | 'dark' | 'system';
  tapHackathonOpensLinkDirectly: boolean;
  unreadNotificationsCount: number;
  activeCalendarView: 'month' | 'week' | 'day';
  isOffline: boolean;
  pendingInviteCode: string | null;
  pendingDeepLink: string | null;
  setThemePreference: (pref: 'light' | 'dark' | 'system') => void;
  setTapHackathonOpensLinkDirectly: (val: boolean) => void;
  setUnreadNotificationsCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  setActiveCalendarView: (view: 'month' | 'week' | 'day') => void;
  setIsOffline: (val: boolean) => void;
  setPendingInviteCode: (code: string | null) => void;
  setPendingDeepLink: (link: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  themePreference: 'system',
  tapHackathonOpensLinkDirectly: true,
  unreadNotificationsCount: 0,
  activeCalendarView: 'month',
  isOffline: false,
  pendingInviteCode: null,
  pendingDeepLink: null,

  setThemePreference: (pref) => set({ themePreference: pref }),
  setTapHackathonOpensLinkDirectly: (val) => set({ tapHackathonOpensLinkDirectly: val }),
  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: Math.max(0, count) }),
  incrementUnreadCount: () => set((s) => ({ unreadNotificationsCount: s.unreadNotificationsCount + 1 })),
  decrementUnreadCount: () => set((s) => ({ unreadNotificationsCount: Math.max(0, s.unreadNotificationsCount - 1) })),
  setActiveCalendarView: (view) => set({ activeCalendarView: view }),
  setIsOffline: (val) => set({ isOffline: val }),
  setPendingInviteCode: (code) => set({ pendingInviteCode: code }),
  setPendingDeepLink: (link) => set({ pendingDeepLink: link }),
}));

