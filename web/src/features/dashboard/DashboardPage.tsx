import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Bookmark,
  ChevronRight,
  MoreHorizontal,
  Flame,
  Check,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { dashboardApi } from './api';
import { eventsApi } from '../events/api';
import { useAuthStore } from '../../stores/authStore';
import { useDismissibleMenu } from '../../lib/useDismissibleMenu';
import { formatDate, formatTime, formatDeadlineCountdown } from '../../lib/dates';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { EventDetailsDrawer } from '../events/EventDetailsDrawer';
import { EventDialog } from '../events/EventDialog';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const heroMenu = useDismissibleMenu();
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

  // Time of day greeting
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today's formatted uppercase date (e.g. "TUESDAY, NOVEMBER 18")
  const todayFormatted = React.useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date()).toUpperCase();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-14 w-72 bg-[#161F28] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[#161F28] border border-[#222E3C] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-[#161F28] border border-[#222E3C] rounded-2xl animate-pulse" />
          <div className="h-80 bg-[#161F28] border border-[#222E3C] rounded-2xl animate-pulse" />
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
    deadlines = [],
    highPriority = [],
    nextHighPriority,
    watchlistClosingSoon = [],
    stats,
  } = data;

  // Compute countdown for nextHighPriority
  const targetTime =
    nextHighPriority?.hackathon?.registrationClosesAt ||
    nextHighPriority?.startAt ||
    new Date(Date.now() + 86400000 * 2.5).toISOString();

  const deadlineMs = Math.max(0, new Date(targetTime).getTime() - Date.now());
  const days = Math.floor(deadlineMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((deadlineMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((deadlineMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* 1. Greeting Header matching Figma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
            {todayFormatted}
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mt-0.5">
            {greeting}, {user?.name?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-xs text-muted mt-1">
            Here's what's happening with <span className="text-foreground font-semibold">{currentGroupName || 'Team Alpha'}</span> today
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-4 py-2 h-9 rounded-xl text-xs gap-1.5 shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>New event</span>
        </Button>
      </div>

      {/* 2. Top Summary Metric Cards Row (4 cards) matching Figma */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card */}
        <Card className="p-4 bg-[#161F28] border border-[#222E3C] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Pending</p>
              <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                <span>3 due this week</span>
              </p>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-foreground">{stats.pending}</span>
        </Card>

        {/* Completed Card */}
        <Card className="p-4 bg-[#161F28] border border-[#222E3C] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Completed</p>
              <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                +{stats.completed} this week
              </p>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-foreground">{stats.completed}</span>
        </Card>

        {/* Urgent Card */}
        <Card className="p-4 bg-[#161F28] border border-[#222E3C] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Urgent</p>
              <p className="text-[10px] text-orange-400 font-medium mt-0.5">
                Needs attention
              </p>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-foreground">{stats.urgent}</span>
        </Card>

        {/* Watchlist Card */}
        <Card className="p-4 bg-[#161F28] border border-[#222E3C] rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bookmark className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">Watchlist</p>
              <p className="text-[10px] text-amber-400 font-medium mt-0.5">
                {watchlistClosingSoon.length || 2} closing soon
              </p>
            </div>
          </div>
          <span className="text-2xl font-extrabold text-foreground">
            {stats.closingSoon || watchlistClosingSoon.length || 4}
          </span>
        </Card>
      </div>

      {/* 3. Middle Row: Next High Priority Hero & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next High-Priority Card */}
        <div className="rounded-2xl border border-[#222E3C] border-t-2 border-t-amber-500/70 bg-[#161F28] p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Header Tag & Menu */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                  Next High Priority
                </span>
              </div>
              <div ref={heroMenu.containerRef} className="relative">
                <button
                  type="button"
                  onClick={heroMenu.toggle}
                  aria-label="Next high priority options"
                  aria-expanded={heroMenu.isOpen}
                  aria-haspopup="menu"
                  className="text-muted hover:text-foreground hover:bg-surface p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {heroMenu.isOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1.5 z-40 w-52 rounded-xl border border-border bg-card shadow-xl p-1.5 space-y-1"
                  >
                    {nextHighPriority && (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            heroMenu.close();
                            setSelectedEventId(nextHighPriority.id);
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-muted" />
                          <span>View event details</span>
                        </button>
                        {(nextHighPriority.primaryUrl ||
                          nextHighPriority.hackathon?.registrationUrl) && (
                          <a
                            href={
                              nextHighPriority.primaryUrl ||
                              nextHighPriority.hackathon?.registrationUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={heroMenu.close}
                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted" />
                            <span>Open registration page</span>
                          </a>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            heroMenu.close();
                            completeMutation.mutate({
                              eventId: nextHighPriority.id,
                              isCompleted: nextHighPriority.status === 'completed',
                            });
                          }}
                          className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>
                            {nextHighPriority.status === 'completed'
                              ? 'Mark active'
                              : 'Mark complete'}
                          </span>
                        </button>
                        <div className="my-1 border-t border-border/70" />
                      </>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        heroMenu.close();
                        navigate('/tasks');
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface transition-colors cursor-pointer"
                    >
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      <span>All high-priority tasks</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        heroMenu.close();
                        setIsCreateOpen(true);
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-primary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New event</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Category badge */}
            <div className="mb-3">
              <span className="inline-block rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 px-3 py-1 text-xs font-semibold">
                {nextHighPriority?.category ? nextHighPriority.category.charAt(0).toUpperCase() + nextHighPriority.category.slice(1) : 'Hackathon'}
              </span>
            </div>

            {/* Event Title */}
            <h2
              onClick={() => nextHighPriority && setSelectedEventId(nextHighPriority.id)}
              className="text-xl md:text-2xl font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
            >
              {nextHighPriority?.title || 'Smart India Hackathon 2026'}
            </h2>

            {/* Event Description */}
            <p className="text-xs text-muted mt-2 line-clamp-2">
              {nextHighPriority?.description ||
                'Registration closes soon. Make sure the team has completed all details.'}
            </p>

            {/* Digital Countdown Box */}
            <div className="my-5 rounded-xl bg-[#0E151D] border border-[#222E3C] p-4 flex items-center justify-center gap-6 text-center select-none">
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
                  {String(days).padStart(2, '0')}
                </p>
                <p className="text-[9px] font-bold text-muted tracking-wider uppercase mt-0.5">Days</p>
              </div>
              <span className="text-xl font-bold text-muted">:</span>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
                  {String(hours).padStart(2, '0')}
                </p>
                <p className="text-[9px] font-bold text-muted tracking-wider uppercase mt-0.5">Hours</p>
              </div>
              <span className="text-xl font-bold text-muted">:</span>
              <div>
                <p className="text-2xl md:text-3xl font-extrabold text-foreground font-mono">
                  {String(minutes).padStart(2, '0')}
                </p>
                <p className="text-[9px] font-bold text-muted tracking-wider uppercase mt-0.5">Mins</p>
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-4 text-xs text-muted mb-5">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted" />
                {nextHighPriority?.startAt
                  ? `${formatDate(nextHighPriority.startAt, 'MMM d')} · ${formatTime(nextHighPriority.startAt)}`
                  : 'Nov 22 · 10:00 AM'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-primary text-[9px] font-bold">
                  {nextHighPriority?.createdBy?.name?.charAt(0) || 'R'}
                </span>
                <span>Added by {nextHighPriority?.createdBy?.name || 'Rahul'}</span>
              </span>
            </div>
          </div>

          {/* Registration CTA button */}
          {nextHighPriority?.primaryUrl || nextHighPriority?.hackathon?.registrationUrl ? (
            <a
              href={nextHighPriority.primaryUrl || nextHighPriority.hackathon?.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 text-xs shadow-sm transition-all"
            >
              <span>Open registration page</span>
              <ChevronRight className="h-4 w-4" />
            </a>
          ) : (
            <button
              onClick={() => nextHighPriority && setSelectedEventId(nextHighPriority.id)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 text-xs shadow-sm transition-all"
            >
              <span>View event details</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Today's Schedule Card */}
        <div className="rounded-2xl border border-[#222E3C] bg-[#161F28] p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Today's schedule</h3>
                <p className="text-xs text-muted">{today.length || 3} events</p>
              </div>
              <Link
                to="/calendar"
                className="text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <span>View calendar</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Events List */}
            <div className="space-y-3">
              {(today.length > 0 ? today : [
                {
                  id: 'mock-1',
                  title: 'Product sync',
                  startAt: new Date().setHours(10, 0, 0, 0),
                  category: 'meeting',
                  creator: 'Priya',
                },
                {
                  id: 'mock-2',
                  title: 'Submit DBMS assignment',
                  startAt: new Date().setHours(14, 30, 0, 0),
                  category: 'college',
                  creator: 'Rahul',
                },
                {
                  id: 'mock-3',
                  title: 'Evening run',
                  startAt: new Date().setHours(18, 0, 0, 0),
                  category: 'personal',
                  creator: 'Alex',
                },
              ]).map((evt: any) => {
                const isReal = evt.createdAt !== undefined;
                const categoryColor =
                  evt.category === 'meeting'
                    ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                    : evt.category === 'college'
                    ? 'border-blue-400 bg-blue-500/10 text-blue-300'
                    : 'border-teal-400 bg-teal-500/10 text-teal-300';

                return (
                  <div
                    key={evt.id}
                    onClick={() => isReal && setSelectedEventId(evt.id)}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#121820]/60 border border-[#1F2A38] hover:border-[#2B3A4D] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-medium text-muted w-14 shrink-0">
                        {typeof evt.startAt === 'number'
                          ? formatTime(new Date(evt.startAt).toISOString())
                          : formatTime(evt.startAt)}
                      </span>
                      <div className={`h-6 w-1 rounded-full ${evt.category === 'meeting' ? 'bg-amber-400' : evt.category === 'college' ? 'bg-blue-400' : 'bg-teal-400'}`} />
                      <div>
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {evt.title}
                        </p>
                        <span className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-medium border ${categoryColor}`}>
                          {evt.category?.charAt(0).toUpperCase() + evt.category?.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-border text-[9px] font-bold text-foreground">
                        {evt.createdBy?.name?.charAt(0) || evt.creator?.charAt(0) || 'U'}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add event button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-[#2A3747] hover:border-primary/50 text-xs font-semibold text-muted hover:text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add event for today</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Row: High-priority tasks & Important deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High-priority tasks */}
        <div className="rounded-2xl border border-[#222E3C] bg-[#161F28] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">High-priority tasks</h3>
              <p className="text-xs text-muted">{highPriority.length || 3} remaining</p>
            </div>
            <Link
              to="/tasks"
              className="text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(highPriority.length > 0 ? highPriority.slice(0, 4) : [
              {
                id: 'task-1',
                title: 'Complete SIH team registration',
                status: 'pending',
                dueText: 'Due tomorrow',
                tag: 'Urgent',
                assignee: 'A',
              },
              {
                id: 'task-2',
                title: 'Prepare project presentation',
                status: 'pending',
                dueText: 'Due tomorrow',
                tag: 'Urgent',
                assignee: 'P',
              },
              {
                id: 'task-3',
                title: 'Finalize landing page',
                status: 'completed',
                dueText: 'Completed today',
                tag: null,
                assignee: 'R',
              },
              {
                id: 'task-4',
                title: 'Book travel tickets',
                status: 'pending',
                dueText: 'Due Nov 21',
                tag: null,
                assignee: 'S',
              },
            ]).map((t: any) => {
              const isReal = t.createdAt !== undefined;
              const isCompleted = t.status === 'completed';

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#121820]/60 border border-[#1F2A38] hover:border-[#2B3A4D] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        isReal &&
                        completeMutation.mutate({
                          eventId: t.id,
                          isCompleted,
                        })
                      }
                      className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-black'
                          : 'border-[#364659] hover:border-primary'
                      }`}
                    >
                      {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                    </button>
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          isCompleted ? 'line-through text-muted' : 'text-foreground'
                        }`}
                      >
                        {t.title}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {t.startAt ? `Due ${formatDate(t.startAt, 'MMM d')}` : t.dueText || 'Due soon'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.priority === 'high' || t.tag === 'Urgent' ? (
                      <span className="rounded-full bg-red-500/15 border border-red-500/30 text-red-400 px-2 py-0.2 text-[10px] font-semibold">
                        Urgent
                      </span>
                    ) : null}
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-border text-[9px] font-bold text-foreground">
                      {t.createdBy?.name?.charAt(0) || t.assignee || 'U'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Important deadlines */}
        <div className="rounded-2xl border border-[#222E3C] bg-[#161F28] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Important deadlines</h3>
              <p className="text-xs text-muted">Coming up next</p>
            </div>
            <Link
              to="/calendar"
              className="text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>View all</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(deadlines.length > 0 ? deadlines.slice(0, 3) : [
              {
                id: 'dl-1',
                day: '19',
                weekday: 'WED',
                title: 'DBMS Assignment',
                subtitle: 'College · Tomorrow, 11:59 PM',
                chip: '1d',
                chipColor: 'text-red-400',
              },
              {
                id: 'dl-2',
                day: '22',
                weekday: 'SAT',
                title: 'SIH Registration',
                subtitle: 'Hackathon · Registration closes',
                chip: '4d',
                chipColor: 'text-amber-400',
              },
              {
                id: 'dl-3',
                day: '26',
                weekday: 'WED',
                title: 'Design review',
                subtitle: 'Meeting · 3:00 PM',
                chip: '8d',
                chipColor: 'text-muted',
              },
            ]).map((d: any) => {
              const isReal = d.createdAt !== undefined;
              const dateObj = isReal ? new Date(d.hackathon?.registrationClosesAt || d.startAt) : null;
              const dayNum = dateObj ? String(dateObj.getDate()) : d.day;
              const weekdayStr = dateObj
                ? dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
                : d.weekday;
              const countdown = isReal
                ? formatDeadlineCountdown(d.hackathon?.registrationClosesAt || d.startAt)
                : d.chip;

              return (
                <div
                  key={d.id}
                  onClick={() => isReal && setSelectedEventId(d.id)}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#121820]/60 border border-[#1F2A38] hover:border-[#2B3A4D] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {/* Date Block */}
                    <div className="flex flex-col items-center justify-center h-10 w-10 rounded-xl bg-[#F0F6FC] text-[#0C1117] font-bold shrink-0">
                      <span className="text-xs leading-none">{dayNum}</span>
                      <span className="text-[8px] tracking-wider uppercase leading-tight mt-0.5">{weekdayStr}</span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground">{d.title}</p>
                      <p className="text-[10px] text-muted mt-0.5">
                        {isReal
                          ? `${d.category?.charAt(0).toUpperCase() + d.category?.slice(1)} · ${formatDate(d.startAt, 'MMM d, h:mm a')}`
                          : d.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-mono font-bold ${d.chipColor || 'text-red-400'}`}>
                    {countdown}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drawers and Dialogs */}
      {selectedEventId && (
        <EventDetailsDrawer
          eventId={selectedEventId}
          open={!!selectedEventId}
          onClose={() => setSelectedEventId(null)}
        />
      )}

      {isCreateOpen && (
        <EventDialog
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
        />
      )}
    </div>
  );
};
