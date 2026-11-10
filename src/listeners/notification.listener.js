import { eventBus } from '../utils/eventBus.js';
import { Group } from '../models/Group.js';
import { notifyUsers } from '../services/notification.service.js';
import { logger } from '../config/logger.js';

export const registerNotificationListener = () => {
  eventBus.on('domain.event.created', async ({ event, user }) => {
    try {
      const group = await Group.findById(event.groupId);
      if (!group) return;

      const actorId = user._id.toString();
      const actorName = user.name || 'Someone';

      let targetUserIds = [];
      if (event.assignedToAll) {
        targetUserIds = group.members.map((m) => m.userId.toString());
      } else if (Array.isArray(event.assignedTo) && event.assignedTo.length > 0) {
        targetUserIds = event.assignedTo.map((id) => (id._id ? id._id.toString() : id.toString()));
      }

      const formattedDate = new Date(event.startAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      await notifyUsers({
        userIds: targetUserIds,
        groupId: event.groupId.toString(),
        actorId,
        type: 'event_created',
        title: `New event: ${event.title}`,
        body: `${actorName} added it for ${formattedDate}`,
        data: {
          eventId: event._id.toString(),
          deepLink: `/event/${event._id}`,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error in notification listener on domain.event.created');
    }
  });

  eventBus.on('domain.event.updated', async ({ event, user, diffFields = [] }) => {
    try {
      const group = await Group.findById(event.groupId);
      if (!group) return;

      const actorId = user._id.toString();
      const actorName = user.name || 'Someone';
      const targetUserIds = group.members.map((m) => m.userId.toString());
      const fieldsText = diffFields.length > 0 ? ` (${diffFields.join(', ')})` : '';

      await notifyUsers({
        userIds: targetUserIds,
        groupId: event.groupId.toString(),
        actorId,
        type: 'event_updated',
        title: `Event updated: ${event.title}`,
        body: `${actorName} updated ${event.title}${fieldsText}`,
        data: {
          eventId: event._id.toString(),
          deepLink: `/event/${event._id}`,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error in notification listener on domain.event.updated');
    }
  });

  eventBus.on('domain.event.completed', async ({ event, user }) => {
    try {
      const group = await Group.findById(event.groupId);
      if (!group) return;

      const actorId = user._id.toString();
      const actorName = user.name || 'Someone';
      const targetUserIds = group.members.map((m) => m.userId.toString());

      await notifyUsers({
        userIds: targetUserIds,
        groupId: event.groupId.toString(),
        actorId,
        type: 'event_completed',
        title: `Event completed: ${event.title}`,
        body: `${actorName} completed ${event.title}`,
        data: {
          eventId: event._id.toString(),
          deepLink: `/event/${event._id}`,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error in notification listener on domain.event.completed');
    }
  });

  eventBus.on('domain.event.deleted', async ({ eventId, title, groupId, actorId, actorName = 'Someone' }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return;

      const targetUserIds = group.members.map((m) => m.userId.toString());

      await notifyUsers({
        userIds: targetUserIds,
        groupId: groupId.toString(),
        actorId: actorId ? actorId.toString() : null,
        type: 'event_deleted',
        title: `Event deleted: ${title}`,
        body: `${actorName} deleted ${title}`,
        data: {
          eventId: eventId ? eventId.toString() : null,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error in notification listener on domain.event.deleted');
    }
  });

  eventBus.on('domain.member.joined', async ({ groupId, user, actorId }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return;

      const targetUserIds = group.members.map((m) => m.userId.toString());

      await notifyUsers({
        userIds: targetUserIds,
        groupId: groupId.toString(),
        actorId: actorId ? actorId.toString() : user._id.toString(),
        type: 'member_joined',
        title: 'New member joined',
        body: `${user.name} joined the group`,
        data: { groupId: groupId.toString() },
      });
    } catch (err) {
      logger.error({ err }, 'Error in notification listener on domain.member.joined');
    }
  });

  eventBus.on('domain.member.left', async ({ groupId, userId, actorId, memberName = 'A member' }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return;

      const targetUserIds = group.members.map((m) => m.userId.toString());

      await notifyUsers({
        userIds: targetUserIds,
        groupId: groupId.toString(),
        actorId: actorId ? actorId.toString() : userId.toString(),
        type: 'member_left',
        title: 'Member left group',
        body: `${memberName} has left the group`,
        data: { groupId: groupId.toString() },
      });
    } catch (err) {
      logger.error({ err }, 'Error in notification listener on domain.member.left');
    }
  });

  eventBus.on('domain.pin.added', async ({ event, pin, user, groupId }) => {
    try {
      if (pin && pin.visibility === 'private') {
        return; // Exclude private pins from notifications
      }

      const group = await Group.findById(groupId);
      if (!group) return;

      const actorId = user._id.toString();
      const actorName = user.name || 'Someone';
      const targetUserIds = group.members.map((m) => m.userId.toString());

      await notifyUsers({
        userIds: targetUserIds,
        groupId: groupId.toString(),
        actorId,
        type: 'pin_added',
        title: 'Event pinned',
        body: `${actorName} pinned ${event.title}`,
        data: {
          eventId: event._id.toString(),
          deepLink: `/event/${event._id}`,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error in notification listener on domain.pin.added');
    }
  });

  eventBus.on('domain.status.registered', async ({ event, user, groupId }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return;

      const actorId = user._id.toString();
      const actorName = user.name || 'Someone';
      const targetUserIds = group.members.map((m) => m.userId.toString());

      await notifyUsers({
        userIds: targetUserIds,
        groupId: groupId.toString(),
        actorId,
        type: 'status_changed',
        title: 'Member registered',
        body: `${actorName} registered for ${event.title} ✅`,
        data: {
          eventId: event._id.toString(),
          deepLink: `/event/${event._id}`,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error in notification listener on domain.status.registered');
    }
  });
};
