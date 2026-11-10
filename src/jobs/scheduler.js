import cron from 'node-cron';
import { logger } from '../config/logger.js';
import { processDueReminders, runRegistrationDeadlineSweep } from './reminder.job.js';
import { runNightlyGoogleReconciliation } from './googleResync.job.js';

let reminderTask = null;
let sweepTask = null;
let googleReconcileTask = null;

export function startScheduler() {
  if (process.env.DISABLE_SCHEDULER === 'true') {
    logger.info('Scheduler disabled via DISABLE_SCHEDULER=true');
    return;
  }

  // Every minute: process due reminders
  reminderTask = cron.schedule('* * * * *', async () => {
    try {
      await processDueReminders();
    } catch (err) {
      logger.error({ err }, 'Error in reminder worker cron');
    }
  });

  // Daily at 08:00 Asia/Kolkata: registration deadline sweep
  sweepTask = cron.schedule(
    '0 8 * * *',
    async () => {
      try {
        await runRegistrationDeadlineSweep();
      } catch (err) {
        logger.error({ err }, 'Error in registration sweep cron');
      }
    },
    {
      timezone: 'Asia/Kolkata',
    }
  );

  // Daily at 03:00 Asia/Kolkata: Google Calendar reconciliation
  googleReconcileTask = cron.schedule(
    '0 3 * * *',
    async () => {
      try {
        await runNightlyGoogleReconciliation();
      } catch (err) {
        logger.error({ err }, 'Error in Google Calendar reconciliation cron');
      }
    },
    {
      timezone: 'Asia/Kolkata',
    }
  );

  logger.info('Background scheduler started (reminder worker + sweep + Google reconcile)');
}

export function stopScheduler() {
  if (reminderTask) {
    reminderTask.stop();
    reminderTask = null;
  }
  if (sweepTask) {
    sweepTask.stop();
    sweepTask = null;
  }
  if (googleReconcileTask) {
    googleReconcileTask.stop();
    googleReconcileTask = null;
  }
  logger.info('Background scheduler stopped');
}

