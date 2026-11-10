# 03 – Auth & Group Flows (WEB)

## Login / Signup pages
Centered card (max 400px), logo, fields with labels, show/hide password, inline errors from zod + server `details`. Signup: name, email, password (min 8, strength hint), confirm password. After success → `/` (or `/onboarding` if no group; or auto-join if a pending invite code is stored). Link between pages. Footer: theme toggle.

## Onboarding (`/onboarding`)
Two big option cards: **Create a group** (name input → POST /groups → show invite panel immediately) and **Join with a code** (8-char input, auto-uppercase, paste friendly; on blur call preview endpoint and show "Join *Team Alpha* (3/5 members)").

## `/join/:code`
Calls preview (public). Shows group name, member count, big "Join group" button. Not logged in → store code, show Login/Signup buttons. Errors: `INVITE_INVALID` → friendly "This invite link is no longer valid, ask the owner for a new one"; `GROUP_FULL` → "This group is full".

## Group page (`/group`)
- Members list (avatar, name, role badge, joined date, "You"). Owner sees "Remove" per member (ConfirmDialog).
- **Invite panel (owner only):** shows code in monospace, buttons: Copy code, Copy link (`{origin}/join/{code}`), Share (Web Share API when available), Regenerate (ConfirmDialog warning old link stops working). Display slots: "3 of 5 members".
- Rename group (owner), Leave group (members), Delete group (owner, typed confirmation), Transfer ownership.
- Realtime: members joining/leaving update list live (`group:member-joined/left`).

## Auth store behaviours
`login/signup` set tokens; `logout` calls API, unregisters FCM token, clears Query cache, disconnects socket, navigates to /login. Handle multi-tab logout via `storage` event.
