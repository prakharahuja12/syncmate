import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { emitToUser } from '../realtime/socket.js';
import { sendPushToUser } from './push.service.js';
import { sendEmailToUser } from './email.service.js';
import { logger } from '../config/logger.js';

/**
 * Formats a Notification document matching API_CONTRACT.md:
 * { id, type, title, body, data: { eventId, groupId, deepLink }, actor: { id, name }|null, readAt, createdAt }
 */
export const formatNotification = (notification) => {
  if (!notification) return null;
  const raw = notification.toObject ? notification.toObject() : notification;

  const actorDoc = raw.actorId && typeof raw.actorId === 'object' ? raw.actorId : null;
  const actor = actorDoc
    ? {
        id: actorDoc._id?.toString() || actorDoc.id,
        name: actorDoc.name || '',
      }
    : null;

  return {
    id: raw._id ? raw._id.toString() : raw.id,
    type: raw.type,
    title: raw.title,
    body: raw.body,
    data: {
      eventId: raw.data?.eventId ? raw.data.eventId.toString() : null,
      groupId: raw.data?.groupId ? raw.data.groupId.toString() : null,
      deepLink: raw.data?.deepLink || null,
    },
    actor,
    readAt: raw.readAt ? new Date(raw.readAt).toISOString() : null,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  };
};

/**
 * Dispatches notifications to multiple users across in-app, socket, and push channels.
 *
 * @param {object} params
 * @param {Array<string>} params.userIds
 * @param {string} params.groupId
 * @param {string|null} [params.actorId]
 * @param {string} params.type
 * @param {string} params.title
 * @param {string} params.body
 * @param {object} [params.data]
 * @returns {Promise<Array<object>>}
 */
export const notifyUsers = async ({
  userIds = [],
  groupId,
  actorId = null,
  type,
  title,
  body,
  data = {},
}) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  // De-duplicate & exclude actor unless type is reminder
  const actorStr = actorId ? actorId.toString() : null;
  const isSelfNotifyType = type === 'reminder' || type === 'registration_deadline';

  const uniqueRecipients = [
    ...new Set(
      userIds
        .map((id) => (id._id ? id._id.toString() : id.toString()))
        .filter((id) => isSelfNotifyType || id !== actorStr)
    ),
  ];

  if (uniqueRecipients.length === 0) {
    return [];
  }

  const notificationDocs = uniqueRecipients.map((uid) => ({
    userId: uid,
    groupId,
    actorId: actorId || null,
    type,
    title,
    body,
    data: {
      eventId: data?.eventId || null,
      groupId: groupId || null,
      deepLink: data?.deepLink || (data?.eventId ? `/event/${data.eventId}` : null),
    },
    readAt: null,
    channels: { push: 'skipped', email: 'skipped' },
  }));

  let createdNotifications = [];
  try {
    createdNotifications = await Notification.insertMany(notificationDocs);
  } catch (err) {
    logger.error({ err }, 'Failed to insert notification documents');
    return [];
  }

  // Populate actor for serialization
  const populated = await Notification.find({
    _id: { $in: createdNotifications.map((n) => n._id) },
  }).populate('actorId', 'name avatarColor');

  // Load recipient users for push and email preferences
  const recipientUsers = await User.find({ _id: { $in: uniqueRecipients } });
  const userMap = new Map(recipientUsers.map((u) => [u._id.toString(), u]));

  // Dispatch via Socket.IO, Push, and Email (non-blocking, never throws)
  for (const notif of populated) {
    try {
      const formatted = formatNotification(notif);
      emitToUser(notif.userId.toString(), 'notification:new', formatted);

      const targetUser = userMap.get(notif.userId.toString());
      if (targetUser) {
        Promise.allSettled([
          sendPushToUser({
            user: targetUser,
            title,
            body,
            data: {
              notificationId: notif._id,
              type,
              eventId: data?.eventId,
              deepLink: notif.data?.deepLink,
            },
          }).then(async (pushStatus) => {
            if (pushStatus && pushStatus !== 'skipped') {
              await Notification.findByIdAndUpdate(notif._id, { 'channels.push': pushStatus });
            }
          }),
          sendEmailToUser({
            user: targetUser,
            title,
            body,
            data: {
              eventId: data?.eventId,
              deepLink: notif.data?.deepLink,
            },
          }).then(async (emailStatus) => {
            if (emailStatus && emailStatus !== 'skipped') {
              await Notification.findByIdAndUpdate(notif._id, { 'channels.email': emailStatus });
            }
          }),
        ]).catch(() => {});
      }
    } catch (err) {
      logger.error({ err, notifId: notif._id }, 'Error dispatching notification');
    }
  }

  return populated.map(formatNotification);
};

/**
 * Lists paginated notifications for the authenticated user.
 */
export const listNotifications = async (userId, { unread, page = 1, limit = 20 } = {}) => {
  const filter = { userId };

  if (unread === 'true' || unread === true) {
    filter.readAt = null;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [docs, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('actorId', 'name avatarColor'),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications: docs.map(formatNotification),
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
    },
  };
};

/**
 * Returns count of unread notifications for a user.
 */
export const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ userId, readAt: null });
  return { unreadCount: count };
};

/**
 * Marks a single notification as read.
 */
export const markAsRead = async (notificationId, userId) => {
  const notif = await Notification.findOne({ _id: notificationId, userId }).populate(
    'actorId',
    'name avatarColor'
  );

  if (!notif) {
    throw ApiError.notFound('Notification not found');
  }

  notif.readAt = new Date();
  await notif.save();

  return formatNotification(notif);
};

/**
 * Marks all notifications for a user as read.
 */
export const markAllAsRead = async (userId) => {
  await Notification.updateMany({ userId, readAt: null }, { readAt: new Date() });
  return { message: 'All notifications marked as read' };
};
