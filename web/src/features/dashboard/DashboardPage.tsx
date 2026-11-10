import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Sparkles,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  ArrowUpRight,
  Trophy,
  Pin,
  Activity,
  History,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { dashboardApi } from './api';
import { eventsApi } from '../events/api';
import { useAuthStore } from '../../stores/authStore';
import { formatDate, formatTime, formatRelativeTime, formatDeadlineCountdown, computeIsUrgent } from '../../lib/dates';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PinButton } from '../../components/common/PinButton';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar } from '../../components/ui/avatar';
import { Skeleton } from '../../components/ui/skeleton';
import { EventDetailsDrawer } from '../events/EventDetailsDrawer';
import { EventDialog } from '../events/EventDialog';
import { EventItem, PinVisibility } from '../../types/api';

export const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const currentGroupId = useAuthStore((s) => s.group?.id);
  const currentGroupName = useAuthStore((s) => s.group?.name);

  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', currentGroupId],
    queryFn: () => dashboardApi.getDashboard(currentGroupId!),
    enabled: !!currentGroupId,
    refetchOnWindowFocus: true,
  });

  // Toggle complete mutation
  const completeMutation = useMutation({
    mutationFn: async ({ eventId, isCompleted }: { eventId: string; isCompleted: boolean }) => {
      if (isCompleted) {
        return eventsApi.uncompleteEvent(eventId);
      }
      return eventsApi.completeEvent(eventId);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(
        updated?.status === 'completed' ? 'Marked complete' : 'Marked active'
      );
    },
  });

  // Pin mutation
  const pinMutation = useMutation({
    mutationFn: async ({ eventId, visibility }: { eventId: string; visibility: PinVisibility }) => {
      await eventsApi.pinEvent(eventId, visibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success('Saved to watchlist 📌');
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await eventsApi.unpinEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success('Removed from watchlist');
    },
  });

  // Time of day greeting
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-12 w-64 bg-border/40 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-card border border-border rounded-xl animate-pulse" />
          <div className="h-72 bg-card border border-border rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Failed to load dashboard</h2>
        <p className="text-sm text-muted">There was a problem communicating with the server.</p>
        <Button variant="primary" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const {
    today = [],
    upcoming = [],
    deadlines = [],
    highPriority = [],
    nextHighPriority,
    upcomingHackathons = [],
    recentlyAdded = [],
    watchlistClosingSoon = [],
    recentActivity = [],
    stats,
  } = data;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            {greeting}, {user?.name} 👋
          </h1>
          <p className="text-sm text-muted mt-1 flex items-center gap-2">
            <span>{formatDate(new Date().toISOString(), 'EEEE, MMMM d, yyyy')}</span>
            <span>•</span>
            <span className="font-medium text-foreground">{currentGroupName}</span>
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>New Event</span>
        </Button>
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase">Pending</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.pending}</div>
        </Card>

        <Card className="p-4 bg-card hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{stats.completed}</div>
        </Card>

        <Card className="p-4 bg-card border-red-500/20 bg-red-500/5 hover:border-red-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-500 uppercase">Urgent</span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-500 mt-2">{stats.urgent}</div>
        </Card>

        <Card className="p-4 bg-card border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-500 uppercase">Closing Soon</span>
            <Bookmark className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-2">
            {stats.closingSoon || watchlistClosingSoon.length}
          </div>
        </Card>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Next High-Priority Hero Card */}
        <Card className="lg:col-span-2 border-red-500/30 bg-gradient-to-r from-red-500/10 via-card to-card p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-red-500/40 text-red-500 bg-red-500/10">
                  🔴 Next High Priority
                </Badge>
                {nextHighPriority && <CategoryBadge category={nextHighPriority.category} />}
              </div>

              {nextHighPriority ? (
                <>
                  <h2
                    onClick={() => setSelectedEventId(nextHighPriority.id)}
                    className="text-2xl font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {nextHighPriority.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      {formatDate(nextHighPriority.startAt, 'MMM d, yyyy')} · {formatTime(nextHighPriority.startAt)}
                    </span>
                    <span>Added by {nextHighPriority.createdBy.name}</span>
                  </div>
                </>
              ) : (
                <div className="py-2">
                  <h2 className="text-xl font-bold text-foreground">No high-priority events 🎉</h2>
                  <p className="text-xs text-muted mt-1">You're all caught up on critical milestones.</p>
                </div>
              )}
            </div>

            {nextHighPriority && (
              <div className="flex items-center gap-2">
                {(nextHighPriority.primaryUrl || nextHighPriority.hackathon?.registrationUrl) && (
                  <a
                    href={nextHighPriority.primaryUrl || nextHighPriority.hackathon?.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                  >
                    <span>Register ↗</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
                <Button variant="outline" onClick={() => setSelectedEventId(nextHighPriority.id)}>
                  View Details
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Widget 2: Today's Events Timeline */}
        <Card className="p-5 flex flex-col">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Today's Schedule</span>
            </CardTitle>
            <Link to="/calendar" className="text-xs font-semibold text-primary hover:underline">
              View Calendar
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 space-y-2">
            {today.length > 0 ? (
              today.map((event) => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventId(event.id)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-primary min-w-[65px]">
                      {formatTime(event.startAt)}
                    </span>
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-foreground block">{event.title}</span>
                      <CategoryBadge category={event.category} />
                    </div>
                  </div>
                  <PriorityBadge priority={event.priority} />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted">
                Nothing scheduled today 🎉
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 3: Upcoming Deadlines */}
        <Card className="p-5 flex flex-col">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Important Deadlines</span>
            </CardTitle>
            <Link to="/tasks" className="text-xs font-semibold text-primary hover:underline">
              All Tasks
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 space-y-2">
            {deadlines.length > 0 ? (
              deadlines.slice(0, 5).map((d, idx) => {
                const countdown = formatDeadlineCountdown(d.deadlineAt);
                return (
                  <div
                    key={`${d.event.id}-${idx}`}
                    onClick={() => setSelectedEventId(d.event.id)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-all cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-foreground block">
                        {d.event.title}
                      </span>
                      <span className="text-[11px] text-muted capitalize">
                        {d.deadlineType === 'registration' ? '📝 Registration closes' : 'Event date'} ·{' '}
                        {formatDate(d.deadlineAt, 'MMM d, h:mm a')}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        countdown.isOverdue
                          ? 'bg-red-500/20 text-red-500'
                          : countdown.isClose
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-surface border border-border text-foreground'
                      }`}
                    >
                      {countdown.text}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-muted">
                No immediate deadlines ahead.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 4: High-Priority Tasks Checklist */}
        <Card className="p-5 flex flex-col">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-red-500" />
              <span>High Priority Tasks</span>
            </CardTitle>
            <Link to="/tasks" className="text-xs font-semibold text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 space-y-2">
            {highPriority.length > 0 ? (
              highPriority.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        completeMutation.mutate({
                          eventId: task.id,
                          isCompleted: task.status === 'completed',
                        })
                      }
                      className="text-muted hover:text-foreground cursor-pointer"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>
                    <span
                      onClick={() => setSelectedEventId(task.id)}
                      className="text-sm font-medium text-foreground hover:underline cursor-pointer"
                    >
                      {task.title}
                    </span>
                  </div>
                  <span className="text-xs text-muted">{formatDate(task.startAt, 'MMM d')}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted">No high priority tasks.</div>
            )}
          </CardContent>
        </Card>

        {/* Widget 5: Upcoming Hackathons */}
        <Card className="p-5 flex flex-col">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              <span>Upcoming Hackathons</span>
            </CardTitle>
            <Link to="/watchlist" className="text-xs font-semibold text-primary hover:underline">
              Saved Hackathons
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 space-y-3">
            {upcomingHackathons.length > 0 ? (
              upcomingHackathons.slice(0, 4).map((hack) => {
                const regUrl = hack.primaryUrl || hack.hackathon?.registrationUrl || hack.url;
                const regCloses = hack.hackathon?.registrationClosesAt;
                const countdown = regCloses ? formatDeadlineCountdown(regCloses) : null;

                return (
                  <div
                    key={hack.id}
                    className="p-3.5 rounded-xl border border-border bg-surface/50 hover:bg-surface space-y-2 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4
                          onClick={() => setSelectedEventId(hack.id)}
                          className="text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                          {hack.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted mt-1">
                          {hack.hackathon?.prizePool && (
                            <span>🏆 {hack.hackathon.prizePool}</span>
                          )}
                          <span>📅 {formatDate(hack.startAt, 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      <PinButton
                        pinSummary={hack.pinSummary}
                        onPin={(v) => pinMutation.mutate({ eventId: hack.id, visibility: v })}
                        onUnpin={() => unpinMutation.mutate(hack.id)}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      {countdown ? (
                        <span className="text-[11px] font-semibold text-amber-500">
                          {countdown.text}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">Registration Open</span>
                      )}

                      {regUrl && (
                        <a
                          href={regUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <span>Register ↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-muted">No upcoming hackathons.</div>
            )}
          </CardContent>
        </Card>

        {/* Widget 6: Watchlist Closing Soon */}
        <Card className="p-5 flex flex-col">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-amber-500" />
              <span>Watchlist Closing Soon</span>
            </CardTitle>
            <Link to="/watchlist" className="text-xs font-semibold text-primary hover:underline">
              Saved Events
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 space-y-2">
            {watchlistClosingSoon.length > 0 ? (
              watchlistClosingSoon.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedEventId(item.id)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface/50 hover:bg-surface transition-all cursor-pointer"
                >
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-foreground block">
                      {item.title}
                    </span>
                    <span className="text-xs text-muted">
                      {item.hackathon?.registrationClosesAt
                        ? `Closes ${formatDate(item.hackathon.registrationClosesAt, 'MMM d')}`
                        : 'Registration open'}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-primary">View</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted">
                No pinned events closing soon.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Widget 7: Group Activity Feed */}
        <Card className="p-5 flex flex-col">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>Group Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 5).map((act) => (
                <div key={act.id} className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={act.actor.name} color={act.actor.avatarColor} size="sm" />
                    <div>
                      <span className="font-semibold text-foreground">{act.actor.name} </span>
                      <span className="text-muted">{act.summary}</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted shrink-0">
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted">No recent activity.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Details Drawer */}
      <EventDetailsDrawer
        eventId={selectedEventId}
        open={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />

      {/* Event Dialog */}
      <EventDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
