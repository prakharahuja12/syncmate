import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar as CalendarIcon, Plus, Bookmark, MoreHorizontal } from 'lucide-react';

export interface BottomNavProps {
  onNewEvent: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onNewEvent }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card px-2 lg:hidden select-none">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
            isActive ? 'text-primary' : 'text-muted hover:text-foreground'
          }`
        }
      >
        <Home className="h-5 w-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/calendar"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
            isActive ? 'text-primary' : 'text-muted hover:text-foreground'
          }`
        }
      >
        <CalendarIcon className="h-5 w-5" />
        <span>Calendar</span>
      </NavLink>

      {/* Center FAB */}
      <button
        onClick={onNewEvent}
        className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 cursor-pointer"
        title="Add new event"
      >
        <Plus className="h-6 w-6" />
      </button>

      <NavLink
        to="/watchlist"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
            isActive ? 'text-primary' : 'text-muted hover:text-foreground'
          }`
        }
      >
        <Bookmark className="h-5 w-5" />
        <span>Saved</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
            isActive ? 'text-primary' : 'text-muted hover:text-foreground'
          }`
        }
      >
        <MoreHorizontal className="h-5 w-5" />
        <span>More</span>
      </NavLink>
    </nav>
  );
};

