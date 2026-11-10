# SyncMate Project Context & Task Execution Ledger

> **Last Updated**: 2026-11-10  
> **Repository**: [prakharahuja12/syncmate](https://github.com/prakharahuja12/syncmate) (`main` branch)  
> **Source of Truth**: `syncmate-backend-instructions/API_CONTRACT.md`, `DATA_MODEL.md`, `00_AGENT_RULES.md`

---

## 📌 1. Project Overview & Architecture
SyncMate is a shared group calendar for small teams (3–5 people) featuring:
- **Shared Calendar**: Single calendar per group with event/task/deadline tracking.
- **Hackathons**: Rich metadata, problem statement links, and clickable `primaryUrl`.
- **Realtime Sync**: Socket.IO broadcasts to `group:<gid>` using clean base DTOs.
- **Watchlist**: Group vs private pins, per-user participation states (`interested`, `planning`, `registered`).
- **Reminders & Scheduler**: Per-user event and registration-deadline reminders with atomic cron claiming.
- **Multi-channel Notifications**: In-app DB records, FCM push (iOS/Android/Web), and optional SMTP email.
- **Google Calendar Sync**: Safe one-way OAuth sync with AES-256-GCM encryption and duplicate prevention.

---

## 📜 2. Completed Tasks Ledger ("What Has Been Done")

### A. Antigravity Skills & Engineering Protocols
| Skill / Tool | Path | Status | Purpose & Capabilities |
| :--- | :--- | :--- | :--- |
| **`contract-guard`** | [`.agent/skills/contract-guard/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/contract-guard/SKILL.md) | ✅ Completed | Verifies routes, error codes, and DTOs against `API_CONTRACT.md`; includes `scripts/diff-contract.js`. |
| **`add-api-endpoint`** | [`.agent/skills/add-api-endpoint/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/add-api-endpoint/SKILL.md) | ✅ Completed | Guides route -> Zod -> controller -> service -> serializer pipeline; includes `templates/endpoint.template.js`. |
| **`domain-event-flow`** | [`.agent/skills/domain-event-flow/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/domain-event-flow/SKILL.md) | ✅ Completed | Decouples mutations from side-effects via Node.js `eventBus`; includes `templates/listener.template.js`. |
| **`add-realtime-event`** | [`.agent/skills/add-realtime-event/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/add-realtime-event/SKILL.md) | ✅ Completed | Broadcasts base DTOs to Socket.IO rooms; includes `examples/socket-test.example.js`. |
| **`reminder-scheduler`**| [`.agent/skills/reminder-scheduler/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/reminder-scheduler/SKILL.md) | ✅ Completed | Governs `fireAt` recomputation, atomic cron claiming, and injectable clocks; includes `templates/job.template.js`. |
| **`notification-dispatch`** | [`.agent/skills/notification-dispatch/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/notification-dispatch/SKILL.md) | ✅ Completed | Multi-channel dispatch (in-app, FCM push, email) with actor exclusion; includes `examples/notify-call.example.js`. |
| **`hackathon-and-watchlist`** | [`.agent/skills/hackathon-and-watchlist/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/hackathon-and-watchlist/SKILL.md) | ✅ Completed | Enforces `primaryUrl` logic, URL safety, group/private pin visibility, and participation statuses. |
| **`google-calendar-sync`** | [`.agent/skills/google-calendar-sync/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/google-calendar-sync/SKILL.md) | ✅ Completed | AES-256-GCM token encryption, duplicate prevention via extendedProperties, and nightly reconciliation. |
| **`backend-test-writer`** | [`.agent/skills/backend-test-writer/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/backend-test-writer/SKILL.md) | ✅ Completed | Hermetic Jest + Supertest test generation with in-memory Mongo and cross-group 404 tests. |
| **`seed-and-demo-data`** | [`.agent/skills/seed-and-demo-data/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/seed-and-demo-data/SKILL.md) | ✅ Completed | Idempotent seeder creating 4 personas (`alex@demo.com` etc.), group `DEMO1234`, and SIH 2026. |
| **`security-review`** | [`.agent/skills/security-review/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/security-review/SKILL.md) | ✅ Completed | 5-point security audit checklist (rate limits, mongo injection, auth guards, token rotation, secret masking). |
| **`instant-skill-and-web-search`** | [`.agent/skills/instant-skill-and-web-search/SKILL.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/.agent/skills/instant-skill-and-web-search/SKILL.md) | ✅ Completed | JIT skill creation on prompt review and web research whenever technical documentation is missing. |
| **Workspace Rules** | [`GEMINI.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/GEMINI.md) / [`AGENTS.md`](file:///c:/Users/prakh/OneDrive/Desktop/projects/AGENTS.md) | ✅ Active | Enforces contract-first design, prompt review, task tracking, and error prevention protocols. |

---

### B. Backend Implementation Phases (Pulled & Synced with GitHub)
| Phase | Status | Key Files & Modules | Verification |
| :--- | :--- | :--- | :--- |
| **Phase 1: Foundation & Auth** | ✅ Completed | `src/app.js`, `src/server.js`, `src/config/`, `src/models/User.js`, `src/models/RefreshToken.js`, `src/routes/auth.routes.js`, `src/services/auth.service.js` | Auth tests pass (`tests/auth.test.js`) |
| **Phase 2: Groups Management** | ✅ Completed | `src/models/Group.js`, `src/controllers/group.controller.js`, `src/routes/group.routes.js`, `src/services/group.service.js` | Group tests pass (`tests/group.test.js`) |
| **Phase 3: Events & Hackathons** | ✅ Completed | `src/models/Event.js`, `src/validators/event.validator.js`, `src/routes/event.routes.js`, `src/services/event.service.js`, `src/utils/priority.js`, `src/utils/serializers.js` | Event tests pass (`tests/event.test.js` 18/18) |
| **Phase 4: Realtime & Notifications**| ✅ Completed | `src/realtime/socket.js`, `src/models/Notification.js`, `src/services/notification.service.js`, `src/services/push.service.js`, `src/services/email.service.js`, `src/listeners/` | Notification & Realtime tests pass (`tests/notification.test.js`, `tests/realtime.test.js`) |
| **Phase 5: Reminders & Scheduler** | ✅ Completed | `src/models/Reminder.js`, `src/validators/reminder.validator.js`, `src/services/reminder.service.js`, `src/controllers/reminder.controller.js`, `src/jobs/reminder.job.js`, `src/jobs/scheduler.js` | 10/10 tests pass (`tests/reminder.test.js`) |
| **Phase 6: Watchlist & Participation** | ✅ Completed | `src/models/Pin.js`, `src/models/Participation.js`, `src/validators/watchlist.validator.js`, `src/services/pin.service.js`, `src/services/participation.service.js`, `src/services/watchlist.service.js`, `src/controllers/watchlist.controller.js`, `src/routes/event.routes.js`, `src/routes/group.routes.js`, `src/listeners/` | 13/13 tests pass (`tests/watchlist.test.js`) |

---

## 📋 3. Immediate Roadmap ("What Will You Do")

### Upcoming Development Milestones:
1. **Phase 7 Implementation: Dashboard & Activity**:
   - [ ] Implement aggregated summary endpoint `GET /groups/:gid/dashboard` with sections:
     - `today`: events occurring today.
     - `upcoming`: events in the next 7 days.
     - `deadlines`: pending events sorted nearest, including registration-close deadlines.
     - `highPriority`: pending high priority events.
     - `nextHighPriority`: earliest pending high priority event.
     - `recentlyAdded`: last 10 added events.
     - `upcomingHackathons`: upcoming hackathon events.
     - `watchlistClosingSoon`: events pinned (group or caller) with `registrationClosesAt` in next 7 days and caller status not registered/not_interested.
     - `recentActivity`: last 10 activity rows.
     - `stats`: `{ pending: number, completed: number, urgent: number }`.
   - [ ] Activity log querying with pagination `GET /groups/:gid/activity?page&limit`.
   - [ ] Integration test suite `tests/dashboard.test.js`.

2. **Phase 8 Implementation: Google Calendar Sync**:
   - [ ] OAuth flow (`/integrations/google/auth-url`, `/integrations/google/callback`, status, preferences, sync-now, delete).
   - [ ] AES-256-GCM token encryption, extendedProperties duplicate prevention, nightly reconcile job.

3. **Phase 9: Hardening, Rate Limiting & Demo Seed Script**:
   - [ ] Route-level rate limiting, Dockerfile/compose verification, demo database seeder.

---

## 🔒 4. Risk Mitigation & Error Prevention Checklist
- **Contract Law**: Zero renaming of fields in `API_CONTRACT.md` and `DATA_MODEL.md`.
- **Cross-Group Isolation**: Every resource query verifies `resource.groupId === req.user.groupId`, else returns 404.
- **Decoupled Side Effects**: Services emit `domain.*` events; listeners handle notifications, push, sockets, and audit logs.
- **Atomic Concurrency**: Cron jobs claim tasks using `findOneAndUpdate({ status: 'pending' }, { status: 'processing' })`.

