# 04 – Calendar (MOBILE)

Library: `react-native-calendars` (month strip/agenda) for Month view; custom **Week** and **Day** time-grid using `react-native-big-calendar` (or build with FlashList + absolute positioned blocks if the lib is insufficient). Wrap behind our own `CalendarView` component so the library can be swapped.

## Header
Title with month/year (tap → date jump sheet), Today button, view switcher **Month | Week | Day** (SegmentedControl), filter icon (sheet: categories, priorities, assignee Mine/All, status), notification bell with badge.

## Month view
Compact month grid with coloured **dots** (category colours, max 3 + "+") under dates; selected-day agenda list below (events sorted by time; urgent first accent). Swipe horizontally between months. Registration-closing dates show a dashed 📝 dot and an agenda row "Registration closes – {name}".
## Week view
7-day columns on tablet, 3-day sliding window on phones (pinch-free); time grid with now-line; event blocks coloured by category with priority dot + title; all-day row at top.
## Day view
Single column time grid with generous blocks, swipe left/right for days.

## Data
Visible range → `useEvents({from,to,filters})`; prefetch next/prev range; keep previous data; pull-to-refresh. Realtime handler patches cache (see 08) and briefly highlights new items.

## Interactions
- Tap empty slot/date → EventForm prefilled. Long-press + drag on week/day → create with selected duration (optional stretch). 
- Tap event → **EventDetails bottom sheet** (title, badges, date/time, creator "Added by X · 2h ago", description, assignees, participation avatars, pin button, Complete toggle, Edit, Delete, and for events with `primaryUrl` a prominent **"Open registration page ↗"** button).
- **Hackathon link requirement:** tapping a hackathon/competition event opens the details sheet whose primary CTA and a 🔗 icon on the event chip open `primaryUrl` in the system browser. Provide a setting "Tapping a hackathon opens its link directly" (default ON): when ON, tapping the event chip opens `primaryUrl` immediately via in-app browser (`openBrowserAsync`), and details open via long-press or the ⓘ icon. This satisfies the spec: clicking a hackathon event takes you to its official registration/event page.
- Drag-to-reschedule is NOT required on mobile; use Edit.
- Completed events dimmed with strikethrough. Urgent events: red left bar.
