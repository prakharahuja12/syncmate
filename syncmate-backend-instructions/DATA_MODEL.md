# SyncMate – DATA MODEL (MongoDB / Mongoose)

All collections: `timestamps: true`. `_id` ObjectId exposed as `id` via toJSON transform. Add indexes exactly as listed.

## users
`name, email(unique, lowercase), passwordHash, avatarColor, timezone('Asia/Kolkata' default), settings{theme:'system|light|dark', emailNotifications:false, pushNotifications:true, inAppNotifications:true}, groupId(active Group ref, indexed), groupIds([Group ref], indexed), pushTokens[{token,platform,deviceId,lastSeenAt}], google{connected,email,refreshTokenEnc,calendarId:'primary',syncPreferences{mode:'all',categories[],priorities[],includeRegistrationDeadlines:false},lastSyncAt}`

## refreshtokens
`userId, tokenHash, deviceId, expiresAt (TTL index), revokedAt, replacedBy`

## groups
`name, ownerId, members[{userId, role:'owner|member', joinedAt}], inviteCode(unique), inviteRegeneratedAt, maxMembers:5`
Index: `inviteCode`, `members.userId`.

## events
`groupId, kind, title, description, category, priority, startAt, endAt, allDay, url, assignedToAll(true), assignedTo[userId], status('pending'), completedAt, completedBy, createdBy, updatedBy, hackathon{...see contract}`
Indexes: `{groupId:1,startAt:1}`, `{groupId:1,status:1,priority:1}`, `{groupId:1,'hackathon.registrationClosesAt':1}`, text index on `title,description,hackathon.name`.
Validation: `endAt >= startAt`; `url` and hackathon URLs must be http(s); if category=hackathon then `hackathon.name` required; `registrationClosesAt >= registrationOpensAt`.

## pins  (watchlist)
`groupId, eventId, userId, visibility:'group|private', pinnedAt`. Unique `{eventId,userId}`.

## participations
`groupId, eventId, userId, status:'interested|planning|registered|not_interested', updatedAt`. Unique `{eventId,userId}`.

## reminders
`groupId, eventId, userId, anchor:'start|registrationClose', offsetMinutes, customAt, fireAt(indexed), status:'pending|sent|cancelled', sentAt, attempts`
Index `{status:1, fireAt:1}`. `fireAt` is recomputed whenever the event time or hackathon dates change.

## notifications
`userId, groupId, actorId, type, title, body, data{eventId,deepLink}, readAt, channels{push:'sent|failed|skipped',email:'sent|failed|skipped'}`
Index `{userId:1, readAt:1, createdAt:-1}`. TTL: delete after 90 days.

## activities
`groupId, actorId, action('event.created|event.updated|event.deleted|event.completed|pin.added|pin.removed|status.changed|member.joined|member.left'), eventId, summary, createdAt`. Index `{groupId:1, createdAt:-1}`.

## googlesyncs
`userId, eventId, googleEventId, calendarId, kind:'event|registrationDeadline', contentHash, lastSyncedAt`. Unique `{userId,eventId,kind}`. This table is what prevents duplicates.
