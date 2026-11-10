# 05 – Event Form, Hackathons & Priority (MOBILE)

Full-screen modal `EventForm` (create & edit). One scrollable screen, sticky bottom Save button, keyboard-aware. Minimal steps; progressive disclosure.

## Fields (order)
1. **Title** (autofocus, large). 2. **Category** horizontally scrollable chips (Hackathon, College, Personal, Meeting, Competition, Other – coloured). 3. **Priority** three big chips 🔴 High · 🟡 Medium · 🟢 Low (default Medium). 4. **Date** row + **Start/End time** rows (native pickers: `@react-native-community/datetimepicker`; iOS inline/spinner in a sheet, Android dialog) + **All day** switch; default next full hour, +1h; auto-fix end ≥ start. 5. **Description**. 6. **Registration / event URL** (keyboard `url`, validation http/https, paste button, domain preview). 7. **Assign to**: "Entire group" switch; OFF → member checklist with avatars. 8. **Reminders**: chips 1 day before, 12 hours before, 1 hour before (default), 30 minutes before, Custom (date-time picker). Hint: "Reminders are only for you." 9. Save / Delete (edit) / Mark complete.

## Hackathon section (appears for Hackathon/Competition)
Hackathon name, **Registration link**, **Official website / problem statement link**, Registration opens (date-time), Registration closes (date-time), Hackathon date (the event date above), Prize pool, Location + Mode (Online/Offline/Hybrid), Other details. Validation: name required, URLs http/https, closes ≥ opens, warn if closes after event start. Checkbox **"📌 Save for later (add to Watchlist)"** → on save also pin + default registration reminders.

## Event details for hackathons
Info card: prize, location/mode, registration window progress ("Closes in 3 days"), buttons **Register ↗**, **Official site ↗** (`ExternalLinkButton`), participation panel (see 07), added-by info.

## Priority UI
PriorityBadge (dot + label) everywhere; sort control (Priority / Date / Recent) in Tasks & lists; urgent pill with countdown ("Due in 5h"); high-priority accent.

## Technical
zod schema mirrors backend; local↔UTC conversion via `lib/dates.ts` and user tz; payload exactly per contract; optimistic insert into caches; discard-changes confirm on back; server `details` mapped to fields; submit disabled while pending; success haptic.
