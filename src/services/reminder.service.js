import { Reminder } from '../models/Reminder.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { normalizeAllDayDates } from '../utils/dates.js';

export function computeFireAt({ event, anchor, offsetMinutes, customAt, timezone = 'Asia/Kolkata' }) {
  if (customAt) {
    const customDate = new Date(customAt);
    if (isNaN(customDate.getTime())) {
      throw ApiError.badRequest('Invalid customAt date');
    }
    return customDate;
  }

  if (offsetMinutes == null) {
    throw ApiError.badRequest('offsetMinutes is required when customAt is not provided');
  }

  if (anchor === 'start') {
    if (!event.startAt) {
      throw ApiError.badRequest('Event startAt is missing');
    }

    if (event.allDay) {
      // 09:00 AM in user's timezone on start date
      const { startAt: dayStart } = normalizeAllDayDates(event.startAt, event.endAt, timezone);
      const baseline = new Date(dayStart.getTime() + 9 * 60 * 60 * 1000);
      return new Date(baseline.getTime() - offsetMinutes * 60 * 1000);
    }

    return new Date(new Date(event.startAt).getTime() - offsetMinutes * 60 * 1000);
  }

  if (anchor === 'registrationClose') {
    const closesAt = event.hackathon?.registrationClosesAt;
    if (!closesAt) {
      throw ApiError.badRequest('Event has no registration close deadline');
    }
    return new Date(new Date(closesAt).getTime() - offsetMinutes * 60 * 1000);
  }

  throw ApiError.badRequest(`Unsupported anchor: ${anchor}`);
}

export async function getRemindersForEvent({ eventId, userId, groupId }) {
  const event = await Event.findOne({ _id: eventId, groupId });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const reminders = await Reminder.find({
    eventId,
    userId,
    status: { $in: ['pending', 'processing'] },
  }).sort({ fireAt: 1 });

  return reminders.map((r) => ({
    id: r._id.toString(),
    anchor: r.anchor,
    offsetMinutes: r.offsetMinutes,
    customAt: r.customAt ? r.customAt.toISOString() : null,
    fireAt: r.fireAt.toISOString(),
    status: r.status,
  }));
}

export async function setRemindersForEvent({ eventId, userId, groupId, remindersInput }) {
  const event = await Event.findOne({ _id: eventId, groupId });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const user = await User.findById(userId);
  const timezone = user?.timezone || 'Asia/Kolkata';

  // Cancel existing pending reminders for this user on this event
  await Reminder.updateMany(
    { eventId, userId, status: 'pending' },
    { $set: { status: 'cancelled' } }
  );

  const now = new Date();
  const createdReminders = [];

  for (const item of remindersInput) {
    try {
      const fireAt = computeFireAt({
        event,
        anchor: item.anchor,
        offsetMinutes: item.offsetMinutes,
        customAt: item.customAt,
        timezone,
      });

      // Skip past presets gracefully; reject explicitly past customAt
      if (fireAt <= now) {
        if (item.customAt) {
          throw ApiError.badRequest('customAt must be in the future');
        }
        continue;
      }

      const reminder = await Reminder.create({
        groupId,
        eventId,
        userId,
        anchor: item.anchor,
        offsetMinutes: item.offsetMinutes || null,
        customAt: item.customAt ? new Date(item.customAt) : null,
        fireAt,
        status: 'pending',
      });

      createdReminders.push({
        id: reminder._id.toString(),
        anchor: reminder.anchor,
        offsetMinutes: reminder.offsetMinutes,
        customAt: reminder.customAt ? reminder.customAt.toISOString() : null,
        fireAt: reminder.fireAt.toISOString(),
      });
    } catch (err) {
      if (item.customAt) throw err;
      // Skip invalid offset calculations gracefully
    }
  }

  return createdReminders;
}

export async function recomputeRemindersForEvent(event) {
  const pendingReminders = await Reminder.find({
    eventId: event._id,
    status: 'pending',
  });

  const now = new Date();

  for (const reminder of pendingReminders) {
    try {
      const user = await User.findById(reminder.userId);
      const timezone = user?.timezone || 'Asia/Kolkata';

      const fireAt = computeFireAt({
        event,
        anchor: reminder.anchor,
        offsetMinutes: reminder.offsetMinutes,
        customAt: reminder.customAt,
        timezone,
      });

      if (fireAt <= now) {
        reminder.status = 'cancelled';
      } else {
        reminder.fireAt = fireAt;
      }
      await reminder.save();
    } catch {
      reminder.status = 'cancelled';
      await reminder.save();
    }
  }
}

export async function cancelEventReminders(eventId) {
  await Reminder.updateMany(
    { eventId, status: 'pending' },
    { $set: { status: 'cancelled' } }
  );
}

export async function restoreEventReminders(event) {
  const now = new Date();
  const cancelledReminders = await Reminder.find({
    eventId: event._id,
    status: 'cancelled',
  });

  for (const reminder of cancelledReminders) {
    try {
      const user = await User.findById(reminder.userId);
      const timezone = user?.timezone || 'Asia/Kolkata';

      const fireAt = computeFireAt({
        event,
        anchor: reminder.anchor,
        offsetMinutes: reminder.offsetMinutes,
        customAt: reminder.customAt,
        timezone,
      });

      if (fireAt > now) {
        reminder.fireAt = fireAt;
        reminder.status = 'pending';
        await reminder.save();
      }
    } catch {
      // Keep cancelled
    }
  }
}

export async function cancelRegistrationReminders(eventId, userId) {
  await Reminder.updateMany(
    {
      eventId,
      userId,
      anchor: 'registrationClose',
      status: 'pending',
    },
    { $set: { status: 'cancelled' } }
  );
}

