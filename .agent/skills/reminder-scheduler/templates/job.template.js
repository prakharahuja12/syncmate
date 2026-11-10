/**
 * templates/job.template.js
 * Atomic reminder processing worker with concurrency-safe claim logic.
 */
import { Reminder } from '../models/Reminder.js';
import * as notificationService from '../services/notification.service.js';
import { logger } from '../config/logger.js';

export async function processDueReminders(currentTime = new Date()) {
  const batchLimit = 200;
  const sixHoursAgo = new Date(currentTime.getTime() - 6 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

  // Find due reminders
  const candidates = await Reminder.find({
    status: 'pending',
    fireAt: { $lte: currentTime }
  })
    .sort({ fireAt: 1 })
    .limit(batchLimit);

  for (const candidate of candidates) {
    // 1. Atomic claim: prevents duplicate delivery across multiple workers
    const claimed = await Reminder.findOneAndUpdate(
      { _id: candidate._id, status: 'pending' },
      { status: 'processing' },
      { new: true }
    ).populate('eventId');

    if (!claimed) continue; // Claimed by another worker

    try {
      const event = claimed.eventId;
      // Skip if event completed or removed
      if (!event || event.status === 'completed') {
        claimed.status = 'cancelled';
        await claimed.save();
        continue;
      }

      // Stale catch-up logic
      if (claimed.fireAt < twentyFourHoursAgo) {
        claimed.status = 'cancelled';
        await claimed.save();
        continue;
      }

      const isLate = claimed.fireAt < sixHoursAgo;
      const type = claimed.anchor === 'registrationClose' ? 'registration_deadline' : 'reminder';
      const title = `⏰ ${event.title} starts soon`;
      const body = isLate ? '(missed earlier) ' : '';

      // 2. Dispatch notification
      await notificationService.notifyUsers({
        userIds: [claimed.userId],
        groupId: claimed.groupId,
        actorId: null,
        type,
        title,
        body,
        data: { eventId: event._id.toString() }
      });

      claimed.status = 'sent';
      claimed.sentAt = new Date();
      await claimed.save();
    } catch (err) {
      claimed.attempts = (claimed.attempts || 0) + 1;
      claimed.status = claimed.attempts >= 3 ? 'cancelled' : 'pending';
      await claimed.save();
      logger.error({ err, reminderId: claimed._id }, 'Reminder dispatch failed');
    }
  }
}

