# 04 – Watchlist (Pin / Save for Later) & Participation

## Concepts
- **Pin** = "I'm keeping an eye on this". One row per (event,user). `visibility: group` (default) → every member sees who pinned and when. `private` → only the pinner sees it in their watchlist; excluded from other members' `pinSummary`.
- **Participation status** = per-user, independent: `interested | planning | registered | not_interested`. Any member can set their own at any time, pinned or not.
- Pinning automatically sets my status to `interested` if I have none.

## Endpoints behaviour
- `POST /events/:id/pin` idempotent; returns updated `pinSummary`. Emits `domain.pin.added` → activity ("Aman pinned SIH 2026"), notify other members (type `pin_added`), socket `pin:changed`.
- `DELETE /events/:id/pin` removes only MY pin. Emits `pin:changed`. Do NOT notify (avoid noise) but log activity.
- `PUT /events/:id/my-status` upserts participation. Notify others only when status becomes `registered` ("Priya registered for SIH 2026 ✅") — other changes only emit socket `status:changed`. Setting `registered` also cancels my pending `registrationClose` reminders for this event.
- `GET /groups/:gid/watchlist`
  - `scope=mine` → events I pinned (any visibility).
  - `scope=group` → events pinned by anyone with visibility group.
  - `scope=all` (default) → union.
  - Each item returns the full Event plus `pinSummary`, `participation` (all members, include members with no status as `null` so UI can show "no response"), and `daysToRegistrationClose` (null if none).
  - Sort default: `registrationClosesAt` asc with nulls last; closed registrations go in a separate array `closed` in the response `data: {open:[], closed:[]}` **(exception to flat list; document it in contract)**.
  - Filter `status` applies to MY status.

## Registration-deadline reminders for saved events
- When a user pins an event with `hackathon.registrationClosesAt` in the future and has no `registrationClose` reminders yet, auto-create defaults: 3 days and 1 day before (user can change). Defaults must skip any offset whose fireAt is already past.
- Users edit via `PUT /events/:id/reminders` with `anchor:'registrationClose'` and presets 10080, 4320, 1440 or `customAt`.
- Reminder message: "⏰ Registration for {name} closes in {n} days – {registrationUrl}". Notification `data.deepLink` = `syncmate://event/{id}`; include `primaryUrl`.
- Additionally, the daily job (see 05) creates a `registration_deadline` notification for any watchlisted event where registration closes within 24h and my status ∈ {interested, planning, null}.

## Edge cases
- Event deleted → cascade pins/participations.
- Pinning an event without registration dates is allowed; UI shows "No deadline".
- Member leaves → remove their pins/participations; recompute summaries and emit `pin:changed` for affected events.
