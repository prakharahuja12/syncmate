# 00 – Agent Rules & Phases

## Product summary
SyncMate lets a small group (owner + up to 4 members) share ONE calendar. Any create/update/delete/pin/status change is instantly visible to all members (Socket.IO), triggers in-app + push (+ optional email) notifications, and can sync to each member's Google Calendar. Hackathons have rich metadata and a clickable registration link. Users can pin events to a watchlist that the whole group sees, with per-user participation statuses and registration-deadline reminders.

## Non-negotiables
1. **Contract first.** Follow `API_CONTRACT.md` + `DATA_MODEL.md` literally.
2. **Authorization on every route.** A user may only read/write data of THEIR group. Always load the resource, verify `resource.groupId === req.user.groupId`, else 403/404 (use 404 to avoid leaking existence).
3. **Validation on every input** with `zod` in `src/validators/*.js` via a `validate(schema)` middleware. Strip unknown keys.
4. **Thin controllers, fat services.** Controllers: parse → call service → respond. Business logic in `services/`. DB access only in services/repositories.
5. **Every mutation** (events, pins, statuses, members) must: (a) persist, (b) write an `Activity`, (c) create `Notification`s for the other members through `notificationService`, (d) emit a Socket.IO event, (e) enqueue Google sync for affected users. Put this orchestration in the service, never in controllers. Use a single `eventBus` (Node EventEmitter) so side-effects are decoupled: services emit `domain.event`, listeners in `src/listeners/` do notifications/sockets/google.
6. **Never** log passwords, tokens, refresh tokens. Never return `passwordHash`, `refreshTokenEnc`, `tokenHash`.
7. **Async errors** go through one `asyncHandler` wrapper and one global error middleware producing the contract's error envelope.
8. Use **UTC** everywhere in the DB. Compute with `date-fns` / `luxon`.
9. Code style: ESLint + Prettier, no `var`, no unused vars, JSDoc on service functions, files < 300 lines.
10. Everything configurable lives in `.env` (see 01). Provide `.env.example`.

## Phases (stop for approval after each)
- **Phase 1 – Foundation:** project setup, config, DB connect, error handling, logger (pino), health route `/health`, auth (signup/login/refresh/logout/me), user profile, push-token routes.
- **Phase 2 – Groups:** create, join by code/link, preview, regenerate, remove member, leave, delete. Max members rule.
- **Phase 3 – Events:** CRUD, filters, sorting, hackathon block, priority, complete/uncomplete, urgency, activity log.
- **Phase 4 – Realtime + Notifications:** Socket.IO, notification service, in-app notifications API, FCM push, optional email.
- **Phase 5 – Reminders:** per-user reminders, scheduler, registration-deadline reminders.
- **Phase 6 – Watchlist:** pins, participation statuses, watchlist API, closing-soon logic.
- **Phase 7 – Dashboard:** aggregated endpoint + activity feed.
- **Phase 8 – Google Calendar:** OAuth, sync engine, preferences, duplicate prevention.
- **Phase 9 – Hardening:** rate limiting, helmet, tests, seed script, OpenAPI/Postman, README, Dockerfile.

## Definition of done (per phase)
- All endpoints of the phase exist and match the contract.
- Jest + Supertest tests pass (happy path + 403 cross-group + validation failure per endpoint).
- `npm run lint` clean. App boots with `npm run dev`.
- Agent produces a short walkthrough artifact with sample curl commands and responses.
