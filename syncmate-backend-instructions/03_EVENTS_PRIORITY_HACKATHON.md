# 03 – Events, Priority, Tasks & Hackathons

## Event creation rules (`event.service.createEvent`)
1. Verify caller is in `:gid`.
2. Validate with zod. Rules:
   - `title` 1–120 chars, `description` ≤ 5000.
   - `category` ∈ hackathon, college, personal, meeting, competition, other. `priority` ∈ high, medium, low (default medium).
   - `endAt >= startAt`. If `allDay`, normalise to start-of-day / end-of-day in the creator's timezone.
   - `url` optional http/https only (reject `javascript:` etc.).
   - `assignedToAll` default true. If false, `assignedTo` must be non-empty and every id must be a member of the group.
   - `hackathon` block REQUIRED when category = `hackathon`, OPTIONAL for `competition`. Required: `name`. All URLs http(s). `registrationClosesAt >= registrationOpensAt`.
3. **Link behaviour:** For hackathons the "primary link" the clients open on click is `hackathon.registrationUrl || hackathon.officialUrl || url`. Compute a virtual field `primaryUrl` in the serializer and include it in the response (add to contract as optional convenience field: `primaryUrl`).
4. Save with `createdBy = updatedBy = req.user.id`.
5. If `reminders[]` supplied, create the **creator's** reminders (see file 05).
6. Emit `domain.event.created` → listeners: activity, notify all other group members (or only assignees if not assignedToAll — creator excluded), socket `event:created`, google sync.
7. Return serialized event.

## Update (`PATCH /events/:id`)
- Load, check group, apply allowed fields only, set `updatedBy`.
- Compute a **diff** of changed fields (title, time, priority, category, url, hackathon dates, assignees) and store in the activity + notification body: e.g. "Rahul moved 'SIH Round 1' to 20 Nov, 10:00".
- If `startAt`, `endAt`, or `hackathon.registrationClosesAt` changed → recompute `fireAt` for ALL reminders of this event (all users) and reset those not yet sent to `pending`.
- If assignees changed: notify newly assigned users; remove reminders of unassigned users.
- Emit `domain.event.updated` (only notify when something user-visible changed; ignore no-op patches).

## Delete
Allowed for creator or group owner. Cascade: reminders (cancel), pins, participations. Emit `domain.event.deleted` with a snapshot (title, date) so notifications can still say what was deleted. Google listener removes the synced events from each user's Google Calendar.

## Complete / uncomplete
`status` toggles, set `completedAt/completedBy`. Cancel pending reminders when completed; restore when uncompleted. Emit `domain.event.completed`.

## Listing
`GET /groups/:gid/events`
- Calendar queries use overlap logic: `startAt <= to AND endAt >= from`.
- Also return hackathons whose `registrationClosesAt` falls in range (use `$or`) and mark with `calendarMarkers:[{type:'registrationClose', at}]` so the frontend can draw a deadline chip on that date.
- Filters: category, priority, status, assignee (`assignedToAll:true OR assignedTo contains`), `q` text search.
- Sorting: `sort=priority` uses an aggregation with `$addFields: {p: {$switch ...}}` (high 0, medium 1, low 2) then `startAt`. Provide util `utils/priority.js`.
- Pagination only when `from/to` absent. When from/to present, return all (cap 500).
- `populate` creator & updatedBy (id, name, avatarColor). Attach `pinSummary`, `participation`, `myStatus`, `myReminders`, `isUrgent` using ONE batched query per relation (avoid N+1; use `$in` on event ids).

## Urgency (`utils/priority.js → computeUrgent(event, now)`)
As defined in API_CONTRACT. Unit-test boundaries (exactly 24h, 48h, completed events never urgent).

## Visibility for assigned events
Everyone in the group can SEE every event (shared calendar requirement). `assignedTo` only affects who is notified/reminded and the "assigned to me" filter.

## Activity summary strings
`created`: "{actor} added {title}"; `updated`: "{actor} updated {title} ({fields})"; `deleted`: "{actor} deleted {title}"; `completed`: "{actor} completed {title}".
