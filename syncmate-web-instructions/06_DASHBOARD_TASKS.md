# 06 – Dashboard & Tasks (WEB)

## Dashboard (`/`) – data from `GET /groups/:gid/dashboard` (one query, refetch on window focus, patched by realtime)
Layout: greeting header ("Good evening, Aman" + date + group name + quick "New event"). Stat row (Pending, Completed, Urgent, Watchlist closing soon). Then a responsive grid of cards (2 columns ≥1024, 1 column mobile):
1. **Next high-priority** hero card (spec requirement): big title, countdown ("in 2d 4h"), date/time, creator, primary link button, red accent. Empty → "No high-priority events 🎉".
2. **Today's events** timeline list (time + title + badges); empty state "Nothing scheduled today".
3. **Upcoming events** (next 7 days) grouped by day.
4. **Important deadlines**: nearest first; show deadline type (Event / Registration closes) and relative time; urgent ones red.
5. **High-priority tasks**: checklist with complete toggles.
6. **Upcoming hackathons**: cards with name, prize pool, registration status ("Opens in 3d / Closes in 5d / Closed"), Register ↗ button, pin button.
7. **Recently added**: avatar + "Rahul added *SIH 2026* · 2h ago".
8. **Watchlist closing soon**: pinned items closing ≤ 7d, with my status select.
9. **Group activity**: feed from `recentActivity` with avatars, relative times, live-prepending via `activity:new`.
Each card: header with title + "View all" link, skeleton while loading, EmptyState when empty. Card items open event drawer. Relative times update every minute (shared `useNow` hook).

## Tasks page (`/tasks`)
Tabs: **Pending** · **Completed** · **Upcoming deadlines**. Toolbar: sort (Priority / Date / Recently added), filters (category, priority, assigned to me), search. Rows: checkbox, title, priority badge, category badge, due date (relative + absolute), assignee avatars, urgent pill. Group by priority optionally (High/Medium/Low sections with counts). Bulk none (v1). Completing triggers optimistic update + undo toast (5s). Uses `GET /groups/:gid/events` with `status`, `sort=priority`.
