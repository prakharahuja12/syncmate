# 05 – Notifications & Reminders (most important module)

## Channels
1. **In-app**: `notifications` collection + socket `notification:new` + REST list/read.
2. **Push**: Firebase Cloud Messaging via `firebase-admin` to every token in `user.pushTokens` (web, ios, android). Respect `settings.pushNotifications`.
3. **Email (optional)**: Nodemailer, only if `settings.emailNotifications === true` and SMTP configured. HTML + text template with event title, time, priority colour, and button to open `{WEB_URL}/event/{id}`.

## notificationService API
```js
notifyUsers({ userIds, groupId, actorId, type, title, body, data })
```
- De-duplicate userIds, exclude the actor (except `reminder` types).
- Insert one `Notification` per user (bulk), then for each: emit socket, send push, send email (all in `Promise.allSettled`, never throw). Store per-channel result in `channels`.
- FCM payload: `{ notification:{title,body}, data:{notificationId,type,eventId,deepLink}, android:{priority:'high', notification:{channelId:'syncmate-default'}}, apns:{payload:{aps:{sound:'default'}}}, webpush:{fcmOptions:{link:`${WEB_URL}/event/${eventId}`}} }`.
- On FCM errors `messaging/registration-token-not-registered` or `invalid-registration-token` → remove that token from the user.
- Titles/bodies (use emojis sparingly, priority dot 🔴🟡🟢 in body):
  - event_created: "New event: {title}" / "{actor} added it for {date time}"
  - event_updated: "Event updated: {title}" / diff text
  - event_deleted: "Event deleted: {title}" / "{actor} removed the event on {date}"
  - reminder: "⏰ {title} starts in {human offset}"
- Notify rules: everyone in group for assignedToAll events; otherwise assignees only (+ actor excluded).

## Notification API
List (paginated, newest first, `unread=true` filter), unread-count, mark one read, mark all read. Only the owner of a notification can read it (filter by `userId`).

## Reminder model & scheduling
- Reminders are **per user per event** (see DATA_MODEL). Compute `fireAt`:
  - anchor `start`: `event.startAt - offsetMinutes` (for allDay events use 09:00 local of that day as base).
  - anchor `registrationClose`: `hackathon.registrationClosesAt - offsetMinutes`.
  - `customAt`: as given (must be in the future when created).
- Default reminders on event creation if user gives none: none (explicit). The create-event UI supplies defaults (e.g., 1 hour before) via `reminders[]` for the creator. Other members get reminders via `PUT /events/:id/reminders` or the optional per-user setting `defaultReminderOffsets` (add to user.settings; applied automatically when a new event is created and the user is notified). Implement this setting: `defaultReminderOffsets: [60]`.
- **Scheduler** (`jobs/reminder.job.js`, node-cron `* * * * *`):
  1. Query `reminders` where `status:'pending' AND fireAt <= now` (limit 200, sort fireAt). Use atomic claim: `findOneAndUpdate({_id,status:'pending'},{status:'processing'})` to be safe if two instances run.
  2. Skip & cancel if event missing/completed, or user no longer in group.
  3. Call notificationService (type `reminder`; for registrationClose use type `registration_deadline`).
  4. Mark `sent`, `sentAt`. On failure increment `attempts`, retry up to 3 with back-off, then `cancelled`.
  5. Catch-up: if server was down, reminders older than 6h are still sent once with text "(missed earlier)"; older than 24h are cancelled silently.
- Daily job 08:00 Asia/Kolkata: registration-deadline sweep (see 04).
- Make scheduler a no-op when `DISABLE_SCHEDULER=true` (tests / secondary instances).

## Tests to write
Reminder fires exactly once; changing event time re-computes fireAt; deleting event cancels reminders; push token cleanup on invalid token; actor not notified for own action; non-assignee not notified.
