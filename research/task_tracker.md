# Project Task Tracker & Progress Log

> **Purpose**: Automatically maintained tracker for reviewed user prompts, completed tasks, and planned next steps to prevent errors and ensure continuity.

---

## 📌 Current Status & Active Focus

- **Current Status**: Phase 2 Groups Complete & Verified (Ready for Review)
- **Active Focus**: Awaiting approval to proceed to Phase 3 (Events, Tasks, Priority & Hackathon Engine)
- **Lead / Author**: Chahak Moolchandani (@chahak28-tech, chahakneeta@gmail.com)
- **Last Updated**: 2026-11-10

---

## 📋 What Will You Do (Planned Next Steps)

### Phase 3: Events & Hackathons (Next Phase)
- [ ] Create Event validators (`src/validators/event.validator.js`):
  - `createEventSchema`: title, description, category, priority, startAt, endAt, allDay, url, assignedToAll, assignedTo, kind, hackathon block, reminders array.
  - `updateEventSchema`: partial updates with endAt >= startAt validation and hackathon date checks.
  - `listEventsQuerySchema`: from, to (ISO strings for calendar view), category, priority, status, assignee, q, sort, order, page, limit.
- [ ] Implement `src/utils/priority.js`:
  - `computeUrgent(event, now)`: server-side urgency calculation matching API_CONTRACT rules.
  - `getPriorityWeight(priority)`: high (0) < medium (1) < low (2).
- [ ] Implement `src/services/event.service.js`:
  - CRUD operations with group authorization (`resource.groupId === req.user.groupId`).
  - Hackathon URL resolution and virtual `primaryUrl` computation.
  - Diff calculation for updates.
  - Creator reminder provisioning.
  - Domain event emission (`domain.event.created`, `domain.event.updated`, `domain.event.deleted`, `domain.event.completed`).
- [ ] Implement `src/controllers/event.controller.js` and `src/routes/event.routes.js`.
- [ ] Add comprehensive automated integration tests in `tests/event.test.js`.
- [ ] Verify ESLint and test suite pass.

---

## 📜 What Was Done (Completed Work History)

### [2026-11-10] - Phase 2 Groups Implementation & Verification
- **Objective**: Implement all Phase 2 Group requirements strictly according to `API_CONTRACT.md`, `DATA_MODEL.md`, and engineering rules under author Chahak Moolchandani.
- **Actions Taken**:
  - Configured Git author globally and locally:
    - `user.name`: Chahak Moolchandani
    - `user.email`: chahakneeta@gmail.com
    - Re-authored Phase 1 commit (`810cca3`) and force-pushed to `origin/main`.
  - Created Domain Models:
    - `src/models/Event.js`: Event schema with hackathon subdocument, indexes, and full contract types.
    - `src/models/Pin.js`: Watchlist pin model with compound unique index on `{ eventId, userId }`.
    - `src/models/Participation.js`: User participation status model with unique index.
    - `src/models/Reminder.js`: Reminder model with `fireAt` and `status` indexes.
    - `src/models/Activity.js`: Activity feed log model indexed by `{ groupId, createdAt: -1 }`.
    - `src/models/Notification.js`: In-app notification model with 90-day TTL index.
    - `src/models/GoogleSync.js`: Google Calendar sync map model with compound unique index preventing duplicates.
  - Built Middleware & Validators:
    - `src/validators/group.validator.js`: Zod schemas for create, join, update, transfer-owner.
    - `src/middleware/groupAccess.js`: `verifyGroupAccess` (returns 404 on cross-group access to prevent resource leakage) and `requireGroupOwner` (verifies caller is owner, returns 403 otherwise).
  - Implemented Group Service & Controller:
    - `src/services/group.service.js` & `src/controllers/group.controller.js`:
      - `POST /groups`: Creates group with 8-character nanoid `inviteCode` (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`), sets owner, sets `user.groupId`.
      - `GET /groups/me`: Returns current user's group; includes `inviteCode` exclusively for owner.
      - `GET /groups/invite/:code/preview` (PUBLIC): Rate-limited preview returning `{ groupName, memberCount, maxMembers }` (no member data leaked). Returns 410 `INVITE_INVALID` on miss.
      - `POST /groups/join`: Validates invite code, enforces 1-group limit (409 CONFLICT), checks 5-member limit (409 `GROUP_FULL`), updates `user.groupId`, emits `domain.member.joined`.
      - `PATCH /groups/:gid`: Renames group (owner only).
      - `POST /groups/:gid/invite/regenerate`: Generates new invite code (owner only, old code dies).
      - `DELETE /groups/:gid/members/:userId`: Removes member, unsets `user.groupId`, cascades deletion of member's group pins/participations/reminders, emits `domain.member.left`.
      - `POST /groups/:gid/leave`: Member leaves; blocks owner if other members remain (409 CONFLICT).
      - `POST /groups/:gid/transfer-owner`: Transfers owner role to existing group member.
      - `DELETE /groups/:gid`: Cascade deletes group, events, pins, participations, reminders, activities, notifications; resets members' `groupId` to null; emits `group:deleted`.
  - Testing & Verification:
    - Wrote 28 comprehensive tests in `tests/group.test.js`.
    - Executed test suite: **All 4 test suites passed (56/56 tests)**.
    - Verified `npm run lint`: Clean (0 errors, 0 warnings).
- **Status**: Phase 2 Completed & Verified. Ready for Phase 3 approval.

### [2026-11-10] - Phase 1 Foundation Implementation & Verification
- **Objective**: Implement all Phase 1 Foundation requirements strictly according to `API_CONTRACT.md`, `DATA_MODEL.md`, and engineering rules.
- **Actions Taken**:
  - Initialized project configuration:
    - Configured `package.json` with ES Modules (`"type": "module"`), runtime dependencies, and dev tooling (`jest`, `supertest`, `mongodb-memory-server`, `eslint`, `prettier`, `nodemon`).
    - Configured `.env.example` with all contract variables and integration keys.
    - Configured `src/config/env.js` with comprehensive fallback and environment validation.
    - Set up structured logger `src/config/logger.js` using `pino` with automatic redaction of sensitive credentials (`password`, `passwordHash`, `refreshToken`, `tokenHash`, `authorization`).
    - Implemented database manager `src/config/db.js` with Mongoose connection lifecycle and graceful shutdown.
  - Created Domain Models:
    - `src/models/User.js`: Schema matching `DATA_MODEL.md` with safe `toJSON` transform (strips `passwordHash`, `google.refreshTokenEnc`, `__v`).
    - `src/models/RefreshToken.js`: Schema with TTL index on `expiresAt` (auto-purging expired tokens), `tokenHash`, `deviceId`, and revocation tracking.
    - `src/models/Group.js`: Schema with `ownerId`, `members` array, unique `inviteCode` index, and `maxMembers: 5`.
  - Implemented Core Utilities & Middleware:
    - `src/utils/ApiError.js`: Contract-compliant error class with factory helpers.
    - `src/utils/response.js`: Standard success `{ success: true, data }` and error `{ success: false, error: { code, message, details } }` response helpers.
    - `src/utils/crypto.js`: Cryptographic helpers including SHA-256 token hashing, random 64-byte token generation, and AES-256-GCM encryption/decryption.
    - `src/utils/eventBus.js`: Node `EventEmitter` domain event bus.
    - `src/utils/serializers.js`: Safe entity serializers (`serializeUser`, `serializeGroup`).
    - `src/middleware/asyncHandler.js`: Central async error wrapper.
    - `src/middleware/errorHandler.js`: Global error handling middleware.
    - `src/middleware/validate.js`: Zod schema validation middleware that strips unknown keys.
    - `src/middleware/auth.js`: JWT Bearer authentication, user reloading from DB, `req.user` & `req.groupId` assignment.
    - `src/middleware/rateLimit.js`: General rate limiter (100 req/min/IP) and strict auth rate limiter (10 req/min/IP).
  - Implemented Phase 1 Routes & Controllers:
    - Health check: `/health` and `/api/v1/health`.
    - Auth routes: signup, login, refresh, logout, /auth/me.
    - User routes: /users/me, /users/me/push-tokens.
  - Setup & Verification:
    - Configured `eslint.config.js` and `.prettierrc`.
    - Configured Jest test suite with in-memory MongoDB (`tests/setup.js`).
    - Wrote 28 comprehensive automated tests across `tests/health.test.js`, `tests/auth.test.js`, and `tests/user.test.js`.
- **Verification & Testing Results**:
  - `npm run lint`: 0 errors, 0 warnings.
  - `npm test`: 3/3 test suites passed, 28/28 tests passed.
  - Express application boot verified successfully.
  - Pushed to `origin/main` (`commit 810cca3` authored by `Chahak Moolchandani <chahakneeta@gmail.com>`).
- **Status**: Completed & Verified.

---

## 📜 Prior History

### [2026-11-10] - Pushed Codebase to GitHub
- Initial commit of instructions, skills, rules, and tracking documents to `https://github.com/prakharahuja12/syncmate.git`.
