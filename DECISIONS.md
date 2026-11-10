# SyncMate Architecture Decisions & Skill System Summary

> **Document**: `DECISIONS.md`  
> **Target Workspace**: `backend` (Node.js + Express ES Modules, Mongoose, Socket.IO)  
> **Date**: 2026-11-10

---

## 1. Skill System Architecture

The Antigravity Skills for SyncMate backend have been organized into `.agent/skills/` (and linked to `.agents/skills/`), each kept strictly under 200 lines and paired with real code templates, scripts, or doc excerpts.

### Skills Implemented
1. **`contract-guard`**: Automated verification against `API_CONTRACT.md`, supported by `scripts/diff-contract.js`.
2. **`add-api-endpoint`**: Strict 5-tier architecture (`route -> zod -> controller -> service -> serializer`) with `templates/endpoint.template.js`.
3. **`domain-event-flow`**: Side-effect orchestration using Node's `EventEmitter` to prevent fat controllers.
4. **`add-realtime-event`**: Socket.IO room management (`group:<gid>`, `user:<uid>`) with base DTO broadcasting.
5. **`reminder-scheduler`**: Atomic claim concurrency control (`findOneAndUpdate`) and injectable clock tests.
6. **`notification-dispatch`**: Multi-channel fan-out (in-app, FCM multicast push, SMTP email) with actor exclusion.
7. **`hackathon-and-watchlist`**: `primaryUrl` virtual link logic, private pin masking, and partitioned `{ open, closed }` watchlist envelopes.
8. **`google-calendar-sync`**: AES-256-GCM token encryption, duplicate-prevention via `extendedProperties`, and nightly reconciliation.
9. **`backend-test-writer`**: Hermetic Jest + Supertest suites using `mongodb-memory-server` and cross-group 404 tests.
10. **`seed-and-demo-data`**: Idempotent database seeder with 4 demo personas, group `DEMO1234`, and SIH 2026.
11. **`security-review`**: Comprehensive 5-point security audit checklist derived from specification doc 09.
12. **`instant-skill-and-web-search`**: JIT skill synthesizer and web search integration for runtime adaptability.

---

## 2. Key Architectural Decisions & Assumptions

### Decision 1: Contract-First & Cross-Group 404
- **Decision**: When a user queries a resource belonging to another group, the API responds with **`404 Not Found`** rather than `403 Forbidden`.
- **Rationale**: Returning 403 leaks the existence of sensitive resources (e.g. secret hackathon plans or group events) across group boundaries.

### Decision 2: Decoupled Side Effects via `eventBus`
- **Decision**: Controllers and services never directly call push notification or email services. Services persist mutations to MongoDB and emit a `domain.<entity>.<action>` event.
- **Rationale**: Keeps services testable and thin, isolates external network failures (FCM/SMTP) from blocking HTTP responses, and enables easy extensibility.

### Decision 3: Atomic Concurrency in Reminder Scheduler
- **Decision**: The cron worker claims pending reminders using `findOneAndUpdate({ _id, status: 'pending' }, { status: 'processing' })`.
- **Rationale**: Guarantees exactly-once delivery even if multiple server instances run concurrently behind a load balancer.

### Decision 4: Base DTOs for Socket.IO Realtime Broadcasts
- **Decision**: Socket.IO group broadcasts emit the base event DTO without personalized fields (`myReminders`, `myStatus`).
- **Rationale**: Web and mobile clients cache personalized states locally and merge them upon receiving the base update, avoiding massive N-member serialization overhead on the server.

### Decision 5: One-Way Google Calendar Sync with Idempotency
- **Decision**: V1 sync is strictly one-way (SyncMate -> Google). Duplicates are prevented by stamping Google events with `extendedProperties.private = { syncmateEventId, syncmateGroupId }` and tracking `googlesyncs` with SHA-1 content hashes.
- **Rationale**: Eliminates synchronization loops and prevents duplicate calendar entries across server restarts or retries.

