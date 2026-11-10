import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Circle,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react';
import { eventsApi } from '../events/api';
import { useAuthStore } from '../../stores/authStore';
import { formatDate, formatTime, formatRelativeTime, computeIsUrgent } from '../../lib/dates';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { EventDetailsDrawer } from '../events/EventDetailsDrawer';
import { EventDialog } from '../events/EventDialog';
import { EventItem, EventPriority, EventCategory, EventStatus } from '../../types/api';

export const TasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentGroupId = useAuthStore((s) => s.group?.id);
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [activeTab, setActiveTab] = React.useState<'pending' | 'completed' | 'deadlines'>('pending');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'priority' | 'startAt' | 'createdAt'>('priority');

  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Fetch all events for group
  const { data: events = [], isLoading, error } = useQuery({
    queryKey: ['events', currentGroupId, 'tasks', activeTab, sortBy],
    queryFn: () =>
      eventsApi.getEvents(currentGroupId!, {
        from: new Date(Date.now() - 30 * 86400000).toISOString(),
        to: new Date(Date.now() + 90 * 86400000).toISOString(),
        status: activeTab === 'completed' ? 'completed' : 'pending',
        sort: sortBy,
      }),
    enabled: !!currentGroupId,
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
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(
        updated?.status === 'completed' ? 'Task completed! 🎉' : 'Task marked pending'
      );
    },
  });

  // Filtered & grouped
  const filteredEvents = React.useMemo(() => {
    return events.filter((e) => {
      if (priorityFilter !== 'all' && e.priority !== priorityFilter) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, priorityFilter, categoryFilter, searchQuery]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Tasks & Priorities
          </h1>
          <p className="text-sm text-muted mt-1">
            Track and complete group milestones, assignments, and deadlines.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add Task</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-semibold">
        {(['pending', 'completed'] as const).map((tab) => (
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
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none capitalize"
        >
          <option value="all">All Categories</option>
          <option value="hackathon">Hackathon</option>
          <option value="college">College</option>
          <option value="personal">Personal</option>
          <option value="meeting">Meeting</option>
          <option value="competition">Competition</option>
          <option value="other">Other</option>
        </select>

        {/* Sort Select */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground focus:outline-none"
        >
          <option value="priority">Sort by Priority</option>
          <option value="startAt">Sort by Date</option>
          <option value="createdAt">Sort by Recently Added</option>
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && filteredEvents.length === 0 && (
          <div className="p-12 text-center rounded-xl border border-dashed border-border bg-card/50 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-muted/40 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              {activeTab === 'pending' ? 'No pending tasks' : 'No completed tasks'}
            </h3>
            <p className="text-xs text-muted">
              {activeTab === 'pending'
                ? 'All caught up! Add a new task to get started.'
                : 'Tasks you complete will appear here.'}
            </p>
          </div>
        )}

        {!isLoading &&
          filteredEvents.map((task) => {
            const isCompleted = task.status === 'completed';
            const isUrgent = computeIsUrgent(task);

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all ${
                  isCompleted ? 'opacity-60 bg-surface/50' : ''
                } ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                  {/* Complete Button */}
                  <button
                    type="button"
                    onClick={() =>
                      completeMutation.mutate({
                        eventId: task.id,
                        isCompleted,
                      })
                    }
                    className="text-muted hover:text-foreground cursor-pointer shrink-0"
                    title={isCompleted ? 'Mark pending' : 'Mark complete'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <span
                      onClick={() => setSelectedEventId(task.id)}
                      className={`text-sm font-semibold text-foreground block truncate hover:text-primary hover:underline cursor-pointer ${
                        isCompleted ? 'line-through text-muted' : ''
                      }`}
                    >
                      {task.title}
                    </span>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <CategoryBadge category={task.category} />
                      <PriorityBadge priority={task.priority} />
                      {isUrgent && (
                        <Badge variant="outline" className="border-red-500/40 text-red-500 bg-red-500/10 text-[10px]">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-xs text-muted">
                  <div className="text-right">
                    <span className="block font-medium text-foreground">
                      {formatDate(task.startAt, 'MMM d, yyyy')}
                    </span>
                    <span className="text-[11px] text-muted">{formatTime(task.startAt)}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEventId(task.id)}
                  >
                    View
                  </Button>
                </div>
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

      {/* Event Dialog */}
      <EventDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
