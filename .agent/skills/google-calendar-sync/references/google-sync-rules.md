# Google Calendar Sync Rules & Architecture

## OAuth Flow
1. `GET /integrations/google/auth-url?platform=web|mobile`:
   - Builds consent URL with `state` = signed JWT `{ userId, platform, nonce }` (expires in 10m).
   - Scopes: `https://www.googleapis.com/auth/calendar.events`, `openid email`.
   - Flags: `access_type=offline`, `prompt=consent`.
2. `GET /integrations/google/callback?code&state` (PUBLIC):
   - Exchanges code for tokens.
   - Encrypts refresh token using AES-256-GCM (`utils/crypto.js`) with `ENCRYPTION_KEY`.
   - Stores in `user.google`.
   - Triggers initial full sync.
   - Redirects to `{WEB_URL}/settings/integrations?google=connected` or `syncmate://integrations?google=connected`.

## Duplicate Prevention Guarantee
- Before inserting, compute `contentHash = sha1(title, description, start, end, allDay, url, priority, category)`.
- Use Google Event `extendedProperties.private`:
  ```json
  "extendedProperties": {
    "private": {
      "syncmateEventId": "...",
      "syncmateGroupId": "..."
    }
  }
  ```
- Before creating a new Google event, verify via `events.list(privateExtendedProperty=syncmateEventId=...)` and local `googlesyncs` collection (`unique { userId, eventId, kind }`).
- If Google returns 404/410, handle safely (if user manually deleted in Google, flag `userRemoved: true` to prevent fighting the user).

## User Preferences (`shouldSync(user, event)`)
- `mode`:
  - `all`: Syncs every group event.
  - `categories`: Only syncs events matching `syncPreferences.categories` and `priorities`.
  - `assigned_to_me`: Only syncs events where `assignedTo` explicitly contains `user.id`.
  - `none`: Paused.
- `includeRegistrationDeadlines`: If true, creates an all-day event `"📝 {name} – registration closes"` on the deadline date.

