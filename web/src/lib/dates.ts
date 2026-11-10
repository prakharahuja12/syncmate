import {
  format,
  formatDistanceToNow,
  differenceInHours,
  differenceInDays,
  isPast,
  isBefore,
  addHours,
  parseISO,
} from 'date-fns';
import { EventItem } from '../types/api';

export const formatDate = (isoString?: string | null, formatPattern = 'MMM d, yyyy'): string => {
  if (!isoString) return '';
  try {
    return format(parseISO(isoString), formatPattern);
  } catch {
    return '';
  }
};

export const formatTime = (isoString?: string | null, formatPattern = 'h:mm a'): string => {
  if (!isoString) return '';
  try {
    return format(parseISO(isoString), formatPattern);
  } catch {
    return '';
  }
};

export const formatRelativeTime = (isoString?: string | null): string => {
  if (!isoString) return '';
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return '';
  }
};

export const formatDeadlineCountdown = (
  isoString?: string | null
): { text: string; isClose: boolean; isOverdue: boolean } => {
  if (!isoString) return { text: '', isClose: false, isOverdue: false };
  try {
    const target = parseISO(isoString);
    if (isPast(target)) {
      return { text: 'Overdue', isClose: true, isOverdue: true };
    }
    const hours = differenceInHours(target, new Date());
    if (hours < 24) {
      return { text: `Closes in ${hours}h`, isClose: true, isOverdue: false };
    }
    const days = differenceInDays(target, new Date());
    return { text: `Closes in ${days}d`, isClose: days <= 3, isOverdue: false };
  } catch {
    return { text: '', isClose: false, isOverdue: false };
  }
};

export const computeIsUrgent = (event: EventItem, now = new Date()): boolean => {
  if (event.status === 'completed') return false;

  const start = parseISO(event.startAt);
  const in24h = addHours(now, 24);
  const in48h = addHours(now, 48);

  // Overdue high-priority
  if (event.priority === 'high' && isBefore(start, now)) {
    return true;
  }

  // High priority within 48h
  if (event.priority === 'high' && isBefore(start, in48h)) {
    return true;
  }

  // Any pending event with startAt within 24h
  if (isBefore(start, in24h) && !isBefore(start, now)) {
    return true;
  }

  // Hackathon registration closes within 24h
  if (event.hackathon?.registrationClosesAt) {
    const regClose = parseISO(event.hackathon.registrationClosesAt);
    if (isBefore(regClose, in24h) && !isBefore(regClose, now)) {
      return true;
    }
  }

  return false;
};
