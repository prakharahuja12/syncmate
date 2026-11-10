/**
 * Priority ordering weight:
 * high (0) < medium (1) < low (2)
 */
export const PRIORITY_WEIGHTS = {
  high: 0,
  medium: 1,
  low: 2,
};

export const getPriorityWeight = (priority) => {
  return PRIORITY_WEIGHTS[priority] ?? 1;
};

/**
 * Computes whether an event is urgent based on the API Contract rules:
 * - Event must be 'pending' (completed events are never urgent).
 * - AND:
 *   1) priority === 'high' AND startAt is within the next 48 hours [now, now + 48h]
 *   2) startAt is within the next 24 hours [now, now + 24h]
 *   3) hackathon.registrationClosesAt is within the next 24 hours [now, now + 24h]
 *   4) Overdue pending high-priority event (startAt < now AND priority === 'high')
 *
 * @param {object} event
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export const computeUrgent = (event, now = new Date()) => {
  if (!event || event.status === 'completed') {
    return false;
  }

  const nowMs = now.getTime();
  const startMs = event.startAt ? new Date(event.startAt).getTime() : null;
  const regCloseMs = event.hackathon?.registrationClosesAt
    ? new Date(event.hackathon.registrationClosesAt).getTime()
    : null;

  const ms24h = 24 * 60 * 60 * 1000;
  const ms48h = 48 * 60 * 60 * 1000;

  // Rule 4: Overdue pending high-priority
  if (event.priority === 'high' && startMs !== null && startMs < nowMs) {
    return true;
  }

  // Rule 1: High priority starting within next 48h
  if (event.priority === 'high' && startMs !== null && startMs >= nowMs && startMs <= nowMs + ms48h) {
    return true;
  }

  // Rule 2: Any pending event starting within next 24h
  if (startMs !== null && startMs >= nowMs && startMs <= nowMs + ms24h) {
    return true;
  }

  // Rule 3: Any pending event whose registrationClosesAt is within next 24h
  if (regCloseMs !== null && regCloseMs >= nowMs && regCloseMs <= nowMs + ms24h) {
    return true;
  }

  return false;
};
