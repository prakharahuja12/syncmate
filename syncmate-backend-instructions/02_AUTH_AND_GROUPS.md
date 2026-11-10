# 02 – Authentication & Groups

## Auth
- Signup: validate, lowercase email, reject duplicate (409 CONFLICT), bcrypt cost 12, assign random `avatarColor` from a palette of 10 pleasant colours. Return user + tokens.
- Login: constant-time compare; generic message "Invalid email or password".
- Access JWT payload: `{sub: userId, gid: groupId|null}`. Because `gid` can change (join/leave), the `auth` middleware ALWAYS reloads the user from DB (select minimal fields) and sets `req.user`, `req.groupId`.
- Refresh tokens: random 64-byte string, store **SHA-256 hash** in `refreshtokens`. On refresh: verify, revoke old, issue new (rotation). If a revoked token is reused → revoke all tokens of that user (theft detection).
- Logout: revoke provided refresh token and remove the push token if supplied.
- `GET /auth/me` returns `{user, group}` where group includes members (id, name, avatarColor, role, joinedAt) and `inviteCode` ONLY for owner.
- Middleware `requireGroup` → 403 if user has no group. Middleware `requireOwner`.

## Push tokens
`POST /users/me/push-tokens` upserts into `user.pushTokens` (unique by token; remove same token from other users first — device switched accounts). Cap 10 tokens per user (drop oldest).

## Groups
- One user belongs to one group in v1 (`user.groupId`). Creating/joining while already in a group → 409.
- Create: generate `inviteCode` via nanoid custom alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` length 8; retry on collision.
- Preview (PUBLIC): returns only `groupName, memberCount, maxMembers` (no member info). Rate-limit.
- Join: case-insensitive code; reject if full (`GROUP_FULL`), already member, or invalid (`INVITE_INVALID`). On success: push member, set `user.groupId`, emit `domain.member.joined` → activity + notification to others + socket `group:member-joined`.
- Regenerate code: owner only; invalidates previous.
- Remove member / leave: delete the member's `pins`, `participations`, `reminders` for the group; keep their events but keep `createdBy` (frontend shows "Former member" if user missing from members). Emit `group:member-left`. Owner cannot leave while other members exist (must delete group or transfer – implement `POST /groups/:gid/transfer-owner {userId}` as an extra).
- Delete group: cascade delete everything for that group; set `groupId=null` for members; emit socket `group:deleted`.
- Use MongoDB transactions only if replica set is available; otherwise order operations safely and make them idempotent.
