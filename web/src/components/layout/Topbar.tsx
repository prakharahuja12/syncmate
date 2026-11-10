import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Bell, Plus, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { useUiStore } from '../../stores/uiStore';
import { SyncmateLogo } from '../common/SyncmateLogo';

export interface TopbarProps {
  onNewEvent: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onNewEvent }) => {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const unreadCount = useUiStore((s) => s.unreadNotificationsCount);
  const [searchQuery, setSearchQuery] = React.useState('');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-[#0C1117] px-4 sm:px-6 select-none shrink-0 gap-4">
      {/* Mobile Logo & Desktop Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="lg:hidden">
          <SyncmateLogo size="sm" />
        </div>

        {/* Global Search Input matching Figma */}
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search events, tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141B23] border border-[#222E3C] rounded-xl pl-9 pr-14 py-2 text-xs text-foreground placeholder:text-muted/70 focus:outline-none focus:border-primary/50 transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-[#2A3747] bg-[#0E151D] text-[10px] font-mono text-muted select-none">
            ⌘ K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-xl p-2 text-muted hover:bg-[#141B23] hover:text-foreground transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications Bell */}
        <NavLink
          to="/notifications"
          className="relative rounded-xl p-2 text-muted hover:bg-[#141B23] hover:text-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500" />
          )}
        </NavLink>

        {/* New Event Button (Mint Primary) */}
        <Button
          onClick={onNewEvent}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-4 py-2 h-9 rounded-xl text-xs gap-1.5 shadow-sm transition-all"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>New event</span>
        </Button>
      </div>
    </header>
  );
};
