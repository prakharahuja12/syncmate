import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { GoogleSync } from '../models/GoogleSync.js';
import { env } from '../config/env.js';
import { encrypt, decrypt } from '../utils/crypto.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

export const CATEGORY_COLOR_MAP = {
  hackathon: '11', // tomato
  college: '9', // blueberry
  personal: '2', // sage
  meeting: '5', // banana
  competition: '3', // grape
  other: '8', // graphite
};

export const PRIORITY_EMOJI_MAP = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export function generateAuthUrl({ userId, platform = 'web' }) {
  const oauth2Client = getOAuth2Client();

  const state = jwt.sign(
    {
      userId: userId.toString(),
      platform,
      nonce: crypto.randomBytes(8).toString('hex'),
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '10m' }
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'openid',
      'email',
    ],
    state,
  });

  return { url };
}

export async function handleOAuthCallback({ code, state }) {
  let decoded;
  try {
    decoded = jwt.verify(state, env.JWT_ACCESS_SECRET);
  } catch {
    throw ApiError.badRequest('Invalid or expired state parameter');
  }

  const { userId, platform = 'web' } = decoded;
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens);

  // Retrieve user email from oauth2 userinfo
  let email = null;
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    email = userInfo.data?.email || null;
  } catch (err) {
    logger.warn({ err }, 'Failed to fetch user email during Google OAuth callback');
  }

  user.google = user.google || {};
  user.google.connected = true;
  user.google.email = email;
  user.google.calendarId = user.google.calendarId || 'primary';

  if (tokens.refresh_token) {
    user.google.refreshTokenEnc = encrypt(tokens.refresh_token, env.ENCRYPTION_KEY);
  }

  await user.save();

  // Trigger initial background sync
  syncAllForUser(user).catch((err) => {
    logger.error({ err, userId: user._id }, 'Error during initial Google sync');
  });

  const redirectUrl =
    platform === 'mobile'
      ? 'syncmate://integrations?google=connected'
      : `${env.WEB_URL}/settings/integrations?google=connected`;

  return { redirectUrl };
}

export function getAuthenticatedCalendarClient(user) {
  if (!user.google?.connected || !user.google?.refreshTokenEnc) {
    throw ApiError.badRequest('Google Calendar is not connected');
  }

  const refreshToken = decrypt(user.google.refreshTokenEnc, env.ENCRYPTION_KEY);
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export function shouldSync(user, event) {
  if (!user?.google?.connected) {
    return false;
  }

  const prefs = user.google.syncPreferences || {};
  const mode = prefs.mode || 'all';

  if (mode === 'none') {
    return false;
  }

  if (mode === 'all') {
    return true;
  }

  if (mode === 'categories') {
    if (Array.isArray(prefs.categories) && prefs.categories.length > 0) {
      if (!prefs.categories.includes(event.category)) {
        return false;
      }
    }
    if (Array.isArray(prefs.priorities) && prefs.priorities.length > 0) {
      if (!prefs.priorities.includes(event.priority)) {
        return false;
      }
    }
    return true;
  }

  if (mode === 'assigned_to_me') {
    // Only events explicitly assigning me
    const userIdStr = user._id.toString();
    const assignedList = Array.isArray(event.assignedTo) ? event.assignedTo : [];
    return assignedList.some((id) => (id._id ? id._id.toString() : id.toString()) === userIdStr);
  }

  return false;
}

export function computeContentHash(event, kind = 'event') {
  const primaryUrl =
    event.hackathon?.registrationUrl || event.hackathon?.officialUrl || event.url || '';

  const raw = [
    event.title || '',
    event.description || '',
    event.startAt ? new Date(event.startAt).toISOString() : '',
    event.endAt ? new Date(event.endAt).toISOString() : '',
    Boolean(event.allDay),
    primaryUrl,
    event.priority || 'medium',
    event.category || 'other',
    event.status || 'pending',
    kind,
  ].join('|');

  return crypto.createHash('sha1').update(raw).digest('hex');
}

export function buildGoogleEventBody(event, kind = 'event') {
  const priorityEmoji = PRIORITY_EMOJI_MAP[event.priority] || '🟡';
  const completedPrefix = event.status === 'completed' ? '✅ ' : '';
  const primaryUrl =
    event.hackathon?.registrationUrl || event.hackathon?.officialUrl || event.url || null;

  const colorId = CATEGORY_COLOR_MAP[event.category] || '8';

  if (kind === 'registrationDeadline') {
    const regCloseDate = event.hackathon?.registrationClosesAt
      ? new Date(event.hackathon.registrationClosesAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    return {
      summary: `[SyncMate] 📝 ${event.title} – registration closes`,
      description: `${event.description || ''}\n\nRegistration URL: ${primaryUrl || ''}\n${env.WEB_URL}/event/${event._id}`,
      start: { date: regCloseDate },
      end: { date: regCloseDate },
      colorId: '11', // Tomato for deadlines
      extendedProperties: {
        private: {
          syncmateEventId: event._id.toString(),
          syncmateGroupId: event.groupId ? event.groupId.toString() : '',
          syncmateKind: kind,
        },
      },
    };
  }

  let start;
  let end;

  if (event.allDay) {
    const startDate = new Date(event.startAt).toISOString().split('T')[0];
    const endDate = new Date(event.endAt).toISOString().split('T')[0];
    start = { date: startDate };
    end = { date: endDate };
  } else {
    start = { dateTime: new Date(event.startAt).toISOString() };
    end = { dateTime: new Date(event.endAt).toISOString() };
  }

  const creatorName = event.createdBy?.name || 'SyncMate';
  const descriptionParts = [
    event.description || '',
    `Created by ${creatorName}`,
  ];
  if (primaryUrl) {
    descriptionParts.push(`Open: ${primaryUrl}`);
  }
  descriptionParts.push(`${env.WEB_URL}/event/${event._id}`);

  return {
    summary: `[SyncMate] ${priorityEmoji} ${completedPrefix}${event.title}`,
    description: descriptionParts.join('\n\n'),
    location: event.hackathon?.location || null,
    start,
    end,
    colorId,
    extendedProperties: {
      private: {
        syncmateEventId: event._id.toString(),
        syncmateGroupId: event.groupId ? event.groupId.toString() : '',
        syncmateKind: kind,
      },
    },
  };
}

export async function syncEventForUser(user, event, kind = 'event') {
  if (!shouldSync(user, event)) {
    return removeGoogleEvent(user, event._id, kind);
  }

  const contentHash = computeContentHash(event, kind);
  const syncRecord = await GoogleSync.findOne({
    userId: user._id,
    eventId: event._id,
    kind,
  });

  if (syncRecord) {
    if (syncRecord.contentHash === contentHash) {
      return; // Up to date
    }
  }

  let calendar;
  try {
    calendar = getAuthenticatedCalendarClient(user);
  } catch (err) {
    logger.warn({ err, userId: user._id }, 'Skipping Google sync: client not available');
    return;
  }

  const calendarId = user.google?.calendarId || 'primary';
  const requestBody = buildGoogleEventBody(event, kind);

  if (!syncRecord) {
    // 1. Query Google by extendedProperties first (duplicate prevention)
    let existingGoogleEventId = null;
    try {
      const listRes = await calendar.events.list({
        calendarId,
        privateExtendedProperty: [
          `syncmateEventId=${event._id.toString()}`,
          `syncmateKind=${kind}`,
        ],
      });
      if (listRes.data.items && listRes.data.items.length > 0) {
        existingGoogleEventId = listRes.data.items[0].id;
      }
    } catch (err) {
      logger.warn({ err }, 'Google events.list extendedProperty query failed');
    }

    if (existingGoogleEventId) {
      await calendar.events.patch({
        calendarId,
        eventId: existingGoogleEventId,
        requestBody,
      });

      await GoogleSync.findOneAndUpdate(
        { userId: user._id, eventId: event._id, kind },
        {
          $set: {
            googleEventId: existingGoogleEventId,
            calendarId,
            contentHash,
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } else {
      const insertRes = await calendar.events.insert({
        calendarId,
        requestBody,
      });

      await GoogleSync.create({
        userId: user._id,
        eventId: event._id,
        googleEventId: insertRes.data.id,
        calendarId,
        kind,
        contentHash,
        lastSyncedAt: new Date(),
      });
    }
  } else {
    try {
      await calendar.events.patch({
        calendarId: syncRecord.calendarId || calendarId,
        eventId: syncRecord.googleEventId,
        requestBody,
      });

      syncRecord.contentHash = contentHash;
      syncRecord.lastSyncedAt = new Date();
      await syncRecord.save();
    } catch (err) {
      if (err.status === 404 || err.status === 410 || err.code === 404 || err.code === 410) {
        // Recreate if event was deleted on Google
        const recreateRes = await calendar.events.insert({
          calendarId,
          requestBody,
        });
        syncRecord.googleEventId = recreateRes.data.id;
        syncRecord.contentHash = contentHash;
        syncRecord.lastSyncedAt = new Date();
        await syncRecord.save();
      } else {
        throw err;
      }
    }
  }
}

export async function removeGoogleEvent(user, eventId, kind = 'event') {
  const syncRecord = await GoogleSync.findOne({
    userId: user._id,
    eventId,
    kind,
  });

  if (!syncRecord) return;

  try {
    const calendar = getAuthenticatedCalendarClient(user);
    await calendar.events.delete({
      calendarId: syncRecord.calendarId || 'primary',
      eventId: syncRecord.googleEventId,
    });
  } catch (err) {
    if (err.status !== 404 && err.status !== 410 && err.code !== 404 && err.code !== 410) {
      logger.warn({ err, eventId }, 'Failed to delete Google Calendar event');
    }
  }

  await GoogleSync.deleteOne({ _id: syncRecord._id });
}

export async function disconnectGoogle(user, { removeEvents = false } = {}) {
  if (removeEvents) {
    const syncRecords = await GoogleSync.find({ userId: user._id });
    let calendar = null;
    try {
      calendar = getAuthenticatedCalendarClient(user);
    } catch {
      // Ignored if client unavailable
    }

    if (calendar) {
      for (const rec of syncRecords) {
        try {
          await calendar.events.delete({
            calendarId: rec.calendarId || 'primary',
            eventId: rec.googleEventId,
          });
        } catch {
          // Ignore individual delete errors
        }
      }
    }
  }

  await GoogleSync.deleteMany({ userId: user._id });

  user.google = {
    connected: false,
    email: null,
    refreshTokenEnc: null,
    calendarId: 'primary',
    syncPreferences: {
      mode: 'all',
      categories: [],
      priorities: [],
      includeRegistrationDeadlines: false,
    },
    lastSyncAt: null,
  };

  await user.save();
}

export async function syncAllForUser(user) {
  if (!user.google?.connected || !user.groupId) return;

  const events = await Event.find({ groupId: user.groupId });
  const activeEventIds = new Set(events.map((e) => e._id.toString()));

  for (const event of events) {
    try {
      await syncEventForUser(user, event, 'event');
      if (
        user.google.syncPreferences?.includeRegistrationDeadlines &&
        event.hackathon?.registrationClosesAt
      ) {
        await syncEventForUser(user, event, 'registrationDeadline');
      }
    } catch (err) {
      logger.error({ err, eventId: event._id }, 'Error syncing event to Google Calendar');
    }
  }

  // Delete orphaned sync records
  const allUserSyncs = await GoogleSync.find({ userId: user._id });
  for (const syncRec of allUserSyncs) {
    if (!activeEventIds.has(syncRec.eventId.toString())) {
      await removeGoogleEvent(user, syncRec.eventId, syncRec.kind);
    }
  }

  user.google.lastSyncAt = new Date();
  await user.save();
}

