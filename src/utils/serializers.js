/**
 * Serializes a User document into the contract-compliant response shape.
 * Strips passwordHash, refreshTokenEnc, pushTokens, and internal mongo fields.
 *
 * @param {object} user
 * @returns {object} Safe user object
 */
export const serializeUser = (user) => {
  if (!user) return null;

  const raw = user.toObject ? user.toObject() : user;

  return {
    id: raw._id ? raw._id.toString() : raw.id,
    name: raw.name,
    email: raw.email,
    avatarColor: raw.avatarColor,
    timezone: raw.timezone || 'Asia/Kolkata',
    settings: {
      theme: raw.settings?.theme || 'system',
      emailNotifications: Boolean(raw.settings?.emailNotifications),
      pushNotifications: raw.settings?.pushNotifications !== false,
      inAppNotifications: raw.settings?.inAppNotifications !== false,
      defaultReminderOffsets: Array.isArray(raw.settings?.defaultReminderOffsets)
        ? raw.settings.defaultReminderOffsets
        : [60],
    },
    groupId: raw.groupId ? raw.groupId.toString() : null,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
  };
};

/**
 * Serializes a Group document into the contract-compliant response shape.
 * Only includes inviteCode for the group owner.
 *
 * @param {object} group
 * @param {string} [currentUserId]
 * @returns {object} Safe group object
 */
export const serializeGroup = (group, currentUserId) => {
  if (!group) return null;

  const raw = group.toObject ? group.toObject() : group;
  const ownerIdStr = raw.ownerId ? raw.ownerId.toString() : '';
  const currentUserIdStr = currentUserId ? currentUserId.toString() : '';
  const isOwner = currentUserIdStr === ownerIdStr;

  const members = Array.isArray(raw.members)
    ? raw.members.map((m) => {
        const u = m.userId && typeof m.userId === 'object' ? m.userId : null;
        const uid = u ? (u._id ? u._id.toString() : u.id) : m.userId ? m.userId.toString() : '';
        return {
          id: uid,
          name: u ? u.name : m.name || '',
          avatarColor: u ? u.avatarColor : m.avatarColor || '',
          role: m.role || 'member',
          joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString() : new Date().toISOString(),
        };
      })
    : [];

  const response = {
    id: raw._id ? raw._id.toString() : raw.id,
    name: raw.name,
    ownerId: ownerIdStr,
    members,
    maxMembers: raw.maxMembers || 5,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
  };

  if (isOwner && raw.inviteCode) {
    response.inviteCode = raw.inviteCode;
  }

  return response;
};
