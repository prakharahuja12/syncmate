---
name: add-realtime-event
description: Emits Socket.IO events to group/user rooms using base DTOs (no per-user fields), and provides socket integration test patterns. Trigger on "socket event", "realtime", "Socket.IO", "emit realtime", "broadcast event", or "add-realtime-event".
---

# Add Realtime Event (SyncMate Backend)

## Purpose
Ensures that realtime updates emitted via Socket.IO strictly use base DTOs (omitting personalized per-user fields), target appropriate group/user rooms (`group:<groupId>`, `user:<userId>`), and follow the event catalog defined in `docs/API_CONTRACT.md`.

## When to use
- Implementing Socket.IO broadcasters in `src/realtime/socket.js`.
- Adding new event emitters in `src/listeners/socket.listener.js`.
- Testing WebSocket connections, authentication handshakes, and room isolation.
- Triggers: "socket event", "realtime", "Socket.IO", "emit realtime", "broadcast event".

## Step-by-Step Procedure
1. **Validate Contract Event Name & Payload**:
   - Check `docs/API_CONTRACT.md` under **Socket.IO events**:
     - `event:created`, `event:updated`, `event:deleted` (`{ id }`), `event:completed`
     - `pin:changed` (`{ eventId, pinSummary }`)
     - `status:changed` (`{ eventId, participation }`)
     - `notification:new` (Full Notification DTO)
     - `group:member-joined`, `group:member-left`, `group:deleted`, `activity:new`
2. **Ensure Base DTO Serialization**:
   - Broadcast the **base event DTO** to `group:<groupId>`:
     - Include common fields: `id`, `groupId`, `title`, `startAt`, `endAt`, `priority`, `category`, `pinSummary`, `participation`, `isUrgent`.
     - **DO NOT include per-user fields** (`myReminders`, `myStatus`): clients merge these locally from their cache.
3. **Emit After Persistence Only**:
   - Wire the broadcast inside `src/listeners/socket.listener.js` responding to `eventBus` domain events.
   - Never emit before the MongoDB write succeeds.
4. **Target Appropriate Rooms**:
   - Group notifications / event updates: `emitToGroup(groupId, eventName, payload)`.
   - Personal notifications: `emitToUser(userId, 'notification:new', payload)`.
   - Exclude the initiating actor when required: `emitToGroup(groupId, eventName, payload, { exceptUserId })`.
5. **Write Socket Integration Test**:
   - Use `socket.io-client` in `tests/integration/socket.test.js`.
   - Verify User A's mutation broadcasts to User B in the same group.
   - Verify User C in a different group receives nothing.
6. **Verify Quality**:
   - Run `npm run lint` and `npm test`.

## Rules / Do-Not List
- **DO NOT allow mutations over sockets**: All client mutations must use REST. Sockets are for Server -> Client pushes and heartbeat `ping` -> `pong` only.
- **DO NOT broadcast sensitive data**: Never emit `refreshToken`, `passwordHash`, or private pin records in group rooms.
- **DO NOT crash server on socket errors**: Guard room lookups and handle disconnected sockets gracefully.

## Checklist before finishing
- [ ] Event name matches `docs/API_CONTRACT.md`.
- [ ] Payload uses clean base DTO without personal fields.
- [ ] Emitter called from `src/listeners/socket.listener.js`.
- [ ] Cross-group leakage prevented (isolated rooms).
- [ ] Socket integration test passes.
- [ ] `npm run lint` and `npm test` are clean.

## Example: Socket Listener Implementation
```javascript
// src/listeners/socket.listener.js
import { eventBus } from '../utils/eventBus.js';
import { emitToGroup } from '../realtime/socket.js';
import { serializeEventBase } from '../utils/serializers.js';

export function registerSocketListeners() {
  eventBus.on('domain.event.created', ({ event, groupId }) => {
    // Base serialization: strips myReminders and myStatus
    const payload = serializeEventBase(event);
    emitToGroup(groupId, 'event:created', payload);
  });

  eventBus.on('domain.pin.changed', ({ eventId, pinSummary, groupId }) => {
    emitToGroup(groupId, 'pin:changed', { eventId, pinSummary });
  });
}
```

