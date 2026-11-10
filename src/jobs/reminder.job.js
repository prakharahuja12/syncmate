import { Reminder } from '../models/Reminder.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { logger } from '../config/logger.js';
import * as notificationService from '../services/notification.service.js';

/**
 * Processes due reminders with atomic concurrency-safe claim logic.
 * Accepts an optional currentTime parameter for injectable-clock unit tests.
 */
export async function processDueReminders(currentTime = new Date()) {
  if (process.env.DISABLE_SCHEDULER === 'true') {
    return { processed: 0, skipped: true };
  }

  const batchLimit = 200;
  const now = new Date(currentTime);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const candidates = await Reminder.find({
    status: 'pending',
    fireAt: { $lte: now },
  })
    .sort({ fireAt: 1 })
    .limit(batchLimit);

  let processedCount = 0;

  for (const candidate of candidates) {
    // 1. Atomic claim: ensures exactly-once execution across instances
    const claimed = await Reminder.findOneAndUpdate(
      { _id: candidate._id, status: 'pending' },
      { $set: { status: 'processing' } },
      { new: true }
    );

    if (!claimed) continue; // Claimed by another worker

    try {
      // Catch-up rule: older than 24h -> silently cancel
      if (claimed.fireAt < twentyFourHoursAgo) {
        claimed.status = 'cancelled';
        await claimed.save();
        continue;
      }

      const event = await Event.findById(claimed.eventId);
      const user = await User.findById(claimed.userId);

      // Verify event is active and user remains in group
      if (!event || event.status === 'completed' || !user || !user.groupId?.equals(claimed.groupId)) {
        claimed.status = 'cancelled';
        await claimed.save();
        continue;
      }

      const isLate = claimed.fireAt < sixHoursAgo;
      const isRegClose = claimed.anchor === 'registrationClose';
      const type = isRegClose ? 'registration_deadline' : 'reminder';

      const prefix = isLate ? '(missed earlier) ' : '';
      let title = `⏰ ${event.title}`;
      let body = '';

      if (isRegClose) {
        title = `⏰ Registration Deadline: ${event.title}`;
        body = `${prefix}Registration closes soon for ${event.title}.`;
      } else {
        title = `⏰ Upcoming Event: ${event.title}`;
        body = `${prefix}Event starts soon at ${new Date(event.startAt).toLocaleTimeString()}.`;
      }

      await notificationService.notifyUsers({
        userIds: [claimed.userId],
        groupId: claimed.groupId,
        actorId: null,
        type,
        title,
        body,
        data: {
          eventId: event._id.toString(),
          deepLink: `syncmate://event/${event._id.toString()}`,
        },
      });

      claimed.status = 'sent';
      claimed.sentAt = new Date();
      await claimed.save();
      processedCount++;
    } catch (err) {
      claimed.attempts = (claimed.attempts || 0) + 1;
      claimed.status = claimed.attempts >= 3 ? 'cancelled' : 'pending';
      await claimed.save();
      logger.error({ err, reminderId: claimed._id }, 'Reminder dispatch attempt failed');
    }
  }

  return { processed: processedCount };
}

/**
 * Daily 08:00 Asia/Kolkata sweep for watchlist events closing within 24h.
 */
export async function runRegistrationDeadlineSweep(currentTime = new Date()) {
  if (process.env.DISABLE_SCHEDULER === 'true') {
    return { swept: 0 };
  }

  const now = new Date(currentTime);
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const closingEvents = await Event.find({
    status: 'pending',
    'hackathon.registrationClosesAt': { $gte: now, $lte: next24h },
  });

  let count = 0;
  for (const event of closingEvents) {
    // Notify all members who haven't registered
    await notificationService.notifyUsers({
      userIds: event.assignedToAll ? [] : event.assignedTo,
      groupId: event.groupId,
      actorId: null,
      type: 'registration_deadline',
      title: `⏰ Urgent: Registration Closes Today for ${event.title}`,
      body: `Registration closes in less than 24 hours.`,
      data: {
        eventId: event._id.toString(),
        deepLink: `syncmate://event/${event._id.toString()}`,
      },
    });
    count++;
  }

  return { swept: count };
}

