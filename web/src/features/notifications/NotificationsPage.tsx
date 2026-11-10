import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  Clock,
  Pin,
  UserPlus,
  UserMinus,
  AlertCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { notificationsApi } from './api';
import { useUiStore } from '../../stores/uiStore';
import { formatRelativeTime } from '../../lib/dates';
import { Button } from '../../components/ui/button';
import { Avatar } from '../../components/ui/avatar';
import { EventDetailsDrawer } from '../events/EventDetailsDrawer';
import { NotificationItem, NotificationType } from '../../types/api';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'event_created':
      return <Calendar className="h-4 w-4 text-primary" />;
    case 'event_updated':
      return <Activity className="h-4 w-4 text-blue-500" />;
    case 'event_deleted':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'event_completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case 'reminder':
    case 'registration_deadline':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'pin_added':
      return <Pin className="h-4 w-4 text-purple-500" />;
    case 'status_changed':
      return <Activity className="h-4 w-4 text-indigo-500" />;
    case 'member_joined':
      return <UserPlus className="h-4 w-4 text-emerald-500" />;
    case 'member_left':
      return <UserMinus className="h-4 w-4 text-amber-500" />;
    case 'google_sync_error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-primary" />;
  }
};

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const setUnreadCount = useUiStore((s) => s.setUnreadNotificationsCount);

  const [activeTab, setActiveTab] = React.useState<'all' | 'unread'>('all');
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);

  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications', activeTab],
    queryFn: () =>
      notificationsApi.getNotifications({
        unreadOnly: activeTab === 'unread',
      }),
  });

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      notificationsApi.getUnreadCount().then(setUnreadCount);
    },
  });

  // Mark all as read mutation
  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    },
  });

  const handleItemClick = (notif: NotificationItem) => {
    if (!notif.readAt) {
      markReadMutation.mutate(notif.id);
    }
    if (notif.data.eventId) {
      setSelectedEventId(notif.data.eventId);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bell className="h-7 w-7 text-primary" />
            <span>Notifications</span>
          </h1>
          <p className="text-sm text-muted mt-1">
            Realtime updates, reminders, member activity, and registration deadlines.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllMutation.mutate()}
          isLoading={markAllMutation.isPending}
          disabled={notifications.every((n) => n.readAt !== null)}
        >
          <CheckCheck className="h-4 w-4 mr-1.5" />
          <span>Mark all as read</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-semibold">
        {(['all', 'unread'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All Notifications' : 'Unread Only'}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-2">
            <Bell className="h-10 w-10 text-muted/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">No notifications</h3>
            <p className="text-xs text-muted">
              {activeTab === 'unread'
                ? "You've read all your notifications!"
                : "When your team creates events, pins hackathons, or triggers reminders, they'll appear here."}
            </p>
          </div>
        )}

        {!isLoading &&
          notifications.map((notif) => {
            const isUnread = notif.readAt === null;

            return (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  isUnread
                    ? 'border-primary/40 bg-primary/5 shadow-2xs'
                    : 'border-border bg-card hover:bg-surface/60 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-surface border border-border shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{notif.title}</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                      {notif.body}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-muted">
                      {notif.actor && (
                        <span>
                          From <strong className="text-foreground">{notif.actor.name}</strong>
                        </span>
                      )}
                      {notif.actor && <span>•</span>}
                      <span>{formatRelativeTime(notif.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {isUnread && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadMutation.mutate(notif.id);
                    }}
                    className="text-xs text-primary hover:underline shrink-0 p-1 cursor-pointer font-medium"
                    title="Mark as read"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
      </div>

      {/* Event Details Drawer */}
      <EventDetailsDrawer
        eventId={selectedEventId}
        open={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
};

