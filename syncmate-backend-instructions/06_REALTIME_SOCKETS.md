# 06 – Realtime (Socket.IO)

- Attach to the same http server. CORS = CORS_ORIGINS. Transports: websocket, polling fallback.
- **Auth handshake:** `io.use` verifies `socket.handshake.auth.token` (access JWT), loads the user, rejects with `UNAUTHORIZED`. When the token expires the client reconnects with a fresh token (client's job).
- On connection: `socket.join('user:'+id)`, and if user has a group `socket.join('group:'+gid)`. When a user joins/leaves a group, move their live sockets between rooms (`io.in('user:'+id).socketsJoin(...)` / `socketsLeave`).
- `realtime/socket.js` exports `emitToGroup(gid, event, payload, {exceptUserId})` and `emitToUser(uid, event, payload)`.
- Listener `socket.listener.js` subscribes to the eventBus and emits the contract events. Always emit the **serialized** event as each recipient would see it? Simpler rule: emit the base serialized event to the group room; the client merges its own `myStatus/myReminders` from its cache. Document this in code comments. For pin/participation, emit `pin:changed` / `status:changed` with the compact payload from the contract.
- Emit AFTER the DB write commits. Never emit inside a failed request.
- Heartbeat: socket.io default ping is enough; also support `ping` → `pong` ack for clients.
- Scale note: if later running multiple instances, add `@socket.io/redis-adapter` (leave a commented section in `socket.js`).
- Test with `socket.io-client` in integration tests: user A creates event → user B in same group receives `event:created` within 1s; user C in another group receives nothing.
