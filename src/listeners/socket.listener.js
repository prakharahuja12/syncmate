import { eventBus } from '../utils/eventBus.js';
import { emitToGroup } from '../realtime/socket.js';
import { serializeEvent } from '../utils/serializers.js';
import { logger } from '../config/logger.js';

export const registerSocketListener = () => {
  eventBus.on('domain.event.created', ({ event, groupId }) => {
    try {
      const payload = serializeEvent(event);
      emitToGroup(groupId, 'event:created', payload);
    } catch (err) {
      logger.error({ err }, 'Error emitting socket event:created');
    }
  });

  eventBus.on('domain.event.updated', ({ event }) => {
    try {
      const payload = serializeEvent(event);
      emitToGroup(event.groupId.toString(), 'event:updated', payload);
    } catch (err) {
      logger.error({ err }, 'Error emitting socket event:updated');
    }
  });

  eventBus.on('domain.event.completed', ({ event }) => {
    try {
      const payload = serializeEvent(event);
      emitToGroup(event.groupId.toString(), 'event:completed', payload);
    } catch (err) {
      logger.error({ err }, 'Error emitting socket event:completed');
    }
  });

  eventBus.on('domain.event.deleted', ({ eventId, groupId }) => {
    try {
      emitToGroup(groupId.toString(), 'event:deleted', { id: eventId.toString() });
    } catch (err) {
      logger.error({ err }, 'Error emitting socket event:deleted');
    }
  });

  eventBus.on('domain.member.joined', ({ groupId, user }) => {
    try {
      emitToGroup(groupId.toString(), 'group:member-joined', {
        user: {
          id: user._id.toString(),
          name: user.name,
          avatarColor: user.avatarColor,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error emitting socket group:member-joined');
    }
  });

  eventBus.on('domain.member.left', ({ groupId, userId }) => {
    try {
      emitToGroup(groupId.toString(), 'group:member-left', {
        userId: userId.toString(),
      });
    } catch (err) {
      logger.error({ err }, 'Error emitting socket group:member-left');
    }
  });

  eventBus.on('group:deleted', ({ groupId }) => {
    try {
      emitToGroup(groupId.toString(), 'group:deleted', {});
    } catch (err) {
      logger.error({ err }, 'Error emitting socket group:deleted');
    }
  });

  eventBus.on('pin:changed', ({ groupId, eventId, pinSummary }) => {
    try {
      emitToGroup(groupId.toString(), 'pin:changed', { eventId, pinSummary });
    } catch (err) {
      logger.error({ err }, 'Error emitting socket pin:changed');
    }
  });

  eventBus.on('status:changed', ({ groupId, eventId, participation }) => {
    try {
      emitToGroup(groupId.toString(), 'status:changed', { eventId, participation });
    } catch (err) {
      logger.error({ err }, 'Error emitting socket status:changed');
    }
  });
};
