# 07 – Watchlist: Save, Pin & Register Later (WEB)

## PinButton (reusable)
📌 icon button (outline → filled when `isPinnedByMe`). Tooltip "Save for later". Click → optimistic pin (visibility group). Long-press/dropdown chevron: "Pin for group" / "Pin privately" / "Unpin". Present on: EventCard, calendar popover, event drawer, dashboard hackathon cards, watchlist cards.
Group visibility chip next to it: avatar stack of who pinned ("Aman + 2 pinned").

## Watchlist page (`/watchlist`, nav label "Saved Events")
Header: title, scope tabs **All · Mine · Group** (maps to `scope`), status filter chips (All / Interested / Planning to Register / Registered / Not Interested — applies to MY status), sort select (Registration deadline · Event date · Recently pinned).
Sections: **Open** (registration open or no deadline) and a collapsed **Closed / Past** section (data `open/closed`).
**WatchCard** (spec-required content): title + category badge; **registration deadline** (date + countdown chip, red when ≤ 24h, amber ≤ 3d), **event date**, **registration link button ("Register ↗" opens `primaryUrl`/registrationUrl)**, official site link; prize pool/location line; **"Pinned by Aman · 2 days ago"** (+ others); **participants row**: every group member avatar with a small status glyph (👀 interested, 🗓 planning, ✅ registered, ✖ not interested, ○ no response) and tooltip names; summary line "2 interested · 1 registered"; **my status select** (Interested, Planning to Register, Registered, Not Interested) – independent per user, optimistic; **reminder control**: dropdown with 7 days / 3 days / 1 day before registration closes + Custom date-time (multi-select chips), saved via `PUT /events/:id/reminders` (`anchor: registrationClose`). Overflow menu: Unpin, Open details, Edit.
Marking **Registered**: confetti-less subtle check animation, card gets green "Registered" ribbon, reminder chips greyed with note "Reminders stopped".
Empty state: "Nothing saved yet. Pin hackathons you might join later" with CTA to Calendar.

## Realtime
`pin:changed` and `status:changed` patch `['watchlist', *]`, `['event', id]` and the dashboard cache; toast only for others' pins ("Priya saved *SIH 2026* 📌") — respects in-app notification setting.

## Notifications integration
Pin and "registered" events by others appear as notifications (types `pin_added`, `status_changed`); registration-deadline reminders deep-link to `/event/:id`.
