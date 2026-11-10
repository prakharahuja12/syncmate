import * as googleCalendarService from '../services/googleCalendar.service.js';
import { successResponse } from '../utils/response.js';

export async function getAuthUrl(req, res) {
  const platform = req.query.platform || 'web';
  const result = googleCalendarService.generateAuthUrl({
    userId: req.user._id,
    platform,
  });

  return successResponse(res, result);
}

export async function handleCallback(req, res) {
  const { code, state } = req.query;
  const { redirectUrl } = await googleCalendarService.handleOAuthCallback({
    code,
    state,
  });

  return res.redirect(redirectUrl);
}

export async function getStatus(req, res) {
  const googleData = req.user.google || {};

  return successResponse(res, {
    connected: Boolean(googleData.connected),
    email: googleData.email || null,
    calendarId: googleData.calendarId || 'primary',
    preferences: googleData.syncPreferences || {
      mode: 'all',
      categories: [],
      priorities: [],
      includeRegistrationDeadlines: false,
    },
    lastSyncAt: googleData.lastSyncAt ? new Date(googleData.lastSyncAt).toISOString() : null,
  });
}

export async function updatePreferences(req, res) {
  req.user.google = req.user.google || {};
  req.user.google.syncPreferences = {
    ...req.user.google.syncPreferences,
    ...req.body,
  };

  await req.user.save();

  // Reconcile events in background with new preferences
  if (req.user.google.connected) {
    googleCalendarService.syncAllForUser(req.user).catch(() => {});
  }

  return successResponse(res, req.user.google.syncPreferences);
}

export async function syncNow(req, res) {
  await googleCalendarService.syncAllForUser(req.user);

  return successResponse(res, {
    message: 'Google Calendar synchronized successfully',
  });
}

export async function disconnect(req, res) {
  const removeEvents = Boolean(req.query.removeEvents);
  await googleCalendarService.disconnectGoogle(req.user, { removeEvents });

  return successResponse(res, {
    message: 'Google Calendar disconnected successfully',
  });
}

