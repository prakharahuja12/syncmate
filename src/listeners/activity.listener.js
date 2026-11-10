import { eventBus } from '../utils/eventBus.js';
import { Activity } from '../models/Activity.js';
import { logger } from '../config/logger.js';

export const registerActivityListener = () => {
  eventBus.on('domain.event.created', async ({ event, user }) => {
    try {
      const actorName = user?.name || 'Someone';
      await Activity.create({
        groupId: event.groupId,
        actorId: user._id,
        action: 'event.created',
        eventId: event._id,
        summary: `${actorName} added ${event.title}`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record event.created activity');
    }
  });

  eventBus.on('domain.event.updated', async ({ event, user, diffFields = [] }) => {
    try {
      const actorName = user?.name || 'Someone';
      const fieldsText = diffFields.length > 0 ? ` (${diffFields.join(', ')})` : '';
      await Activity.create({
        groupId: event.groupId,
        actorId: user._id,
        action: 'event.updated',
        eventId: event._id,
        summary: `${actorName} updated ${event.title}${fieldsText}`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record event.updated activity');
    }
  });

  eventBus.on('domain.event.completed', async ({ event, user }) => {
    try {
      const actorName = user?.name || 'Someone';
      await Activity.create({
        groupId: event.groupId,
        actorId: user._id,
        action: 'event.completed',
        eventId: event._id,
        summary: `${actorName} completed ${event.title}`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record event.completed activity');
    }
  });

  eventBus.on('domain.event.deleted', async ({ eventId, title, groupId, actorId, actorName = 'Someone' }) => {
    try {
      await Activity.create({
        groupId,
        actorId,
        action: 'event.deleted',
        eventId,
        summary: `${actorName} deleted ${title}`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record event.deleted activity');
    }
  });

  eventBus.on('domain.member.joined', async ({ groupId, user }) => {
    try {
      await Activity.create({
        groupId,
        actorId: user._id,
        action: 'member.joined',
        summary: `${user.name} joined the group`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record member.joined activity');
    }
  });

  eventBus.on('domain.member.left', async ({ groupId, userId, actorId, memberName = 'Member' }) => {
    try {
      await Activity.create({
        groupId,
        actorId: actorId || userId,
        action: 'member.left',
        summary: `${memberName} left the group`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record member.left activity');
    }
  });

  eventBus.on('domain.pin.added', async ({ event, user, groupId }) => {
    try {
      const actorName = user?.name || 'Someone';
      await Activity.create({
        groupId,
        actorId: user._id,
        action: 'pin.added',
        eventId: event._id,
        summary: `${actorName} pinned ${event.title}`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record pin.added activity');
    }
  });

  eventBus.on('domain.pin.removed', async ({ event, user, groupId }) => {
    try {
      const actorName = user?.name || 'Someone';
      await Activity.create({
        groupId,
        actorId: user._id,
        action: 'pin.removed',
        eventId: event._id,
        summary: `${actorName} unpinned ${event.title}`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record pin.removed activity');
    }
  });

  eventBus.on('domain.status.registered', async ({ event, user, groupId }) => {
    try {
      const actorName = user?.name || 'Someone';
      await Activity.create({
        groupId,
        actorId: user._id,
        action: 'status.changed',
        eventId: event._id,
        summary: `${actorName} registered for ${event.title}`,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to record status.changed activity');
    }
  });
};
