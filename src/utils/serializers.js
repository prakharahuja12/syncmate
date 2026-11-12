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
    groupIds: Array.from(
      new Set([
        ...(Array.isArray(raw.groupIds) ? raw.groupIds.map((g) => g.toString()) : []),
        ...(raw.groupId ? [raw.groupId.toString()] : []),
      ])
    ),
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

import { computeUrgent } from './priority.js';

/**
 * Serializes an Event document into the contract-compliant response shape.
 *
 * @param {object} event
 * @param {object} [context={}]
 * @param {string} [context.currentUserId]
 * @param {object} [context.pinSummary]
 * @param {Array} [context.participation]
 * @param {string|null} [context.myStatus]
 * @param {Array} [context.myReminders]
 * @param {Array} [context.calendarMarkers]
 * @returns {object} Safe event object
 */
export const serializeEvent = (
  event,
  {
    currentUserId: _currentUserId,
    pinSummary,
    participation,
    myStatus,
    myReminders,
    calendarMarkers,
  } = {}
) => {
  if (!event) return null;

  const raw = event.toObject ? event.toObject() : event;

  const createdByDoc = raw.createdBy && typeof raw.createdBy === 'object' ? raw.createdBy : null;
  const createdBy = {
    id: createdByDoc ? (createdByDoc._id?.toString() || createdByDoc.id) : (raw.createdBy?.toString() || ''),
    name: createdByDoc?.name || '',
    avatarColor: createdByDoc?.avatarColor || '',
  };

  const updatedByDoc = raw.updatedBy && typeof raw.updatedBy === 'object' ? raw.updatedBy : null;
  const updatedBy = {
    id: updatedByDoc ? (updatedByDoc._id?.toString() || updatedByDoc.id) : (raw.updatedBy?.toString() || ''),
    name: updatedByDoc?.name || '',
  };

  // Compute primaryUrl (Addenda 1: hackathon.registrationUrl || hackathon.officialUrl || url)
  const primaryUrl =
    raw.hackathon?.registrationUrl || raw.hackathon?.officialUrl || raw.url || null;

  // Hackathon object (if category is hackathon or competition, or hackathon data exists)
  let hackathon = null;
  if (raw.hackathon && (raw.category === 'hackathon' || raw.category === 'competition' || raw.hackathon.name)) {
    hackathon = {
      name: raw.hackathon.name || '',
      registrationUrl: raw.hackathon.registrationUrl || null,
      officialUrl: raw.hackathon.officialUrl || null,
      problemStatementUrl: raw.hackathon.problemStatementUrl || null,
      registrationOpensAt: raw.hackathon.registrationOpensAt
        ? new Date(raw.hackathon.registrationOpensAt).toISOString()
        : null,
      registrationClosesAt: raw.hackathon.registrationClosesAt
        ? new Date(raw.hackathon.registrationClosesAt).toISOString()
        : null,
      prizePool: raw.hackathon.prizePool || null,
      location: raw.hackathon.location || null,
      mode: raw.hackathon.mode || 'online',
      details: raw.hackathon.details || null,
    };
  }

  const response = {
    id: raw._id ? raw._id.toString() : raw.id,
    groupId: raw.groupId ? raw.groupId.toString() : '',
    kind: raw.kind || 'event',
    title: raw.title,
    description: raw.description || '',
    category: raw.category,
    priority: raw.priority || 'medium',
    startAt: raw.startAt ? new Date(raw.startAt).toISOString() : '',
    endAt: raw.endAt ? new Date(raw.endAt).toISOString() : '',
    allDay: Boolean(raw.allDay),
    url: raw.url || null,
    primaryUrl,
    assignedToAll: raw.assignedToAll !== false,
    assignedTo: Array.isArray(raw.assignedTo)
      ? raw.assignedTo.map((id) => (id._id ? id._id.toString() : id.toString()))
      : [],
    status: raw.status || 'pending',
    completedAt: raw.completedAt ? new Date(raw.completedAt).toISOString() : null,
    completedBy: raw.completedBy ? raw.completedBy.toString() : null,
    createdBy,
    updatedBy,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
    pinSummary: pinSummary || { pinnedBy: [], isPinnedByMe: false },
    participation: participation || [],
    myStatus: myStatus !== undefined ? myStatus : null,
    myReminders: myReminders || [],
    isUrgent: computeUrgent(raw),
  };

  if (hackathon) {
    response.hackathon = hackathon;
  }

  if (calendarMarkers && Array.isArray(calendarMarkers) && calendarMarkers.length > 0) {
    response.calendarMarkers = calendarMarkers;
  }

  return response;
};

/**
 * Serializes an Activity document into the contract-compliant response shape:
 * { id, actor: { id, name, avatarColor } | null, action, eventId, summary, createdAt }
 *
 * @param {object} activity
 * @returns {object} Safe activity object
 */
export const serializeActivity = (activity) => {
  if (!activity) return null;
  const raw = activity.toObject ? activity.toObject() : activity;
  const actorDoc = raw.actorId && typeof raw.actorId === 'object' ? raw.actorId : null;
  const actor = actorDoc
    ? {
        id: actorDoc._id?.toString() || actorDoc.id,
        name: actorDoc.name || '',
        avatarColor: actorDoc.avatarColor || '',
      }
    : null;

  return {
    id: raw._id ? raw._id.toString() : raw.id,
    actor,
    action: raw.action,
    eventId: raw.eventId ? raw.eventId.toString() : null,
    summary: raw.summary,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  };
};
