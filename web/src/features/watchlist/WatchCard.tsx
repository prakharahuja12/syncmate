import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Trophy,
  MapPin,
  ExternalLink as ExternalIcon,
  Globe,
  Bell,
  Trash2,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';
import { eventsApi } from '../events/api';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { formatDate, formatDeadlineCountdown, formatRelativeTime } from '../../lib/dates';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { WatchlistItem, ParticipationStatus, UserSummary } from '../../types/api';

export interface WatchCardProps {
  item: WatchlistItem;
  groupMembers: UserSummary[];
  onOpenDetails: (id: string) => void;
}

const PARTICIPATION_ICONS: Record<ParticipationStatus, { label: string; icon: string }> = {
  interested: { label: 'Interested', icon: '👀' },
  planning: { label: 'Planning to Register', icon: '🗓️' },
  registered: { label: 'Registered', icon: '✅' },
  not_interested: { label: 'Not Interested', icon: '✖️' },
};

export const WatchCard: React.FC<WatchCardProps> = ({
  item,
  groupMembers,
  onOpenDetails,
}) => {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const tapHackathonOpensLink = useUiStore((s) => s.tapHackathonOpensLinkDirectly);

  const [showStatusMenu, setShowStatusMenu] = React.useState(false);

  const regClosesAt = item.hackathon?.registrationClosesAt;
  const deadlineCountdown = regClosesAt ? formatDeadlineCountdown(regClosesAt) : null;
  const primaryUrl = item.primaryUrl || item.hackathon?.registrationUrl || item.url;
  const officialUrl = item.hackathon?.officialUrl;

  const myStatus = item.myStatus;
  const isRegistered = myStatus === 'registered';

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async (status: ParticipationStatus) => {
      await eventsApi.setMyStatus(item.id, status);
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(`Status updated to ${PARTICIPATION_ICONS[newStatus].label}`);
      setShowStatusMenu(false);
    },
  });

  // Unpin mutation
  const unpinMutation = useMutation({
    mutationFn: async () => {
      await eventsApi.unpinEvent(item.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Removed from watchlist');
    },
  });

  // Reminders mutation for registration close
  const reminderMutation = useMutation({
    mutationFn: async (offsetDays: number) => {
      const offsetMinutes = offsetDays * 24 * 60;
      await eventsApi.setReminders(item.id, [
        { anchor: 'registrationClose', offsetMinutes },
      ]);
    },
    onSuccess: (_, offsetDays) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(`Reminder set for ${offsetDays}d before registration closes 🔔`);
    },
  });

  // Participation tally
  const interestedCount = item.participation?.filter((p) => p.status === 'interested').length || 0;
  const registeredCount = item.participation?.filter((p) => p.status === 'registered').length || 0;

  const handleTitleClick = () => {
    if (tapHackathonOpensLink && primaryUrl) {
      window.open(primaryUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    onOpenDetails(item.id);
  };

  return (
    <div
      className={`relative p-5 rounded-xl border border-border bg-card space-y-4 hover:border-primary/40 transition-all shadow-2xs ${
        isRegistered ? 'ring-1 ring-emerald-500/30' : ''
      }`}
    >
      {/* Registered Ribbon */}
      {isRegistered && (
        <div className="absolute top-0 right-12 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Registered</span>
        </div>
      )}

      {/* Top Header: Categories, Deadlines & Unpin */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={item.category} />
          <PriorityBadge priority={item.priority} />
          {deadlineCountdown && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                deadlineCountdown.isOverdue
                  ? 'bg-red-500/20 text-red-500'
                  : deadlineCountdown.isClose
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-surface border border-border text-foreground'
              }`}
            >
              {deadlineCountdown.text}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => unpinMutation.mutate()}
          className="text-muted hover:text-red-500 p-1 rounded-md transition-colors cursor-pointer"
          title="Remove from watchlist"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Title & Pinned By */}
      <div>
        <h3
          onClick={handleTitleClick}
          className="text-lg font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {item.title}
        </h3>
        <p className="text-xs text-muted mt-1">
          Pinned by{' '}
          <strong className="text-foreground">
            {item.pinSummary?.pinnedBy?.[0]?.user?.name || 'a group member'}
          </strong>{' '}
          · {formatRelativeTime(item.createdAt)}
        </p>
      </div>

      {/* Hackathon Specs & Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted pt-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <span>Event: <strong className="text-foreground">{formatDate(item.startAt, 'MMM d, yyyy')}</strong></span>
        </div>

        {regClosesAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Closes: <strong className="text-foreground">{formatDate(regClosesAt, 'MMM d, h:mm a')}</strong></span>
          </div>
        )}

        {item.hackathon?.prizePool && (
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Prize: <strong className="text-foreground">{item.hackathon.prizePool}</strong></span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span>Mode: <strong className="capitalize text-foreground">{item.hackathon?.mode || 'Online'}</strong></span>
        </div>
      </div>

      {/* Links CTA Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
        {primaryUrl && (
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <span>Register ↗</span>
            <ExternalIcon className="h-3 w-3" />
          </a>
        )}

        {officialUrl && officialUrl !== primaryUrl && (
          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-foreground text-xs font-medium hover:bg-border/30 transition-all"
          >
            <Globe className="h-3 w-3" />
            <span>Official site</span>
          </a>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenDetails(item.id)}
          className="ml-auto text-xs"
        >
          Details
        </Button>
      </div>

      {/* Group Members Participation Row */}
      <div className="pt-2 border-t border-border/50 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Group Status:</span>
          <span className="text-muted">
            {interestedCount > 0 && `${interestedCount} interested`}
            {interestedCount > 0 && registeredCount > 0 && ' · '}
            {registeredCount > 0 && `${registeredCount} registered`}
            {interestedCount === 0 && registeredCount === 0 && 'No responses'}
          </span>
        </div>

        {/* Member Glyphs */}
        <div className="flex flex-wrap items-center gap-2">
          {groupMembers.map((member) => {
            const userPart = item.participation?.find((p) => p.user.id === member.id);
            const statusIcon = userPart?.status
              ? PARTICIPATION_ICONS[userPart.status]?.icon
              : '○';
            return (
              <div
                key={member.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md border border-border bg-surface text-xs"
                title={`${member.name}: ${userPart?.status || 'No response'}`}
              >
                <Avatar name={member.name} color={member.avatarColor} size="xs" />
                <span className="text-[11px] font-medium text-foreground">{member.name}</span>
                <span>{statusIcon}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* My Status & Reminders Footer */}
      <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">My status:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="px-2.5 py-1 rounded-lg border border-border bg-surface text-xs font-semibold text-foreground hover:bg-border/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{myStatus ? PARTICIPATION_ICONS[myStatus].icon : '❓'}</span>
              <span>{myStatus ? PARTICIPATION_ICONS[myStatus].label : 'Select status'}</span>
            </button>

            {showStatusMenu && (
              <div className="absolute left-0 bottom-full mb-1 z-30 w-48 rounded-lg border border-border bg-card shadow-lg p-1 space-y-1">
                {(Object.keys(PARTICIPATION_ICONS) as ParticipationStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => statusMutation.mutate(st)}
                    className="w-full text-left px-2 py-1.5 rounded-md text-xs font-medium hover:bg-surface flex items-center gap-2 text-foreground cursor-pointer"
                  >
                    <span>{PARTICIPATION_ICONS[st].icon}</span>
                    <span>{PARTICIPATION_ICONS[st].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Deadline Reminder Chips */}
        {regClosesAt && !isRegistered && (
          <div className="flex items-center gap-1 text-[11px]">
            <Bell className="h-3.5 w-3.5 text-muted mr-1" />
            <button
              type="button"
              onClick={() => reminderMutation.mutate(7)}
              className="px-1.5 py-0.5 rounded border border-border bg-surface hover:border-primary text-muted hover:text-foreground cursor-pointer"
            >
              7d
            </button>
            <button
              type="button"
              onClick={() => reminderMutation.mutate(3)}
              className="px-1.5 py-0.5 rounded border border-border bg-surface hover:border-primary text-muted hover:text-foreground cursor-pointer"
            >
              3d
            </button>
            <button
              type="button"
              onClick={() => reminderMutation.mutate(1)}
              className="px-1.5 py-0.5 rounded border border-border bg-surface hover:border-primary text-muted hover:text-foreground cursor-pointer"
            >
              1d
            </button>
          </div>
        )}

        {isRegistered && (
          <span className="text-[11px] text-muted italic">Reminders stopped</span>
        )}
      </div>
    </div>
  );
};
