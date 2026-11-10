# 05 – Event Form, Hackathons & Priority (WEB)

Single **EventDialog** (centered dialog desktop, full-height sheet mobile) used for create + edit. Goal: "simple event creation without unnecessary steps" → one screen, sensible defaults, progressive disclosure.

## Fields (in order)
1. **Title** (autofocus, large, borderless style like Notion). Press Enter to jump on.
2. **Category** segmented chips: Hackathon · College · Personal · Meeting · Competition · Other (coloured). Choosing Hackathon/Competition reveals the *Hackathon details* section (below).
3. **Priority** three chips: 🔴 High · 🟡 Medium · 🟢 Low (default Medium).
4. **Date** (date picker) + **Start time / End time** (time selects, 15-min steps) + **All day** switch. Default: next full hour, 1h duration. If end < start show inline error; auto-adjust end when start changes.
5. **Description** textarea (markdown allowed, simple).
6. **Registration / event URL** input with live validation (must be http/https) and a "paste" convenience; show favicon + domain preview when valid.
7. **Assign to**: toggle "Entire group" (default ON); OFF → multi-select member avatars (checkbox list).
8. **Reminders**: ReminderPicker — chips: 1 day before, 12 hours before, 1 hour before (default selected), 30 minutes before, + "Custom" (opens date-time picker). Multiple allowed. Text: "These reminders are just for you."
9. Footer: Cancel, **Save** (Cmd/Ctrl+Enter). Edit mode adds Delete (ConfirmDialog) and "Mark complete".
Also a quick-add: typing in the topbar command palette "SIH 15 Nov 10am" is OPTIONAL stretch goal.

## Hackathon details section (animated expand)
Fields exactly per product spec: Hackathon name, **Registration link**, **Official website / problem statement link**, Registration opens (datetime), Registration closes (datetime), Hackathon date(s) (this is the event's date/time above), Prize pool (text), Location (text) + Mode (Online/Offline/Hybrid), Other details (textarea).
Validation: name required; URLs http/https; closes ≥ opens; warn (not block) if registration closes after event start. Auto-fill: if the title is empty, copy hackathon name to title.
Include a **"Save for later (📌 add to Watchlist)"** checkbox at the bottom of this section → after creation call pin endpoint + default registration-close reminders.

## Event details drawer/page (`/event/:id`)
Large view with all info; for hackathons render a structured info card: prize pool, location/mode, registration window with progress bar ("Registration closes in 3 days"), two link buttons (**Register ↗**, **Official site / Problem statement ↗**), group participation panel (see 07), "Added by X on date", activity history for that event (optional).

## Priority UI
PriorityBadge everywhere. Sorting controls on Tasks page & dashboard lists: Priority (high→low), Date, Recently added. Urgent highlighting per 02. Events list "completed" toggle uses checkbox with animation; completed → muted/strikethrough, moves to "Completed" tab.

## Form technical notes
Schema in `features/events/schema.ts` mirroring backend zod rules; convert local datetime ↔ UTC ISO via `lib/dates.ts` using user timezone; submit payload exactly as contract (`hackathon` only when category requires it); on success close dialog, toast, rely on realtime/optimistic cache update (also insert returned event into cache for instant UI). Show server `details` errors on fields. Unsaved-changes guard on close.
