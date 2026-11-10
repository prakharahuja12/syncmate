# SyncMate BACKEND – Antigravity Instruction Pack

Stack: **Node.js (>=20) + Express, plain JavaScript (ES Modules)**, MongoDB (Mongoose), Socket.IO, JWT, node-cron, Firebase Admin (FCM push), Nodemailer, googleapis.

## How to use this pack with Antigravity
1. Create an empty folder `syncmate-backend`, open it in Antigravity.
2. Unzip this pack into a `docs/` folder inside it (`docs/API_CONTRACT.md`, etc.).
3. Paste the contents of `PROMPT_FOR_ANTIGRAVITY.txt` into the Agent Manager as the first task.
4. Let the agent work **phase by phase** (see `00_AGENT_RULES.md`). Review the Implementation Plan artifact before approving each phase.

## File index (read in this order)
| # | File | Purpose |
|---|---|---|
| 00 | 00_AGENT_RULES.md | Rules, coding standards, phase order, definition of done |
| 01 | 01_SETUP_AND_STRUCTURE.md | Dependencies, folder tree, env vars, boot sequence |
| 02 | 02_AUTH_AND_GROUPS.md | Signup/login/JWT, groups, invites |
| 03 | 03_EVENTS_PRIORITY_HACKATHON.md | Events CRUD, hackathon fields, priority, tasks, urgency |
| 04 | 04_WATCHLIST_PINS.md | Pin/save, participation statuses, group visibility |
| 05 | 05_NOTIFICATIONS_REMINDERS.md | Notification service, reminder scheduler, push, email |
| 06 | 06_REALTIME_SOCKETS.md | Socket.IO design |
| 07 | 07_GOOGLE_CALENDAR_SYNC.md | OAuth, two-way-safe sync, duplicate prevention |
| 08 | 08_DASHBOARD_ACTIVITY.md | Dashboard aggregation queries |
| 09 | 09_SECURITY_TESTING_DEPLOY.md | Security, tests, seed data, deployment, acceptance checklist |
| – | API_CONTRACT.md | **Exact endpoints & payloads** (shared with web/mobile) |
| – | DATA_MODEL.md | **Exact schemas & indexes** |
