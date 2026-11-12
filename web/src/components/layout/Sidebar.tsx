import * as React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Calendar as CalendarIcon,
  CheckCircle2,
  Bookmark,
  Bell,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { useSignOut } from '../../features/auth/useSignOut';
import { useDismissibleMenu } from '../../lib/useDismissibleMenu';
import { SyncmateLogo } from '../common/SyncmateLogo';
import { QuickTeamSwitcher } from '../common/QuickTeamSwitcher';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const userMenu = useDismissibleMenu();
  const user = useAuthStore((s) => s.user);
  const group = useAuthStore((s) => s.group);
  const isCollapsed = useUiStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const unreadCount = useUiStore((s) => s.unreadNotificationsCount);

  const workspaceItems = [
    { label: 'Dashboard', to: '/', icon: LayoutGrid },
    { label: 'Calendar', to: '/calendar', icon: CalendarIcon },
    { label: 'Tasks', to: '/tasks', icon: CheckCircle2 },
    { label: 'Saved', to: '/watchlist', icon: Bookmark },
  ];

  const manageItems = [
    { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'Group', to: '/group', icon: Users },
    { label: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-border bg-[#0C1117] transition-all duration-200 select-none shrink-0 ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/80">
        {!isCollapsed && <SyncmateLogo size="md" />}
        {isCollapsed && <SyncmateLogo size="sm" showText={false} className="mx-auto" />}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Workspace Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold tracking-wider text-muted/80 uppercase">
              Workspace
            </p>
          )}
          <nav className="space-y-1">
            {workspaceItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#182628] text-primary border border-primary/20 shadow-sm'
                        : 'text-muted hover:bg-[#141B24] hover:text-foreground'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Manage Section */}
        <div>
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold tracking-wider text-muted/80 uppercase">
              Manage
            </p>
          )}
          <nav className="space-y-1">
            {manageItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#182628] text-primary border border-primary/20 shadow-sm'
                        : 'text-muted hover:bg-[#141B24] hover:text-foreground'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {item.badge && item.badge > 0 ? (
                    <span className="flex h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  ) : null}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer */}
      <div
        ref={userMenu.containerRef}
        className="relative border-t border-border/80 p-3 bg-[#0B0F14]/60"
      >
        {userMenu.isOpen && (
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 mb-2 z-50 rounded-xl border border-border bg-card shadow-xl p-1.5 space-y-1 min-w-[210px]"
          >
            <QuickTeamSwitcher onSelect={userMenu.close} />
            <div className="my-1 border-t border-border/70" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                userMenu.close();
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-muted" />
              <span>Profile & Settings</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                userMenu.close();
                navigate('/group');
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <Users className="h-3.5 w-3.5 text-muted" />
              <span>Group & Members</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                userMenu.close();
                navigate('/notifications');
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
            >
              <Bell className="h-3.5 w-3.5 text-muted" />
              <span>Notifications</span>
            </button>
            <div className="my-1 border-t border-border/70" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                userMenu.close();
                void signOut();
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        )}

        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <button
            type="button"
            onClick={userMenu.toggle}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs shrink-0 border border-primary/30 hover:border-primary/60 transition-colors cursor-pointer"
            title="Account menu"
          >
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </button>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{user?.name || 'SyncMate User'}</p>
                <p className="text-[10px] text-muted truncate">{group?.name || 'Workspace'}</p>
              </div>
              <button
                type="button"
                onClick={userMenu.toggle}
                aria-label="Account options"
                aria-expanded={userMenu.isOpen}
                aria-haspopup="menu"
                className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-md transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
