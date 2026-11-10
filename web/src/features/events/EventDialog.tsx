import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addHours, format, parseISO, startOfHour } from 'date-fns';
import { Dialog } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { eventsApi, CreateEventPayload } from './api';
import { groupApi } from '../group/api';
import { useAuthStore } from '../../stores/authStore';
import { CATEGORY_COLORS, CATEGORY_LABELS, PRIORITY_COLORS, PRIORITY_LABELS } from '../../lib/constants';
import { EventCategory, EventPriority, HackathonMode, EventItem } from '../../types/api';

export interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  eventToEdit?: EventItem | null;
  initialDate?: string;
  initialCategory?: EventCategory;
}

const CATEGORIES: EventCategory[] = [
  'hackathon',
  'college',
  'personal',
  'meeting',
  'competition',
  'other',
];

const PRIORITIES: EventPriority[] = ['high', 'medium', 'low'];

export const EventDialog: React.FC<EventDialogProps> = ({
  open,
  onClose,
  eventToEdit,
  initialDate,
  initialCategory = 'hackathon',
}) => {
  const queryClient = useQueryClient();
  const currentGroupId = useAuthStore((s) => s.group?.id);

  const defaultStart = startOfHour(addHours(new Date(), 1));
  const defaultEnd = addHours(defaultStart, 1);

  const [title, setTitle] = React.useState('');
  const [category, setCategory] = React.useState<EventCategory>(initialCategory);
  const [priority, setPriority] = React.useState<EventPriority>('medium');
  const [startAt, setStartAt] = React.useState(defaultStart.toISOString().slice(0, 16));
  const [endAt, setEndAt] = React.useState(defaultEnd.toISOString().slice(0, 16));
  const [allDay, setAllDay] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [assignedToAll, setAssignedToAll] = React.useState(true);
  const [assignedTo, setAssignedTo] = React.useState<string[]>([]);
  const [selectedReminderOffset, setSelectedReminderOffset] = React.useState<number | null>(60);
  const [saveToWatchlist, setSaveToWatchlist] = React.useState(false);

  // Hackathon specific fields
  const [hackName, setHackName] = React.useState('');
  const [regUrl, setRegUrl] = React.useState('');
  const [officialUrl, setOfficialUrl] = React.useState('');
  const [regClosesAt, setRegClosesAt] = React.useState('');
  const [prizePool, setPrizePool] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [mode, setMode] = React.useState<HackathonMode>('online');

  const { data: group } = useQuery({
    queryKey: ['group'],
    queryFn: () => groupApi.getMyGroup(),
    enabled: open,
  });

  React.useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setCategory(eventToEdit.category);
      setPriority(eventToEdit.priority);
      setStartAt(eventToEdit.startAt.slice(0, 16));
      setEndAt(eventToEdit.endAt.slice(0, 16));
      setAllDay(eventToEdit.allDay);
      setDescription(eventToEdit.description || '');
      setUrl(eventToEdit.url || '');
      setAssignedToAll(eventToEdit.assignedToAll);
      setAssignedTo(eventToEdit.assignedTo || []);

      if (eventToEdit.hackathon) {
        setHackName(eventToEdit.hackathon.name || '');
        setRegUrl(eventToEdit.hackathon.registrationUrl || '');
        setOfficialUrl(eventToEdit.hackathon.officialUrl || '');
        setRegClosesAt(eventToEdit.hackathon.registrationClosesAt?.slice(0, 16) || '');
        setPrizePool(eventToEdit.hackathon.prizePool || '');
        setLocation(eventToEdit.hackathon.location || '');
        setMode(eventToEdit.hackathon.mode || 'online');
      }
    } else {
      setTitle('');
      setCategory(initialCategory);
      setPriority('medium');
      if (initialDate) {
        setStartAt(initialDate.slice(0, 16));
        setEndAt(addHours(parseISO(initialDate), 1).toISOString().slice(0, 16));
      }
      setAllDay(false);
      setDescription('');
      setUrl('');
      setAssignedToAll(true);
      setAssignedTo([]);
      setHackName('');
      setRegUrl('');
      setOfficialUrl('');
      setRegClosesAt('');
      setPrizePool('');
      setLocation('');
      setMode('online');
      setSaveToWatchlist(false);
    }
  }, [eventToEdit, open, initialDate, initialCategory]);

  const isHackathonType = category === 'hackathon' || category === 'competition';

  const mutation = useMutation({
    mutationFn: (payload: CreateEventPayload) => {
      if (eventToEdit) {
        return eventsApi.updateEvent(eventToEdit.id, payload);
      }
      return eventsApi.createEvent(currentGroupId!, payload);
    },
    onSuccess: async (event) => {
      if (saveToWatchlist && !eventToEdit) {
        try {
          await eventsApi.pinEvent(event.id, 'group');
        } catch {}
      }
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(eventToEdit ? 'Event updated!' : 'Event created!');
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save event'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.deleteEvent(eventToEdit!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.info('Event deleted');
      onClose();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    const payload: CreateEventPayload = {
      title: title.trim(),
      category,
      priority,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      allDay,
      description: description.trim() || undefined,
      url: url.trim() || undefined,
      assignedToAll,
      assignedTo: assignedToAll ? [] : assignedTo,
      kind: 'event',
      reminders: selectedReminderOffset
        ? [{ anchor: 'start', offsetMinutes: selectedReminderOffset }]
        : [],
    };

    if (isHackathonType) {
      payload.hackathon = {
        name: hackName.trim() || title.trim(),
        registrationUrl: regUrl.trim() || undefined,
        officialUrl: officialUrl.trim() || undefined,
        registrationClosesAt: regClosesAt ? new Date(regClosesAt).toISOString() : undefined,
        prizePool: prizePool.trim() || undefined,
        location: location.trim() || undefined,
        mode,
      };
    }

    mutation.mutate(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={eventToEdit ? 'Edit Event' : 'Create New Event'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
        {/* Title */}
        <Input
          label="Title"
          placeholder="e.g. Smart India Hackathon 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-base font-semibold"
          autoFocus
        />

        {/* Category Chips */}
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              const color = CATEGORY_COLORS[cat];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected ? 'text-white' : 'text-foreground hover:bg-surface'
                  }`}
                  style={{
                    backgroundColor: isSelected ? color : 'transparent',
                    borderColor: isSelected ? color : 'var(--border)',
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority Chips */}
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5">Priority</label>
          <div className="flex gap-2">
            {PRIORITIES.map((p) => {
              const isSelected = priority === p;
              const color = PRIORITY_COLORS[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected ? 'border-2' : 'border-border bg-surface'
                  }`}
                  style={{
                    borderColor: isSelected ? color : undefined,
                    backgroundColor: isSelected ? `${color}15` : undefined,
                    color: isSelected ? color : 'var(--text)',
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {PRIORITY_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dates & Times */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Start date & time"
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
          <Input
            label="End date & time"
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>

        {/* All day toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDayCheck"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="rounded border-border text-primary cursor-pointer"
          />
          <label htmlFor="allDayCheck" className="text-xs font-medium cursor-pointer">
            All-day event
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1">Description</label>
          <textarea
            rows={2}
            placeholder="Agendas, notes, or details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border bg-surface p-2 text-xs text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        {/* Hackathon Section */}
        {isHackathonType && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
              🏆 Hackathon / Competition Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Registration URL"
                type="url"
                placeholder="https://devpost.com/sih2026"
                value={regUrl}
                onChange={(e) => setRegUrl(e.target.value)}
              />
              <Input
                label="Official Website"
                type="url"
                placeholder="https://sih.gov.in"
                value={officialUrl}
                onChange={(e) => setOfficialUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Registration Closes"
                type="datetime-local"
                value={regClosesAt}
                onChange={(e) => setRegClosesAt(e.target.value)}
              />
              <Input
                label="Prize Pool"
                placeholder="₹1,00,000"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
              />
              <Input
                label="Location"
                placeholder="New Delhi / Online"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="saveToWatchlist"
                checked={saveToWatchlist}
                onChange={(e) => setSaveToWatchlist(e.target.checked)}
                className="rounded border-border text-primary cursor-pointer"
              />
              <label htmlFor="saveToWatchlist" className="text-xs font-semibold text-foreground cursor-pointer">
                📌 Save for later (add to Watchlist)
              </label>
            </div>
          </div>
        )}

        {/* Reminders Presets */}
        <div>
          <label className="block text-xs font-semibold text-foreground/80 mb-1.5">
            Reminder (for you only)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '1 hour before', offset: 60 },
              { label: '30 mins before', offset: 30 },
              { label: '12 hours before', offset: 720 },
              { label: '1 day before', offset: 1440 },
            ].map((rem) => {
              const isSelected = selectedReminderOffset === rem.offset;
              return (
                <button
                  key={rem.offset}
                  type="button"
                  onClick={() => setSelectedReminderOffset(isSelected ? null : rem.offset)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                    isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border text-muted'
                  }`}
                >
                  {rem.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {eventToEdit ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Delete this event?')) deleteMutation.mutate();
              }}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending} size="sm">
              {eventToEdit ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
};
