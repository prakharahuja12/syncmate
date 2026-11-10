---
name: google-calendar-sync
description: Implements Google Calendar OAuth, AES-256-GCM token encryption, duplicate prevention via extendedProperties, sync preferences, and nightly reconciliation. Trigger on "google calendar", "google sync", "oauth callback", "calendar integration", or "reconcile calendar".
---

# Google Calendar Sync (SyncMate Backend)

## Purpose
Manages Google Calendar OAuth authentication, AES-256-GCM token encryption, duplicate-proof one-way synchronization (SyncMate -> Google), user category/assignment preferences, and nightly reconciliation.

## When to use
- Implementing Google integration routes (`/api/v1/integrations/google/*`).
- Modifying `src/services/googleCalendar.service.js` or `src/listeners/google.listener.js`.
- Developing the nightly reconciliation cron job (`src/jobs/googleResync.job.js`).
- Triggers: "google calendar", "google sync", "oauth callback", "calendar integration", "reconcile calendar".

## Step-by-Step Procedure
1. **OAuth 2.0 Flow**:
   - `GET /integrations/google/auth-url`: Sign a short-lived state JWT `{ userId, platform, nonce }`.
   - `GET /integrations/google/callback` (PUBLIC): Verify state, exchange auth code via `googleapis` OAuth2 client.
   - **Encrypt Refresh Token**: Encrypt the refresh token using AES-256-GCM with `process.env.ENCRYPTION_KEY` (`src/utils/crypto.js`). Never store raw refresh tokens in MongoDB.
   - Save to `user.google` and redirect to `{WEB_URL}/settings/integrations?google=connected` or mobile deep link.
2. **Evaluate Preferences (`shouldSync`)**:
   - Modes: `all`, `categories` (filter by category & priority), `assigned_to_me` (explicit assignees only), `none`.
   - `includeRegistrationDeadlines`: If true, sync separate all-day registration events.
   - If an event is updated and no longer matches preferences, delete it from Google Calendar.
3. **Prevent Duplicates**:
   - Tag all Google events with `extendedProperties.private = { syncmateEventId, syncmateGroupId }`.
   - Record sync state in `googlesyncs` collection with compound unique index `{ userId, eventId, kind }`.
   - Hash event fields (`contentHash`). Skip patch if hash is unchanged.
   - Before inserting, query Google by private extended property to guarantee idempotency.
4. **Color Mapping & Event Body**:
   - Map SyncMate categories to Google `colorId`: hackathon (11 tomato), college (9 blueberry), personal (2 sage), meeting (5 banana), competition (3 grape), other (8 graphite).
   - Summary: `[SyncMate] {priority emoji} {title}`.
   - Append `primaryUrl` and SyncMate web link to Google event description.
5. **Nightly Reconcile Job** (`src/jobs/googleResync.job.js`):
   - Run daily at 03:00.
   - Reconcile all connected users: query group events, evaluate `shouldSync`, create/patch/delete, and prune orphaned `googlesyncs` records.
6. **Graceful Degradation & Back-off**:
   - Handle rate limits (403) with exponential back-off and 100ms throttle between calls.
   - On `invalid_grant` (401), mark `user.google.connected = false` and notify user via `google_sync_error`.
7. **Verify Quality**:
   - Run `npm run lint` and `npm test`.

## Rules / Do-Not List
- **DO NOT import events from Google into SyncMate**: Sync is strictly one-way (SyncMate -> Google) in v1.
- **DO NOT store unencrypted Google refresh tokens**.
- **DO NOT fight manual user deletions in Google**: If a user manually deletes an event in Google, flag `userRemoved: true` and avoid recreating it endlessly.
- **DO NOT crash if Google credentials are missing**: Log a warning and skip sync.

## Checklist before finishing
- [ ] Refresh token encrypted with AES-256-GCM.
- [ ] `extendedProperties.private` attached to all Google Calendar events.
- [ ] Duplicate prevention verified across double emits.
- [ ] `shouldSync` handles `all`, `categories`, and `assigned_to_me`.
- [ ] Mocked tests pass without real Google API network calls.
- [ ] `npm run lint` and `npm test` are clean.

## Example: Event Sync Engine
```javascript
// src/services/googleCalendar.service.js
export async function syncEventForUser(user, event, kind = 'event') {
  if (!shouldSync(user, event)) {
    return removeGoogleEvent(user, event._id, kind);
  }

  const contentHash = computeHash(event);
  const syncRecord = await GoogleSync.findOne({ userId: user._id, eventId: event._id, kind });

  if (syncRecord && syncRecord.contentHash === contentHash) {
    return; // Already in sync
  }

  const calendar = getGoogleCalendarClient(user);
  if (!syncRecord) {
    const res = await calendar.events.insert({
      calendarId: user.google.calendarId || 'primary',
      requestBody: buildGoogleEventBody(event, kind)
    });
    await GoogleSync.create({
      userId: user._id,
      eventId: event._id,
      googleEventId: res.data.id,
      calendarId: 'primary',
      kind,
      contentHash
    });
  } else {
    await calendar.events.patch({
      calendarId: syncRecord.calendarId,
      eventId: syncRecord.googleEventId,
      requestBody: buildGoogleEventBody(event, kind)
    });
    syncRecord.contentHash = contentHash;
    syncRecord.lastSyncedAt = new Date();
    await syncRecord.save();
  }
}
```
