import { DateTime } from 'luxon';

/**
 * Normalizes all-day events to start-of-day and end-of-day in the user's timezone.
 *
 * @param {Date|string} startAt
 * @param {Date|string} [endAt]
 * @param {string} [timezone='Asia/Kolkata']
 * @returns {{ startAt: Date, endAt: Date }}
 */
export const normalizeAllDayDates = (startAt, endAt = null, timezone = 'Asia/Kolkata') => {
  const zone = timezone || 'Asia/Kolkata';

  const startDt = DateTime.fromJSDate(new Date(startAt), { zone }).startOf('day');
  const targetEnd = endAt ? new Date(endAt) : new Date(startAt);
  const endDt = DateTime.fromJSDate(targetEnd, { zone }).endOf('day');

  return {
    startAt: startDt.toJSDate(),
    endAt: endDt.toJSDate(),
  };
};

/**
 * Returns the start and end of day in the specified timezone.
 *
 * @param {Date|string} [date=new Date()]
 * @param {string} [timezone='Asia/Kolkata']
 * @returns {{ startOfDay: Date, endOfDay: Date }}
 */
export const getUserDayBounds = (date = new Date(), timezone = 'Asia/Kolkata') => {
  const zone = timezone || 'Asia/Kolkata';
  const startOfDay = DateTime.fromJSDate(new Date(date), { zone }).startOf('day').toJSDate();
  const endOfDay = DateTime.fromJSDate(new Date(date), { zone }).endOf('day').toJSDate();

  return { startOfDay, endOfDay };
};
