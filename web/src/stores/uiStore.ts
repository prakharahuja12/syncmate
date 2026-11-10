import { create } from 'zustand';

interface UiState {
  theme: 'light' | 'dark' | 'system';
  tapHackathonOpensLinkDirectly: boolean;
  unreadNotificationsCount: number;
  activeCalendarView: 'month' | 'week' | 'day';
  isSidebarCollapsed: boolean;
  pendingInviteCode: string | null;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setTapHackathonOpensLinkDirectly: (val: boolean) => void;
  setUnreadNotificationsCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: () => void;
  setActiveCalendarView: (view: 'month' | 'week' | 'day') => void;
  toggleSidebar: () => void;
  setPendingInviteCode: (code: string | null) => void;
}

const getInitialTheme = (): 'light' | 'dark' | 'system' => {
  try {
    return (localStorage.getItem('syncmate_theme') as any) || 'system';
  } catch {
    return 'system';
  }
};

const applyThemeToDOM = (theme: 'light' | 'dark' | 'system') => {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useUiStore = create<UiState>((set) => ({
  theme: getInitialTheme(),
  tapHackathonOpensLinkDirectly: true,
  unreadNotificationsCount: 0,
  activeCalendarView: 'month',
  isSidebarCollapsed: false,
  pendingInviteCode: null,

  setTheme: (theme) => {
    try {
      localStorage.setItem('syncmate_theme', theme);
    } catch {}
    applyThemeToDOM(theme);
    set({ theme });
  },

  setTapHackathonOpensLinkDirectly: (val) => set({ tapHackathonOpensLinkDirectly: val }),
  setUnreadNotificationsCount: (count) => set({ unreadNotificationsCount: Math.max(0, count) }),
  incrementUnreadCount: () => set((s) => ({ unreadNotificationsCount: s.unreadNotificationsCount + 1 })),
  decrementUnreadCount: () => set((s) => ({ unreadNotificationsCount: Math.max(0, s.unreadNotificationsCount - 1) })),
  setActiveCalendarView: (view) => set({ activeCalendarView: view }),
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setPendingInviteCode: (code) => set({ pendingInviteCode: code }),
}));
