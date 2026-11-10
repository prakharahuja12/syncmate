import admin from 'firebase-admin';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return true;
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return false;
  }

  try {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    logger.info('Firebase Admin SDK initialized successfully');
    return true;
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Firebase Admin SDK');
    return false;
  }
};

/**
 * Sends push notifications to all registered devices of a user.
 *
 * @param {object} params
 * @param {object} params.user - User document or object with pushTokens and settings
 * @param {string} params.title
 * @param {string} params.body
 * @param {object} [params.data={}]
 * @returns {Promise<'sent'|'failed'|'skipped'>}
 */
export const sendPushToUser = async ({ user, title, body, data = {} }) => {
  try {
    if (!user) return 'skipped';

    // Check user preferences
    if (user.settings && user.settings.pushNotifications === false) {
      return 'skipped';
    }

    const tokens = (user.pushTokens || []).map((t) => t.token).filter(Boolean);
    if (tokens.length === 0) {
      return 'skipped';
    }

    if (!initFirebase()) {
      return 'skipped';
    }

    const eventId = data?.eventId ? data.eventId.toString() : '';
    const deepLink = data?.deepLink || (eventId ? `/event/${eventId}` : '');

    const message = {
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        notificationId: data?.notificationId ? data.notificationId.toString() : '',
        type: data?.type || 'notification',
        eventId,
        deepLink,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'syncmate-default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      webpush: {
        fcmOptions: {
          link: `${env.WEB_URL}${deepLink}`,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up stale / unregistered tokens
    const staleTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const code = resp.error.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          staleTokens.push(tokens[idx]);
        }
      }
    });

    if (staleTokens.length > 0 && user._id) {
      try {
        await User.findByIdAndUpdate(user._id, {
          $pull: { pushTokens: { token: { $in: staleTokens } } },
        });
        logger.info({ userId: user._id, count: staleTokens.length }, 'Cleaned up invalid push tokens');
      } catch (cleanupErr) {
        logger.error({ cleanupErr }, 'Failed to remove stale push tokens');
      }
    }

    return response.successCount > 0 ? 'sent' : 'failed';
  } catch (err) {
    logger.error({ err }, 'Error in sendPushToUser');
    return 'failed';
  }
};
