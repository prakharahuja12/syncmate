import * as React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Calendar as CalendarIcon,
  Plus,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  Bell,
  Users,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';
import { useSignOut } from '../../features/auth/useSignOut';
import { useDismissibleMenu } from '../../lib/useDismissibleMenu';

export interface BottomNavProps {
  onNewEvent: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onNewEvent }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const moreMenu = useDismissibleMenu();
  const unreadCount = useUiStore((s) => s.unreadNotificationsCount);

  const isMoreRouteActive = ['/tasks', '/notifications', '/group', '/settings'].some((path) =>
    location.pathname.startsWith(path)
  );

  const moreItems = [
    { label: 'Tasks', to: '/tasks', icon: CheckCircle2 },
    { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Group & Members', to: '/group', icon: Users },
    { label: 'Settings & Sync', to: '/settings', icon: Settings },
  ];

  return (
    <div ref={moreMenu.containerRef} className="lg:hidden">
      {/* Mobile More Popover Sheet */}
      {moreMenu.isOpen && (
        <div
          role="menu"
          className="fixed bottom-20 right-3 left-3 sm:left-auto sm:w-64 z-50 rounded-2xl border border-border bg-card shadow-2xl p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/60 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              More options
            </span>
            <button
              type="button"
              onClick={moreMenu.close}
              aria-label="Close menu"
              className="text-muted hover:text-foreground p-1 rounded-md cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {moreItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <button
                key={item.to}
                type="button"
                role="menuitem"
                onClick={() => {
                  moreMenu.close();
                  navigate(item.to);
                }}
                className={`w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#182628] text-primary border border-primary/20'
                    : 'text-foreground hover:bg-surface'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge && item.badge > 0 ? (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          <div className="my-1 border-t border-border/60" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              moreMenu.close();
              void signOut();
            }}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-card px-2 select-none">
        <NavLink
          to="/"
          end
          onClick={moreMenu.close}
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
          onClick={moreMenu.close}
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
          type="button"
          onClick={() => {
            moreMenu.close();
            onNewEvent();
          }}
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 cursor-pointer"
          title="Add new event"
        >
          <Plus className="h-6 w-6" />
        </button>

        <NavLink
          to="/watchlist"
          onClick={moreMenu.close}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
              isActive ? 'text-primary' : 'text-muted hover:text-foreground'
            }`
          }
        >
          <Bookmark className="h-5 w-5" />
          <span>Saved</span>
        </NavLink>

        <button
          type="button"
          onClick={moreMenu.toggle}
          aria-label="More options"
          aria-expanded={moreMenu.isOpen}
          aria-haspopup="menu"
          className={`relative flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors cursor-pointer ${
            moreMenu.isOpen || isMoreRouteActive
              ? 'text-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-1 h-2 w-2 rounded-full bg-red-500" />
          )}
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
