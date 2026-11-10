---
name: notification-dispatch
description: Dispatches multi-channel notifications (in-app, FCM push, Web Push, SMTP email) respecting actor exclusion, recipient rules, and quiet preferences. Trigger on "notification", "push token", "FCM", "email alert", "notify users", or "dispatch notification".
---

# Notification Dispatch (SyncMate Backend)

## Purpose
Coordinates decoupled, multi-channel notification dispatch across in-app DB notifications, realtime Socket.IO emits, Firebase Cloud Messaging (iOS/Android/Web), and optional SMTP emails with strict actor exclusion and graceful degradation.

## When to use
- Modifying `src/services/notification.service.js`, `src/services/push.service.js`, or `src/services/email.service.js`.
- Adding new notification types or triggers in `src/listeners/notification.listener.js`.
- Implementing push token registration or pruning invalid tokens.
- Triggers: "notification", "push token", "FCM", "email alert", "notify users", "dispatch notification".

## Step-by-Step Procedure
1. **Validate Notification Type**:
   - Verify type is in the contract catalog:
     - `event_created`, `event_updated`, `event_deleted`, `event_completed`
     - `reminder`, `registration_deadline`
     - `pin_added`, `status_changed`
     - `member_joined`, `member_left`, `google_sync_error`
2. **Resolve Recipient List & Exclude Actor**:
   - De-duplicate target `userIds`.
   - **Exclude `actorId`** for all user actions (`event_created`, `pin_added`, etc.).
   - Reminders and registration deadlines target the specific recipient without actor exclusion.
   - For events with `assignedToAll: false`, target only members listed in `assignedTo`.
3. **Persist In-App Notifications (Bulk)**:
   - Insert rows into `notifications` collection (`userId`, `groupId`, `actorId`, `type`, `title`, `body`, `data`, `channels`).
   - Emit `notification:new` to `user:<userId>` rooms via Socket.IO.
4. **Dispatch FCM Multicast Push**:
   - Collect active tokens from `user.pushTokens` where `user.settings.pushNotifications === true`.
   - Format FCM payload:
     - `android`: `{ priority: 'high', notification: { channelId: 'syncmate-default' } }`
     - `apns`: `{ payload: { aps: { sound: 'default' } } }`
     - `webpush`: `{ fcmOptions: { link: `${WEB_URL}/event/${eventId}` } }`
   - Handle invalid tokens: If Firebase returns `messaging/registration-token-not-registered` or `invalid-registration-token`, remove that token from `user.pushTokens`.
5. **Dispatch Optional SMTP Email**:
   - Send only if `user.settings.emailNotifications === true` and SMTP credentials exist in `process.env`.
   - Render responsive HTML template with event details, priority badge, and CTA button.
6. **Ensure Graceful Degradation**:
   - Run push, email, and socket sends using `Promise.allSettled`.
   - Missing Firebase secrets or SMTP downtime must log warnings without crashing or throwing.
7. **Verify Quality**:
   - Run `npm run lint` and `npm test tests/notification.test.js`.

## Rules / Do-Not List
- **DO NOT notify the actor** for their own create, update, or pin mutations.
- **DO NOT crash on missing third-party credentials**: degrade gracefully with warnings.
- **DO NOT leave dead push tokens in DB**: prune immediately upon FCM rejection.
- **DO NOT send raw passwords or secrets** in notification bodies or payloads.

## Checklist before finishing
- [ ] Actor excluded from recipients for mutation events.
- [ ] Notification type conforms to `docs/API_CONTRACT.md`.
- [ ] FCM token auto-cleanup verified on invalid tokens.
- [ ] Graceful degradation confirmed when SMTP/Firebase is unconfigured.
- [ ] `npm run lint` and `npm test` are clean.

## Example: Notification Service Implementation
```javascript
// src/services/notification.service.js
export async function notifyUsers({ userIds, groupId, actorId, type, title, body, data }) {
  // Exclude actor unless it is a system reminder
  const recipients = userIds
    .filter(id => type.startsWith('reminder') || type === 'registration_deadline' || id.toString() !== actorId?.toString());

  if (recipients.length === 0) return [];

  const docs = recipients.map(uid => ({
    userId: uid,
    groupId,
    actorId: actorId || null,
    type,
    title,
    body,
    data: data || {},
    channels: { push: 'skipped', email: 'skipped' }
  }));

  const created = await Notification.insertMany(docs);

  // Dispatch sockets, push, and emails asynchronously in background
  Promise.allSettled([
    dispatchSockets(created),
    dispatchPush(created),
    dispatchEmail(created)
  ]).catch(err => logger.error({ err }, 'Notification side-effect dispatch error'));

  return created;
}
```

