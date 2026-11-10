import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  Trophy,
  ExternalLink as ExternalIcon,
  CheckCircle2,
  Circle,
  Trash2,
  Edit,
  Bell,
  Globe,
} from 'lucide-react';
import { eventsApi } from './api';
import { groupApi } from '../group/api';
import { useAuthStore } from '../../stores/authStore';
import { formatDate, formatTime, formatRelativeTime, formatDeadlineCountdown, computeIsUrgent } from '../../lib/dates';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { PinButton } from '../../components/common/PinButton';
import { ExternalLink } from '../../components/common/ExternalLink';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarStack } from '../../components/ui/avatar';
import { EventItem, ParticipationStatus, PinVisibility } from '../../types/api';

export interface EventDetailsDrawerProps {
  eventId: string | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (event: EventItem) => void;
}

const PARTICIPATION_STATUS_LABELS: Record<ParticipationStatus, { label: string; icon: string }> = {
  interested: { label: 'Interested', icon: '👀' },
  planning: { label: 'Planning to Register', icon: '🗓️' },
  registered: { label: 'Registered', icon: '✅' },
  not_interested: { label: 'Not Interested', icon: '✖️' },
};

export const EventDetailsDrawer: React.FC<EventDetailsDrawerProps> = ({
  eventId,
  open,
  onClose,
  onEdit,
}) => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventById(eventId!),
    enabled: open && !!eventId,
  });

  const { data: group } = useQuery({
    queryKey: ['group'],
    queryFn: () => groupApi.getMyGroup(),
    enabled: open,
  });

  // Complete / Uncomplete Mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!event) return;
      if (event.status === 'completed') {
        return eventsApi.uncompleteEvent(event.id);
      }
      return eventsApi.completeEvent(event.id);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(
        updated?.status === 'completed' ? 'Event marked as complete' : 'Event marked as active'
      );
    },
    onError: () => {
      toast.error('Failed to update event status');
    },
  });

  // Delete Mutation
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) return;
      await eventsApi.deleteEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Event deleted');
      setShowConfirmDelete(false);
      onClose();
    },
    onError: () => {
      toast.error('Failed to delete event');
    },
  });

  // Pin / Unpin Mutation
  const pinMutation = useMutation({
    mutationFn: async (visibility: PinVisibility) => {
      if (!eventId) return;
      await eventsApi.pinEvent(eventId, visibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Saved to watchlist 📌');
    },
  });

  const unpinMutation = useMutation({
    mutationFn: async () => {
      if (!eventId) return;
      await eventsApi.unpinEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Removed from watchlist');
    },
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: ParticipationStatus) => {
      if (!eventId) return;
      await eventsApi.setMyStatus(eventId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const isUrgent = event ? computeIsUrgent(event) : false;
  const isCompleted = event?.status === 'completed';
  const primaryUrl = event?.primaryUrl || event?.hackathon?.registrationUrl || event?.url;
  const officialUrl = event?.hackathon?.officialUrl;
  const regCountdown = event?.hackathon?.registrationClosesAt
    ? formatDeadlineCountdown(event.hackathon.registrationClosesAt)
    : null;

  const members = group?.members || [];
  const participation = event?.participation || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-surface border-l border-border h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            {event && <CategoryBadge category={event.category} />}
            {event && <PriorityBadge priority={event.priority} />}
            {isUrgent && (
              <Badge variant="outline" className="border-red-500/40 text-red-500 bg-red-500/10">
                Urgent
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10">
                Completed
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {event?.pinSummary && (
              <PinButton
                pinSummary={event.pinSummary}
                onPin={(v) => pinMutation.mutate(v)}
                onUnpin={() => unpinMutation.mutate()}
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border transition-colors cursor-pointer"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {isLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-border/40 rounded-md w-3/4" />
              <div className="h-4 bg-border/40 rounded-md w-1/2" />
              <div className="h-24 bg-border/40 rounded-lg w-full" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              Failed to load event details.
            </div>
          )}

          {event && (
            <>
              {/* Event Title */}
              <div>
                <h2
                  id="drawer-title"
                  className={`text-2xl font-bold tracking-tight text-foreground ${
                    isCompleted ? 'line-through opacity-70' : ''
                  }`}
                >
                  {event.title}
                </h2>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted">
                  <User className="h-3.5 w-3.5" />
                  <span>
                    Added by <strong className="text-foreground">{event.createdBy.name}</strong> ·{' '}
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span>
                    {formatDate(event.startAt, 'EEEE, MMMM d, yyyy')}
                    {event.allDay && ' (All day)'}
                  </span>
                </div>
                {!event.allDay && (
                  <div className="flex items-center gap-3 text-sm text-muted">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {formatTime(event.startAt)} – {formatTime(event.endAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Registration CTA for Hackathons / Events with Primary URL */}
              {primaryUrl && (
                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      Registration & Official Link
                    </span>
                    {regCountdown && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          regCountdown.isOverdue
                            ? 'bg-red-500/20 text-red-500'
                            : regCountdown.isClose
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {regCountdown.text}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <a
                      href={primaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                    >
                      <span>Open registration page</span>
                      <ExternalIcon className="h-4 w-4" />
                    </a>

                    {officialUrl && officialUrl !== primaryUrl && (
                      <a
                        href={officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border/30 transition-all"
                      >
                        <Globe className="h-4 w-4" />
                        <span>Official site</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Hackathon Specific Details */}
              {event.hackathon && (
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Hackathon Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {event.hackathon.prizePool && (
                      <div className="flex items-center gap-2 text-muted">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span>
                          Prize: <strong className="text-foreground">{event.hackathon.prizePool}</strong>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>
                        Mode: <strong className="capitalize text-foreground">{event.hackathon.mode || 'Online'}</strong>
                        {event.hackathon.location ? ` (${event.hackathon.location})` : ''}
                      </span>
                    </div>
                  </div>

                  {event.hackathon.registrationClosesAt && (
                    <div className="text-xs text-muted pt-1 border-t border-border/50">
                      Registration window closes:{' '}
                      <strong className="text-foreground">
                        {formatDate(event.hackathon.registrationClosesAt, 'MMM d, yyyy · h:mm a')}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {event.description && (
                <div className="space-y-1.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Description</h3>
                  <div className="p-4 rounded-xl border border-border bg-card text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </div>
                </div>
              )}

              {/* Participation / Member Statuses */}
              <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Group Participation</h3>
                  <span className="text-xs text-muted">
                    {participation.length > 0
                      ? `${participation.filter((p) => p.status === 'registered').length} registered`
                      : 'No responses yet'}
                  </span>
                </div>

                {/* My Status Selector */}
                <div className="pt-2 border-t border-border/50">
                  <span className="text-xs text-muted block mb-2">My Status:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PARTICIPATION_STATUS_LABELS) as ParticipationStatus[]).map((st) => {
                      const isCurrent = event.myStatus === st;
                      const config = PARTICIPATION_STATUS_LABELS[st];
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => statusMutation.mutate(st)}
                          disabled={statusMutation.isPending}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-primary/10 border-primary text-primary font-semibold'
                              : 'bg-surface border-border text-muted hover:text-foreground hover:bg-border/30'
                          }`}
                        >
                          <span>{config.icon}</span>
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* All Members participation list */}
                {members.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <span className="text-xs text-muted block">Members:</span>
                    <div className="space-y-1.5">
                      {members.map((m) => {
                        const userStatus = participation.find((p) => p.user.id === m.id);
                        const statusConfig = userStatus?.status
                          ? PARTICIPATION_STATUS_LABELS[userStatus.status]
                          : null;
                        return (
                          <div key={m.id} className="flex items-center justify-between text-xs py-1">
                            <div className="flex items-center gap-2">
                              <Avatar name={m.name} color={m.avatarColor} size="sm" />
                              <span className="font-medium text-foreground">{m.name}</span>
                              {m.id === currentUserId && <span className="text-muted text-[10px]">(You)</span>}
                            </div>
                            <span className="text-muted">
                              {statusConfig ? (
                                <span className="inline-flex items-center gap-1 font-medium">
                                  <span>{statusConfig.icon}</span>
                                  <span>{statusConfig.label}</span>
                                </span>
                              ) : (
                                <span className="text-muted/60">○ No response</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Reminders list */}
              {event.myReminders && event.myReminders.length > 0 && (
                <div className="space-y-2 p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Bell className="h-4 w-4 text-primary" />
                    <span>My Reminders</span>
                  </div>
                  <div className="space-y-1.5">
                    {event.myReminders.map((rem, remIdx) => (
                      <div
                        key={rem.id || `rem-${remIdx}`}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface border border-border"
                      >
                        <span className="text-foreground">
                          {rem.offsetMinutes
                            ? `${rem.offsetMinutes / 60}h before`
                            : rem.customAt
                            ? formatDate(rem.customAt, 'MMM d, h:mm a')
                            : 'Reminder'}
                        </span>
                        <span className="text-muted capitalize">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {event && (
          <div className="p-4 border-t border-border bg-card flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant={isCompleted ? 'outline' : 'primary'}
                className="flex-1"
                onClick={() => completeMutation.mutate()}
                isLoading={completeMutation.isPending}
              >
                {isCompleted ? (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    <span>Mark as active</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    <span>Mark as complete</span>
                  </>
                )}
              </Button>

              {onEdit && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onEdit(event);
                    onClose();
                  }}
                  className="px-3"
                  title="Edit event"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
                title="Delete event"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {showConfirmDelete && (
              <div className="p-3 mt-1 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                <p className="text-xs font-semibold text-red-500">
                  Are you sure you want to delete this event? This will remove it for all group members.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => deleteMutation.mutate()}
                    isLoading={deleteMutation.isPending}
                  >
                    Delete permanently
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
