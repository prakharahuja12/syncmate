import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
} from 'lucide-react';
import { watchlistApi } from './api';
import { groupApi } from '../group/api';
import { useAuthStore } from '../../stores/authStore';
import { WatchCard } from './WatchCard';
import { EventDetailsDrawer } from '../events/EventDetailsDrawer';
import { Button } from '../../components/ui/button';
import { ParticipationStatus, UserSummary } from '../../types/api';

export const WatchlistPage: React.FC = () => {
  const currentGroupId = useAuthStore((s) => s.group?.id);

  const [scope, setScope] = React.useState<'all' | 'mine' | 'group'>('all');
  const [statusFilter, setStatusFilter] = React.useState<ParticipationStatus | 'all'>('all');
  const [sortBy, setSortBy] = React.useState<'registrationClose' | 'startAt' | 'createdAt'>('registrationClose');
  const [showClosed, setShowClosed] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);

  // Group members for participation avatars
  const { data: group } = useQuery({
    queryKey: ['group'],
    queryFn: () => groupApi.getMyGroup(),
    enabled: !!currentGroupId,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['watchlist', currentGroupId, scope, statusFilter, sortBy],
    queryFn: () =>
      watchlistApi.getWatchlist(currentGroupId!, {
        scope,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sort: sortBy,
      }),
    enabled: !!currentGroupId,
  });

  const members: UserSummary[] =
    group?.members.map((m) => ({
      id: m.id,
      name: m.name,
      avatarColor: m.avatarColor,
    })) || [];

  const openItems = data?.open || [];
  const closedItems = data?.closed || [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Bookmark className="h-7 w-7 text-primary" />
            <span>Saved Events (Watchlist)</span>
          </h1>
          <p className="text-sm text-muted mt-1">
            Pin hackathons, competitions, and milestones to track deadlines and group participation.
          </p>
        </div>

        <Link to="/calendar">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-1.5" />
            <span>Browse Calendar</span>
          </Button>
        </Link>
      </div>

      {/* Scope Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-semibold">
        {(['all', 'mine', 'group'] as const).map((sc) => (
          <button
            key={sc}
            type="button"
            onClick={() => setScope(sc)}
            className={`pb-3 capitalize transition-all cursor-pointer ${
              scope === sc
                ? 'border-b-2 border-primary text-primary font-bold'
                : 'text-muted hover:text-foreground'
            }`}
          >
            {sc === 'all' ? 'All Pins' : sc === 'mine' ? 'My Pins' : 'Group Pins'}
          </button>
        ))}
      </div>

      {/* Filter Chips & Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'All Statuses' },
              { id: 'interested', label: '👀 Interested' },
              { id: 'planning', label: '🗓️ Planning' },
              { id: 'registered', label: '✅ Registered' },
              { id: 'not_interested', label: '✖️ Not Interested' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setStatusFilter(chip.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === chip.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card border border-border text-muted hover:text-foreground'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground focus:outline-none"
        >
          <option value="registrationClose">Sort: Registration Deadline</option>
          <option value="startAt">Sort: Event Date</option>
          <option value="createdAt">Sort: Recently Pinned</option>
        </select>
      </div>

      {/* Watchlist Open Items Grid */}
      <div className="space-y-4">
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && openItems.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-3">
            <Bookmark className="h-10 w-10 text-muted/40 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Nothing saved yet</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Save hackathons or events from the calendar or dashboard to keep track of deadlines and group status together.
            </p>
            <Link to="/calendar" className="inline-block pt-2">
              <Button variant="primary" size="sm">
                Explore Calendar
              </Button>
            </Link>
          </div>
        )}

        {!isLoading && openItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openItems.map((item) => (
              <WatchCard
                key={item.id}
                item={item}
                groupMembers={members}
                onOpenDetails={(id) => setSelectedEventId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Closed / Past Section */}
      {!isLoading && closedItems.length > 0 && (
        <div className="pt-6 border-t border-border space-y-4">
          <button
            type="button"
            onClick={() => setShowClosed(!showClosed)}
            className="flex items-center gap-2 text-sm font-bold text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {showClosed ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>Closed / Past Watchlist Items ({closedItems.length})</span>
          </button>

          {showClosed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
              {closedItems.map((item) => (
                <WatchCard
                  key={item.id}
                  item={item}
                  groupMembers={members}
                  onOpenDetails={(id) => setSelectedEventId(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Event Details Drawer */}
      <EventDetailsDrawer
        eventId={selectedEventId}
        open={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />
    </div>
  );
};

