import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatTime,
  formatRelativeTime,
  formatDeadlineCountdown,
  computeIsUrgent,
} from '../src/lib/dates';
import { EventItem } from '../src/types/api';

describe('Web Date Utilities', () => {
  it('formats dates and times correctly', () => {
    const iso = '2026-11-15T10:30:00.000Z';
    expect(formatDate(iso, 'yyyy-MM-dd')).toBe('2026-11-15');
    expect(formatTime(iso)).toBeTruthy();
  });

  it('handles null and invalid date inputs safely', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('invalid-date')).toBe('');
    expect(formatTime(undefined)).toBe('');
  });

  it('formats relative time safely', () => {
    const recent = new Date(Date.now() - 3600000).toISOString();
    expect(formatRelativeTime(recent)).toContain('ago');
  });

  it('computes deadline countdown accurately', () => {
    const in10h = new Date(Date.now() + 10 * 3600000).toISOString();
    const res10h = formatDeadlineCountdown(in10h);
    expect(res10h.text).toMatch(/Closes in \d+h/);
    expect(res10h.isClose).toBe(true);
    expect(res10h.isOverdue).toBe(false);

    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const resPast = formatDeadlineCountdown(pastDate);
    expect(resPast.text).toBe('Overdue');
    expect(resPast.isOverdue).toBe(true);
  });

  it('computes urgency based on priority and proximity', () => {
    const baseEvent: EventItem = {
      id: 'e1',
      groupId: 'g1',
      kind: 'event',
      title: 'Urgent SIH Final',
      category: 'hackathon',
      priority: 'high',
      startAt: new Date(Date.now() + 12 * 3600000).toISOString(),
      endAt: new Date(Date.now() + 14 * 3600000).toISOString(),
      allDay: false,
      primaryUrl: 'https://sih.gov.in',
      assignedToAll: true,
      assignedTo: [],
      status: 'pending',
      completedAt: null,
      completedBy: null,
      createdBy: { id: 'u1', name: 'Aman' },
      updatedBy: { id: 'u1', name: 'Aman' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinSummary: { pinnedBy: [], isPinnedByMe: false },
      participation: [],
      myStatus: null,
      myReminders: [],
      isUrgent: false,
    };

    expect(computeIsUrgent(baseEvent)).toBe(true);

    // Completed events are never urgent
    expect(computeIsUrgent({ ...baseEvent, status: 'completed' })).toBe(false);

    // Low priority in 5 days is not urgent
    const farLowEvent: EventItem = {
      ...baseEvent,
      priority: 'low',
      startAt: new Date(Date.now() + 5 * 86400000).toISOString(),
      endAt: new Date(Date.now() + 5 * 86400000 + 3600000).toISOString(),
    };
    expect(computeIsUrgent(farLowEvent)).toBe(false);
  });
});

