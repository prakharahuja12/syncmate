import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  setHours,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  ExternalLink as ExternalIcon,
  Info,
  Clock,
  Filter,
} from 'lucide-react';
import { eventsApi } from '../events/api';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { EventItem, EventCategory } from '../../types/api';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/constants';
import { formatTime, computeIsUrgent } from '../../lib/dates';
import { EventDialog } from '../events/EventDialog';
import { EventDetailsDrawer } from '../events/EventDetailsDrawer';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';

const ALL_CATEGORIES: EventCategory[] = [
  'hackathon',
  'college',
  'personal',
  'meeting',
  'competition',
  'other',
];

export const CalendarPage: React.FC = () => {
  const currentGroupId = useAuthStore((s) => s.group?.id);
  const activeView = useUiStore((s) => s.activeCalendarView);
  const setActiveView = useUiStore((s) => s.setActiveCalendarView);
  const tapHackathonOpensLink = useUiStore((s) => s.tapHackathonOpensLinkDirectly);

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [selectedCategories, setSelectedCategories] = React.useState<EventCategory[]>(ALL_CATEGORIES);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createInitialDate, setCreateInitialDate] = React.useState<string | undefined>(undefined);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [eventToEdit, setEventToEdit] = React.useState<EventItem | null>(null);

  // Range query depending on view
  const range = React.useMemo(() => {
    if (activeView === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      return {
        from: startOfWeek(monthStart).toISOString(),
        to: endOfWeek(monthEnd).toISOString(),
      };
    } else if (activeView === 'week') {
      return {
        from: startOfWeek(currentDate).toISOString(),
        to: endOfWeek(currentDate).toISOString(),
      };
    } else {
      return {
        from: addDays(currentDate, -1).toISOString(),
        to: addDays(currentDate, 1).toISOString(),
      };
    }
  }, [currentDate, activeView]);

  const { data: rawEvents = [], isLoading } = useQuery({
    queryKey: ['events', currentGroupId, range.from, range.to],
    queryFn: () =>
      eventsApi.getEvents(currentGroupId!, {
        from: range.from,
        to: range.to,
      }),
    enabled: !!currentGroupId,
  });

  // Filter events by category
  const events = React.useMemo(() => {
    return rawEvents.filter((e) => selectedCategories.includes(e.category));
  }, [rawEvents, selectedCategories]);

  // Navigation handlers
  const handlePrev = () => {
    if (activeView === 'month') setCurrentDate((d) => subMonths(d, 1));
    else if (activeView === 'week') setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subDays(d, 1));
  };

  const handleNext = () => {
    if (activeView === 'month') setCurrentDate((d) => addMonths(d, 1));
    else if (activeView === 'week') setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Month days
  const monthDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Week days
  const weekDays = React.useMemo(() => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const toggleCategory = (cat: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleEventClick = (event: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const primaryUrl = event.primaryUrl || event.hackathon?.registrationUrl || event.url;
    const isHackathon = event.category === 'hackathon' || event.category === 'competition';

    if (tapHackathonOpensLink && isHackathon && primaryUrl) {
      window.open(primaryUrl, '_blank', 'noopener,noreferrer');
      toast.info(`Opening ${event.title} registration ↗`, {
        action: {
          label: 'View Details',
          onClick: () => setSelectedEventId(event.id),
        },
      });
      return;
    }

    setSelectedEventId(event.id);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Calendar Topbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-border bg-card">
        {/* Left: Navigation Controls */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded text-muted hover:text-foreground hover:bg-card transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded text-muted hover:text-foreground hover:bg-card transition-colors cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground min-w-[180px]">
            {activeView === 'month' && format(currentDate, 'MMMM yyyy')}
            {activeView === 'week' &&
              `${format(startOfWeek(currentDate), 'MMM d')} – ${format(
                endOfWeek(currentDate),
                'MMM d, yyyy'
              )}`}
            {activeView === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h1>
        </div>

        {/* Right: View Switcher & Action */}
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="flex rounded-lg border border-border bg-surface p-0.5 text-xs font-semibold">
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setActiveView(view)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all cursor-pointer ${
                  activeView === view
                    ? 'bg-card text-foreground shadow-xs font-bold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* New Event Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEventToEdit(null);
              setCreateInitialDate(currentDate.toISOString());
              setIsCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>New Event</span>
          </Button>
        </div>
      </div>

      {/* Main Calendar Body + Category Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Legend & Filter) */}
        <aside className="hidden xl:flex w-64 flex-col border-r border-border bg-card/60 p-4 space-y-6 shrink-0 overflow-y-auto">
          {/* Quick jump */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
              Categories
            </h3>
            <div className="space-y-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                const color = CATEGORY_COLORS[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-surface transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: isSelected ? color : 'transparent',
                          border: `2px solid ${color}`,
                        }}
                      />
                      <span className={isSelected ? 'text-foreground' : 'text-muted'}>
                        {CATEGORY_LABELS[cat]}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted">
                      {rawEvents.filter((e) => e.category === cat).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Link Setting Hint */}
          <div className="p-3 rounded-lg border border-border bg-surface/50 text-[11px] text-muted space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1">
              <span>Direct Link Click</span>
              <Badge variant="outline" className="text-[9px] py-0">
                {tapHackathonOpensLink ? 'ON' : 'OFF'}
              </Badge>
            </div>
            <p>
              Clicking a hackathon chip opens its official registration link directly. You can change this in Settings.
            </p>
          </div>
        </aside>

        {/* View Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* MONTH VIEW */}
          {activeView === 'month' && (
            <div className="h-full flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border bg-surface text-center py-2 text-xs font-semibold text-muted">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6 divide-x divide-y divide-border">
                {monthDays.map((day) => {
                  const dayEvents = events.filter((e) => isSameDay(parseISO(e.startAt), day));
                  const isCurMonth = isSameMonth(day, currentDate);
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setCreateInitialDate(day.toISOString());
                        setIsCreateOpen(true);
                      }}
                      className={`min-h-[90px] md:min-h-[110px] p-1.5 flex flex-col transition-colors cursor-pointer group hover:bg-surface/60 ${
                        !isCurMonth ? 'bg-surface/30 opacity-40' : 'bg-card'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-all ${
                            isCurrentDay
                              ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                              : 'text-foreground group-hover:text-primary'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-muted font-medium pr-1">
                            +{dayEvents.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((event) => {
                          const isUrgent = computeIsUrgent(event);
                          const isCompleted = event.status === 'completed';
                          const primaryUrl =
                            event.primaryUrl || event.hackathon?.registrationUrl || event.url;
                          const catColor = CATEGORY_COLORS[event.category];

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => handleEventClick(event, e)}
                              title={event.title}
                              className={`group/chip relative flex items-center justify-between gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border transition-all cursor-pointer truncate ${
                                isCompleted
                                  ? 'bg-surface border-border text-muted line-through opacity-60'
                                  : 'bg-surface/80 hover:bg-surface text-foreground shadow-2xs'
                              } ${isUrgent ? 'border-l-4 border-l-red-500' : ''}`}
                              style={{ borderLeftColor: isUrgent ? undefined : catColor }}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    event.priority === 'high'
                                      ? 'bg-red-500'
                                      : event.priority === 'medium'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                />
                                <span className="truncate">{event.title}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/chip:opacity-100 transition-opacity">
                                {primaryUrl && (
                                  <a
                                    href={primaryUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary hover:text-primary/80"
                                    title="Open link"
                                  >
                                    <ExternalIcon className="h-3 w-3" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventId(event.id);
                                  }}
                                  className="text-muted hover:text-foreground"
                                  title="View details"
                                >
                                  <Info className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {activeView === 'week' && (
            <div className="h-full flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="grid grid-cols-7 border-b border-border bg-surface text-center py-2 text-xs font-semibold">
                {weekDays.map((day) => {
                  const isCurrent = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex flex-col items-center ${isCurrent ? 'text-primary' : 'text-muted'}`}
                    >
                      <span>{format(day, 'EEE')}</span>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 text-xs ${
                          isCurrent ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 grid grid-cols-7 divide-x divide-border overflow-y-auto">
                {weekDays.map((day) => {
                  const dayEvents = events.filter((e) => isSameDay(parseISO(e.startAt), day));
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => {
                        setSelectedDate(day);
                        setCreateInitialDate(day.toISOString());
                        setIsCreateOpen(true);
                      }}
                      className="p-2 space-y-2 min-h-[400px] hover:bg-surface/40 transition-colors cursor-pointer"
                    >
                      {dayEvents.map((event) => {
                        const isUrgent = computeIsUrgent(event);
                        const catColor = CATEGORY_COLORS[event.category];
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => handleEventClick(event, e)}
                            className="p-2.5 rounded-lg border border-border bg-surface text-xs space-y-1 shadow-2xs hover:border-primary transition-all cursor-pointer"
                            style={{ borderLeftWidth: 4, borderLeftColor: isUrgent ? '#E5484D' : catColor }}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-foreground truncate">
                                {event.title}
                              </span>
                              {event.priority === 'high' && (
                                <span className="text-[10px] text-red-500 font-bold">🔴</span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(event.startAt)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {activeView === 'day' && (
            <div className="h-full max-w-3xl mx-auto rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {format(currentDate, 'EEEE, MMMM d, yyyy')}
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    {events.filter((e) => isSameDay(parseISO(e.startAt), currentDate)).length} scheduled
                    events
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEventToEdit(null);
                    setCreateInitialDate(currentDate.toISOString());
                    setIsCreateOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Add Event</span>
                </Button>
              </div>

              <div className="space-y-3">
                {events
                  .filter((e) => isSameDay(parseISO(e.startAt), currentDate))
                  .map((event) => {
                    const isUrgent = computeIsUrgent(event);
                    const catColor = CATEGORY_COLORS[event.category];
                    const primaryUrl = event.primaryUrl || event.hackathon?.registrationUrl || event.url;

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => handleEventClick(event, e)}
                        className="p-4 rounded-xl border border-border bg-surface/50 hover:bg-surface flex items-start justify-between gap-4 transition-all cursor-pointer"
                        style={{ borderLeftWidth: 4, borderLeftColor: isUrgent ? '#E5484D' : catColor }}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-foreground text-sm">{event.title}</h3>
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {event.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {formatTime(event.startAt)} – {formatTime(event.endAt)}
                            </span>
                            {event.hackathon?.prizePool && (
                              <span>Prize: {event.hackathon.prizePool}</span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted line-clamp-2">{event.description}</p>
                          )}
                        </div>

                        {primaryUrl && (
                          <a
                            href={primaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-all"
                          >
                            <span>Register</span>
                            <ExternalIcon className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    );
                  })}

                {events.filter((e) => isSameDay(parseISO(e.startAt), currentDate)).length === 0 && (
                  <div className="py-12 text-center text-muted space-y-2">
                    <CalendarIcon className="h-10 w-10 mx-auto text-muted/40" />
                    <p className="text-sm">No events scheduled for this day.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Drawer */}
      <EventDetailsDrawer
        eventId={selectedEventId}
        open={!!selectedEventId}
        onClose={() => setSelectedEventId(null)}
        onEdit={(event) => {
          setEventToEdit(event);
          setIsCreateOpen(true);
        }}
      />

      {/* Event Dialog (Create / Edit) */}
      <EventDialog
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
        initialDate={createInitialDate}
      />
    </div>
  );
};

