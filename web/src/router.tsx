import * as React from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppShell } from './components/layout/AppShell';

import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { OnboardingPage } from './features/group/OnboardingPage';
import { JoinGroupPage } from './features/group/JoinGroupPage';
import { GroupPage } from './features/group/GroupPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { TasksPage } from './features/tasks/TasksPage';
import { WatchlistPage } from './features/watchlist/WatchlistPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { SettingsPage } from './features/settings/SettingsPage';

// Guard for protected routes (requires authentication)
const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-semibold text-muted">Loading SyncMate...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// Guard requiring active group membership
const GroupRoute: React.FC = () => {
  const group = useAuthStore((s) => s.group);

  if (!group) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

// Guard for public routes (redirects authenticated users to app)
const PublicRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const group = useAuthStore((s) => s.group);

  if (isBootstrapping) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={group ? '/' : '/onboarding'} replace />;
  }

  return <Outlet />;
};

export const router = createBrowserRouter([
  // Public Auth Routes
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },

  // Invite link route (accessible whether signed in or not)
  {
    path: '/join/:code',
    element: <JoinGroupPage />,
  },

  // Protected Routes
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <GroupRoute />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/calendar', element: <CalendarPage /> },
          { path: '/tasks', element: <TasksPage /> },
          { path: '/watchlist', element: <WatchlistPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/group', element: <GroupPage /> },
          { path: '/settings', element: <SettingsPage /> },
          { path: '/settings/integrations', element: <SettingsPage /> },
        ],
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

