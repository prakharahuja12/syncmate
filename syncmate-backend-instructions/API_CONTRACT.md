# SyncMate – API CONTRACT (single source of truth)

Backend, Web and Mobile MUST follow this file exactly. If something must change, change it HERE first, then in all three codebases.

Base URL: `{API_URL}/api/v1`  |  Realtime: Socket.IO on the same origin.
Auth: `Authorization: Bearer <accessToken>` on every route except those marked PUBLIC.
Content type: JSON. All timestamps are ISO-8601 UTC strings (`2026-11-15T09:30:00.000Z`). Clients render in the user's local timezone.

## Response envelope
```json
{ "success": true,  "data": { } , "meta": { "page":1, "limit":20, "total":57 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Human readable", "details": [ { "path":"title", "message":"Required" } ] } }
```
Error codes: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `TOKEN_EXPIRED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `GROUP_FULL` 409, `INVITE_INVALID` 410, `RATE_LIMITED` 429, `INTERNAL` 500.

## Auth & Users
| Method | Path | Body / Query | Notes |
|---|---|---|---|
| POST | /auth/signup (PUBLIC) | `{name,email,password}` | password min 8. Returns `{user, accessToken, refreshToken}` |
| POST | /auth/login (PUBLIC) | `{email,password}` | same return |
| POST | /auth/refresh (PUBLIC) | `{refreshToken}` | rotates refresh token; returns new pair |
| POST | /auth/logout | `{refreshToken}` | revokes it |
| GET | /auth/me | – | `{user, group|null}` |
| PATCH | /users/me | `{name?,avatarColor?,timezone?,settings?{theme,emailNotifications,pushNotifications}}` | |
| POST | /users/me/push-tokens | `{token,platform:'web'|'ios'|'android',deviceId}` | upsert by token |
| DELETE | /users/me/push-tokens | `{token}` | call on logout |

Access token: 15 min. Refresh token: 30 days, rotating.

## Groups
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /groups | `{name}` | creator becomes `owner`; generates `inviteCode` (8 chars, A-Z2-9); switches active `groupId` to the new group (supports hosting multiple teams) |
| GET | /groups | – | lists all groups the user belongs to (`{ groups: Group[] }`; `inviteCode` exposed only for owned groups) |
| GET | /groups/me | – | the user's active group (`user.groupId`) |
| POST | /groups/:gid/switch | – | switches the user's active `groupId` to `:gid` (404 if not a member); returns `{ group }` |
| GET | /groups/invite/:code/preview (PUBLIC) | – | `{groupName, memberCount, maxMembers}` |
| POST | /groups/join | `{code}` | adds member & switches active `groupId` to joined group; 409 CONFLICT if already in that group; 409 GROUP_FULL if members >= maxMembers (default 5 = owner + 4) |
| PATCH | /groups/:gid | `{name}` | owner only |
| POST | /groups/:gid/invite/regenerate | – | owner only; old code dies |
| DELETE | /groups/:gid/members/:userId | – | owner only |
| POST | /groups/:gid/leave | – | members; owner must transfer or delete |
| DELETE | /groups/:gid | – | owner only |

Invite link format: `{WEB_URL}/join/{code}` and deep link `syncmate://join/{code}`.

## Events
Event object (response):
```json
{
 "id":"...", "groupId":"...", "kind":"event|task|deadline",
 "title":"SIH 2026", "description":"...",
 "category":"hackathon|college|personal|meeting|competition|other",
 "priority":"high|medium|low",
 "startAt":"...", "endAt":"...", "allDay":false,
 "url":"https://...",
 "assignedToAll":true, "assignedTo":["userId"],
 "status":"pending|completed", "completedAt":null, "completedBy":null,
 "createdBy":{"id","name","avatarColor"}, "updatedBy":{"id","name"},
 "createdAt":"...", "updatedAt":"...",
 "hackathon": {                       // present only when category === 'hackathon' (or competition)
   "name":"Smart India Hackathon", "registrationUrl":"https://...", "officialUrl":"https://...",
   "problemStatementUrl":"https://...", "registrationOpensAt":"...", "registrationClosesAt":"...",
   "prizePool":"₹1,00,000", "location":"Online / City", "mode":"online|offline|hybrid", "details":"markdown text"
 },
 "pinSummary": { "pinnedBy":[{"user":{...},"pinnedAt":"...","visibility":"group"}], "isPinnedByMe":true },
 "participation": [ {"user":{...}, "status":"interested|planning|registered|not_interested", "updatedAt":"..."} ],
 "myStatus":"interested|planning|registered|not_interested|null",
 "myReminders":[ {"id","anchor":"start|registrationClose","offsetMinutes":60,"customAt":null} ],
 "isUrgent": true         // computed server-side, see rules below
}
```
| Method | Path | Notes |
|---|---|---|
| GET | /groups/:gid/events | query: `from,to` (ISO, required for calendar), `category,priority,status,assignee,q,sort=startAt|priority|createdAt,order=asc|desc,page,limit` |
| POST | /groups/:gid/events | body = event fields (title,description,category,priority,startAt,endAt,allDay,url,assignedToAll,assignedTo,kind,hackathon?,reminders?[]) |
| GET | /events/:id | |
| PATCH | /events/:id | partial; any group member can edit (v1 rule: creator or owner only for delete) |
| DELETE | /events/:id | creator or group owner |
| POST | /events/:id/complete | sets status completed |
| POST | /events/:id/uncomplete | |

**isUrgent rule:** `status=pending` AND (priority=high AND startAt within next 48h) OR (any pending event whose startAt or hackathon.registrationClosesAt is within next 24h) OR overdue pending high-priority.

**Priority sort order:** high(0) < medium(1) < low(2), tie-break by `startAt` asc.

## Reminders (per user, per event)
| Method | Path | Body |
|---|---|---|
| GET | /events/:id/reminders | my reminders |
| PUT | /events/:id/reminders | `{reminders:[{anchor:'start'|'registrationClose', offsetMinutes?: 1440|720|60|30|10080|4320, customAt?: ISO}]}` replaces my set |

Presets for `anchor:'start'`: 1440 (1 day), 720 (12h), 60, 30. Presets for `anchor:'registrationClose'`: 10080 (7d), 4320 (3d), 1440 (1d). Custom = `customAt` absolute datetime.

## Watchlist (Pin / Save for later)
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | /events/:id/pin | `{visibility:'group'|'private'}` default group | idempotent |
| DELETE | /events/:id/pin | – | unpin MY pin |
| GET | /groups/:gid/watchlist | query `scope=all|mine|group`, `status`, `sort=registrationClosesAt|startAt|pinnedAt` | returns events + pinSummary + participation |
| PUT | /events/:id/my-status | `{status}` | independent per user; auto-creates participation row |
| GET | /events/:id/participation | – | all members' statuses |

## Notifications
| Method | Path |
|---|---|
| GET | /notifications?unread=true&page=1&limit=20 |
| GET | /notifications/unread-count |
| PATCH | /notifications/:id/read |
| POST | /notifications/read-all |

Notification object: `{id,type,title,body,data:{eventId?,groupId?,deepLink},actor:{id,name}|null,readAt|null,createdAt}`
Types: `event_created, event_updated, event_deleted, event_completed, reminder, registration_deadline, pin_added, status_changed, member_joined, member_left, google_sync_error`.

## Dashboard & Activity
`GET /groups/:gid/dashboard` returns:
```json
{ "today":[Event], "upcoming":[Event] /*next 7 days*/, "deadlines":[Event] /*pending, sorted nearest, include reg-close deadlines*/,
  "highPriority":[Event] /*pending high*/, "nextHighPriority":Event|null, "recentlyAdded":[Event] /*last 10*/,
  "upcomingHackathons":[Event], "watchlistClosingSoon":[Event] /*reg closes <=7d*/, "recentActivity":[Activity], "stats":{"pending":0,"completed":0,"urgent":0} }
```
`GET /groups/:gid/activity?page&limit` -> `[ {id,actor,action,eventId,summary,createdAt} ]`.

## Google Calendar
| Method | Path | Notes |
|---|---|---|
| GET | /integrations/google/auth-url?platform=web|mobile | returns `{url}`; state param carries signed userId + platform |
| GET | /integrations/google/callback (PUBLIC, Google redirects here) | exchanges code, stores encrypted refresh token, redirects to `{WEB_URL}/settings/integrations?google=connected` or `syncmate://integrations?google=connected` |
| GET | /integrations/google/status | `{connected, email, calendarId, preferences, lastSyncAt}` |
| PATCH | /integrations/google/preferences | `{mode:'all'|'categories'|'assigned_to_me'|'none', categories?:[], priorities?:[], includeRegistrationDeadlines:boolean}` |
| POST | /integrations/google/sync-now | full resync of my events |
| DELETE | /integrations/google | disconnect + optionally delete synced events `?removeEvents=true` |

## Socket.IO events
Client connects with `auth: { token: accessToken }`. Server auto-joins `user:{userId}` and `group:{groupId}`.
Server -> client: `event:created`, `event:updated`, `event:deleted` ({id}), `event:completed`, `pin:changed` ({eventId, pinSummary}), `status:changed` ({eventId, participation}), `notification:new` (Notification), `group:member-joined`, `group:member-left`, `activity:new`.
Payload for event:* is the full Event object (except deleted). Clients must update caches in place (no refetch storm) and ignore echoes of their own optimistic updates by comparing `updatedAt`.
Client -> server: `ping` only. All mutations go through REST.

## Deep links (push taps)
`syncmate://event/{id}`, `syncmate://watchlist`, `syncmate://notifications`, `syncmate://join/{code}`. Web equivalents: `/event/{id}`, `/watchlist`, `/notifications`, `/join/{code}`.

## ADDENDA (final decisions – these override anything above)
1. Event objects also include `primaryUrl` (string|null) = `hackathon.registrationUrl || hackathon.officialUrl || url`. **Clicking a hackathon event opens `primaryUrl` in a new tab / external browser.**
2. Event objects in calendar listings may include `calendarMarkers: [{type:'registrationClose', at:ISO}]`.
3. `GET /groups/:gid/watchlist` returns `data: { open: WatchItem[], closed: WatchItem[] }` where `WatchItem = Event & { daysToRegistrationClose: number|null }`; participation lists ALL group members (status null = no response).
4. Dashboard `deadlines` items = `{ event: Event, deadlineAt: ISO, deadlineType: 'event'|'registration' }`.
5. `user.settings` also has `inAppNotifications:boolean` and `defaultReminderOffsets:number[]` (minutes before start, default `[60]`).
6. Extra group routes: `POST /groups/:gid/transfer-owner {userId}`. Extra socket event: `group:deleted`.
7. `domain` pin visibility: `private` pins are never included in other users' `pinSummary`.
