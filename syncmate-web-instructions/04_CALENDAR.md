# 04 – Calendar (WEB)

Use **FullCalendar** (`dayGridMonth`, `timeGridWeek`, `timeGridDay`, optional `listWeek` on mobile). Theme it fully with design tokens (override FullCalendar CSS variables) so it looks like Google Calendar-meets-Linear: no default blue, thin borders, 12px rounded event chips, current-time indicator in primary colour.

## Toolbar (custom, not FC's default)
Left: Today button, prev/next chevrons, current range title ("November 2026"). Right: SegmentedControl Month | Week | Day, filter popover (category multi-select, priority, assignee "Mine/All", status), search. Mobile: compact toolbar; default view `listWeek` or `dayGridMonth` with a bottom sheet day-agenda on date tap.
Left panel (desktop ≥1280): MiniCalendar for quick jump + **Category legend** with toggles (show/hide category) + "Watchlist deadlines" toggle.

## Data fetching
Use FC `datesSet` to get visible range → `useEvents({from,to,filters})` → pass events via an `events` function/array. Prefetch adjacent ranges. `keepPreviousData` to avoid flicker. Map API Event → FC EventInput: `id, title, start, end, allDay, backgroundColor/borderColor from CATEGORY_STYLES, extendedProps: whole event`. Render custom `eventContent`: priority dot, title, time, small 🔗 icon if `primaryUrl`, pin icon if pinned by me, strike-through + dim if completed, red accent if `isUrgent`.
Also render `calendarMarkers` (registrationClose) as all-day "📝 {name} – registration closes" chips (dashed border) that open the same event details.

## Interactions
- Click empty date/slot → open EventDialog prefilled with that date (and time for week/day via `select` drag for start–end).
- Click event → **EventPopover** (desktop) / bottom sheet (mobile): title, category + priority badges, date/time, creator ("Added by Rahul · 2h ago"), description, assigned to, participation avatars, pin button, Edit, Delete, Complete toggle, and:
  - **If `primaryUrl` exists: a prominent "Open registration page ↗" button.** For events with category hackathon/competition, **a plain click on the event chip opens the details popover, and the popover's main CTA (and a 🔗 icon directly on the chip) opens `primaryUrl` in a new tab.** Provide a user setting "Clicking a hackathon opens its link directly" (default ON): when ON, clicking the chip's body of a hackathon event opens `primaryUrl` immediately in a new tab, and the details open via an ⓘ icon / right-click / `Enter` key. Honour this requirement from the product spec: *clicking a hackathon event in the calendar must take the user to its official registration/event page.*
- Drag & drop to reschedule, drag edges to resize (`editable: true`) → PATCH with optimistic update; rollback + toast on failure. Disabled for completed events.
- Keyboard: arrow keys navigate days, `C` create, `Enter` open event.
- Realtime: when `event:created/updated/deleted` arrives, update all cached `['events', ...]` queries whose range overlaps the event; flash the chip (ring 1.5s) for new/updated events from others; toast "Rahul added *SIH 2026*" with "View" action.
- Today highlight, weekends subtly tinted, now-indicator.
- Overlapping events: FC default stacking, "+n more" popover in month view.

## Performance
Memoise `eventContent`; virtualise nothing (volumes small); debounce range changes 150ms; avoid re-render of FC by stable props.
