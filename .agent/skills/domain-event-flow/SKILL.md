---
name: domain-event-flow
description: Wires internal eventBus domain events to decoupled listeners for notifications, Socket.IO broadcasts, activity logging, reminders, and Google Calendar sync. Trigger on "domain event", "event bus", "add listener", "event wiring", or "side effect orchestration".
---

# Domain Event Flow (SyncMate Backend)

## Purpose
Decouples core business transactions from asynchronous side effects (notifications, Socket.IO broadcasts, activity logging, reminder adjustments, Google Calendar synchronization) using a unified in-process Node.js `EventEmitter`.

## When to use
- When introducing a new domain action (e.g. `domain.event.created`, `domain.pin.added`, `domain.status.changed`, `domain.member.joined`).
- When wiring side-effect listeners for multi-channel notification or realtime dispatch.
- Triggers: "domain event", "event bus", "add listener", "event wiring", "side effect orchestration".

## Step-by-step procedure
1. **Define Event Constants & Payload Contract**:
   - Ensure event names follow `domain.<entity>.<action>` (e.g. `domain.event.created`, `domain.event.updated`, `domain.pin.added`).
   - Standard payload: `{ [entity]: Document|Object, actorId: string, groupId: string, [extra]: any }`.
2. **Emit Event in Service Layer**:
   - Emit ONLY after the database transaction or write operation commits successfully.
   - Example:
     ```javascript
     eventBus.emit('domain.event.created', { event, actorId: userId, groupId });
     ```
3. **Wire Decoupled Listeners** (`src/listeners/`):
   - `activity.listener.js`: Creates an `Activity` document recording actor, action, and summary string.
   - `notification.listener.js`: Calls `notificationService.notifyUsers(...)` with recipient rules (actor excluded, assignees filtered).
   - `socket.listener.js`: Broadcasts `event:created` to the `group:<groupId>` room.
   - `google.listener.js`: Enqueues Google Calendar background sync for affected group members.
4. **Isolate Listener Failures**:
   - Wrap each listener handler in `try/catch` and log errors via `logger.error(...)`.
   - Never allow a listener failure to unhandled-reject or crash the application process.
5. **Verify with Integration Tests**:
   - Write tests simulating service mutations and asserting listener triggers without side-effect race conditions.
6. **Lint & Test**:
   - Run `npm run lint` and `npm test`.

## Rules / Do-Not List
- **DO NOT orchestrate side effects in controllers**: Controllers must remain thin.
- **DO NOT emit events before persistence succeeds**: Never emit if `await doc.save()` fails.
- **DO NOT let listeners throw**: Always handle errors inside each listener so other listeners continue uninterrupted.
- **DO NOT leak passwords or tokens** in domain event payloads.

## Checklist before finishing
- [ ] Domain event constant defined and documented.
- [ ] Service emits event after DB write.
- [ ] Listeners registered in `src/server.js` or `src/app.js` during bootstrap.
- [ ] Listeners wrapped in safe error handling.
- [ ] `npm run lint` and `npm test` pass.

## Example: Event Creation Domain Flow
```javascript
// src/listeners/notification.listener.js
import { eventBus } from '../utils/eventBus.js';
import * as notificationService from '../services/notification.service.js';

export function registerNotificationListeners() {
  eventBus.on('domain.event.created', async ({ event, actorId, groupId }) => {
    try {
      await notificationService.notifyEventCreated({ event, actorId, groupId });
    } catch (err) {
      console.error('Notification listener failed for domain.event.created:', err);
    }
  });
}
```

