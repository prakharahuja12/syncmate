import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Home,
  CheckSquare,
  Bookmark,
  Bell,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { Avatar } from '../ui/avatar';

export const Sidebar: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const group = useAuthStore((s) => s.group);
  const isCollapsed = useUiStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const unreadCount = useUiStore((s) => s.unreadNotificationsCount);

  const navItems = [
    { label: 'Dashboard', to: '/', icon: Home },
    { label: 'Calendar', to: '/calendar', icon: CalendarIcon },
    { label: 'Tasks', to: '/tasks', icon: CheckSquare },
    { label: 'Saved Events', to: '/watchlist', icon: Bookmark },
    { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Group', to: '/group', icon: Users },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-border bg-card transition-all duration-200 select-none ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div>
              <h1 className="text-sm font-bold text-foreground">SyncMate</h1>
              <p className="text-[10px] text-muted truncate max-w-[130px]">{group?.name || 'Workspace'}</p>
            </div>
          </div>
        )}
        {isCollapsed && <span className="text-xl mx-auto">📅</span>}
        <button
          onClick={toggleSidebar}
          className="rounded p-1 text-muted hover:bg-surface hover:text-foreground hidden lg:block"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted hover:bg-surface hover:text-foreground'
                } ${isCollapsed ? 'justify-center px-0' : ''}`
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!isCollapsed && item.badge ? (
                <span className="rounded-full bg-priority-high px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-border p-3">
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <Avatar user={user} size="sm" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
              <p className="text-[10px] text-muted truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
