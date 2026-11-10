# 07 – Google Calendar Integration

## Setup
Google Cloud project → enable Calendar API → OAuth consent (External, test users) → OAuth client (Web). Scopes: `https://www.googleapis.com/auth/calendar.events`, `openid email`. Request `access_type=offline`, `prompt=consent` to get a refresh token.

## OAuth flow
1. `GET /integrations/google/auth-url?platform=web|mobile` → build URL with `state` = signed JWT `{userId, platform, nonce}` (10 min).
2. Google redirects to `/integrations/google/callback?code&state` (PUBLIC route). Verify state, exchange code, fetch email, **encrypt refresh token with AES-256-GCM (`utils/crypto.js`, key ENCRYPTION_KEY)**, save `user.google`. Redirect to web or mobile deep link (see contract). Then trigger initial full sync.
3. Disconnect: revoke token at Google, clear `user.google`, optionally delete all synced Google events (`removeEvents=true`) and delete `googlesyncs` rows.

## Preferences (user control)
`mode`: `all` (every group event), `categories` (only chosen categories/priorities), `assigned_to_me` (events where assignedToAll or I'm assigned… for `assigned_to_me` use ONLY events explicitly assigning me), `none` (connected but paused). `includeRegistrationDeadlines`: also create an all-day Google event "📝 {name} – registration closes" on the closing date.
Evaluate preferences in `shouldSync(user, event)`; unit-test every branch. If an event stops matching after an update/preference change → delete it from Google.

## Sync engine (`services/googleCalendar.service.js`)
- `syncEventForUser(user, event, kind)`: 
  1. Compute `contentHash` = sha1 of (title, description, start, end, allDay, url, priority, category).
  2. Look up `googlesyncs` by `{userId,eventId,kind}`.
  3. No row → `events.insert` with `extendedProperties.private = { syncmateEventId, syncmateGroupId }`, **then** create row. If insert succeeded but DB failed, the next run finds it via `events.list(privateExtendedProperty=syncmateEventId=...)` before inserting → **this is the duplicate-prevention guarantee**.
  4. Row exists & hash equal → skip. Hash differs → `events.patch`. 
  5. Google returns 404/410 (user deleted it) → recreate once, or if user deleted manually set flag `userRemoved:true` and stop syncing that event (respect user control).
- Google event body: `summary` = `[SyncMate] {priority emoji} {title}`, `description` = description + "\n\nCreated by {name}\nOpen: {primaryUrl}\n{WEB_URL}/event/{id}", `location` = hackathon.location, `start/end` with `dateTime` + `timeZone` (or `date` for allDay), `colorId` mapped from category (hackathon 11 tomato, college 9 blueberry, personal 2 sage, meeting 5 banana, competition 3 grape, other 8 graphite), `source:{title:'SyncMate',url}`, `reminders:{useDefault:true}` (SyncMate handles its own reminders).
- Triggered by `google.listener.js` on event created/updated/deleted/completed (completed → keep but prefix "✅"). Process via an in-memory queue with concurrency 3 and exponential retry (3 tries). On persistent failure create `google_sync_error` notification for that user only; if 401 invalid_grant → mark `google.connected=false`.
- **One-way (SyncMate → Google)** in v1. Do not import Google events. Document that edits in Google are overwritten on next change (note in UI copy).
- `POST /sync-now` & nightly `googleResync.job.js` (03:00): reconcile each connected user: list my group events, apply `shouldSync`, create/patch/delete; also delete orphans (googlesyncs whose event no longer exists).
- Rate-limit friendliness: batch with small delay (100ms) between Google calls; handle 403 `rateLimitExceeded` with back-off.

## Tests
Mock `googleapis`. Cases: no duplicates after double event emit; preferences filtering; patch on change; delete on event delete; recreate on 410; token encryption round-trip.
