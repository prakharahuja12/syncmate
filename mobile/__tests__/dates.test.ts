import { addHours, subHours, addDays } from 'date-fns';
import { formatDate, formatTime, formatDeadlineCountdown, computeIsUrgent } from '../src/lib/dates';
import { EventItem } from '../src/types/api';

describe('Date & Urgency Utilities', () => {
  const baseEvent: EventItem = {
    id: 'ev-1',
    groupId: 'grp-1',
    kind: 'event',
    title: 'Test Event',
    category: 'hackathon',
    priority: 'medium',
    startAt: addDays(new Date(), 5).toISOString(),
    endAt: addDays(new Date(), 5).toISOString(),
    allDay: false,
    primaryUrl: null,
    assignedToAll: true,
    assignedTo: [],
    status: 'pending',
    completedAt: null,
    completedBy: null,
    createdBy: { id: 'u1', name: 'Alice' },
    updatedBy: { id: 'u1', name: 'Alice' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinSummary: { pinnedBy: [], isPinnedByMe: false },
    participation: [],
    myStatus: null,
    myReminders: [],
    isUrgent: false,
  };

  test('formatDate and formatTime format ISO strings properly', () => {
    const iso = '2026-11-15T09:30:00.000Z';
    expect(formatDate(iso, 'yyyy-MM-dd')).toBe('2026-11-15');
    expect(formatTime(iso)).toBeTruthy();
  });

  test('formatDeadlineCountdown calculates countdown and closeness', () => {
    const futureClose = addHours(new Date(), 10).toISOString();
    const result = formatDeadlineCountdown(futureClose);
    expect(result.isClose).toBe(true);
    expect(result.text).toContain('Closes in');

    const pastClose = subHours(new Date(), 2).toISOString();
    const overdueResult = formatDeadlineCountdown(pastClose);
    expect(overdueResult.isOverdue).toBe(true);
    expect(overdueResult.text).toBe('Overdue');
  });

  describe('computeIsUrgent per API_CONTRACT rules', () => {
    const now = new Date();

    test('completed event is never urgent', () => {
      const urgentCandidate: EventItem = {
        ...baseEvent,
        status: 'completed',
        priority: 'high',
        startAt: addHours(now, 2).toISOString(),
      };
      expect(computeIsUrgent(urgentCandidate, now)).toBe(false);
    });

    test('overdue high-priority event is urgent', () => {
      const overdueHigh: EventItem = {
        ...baseEvent,
        priority: 'high',
        startAt: subHours(now, 3).toISOString(),
      };
      expect(computeIsUrgent(overdueHigh, now)).toBe(true);
    });

    test('high priority event within 48h is urgent', () => {
      const high48h: EventItem = {
        ...baseEvent,
        priority: 'high',
        startAt: addHours(now, 30).toISOString(),
      };
      expect(computeIsUrgent(high48h, now)).toBe(true);
    });

    test('any pending event starting within 24h is urgent', () => {
      const low24h: EventItem = {
        ...baseEvent,
        priority: 'low',
        startAt: addHours(now, 12).toISOString(),
      };
      expect(computeIsUrgent(low24h, now)).toBe(true);
    });

    test('event in 4 days with no urgent deadline is not urgent', () => {
      const normal: EventItem = {
        ...baseEvent,
        priority: 'medium',
        startAt: addDays(now, 4).toISOString(),
      };
      expect(computeIsUrgent(normal, now)).toBe(false);
    });

    test('event with hackathon registration closing in 10h is urgent', () => {
      const hackUrgent: EventItem = {
        ...baseEvent,
        priority: 'low',
        startAt: addDays(now, 10).toISOString(),
        hackathon: {
          name: 'SIH 2026',
          registrationClosesAt: addHours(now, 10).toISOString(),
        },
      };
      expect(computeIsUrgent(hackUrgent, now)).toBe(true);
    });
  });
});

