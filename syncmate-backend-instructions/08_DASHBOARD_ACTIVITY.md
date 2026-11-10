# 08 – Dashboard & Activity

`GET /groups/:gid/dashboard` → implement in `dashboard.service.js` with parallel `Promise.all` queries (each limited, lean, indexed). `now` = server time; "today" is computed in the requesting user's timezone (`user.timezone`).

| Key | Query |
|---|---|
| today | events overlapping [startOfDay, endOfDay] user-tz, sorted by startAt; pending first |
| upcoming | startAt in (now, now+7d], pending, sorted startAt, limit 10 |
| deadlines | pending events with `startAt` or `hackathon.registrationClosesAt` in next 30 days; flatten to items sorted by the nearest relevant date; each item has `deadlineAt`, `deadlineType: 'event'|'registration'` (extend contract if needed and document) |
| highPriority | pending high, sorted startAt, limit 10 |
| nextHighPriority | first of highPriority with startAt >= now (else null) |
| recentlyAdded | createdAt desc, limit 10 |
| upcomingHackathons | category hackathon, startAt >= now, limit 5 |
| watchlistClosingSoon | pinned (group or mine) with registrationClosesAt in next 7 days and my status not `registered/not_interested` |
| recentActivity | last 15 activities |
| stats | counts pending/completed/urgent (urgent via computeUrgent in JS over pending upcoming set) |

All event items serialized exactly like the events list (with pinSummary, myStatus, isUrgent). Cache nothing (data must be fresh) but keep queries indexed.

Activity endpoint: simple paginated list, populate actor (id, name, avatarColor).
