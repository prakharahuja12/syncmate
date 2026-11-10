# 07 – Watchlist: Save, Pin & Register Later (MOBILE)

## PinButton
📌 outline/filled, haptic on toggle, optimistic. Tap = pin for group; long-press (or chevron) → action sheet: "Pin for group", "Pin privately", "Unpin". Shows avatar stack "Aman +2 pinned". Present on EventCard, EventDetails, dashboard hackathon cards, Watchlist cards.

## Saved tab ("Saved Events")
Top: SegmentedControl **All · Mine · Group**; chips for my status (All, Interested, Planning to Register, Registered, Not Interested); sort sheet (Registration deadline, Event date, Recently pinned). Sections **Open** and collapsible **Closed/Past** (API `open/closed`).
**WatchCard** shows (spec): title + category; **registration deadline** with countdown chip (red ≤24h, amber ≤3d); **event date**; **Register ↗** button (opens registration link) + **Official site ↗**; prize/location; **"Pinned by Aman · 2 days ago"**; **participants row** – every member avatar with status glyph (👀 interested, 🗓 planning, ✅ registered, ✖ not interested, ○ no response), tap → sheet with names & statuses; summary "2 interested · 1 registered"; **My status** picker (bottom sheet with 4 options, independent per user, optimistic + haptic); **Reminders** chip row opening a sheet: 7 days / 3 days / 1 day before registration closes + Custom date-time (multi-select) → `PUT /events/:id/reminders` (`anchor:'registrationClose'`). Setting **Registered** → green ribbon, reminders show "Stopped".
Empty state: "Nothing saved yet" + CTA to Calendar.

## Realtime & push
`pin:changed`, `status:changed` patch caches; toast for others' pins. Push deep link opens Event details. Registration-deadline push arrives per backend schedule.
