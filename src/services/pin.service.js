import { Pin } from '../models/Pin.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { Participation } from '../models/Participation.js';
import { Reminder } from '../models/Reminder.js';
import { ApiError } from '../utils/ApiError.js';
import { eventBus } from '../utils/eventBus.js';
import { computeFireAt } from './reminder.service.js';

export async function getPinSummary(eventId, requestingUserId) {
  const pins = await Pin.find({ eventId }).populate('userId', 'name avatarColor');
  const userIdStr = requestingUserId ? requestingUserId.toString() : null;

  const isPinnedByMe = pins.some(
    (p) => (p.userId?._id?.toString() || p.userId?.toString()) === userIdStr
  );

  const visiblePins = pins.filter(
    (p) => p.visibility === 'group' || (p.userId?._id?.toString() || p.userId?.toString()) === userIdStr
  );

  const pinnedBy = visiblePins.map((p) => ({
    user: {
      id: p.userId?._id?.toString() || p.userId?.toString(),
      name: p.userId?.name || '',
      avatarColor: p.userId?.avatarColor || '',
    },
    pinnedAt: p.pinnedAt ? new Date(p.pinnedAt).toISOString() : new Date().toISOString(),
    visibility: p.visibility,
  }));

  return { pinnedBy, isPinnedByMe };
}

export async function pinEvent({ eventId, userId, groupId, visibility = 'group' }) {
  const event = await Event.findOne({ _id: eventId, groupId });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  const pin = await Pin.findOneAndUpdate(
    { eventId, userId },
    { $set: { groupId, visibility, pinnedAt: new Date() } },
    { upsert: true, new: true }
  );

  // 1. Auto-set participation to 'interested' if none exists
  const existingPart = await Participation.findOne({ eventId, userId });
  if (!existingPart) {
    await Participation.create({
      groupId,
      eventId,
      userId,
      status: 'interested',
      updatedAt: new Date(),
    });
  }

  // 2. Default registration-deadline reminders on save (3d, 1d) if hackathon deadline in future
  if (event.hackathon?.registrationClosesAt) {
    const existingReminders = await Reminder.find({
      eventId,
      userId,
      anchor: 'registrationClose',
      status: { $ne: 'cancelled' },
    });

    if (existingReminders.length === 0) {
      const now = new Date();
      const user = await User.findById(userId);
      const timezone = user?.timezone || 'Asia/Kolkata';

      for (const offset of [4320, 1440]) {
        try {
          const fireAt = computeFireAt({
            event,
            anchor: 'registrationClose',
            offsetMinutes: offset,
            timezone,
          });
          if (fireAt > now) {
            await Reminder.create({
              groupId,
              eventId,
              userId,
              anchor: 'registrationClose',
              offsetMinutes: offset,
              fireAt,
              status: 'pending',
            });
          }
        } catch {
          // Gracefully skip
        }
      }
    }
  }

  const user = await User.findById(userId);
  const pinSummary = await getPinSummary(eventId, userId);

  // Emit domain event for activity & notifications
  eventBus.emit('domain.pin.added', { event, pin, user, groupId });

  // Broadcast realtime socket update
  eventBus.emit('pin:changed', {
    groupId: groupId.toString(),
    eventId: eventId.toString(),
    pinSummary,
  });

  return pinSummary;
}

export async function unpinEvent({ eventId, userId, groupId }) {
  const event = await Event.findOne({ _id: eventId, groupId });
  if (!event) {
    throw ApiError.notFound('Event not found');
  }

  await Pin.deleteOne({ eventId, userId });
  const user = await User.findById(userId);
  const pinSummary = await getPinSummary(eventId, userId);

  // Emit domain event for activity logging
  eventBus.emit('domain.pin.removed', { event, user, groupId });

  // Broadcast realtime socket update
  eventBus.emit('pin:changed', {
    groupId: groupId.toString(),
    eventId: eventId.toString(),
    pinSummary,
  });

  return { message: 'Pin removed successfully', pinSummary };
}
