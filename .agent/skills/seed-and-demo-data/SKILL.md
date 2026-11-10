---
name: seed-and-demo-data
description: Creates and verifies idempotent demo database seed scripts with 4 users, group DEMO1234, SIH 2026 hackathon, and realistic group activity. Trigger on "seed", "seed data", "demo data", "populate db", or "reset database".
---

# Seed & Demo Data (SyncMate Backend)

## Purpose
Establishes and verifies an idempotent database seeder (`src/seed/seed.js` / `npm run seed`) that populates MongoDB with 4 demo personas, group `DEMO1234`, SIH 2026 hackathon event, and rich realistic calendar data.

## When to use
- Creating or updating the development seed script (`src/seed/seed.js`).
- Resetting the local database for end-to-end testing or frontend integration.
- Verifying demo accounts and initial state before demo presentations.
- Triggers: "seed", "seed data", "demo data", "populate db", "reset database".

## Step-by-Step Procedure
1. **Define Demo Personas & Group**:
   - 4 users:
     - `alex@demo.com` (Owner)
     - `sam@demo.com` (Member)
     - `priya@demo.com` (Member)
     - `rahul@demo.com` (Member)
   - Password: `Demo@1234` (hashed with bcrypt 12).
   - Assign distinct avatar colors (`#EF4444`, `#3B82F6`, `#10B981`, `#F59E0B`).
   - Group: `"Team Alpha"`, `inviteCode: "DEMO1234"`, `ownerId: alex._id`, `maxMembers: 5`.
2. **Seed 25 Rich Events**:
   - **SIH 2026** (`category: 'hackathon'`):
     - `hackathon.name`: "Smart India Hackathon 2026"
     - `registrationUrl`: "https://sih.gov.in/register"
     - `officialUrl`: "https://sih.gov.in"
     - `problemStatementUrl`: "https://sih.gov.in/ps"
     - `registrationOpensAt` and `registrationClosesAt` in ISO-8601 UTC.
     - `mode: 'hybrid'`, `prizePool: '₹1,00,000'`.
   - Balanced distribution of other categories: `college`, `personal`, `meeting`, `competition`, `other`.
   - Priorities: `high`, `medium`, `low`.
   - Mix of `allDay: true` and time-scoped events.
3. **Seed Pins & Participations**:
   - Pins on SIH 2026 from Alex (group) and Priya (private).
   - Participations: Priya (`registered`), Alex (`planning`), Sam (`interested`), Rahul (`null`).
4. **Seed Reminders & Activities**:
   - Creator reminders (1h before start, 3d before registration close).
   - Activity log rows for recent actions (`event.created`, `pin.added`, `status.changed`).
5. **Enforce Strict Idempotency**:
   - Use `deleteMany` or upsert queries scoped to the demo group/emails so re-running `npm run seed` resets the state cleanly without duplicate keys.
   - Guard against running in production (`if (process.env.NODE_ENV === 'production') throw`).
6. **Verify Seed Execution**:
   - Run verification script:
     ```bash
     node .agent/skills/seed-and-demo-data/scripts/seed-verifier.js
     ```

## Rules / Do-Not List
- **DO NOT execute seed script in production**: Always enforce `NODE_ENV !== 'production'`.
- **DO NOT commit plain-text passwords**: Always use bcrypt hash.
- **DO NOT create non-idempotent scripts**: Re-running must produce the exact same database state.

## Checklist before finishing
- [ ] 4 demo users created with password `Demo@1234`.
- [ ] Group created with invite code `DEMO1234`.
- [ ] SIH 2026 hackathon includes all registration URLs.
- [ ] Script is strictly idempotent.
- [ ] Verification script passes.

## Example: Idempotent Seed Snippet
```javascript
// src/seed/seed.js
export async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot seed database in production mode!');
  }

  // Clear demo group and users idempotently
  await User.deleteMany({ email: { $in: ['alex@demo.com', 'sam@demo.com', 'priya@demo.com', 'rahul@demo.com'] } });
  await Group.deleteMany({ inviteCode: 'DEMO1234' });

  const group = await Group.create({ name: 'Team Alpha', inviteCode: 'DEMO1234' });
  const passwordHash = await bcrypt.hash('Demo@1234', 12);
  // Create users and link to group...
}
```
