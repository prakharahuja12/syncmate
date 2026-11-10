import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Plus, Sun, Moon, Laptop } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { Avatar } from '../ui/avatar';

export interface TopbarProps {
  onNewEvent: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onNewEvent }) => {
  const user = useAuthStore((s) => s.user);
  const group = useAuthStore((s) => s.group);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const unreadCount = useUiStore((s) => s.unreadNotificationsCount);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6 select-none shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xl lg:hidden">📅</span>
        <div>
          <h2 className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
            {group?.name || 'SyncMate Workspace'}
          </h2>
          <p className="text-[10px] text-muted hidden sm:block">
            {group?.members.length || 1} team members synced in realtime
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* New Event Button */}
        <Button onClick={onNewEvent} size="sm" className="gap-1 shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New event</span>
        </Button>

        {/* Notifications Bell */}
        <NavLink
          to="/notifications"
          className="relative rounded-md p-2 text-muted hover:bg-surface hover:text-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-priority-high text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>

        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="rounded-md p-2 text-muted hover:bg-surface hover:text-foreground transition-colors cursor-pointer"
          title={`Current theme: ${theme}. Click to switch.`}
        >
          {theme === 'light' ? (
            <Sun className="h-4 w-4 text-amber-500" />
          ) : theme === 'dark' ? (
            <Moon className="h-4 w-4 text-indigo-400" />
          ) : (
            <Laptop className="h-4 w-4 text-muted" />
          )}
        </button>

        {/* User Avatar */}
        <NavLink to="/settings" title="Profile Settings">
          <Avatar user={user} size="sm" />
        </NavLink>
      </div>
    </header>
  );
};

