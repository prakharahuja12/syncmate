---
name: reminder-scheduler
description: Manages per-user reminder creation, time recomputation, atomic cron claiming, and injectable-clock tests. Trigger on "reminder", "scheduler", "cron", "fireAt", "reminder job", or "recompute reminders".
---

# Reminder Scheduler (SyncMate Backend)

## Purpose
Governs per-user reminder creation, time recomputations on event date modifications, atomic concurrency-safe claiming via node-cron, and exactly-once delivery guarantees.

## When to use
- Implementing or modifying reminder endpoints (`GET /events/:id/reminders`, `PUT /events/:id/reminders`).
- Developing or adjusting the cron job in `src/jobs/reminder.job.js`.
- Recomputing `fireAt` when `startAt`, `endAt`, or `hackathon.registrationClosesAt` shifts.
- Testing scheduled jobs with injectable fake clocks.
- Triggers: "reminder", "scheduler", "cron", "fireAt", "reminder job", "recompute reminders".

## Step-by-step procedure
1. **Compute `fireAt` On Creation** (`src/services/reminder.service.js`):
   - `anchor: 'start'`: `event.startAt - offsetMinutes` (for `allDay` events, baseline is 09:00 user local time). Presets: 1440, 720, 60, 30.
   - `anchor: 'registrationClose'`: `hackathon.registrationClosesAt - offsetMinutes`. Presets: 10080 (7d), 4320 (3d), 1440 (1d).
   - `customAt`: Absolute ISO timestamp (must be strictly in the future).
2. **Recompute `fireAt` On Event Updates**:
   - If an event's time or registration deadline changes, update `fireAt` for all pending reminders across all users for that event.
   - Reset non-sent reminders from `failed`/`processing` back to `pending`.
3. **Cancel Stale Reminders**:
   - When an event is marked completed (`POST /events/:id/complete`) or deleted, set pending reminders to `status: 'cancelled'`.
   - When a user sets participation status to `registered`, cancel all their pending `registrationClose` reminders for that event.
4. **Execute Atomic Claim in Cron Job** (`src/jobs/reminder.job.js`):
   - Run `* * * * *` (every minute).
   - Find due candidates: `{ status: 'pending', fireAt: { $lte: now } }`.
   - Claim atomically to prevent multi-instance races:
     ```javascript
     const claimed = await Reminder.findOneAndUpdate(
       { _id: candidate._id, status: 'pending' },
       { status: 'processing' },
       { new: true }
     );
     ```
   - If `claimed` is null, another instance claimed it—skip immediately.
5. **Dispatch & Catch-Up Logic**:
   - Dispatch through `notificationService.notifyUsers(...)`.
   - Catch-up rule: If server was down, reminders older than 6h receive `(missed earlier)` text. Reminders older than 24h are silently cancelled.
   - Mark `status: 'sent'`, `sentAt: new Date()`.
   - On error: increment `attempts`. If `attempts >= 3`, mark `cancelled`; otherwise revert to `pending`.
6. **Support Test Disabling**:
   - Check `process.env.DISABLE_SCHEDULER === 'true'` to bypass running the cron during integration test suites.
7. **Verify Quality**:
   - Run `npm run lint` and `npm test`.

## Rules / Do-Not List
- **DO NOT deliver reminders without atomic claiming**: Prevents duplicate pushes/emails.
- **DO NOT fire reminders for completed or deleted events**.
- **DO NOT block cron execution**: Wrap candidate processing in `try/catch` and continue the loop.
- **DO NOT hardcode system time**: Always allow passing `currentTime` for clock injection testing.

## Checklist before finishing
- [ ] Presets validated for `start` (1440, 720, 60, 30) and `registrationClose` (10080, 4320, 1440).
- [ ] Atomic `findOneAndUpdate` lock in place.
- [ ] Event completion and deletion cascades properly cancel pending reminders.
- [ ] Clock injection test passes.
- [ ] `npm run lint` and `npm test` are clean.

## Example: Injectable Clock Test
```javascript
// tests/reminder.test.js
import { processDueReminders } from '../src/jobs/reminder.job.js';

test('due reminders fire once and transition to sent status', async () => {
  const future = new Date(Date.now() + 60 * 60 * 1000);
  const fakeClock = new Date(future.getTime() + 5000);

  await processDueReminders(fakeClock);

  const updated = await Reminder.findById(reminderId);
  expect(updated.status).toBe('sent');
  expect(updated.sentAt).toBeDefined();
});
```

