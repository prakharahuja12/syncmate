---
name: hackathon-and-watchlist
description: Implements hackathon metadata validation, URL sanitization, primaryUrl resolution, group/private pin visibility, and participation states. Trigger on "hackathon", "watchlist", "pin", "participation", "primaryUrl", or "save for later".
---

# Hackathon & Watchlist (SyncMate Backend)

## Purpose
Governs hackathon metadata integrity, URL sanitization, clickable `primaryUrl` resolution, watchlist pin privacy boundaries (`group` vs `private`), and independent per-user participation lifecycles.

## When to use
- Creating or updating events with `category: 'hackathon'` or `'competition'`.
- Implementing watchlist endpoints (`POST /events/:id/pin`, `DELETE /events/:id/pin`, `GET /groups/:gid/watchlist`).
- Implementing participation tracking (`PUT /events/:id/my-status`).
- Triggers: "hackathon", "watchlist", "pin", "participation", "primaryUrl", "save for later".

## Step-by-Step Procedure
1. **Validate Hackathon Block**:
   - If `category === 'hackathon'`, require `hackathon.name`. Optional for `competition`.
   - Validate URLs: `registrationUrl`, `officialUrl`, `problemStatementUrl` must use `http` or `https` protocol.
   - Enforce date ordering: `registrationClosesAt >= registrationOpensAt`.
2. **Compute `primaryUrl` Virtual Field**:
   - In `src/utils/serializers.js`, compute:
     ```javascript
     const primaryUrl = event.hackathon?.registrationUrl || event.hackathon?.officialUrl || event.url || null;
     ```
   - Embed `primaryUrl` on all serialized event representations so web/mobile apps can open it in a new tab on card click.
3. **Manage Watchlist Pins**:
   - `POST /events/:id/pin`: Idempotent upsert into `pins` collection (`groupId`, `eventId`, `userId`, `visibility`).
   - Default `visibility: 'group'`. If `visibility: 'private'`, do not include this pin in other users' `pinSummary`.
   - If user has no existing participation status, auto-set to `interested`.
   - Emit `domain.pin.added` -> creates Activity + notifies group (type: `pin_added`) + emits `pin:changed`.
   - `DELETE /events/:id/pin`: Deletes only the caller's pin. Emits `pin:changed` without sending push notifications to avoid noise.
4. **Manage Participation Statuses**:
   - Statuses: `interested | planning | registered | not_interested`.
   - Upsert `participations` collection row `{ groupId, eventId, userId, status }`.
   - When status becomes `registered`:
     - Notify other group members: `"{name} registered for {title} ✅"`.
     - Automatically cancel any pending `registrationClose` reminders for this user on this event.
   - For other status changes: only emit socket event `status:changed`.
5. **Format Watchlist Endpoint**:
   - `GET /groups/:gid/watchlist`: Return `data: { open: WatchItem[], closed: WatchItem[] }`.
   - Attach `daysToRegistrationClose` (integer or null).
   - In `participation`, list all group members (status: null for those who haven't responded).
6. **Verify Quality**:
   - Run `npm run lint` and `npm test`.

## Rules / Do-Not List
- **DO NOT allow non-http/https protocols**: Reject `javascript:`, `data:`, or `file:` schemes.
- **DO NOT leak private pins** in other users' `pinSummary`.
- **DO NOT notify group on unpinning**: Only log activity to avoid notification clutter.
- **DO NOT return flat lists on watchlist endpoint**: Must return `{ success: true, data: { open: [], closed: [] } }`.

## Checklist before finishing
- [ ] Hackathon URL fields validated with `http(s)` protocol check.
- [ ] `primaryUrl` computed and serialized on all event responses.
- [ ] Private pins hidden from other members' summaries.
- [ ] Setting `registered` cancels pending `registrationClose` reminders.
- [ ] Watchlist response returns partitioned `{ open, closed }` arrays.
- [ ] `npm run lint` and `npm test` are clean.

## Example: Pin Summary Aggregation
```javascript
// src/services/pin.service.js
export async function getPinSummary(eventId, requestingUserId) {
  const pins = await Pin.find({ eventId }).populate('userId', 'name avatarColor');
  
  const isPinnedByMe = pins.some(p => p.userId._id.toString() === requestingUserId.toString());
  const pinnedBy = pins
    .filter(p => p.visibility === 'group' || p.userId._id.toString() === requestingUserId.toString())
    .map(p => ({
      user: { id: p.userId._id.toString(), name: p.userId.name, avatarColor: p.userId.avatarColor },
      pinnedAt: p.createdAt.toISOString(),
      visibility: p.visibility
    }));

  return { pinnedBy, isPinnedByMe };
}
```

