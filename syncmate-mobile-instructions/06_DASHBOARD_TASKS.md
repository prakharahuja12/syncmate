# 06 – Dashboard & Tasks (MOBILE)

## Home / Dashboard (`GET /groups/:gid/dashboard`)
Vertical scroll with pull-to-refresh. Header: greeting, group name, bell (badge). Stat chips row (Pending, Completed, Urgent, Closing soon) – horizontally scrollable. Sections (each with title + "See all", skeleton, empty state):
1. **Next high-priority** hero card (red accent, countdown, date, creator, primary link button).
2. **Today** timeline.
3. **Upcoming** (7 days, grouped by day).
4. **Important deadlines** (event vs registration deadline type, relative time, urgent in red).
5. **High-priority tasks** (checklist with complete toggle + haptic).
6. **Upcoming hackathons** horizontal carousel of cards (name, prize, reg status, Register ↗, pin).
7. **Recently added**.
8. **Watchlist closing soon** (status quick-select).
9. **Group activity** feed (live-updating).
Tap any item → EventDetails sheet. Relative times refresh every minute (`useNow`).

## Tasks screen (More → Tasks)
Segmented tabs **Pending · Completed · Deadlines**; sort (Priority/Date/Recent) and filter sheet; SectionList grouped by priority (High/Medium/Low) with counts; rows: checkbox, title, badges, due (relative), assignee avatars, urgent pill. Swipe right = complete (undo toast 5s), swipe left = delete (confirm, only creator/owner). Search bar.
