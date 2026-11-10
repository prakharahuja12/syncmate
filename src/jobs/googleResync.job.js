import { User } from '../models/User.js';
import { syncAllForUser } from '../services/googleCalendar.service.js';
import { logger } from '../config/logger.js';

/**
 * Nightly reconciliation job for all Google Calendar connected users.
 * Runs daily at 03:00 Asia/Kolkata.
 */
export async function runNightlyGoogleReconciliation() {
  logger.info('Starting nightly Google Calendar reconciliation');
  const connectedUsers = await User.find({ 'google.connected': true });

  let successCount = 0;
  let errorCount = 0;

  for (const user of connectedUsers) {
    try {
      await syncAllForUser(user);
      successCount++;
    } catch (err) {
      errorCount++;
      logger.error({ err, userId: user._id }, 'Error during nightly Google sync for user');
    }
  }

  logger.info(
    { successCount, errorCount, total: connectedUsers.length },
    'Nightly Google Calendar reconciliation completed'
  );

  return { successCount, errorCount, total: connectedUsers.length };
}
