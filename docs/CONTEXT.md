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
| **Phase 7: Dashboard & Activity** | ✅ Completed | `src/validators/activity.validator.js`, `src/services/activity.service.js`, `src/services/dashboard.service.js`, `src/controllers/dashboard.controller.js`, `src/routes/group.routes.js`, `src/utils/dates.js`, `src/utils/serializers.js` | 4/4 tests pass (`tests/dashboard.test.js`) |
| **Phase 8: Google Calendar Sync** | ✅ Completed | `src/services/googleCalendar.service.js`, `src/controllers/google.controller.js`, `src/routes/google.routes.js`, `src/listeners/google.listener.js`, `src/jobs/googleResync.job.js`, `src/validators/google.validator.js`, `src/utils/crypto.js` | 16/16 tests pass (`tests/google.test.js`) |
| **Phase 9: Hardening, Deploy & Seed**| ✅ Completed | `src/seed/seed.js`, `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `src/middleware/rateLimit.js` | Seed tests pass (`tests/seed.test.js`), 0 lint errors |

---

## 📋 3. Project Roadmap & Production Readiness

### Status Across All 9 Development Phases:
- [x] **Phase 1: Foundation & Auth** (100% Complete)
- [x] **Phase 2: Groups Management & Membership** (100% Complete)
- [x] **Phase 3: Events & Hackathons** (100% Complete)
- [x] **Phase 4: Realtime Sockets & Multi-channel Notifications** (100% Complete)
- [x] **Phase 5: Reminders & Scheduler Worker** (100% Complete)
- [x] **Phase 6: Watchlist Pins & Participation** (100% Complete)
- [x] **Phase 7: Dashboard Aggregated Summary & Activity Logs** (100% Complete)
- [x] **Phase 8: Google Calendar Sync & Nightly Reconcile** (100% Complete)
- [x] **Phase 9: Hardening, Docker Deploy & Demo Database Seeder** (100% Complete)

---

## 🔒 4. Risk Mitigation & Error Prevention Checklist
- **Contract Law**: Zero renaming of fields in `API_CONTRACT.md` and `DATA_MODEL.md`.
- **Cross-Group Isolation**: Every resource query verifies `resource.groupId === req.user.groupId`, else returns 404.
- **Decoupled Side Effects**: Services emit `domain.*` events; listeners handle notifications, push, sockets, and audit logs.
- **Atomic Concurrency**: Cron jobs claim tasks using `findOneAndUpdate({ status: 'pending' }, { status: 'processing' })`.

