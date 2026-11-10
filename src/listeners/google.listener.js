import { eventBus } from '../utils/eventBus.js';
import { User } from '../models/User.js';
import {
  syncEventForUser,
  removeGoogleEvent,
} from '../services/googleCalendar.service.js';
import { logger } from '../config/logger.js';

export const registerGoogleListener = () => {
  eventBus.on('domain.event.created', async ({ event, groupId }) => {
    try {
      const users = await User.find({
        groupId,
        'google.connected': true,
      });

      for (const user of users) {
        try {
          await syncEventForUser(user, event, 'event');
          if (
            user.google.syncPreferences?.includeRegistrationDeadlines &&
            event.hackathon?.registrationClosesAt
          ) {
            await syncEventForUser(user, event, 'registrationDeadline');
          }
        } catch (err) {
          logger.error({ err, userId: user._id, eventId: event._id }, 'Failed to sync event creation to Google');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error in google.listener on domain.event.created');
    }
  });

  eventBus.on('domain.event.updated', async ({ event }) => {
    try {
      const users = await User.find({
        groupId: event.groupId,
        'google.connected': true,
      });

      for (const user of users) {
        try {
          await syncEventForUser(user, event, 'event');
          if (
            user.google.syncPreferences?.includeRegistrationDeadlines &&
            event.hackathon?.registrationClosesAt
          ) {
            await syncEventForUser(user, event, 'registrationDeadline');
          }
        } catch (err) {
          logger.error({ err, userId: user._id, eventId: event._id }, 'Failed to sync event update to Google');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error in google.listener on domain.event.updated');
    }
  });

  eventBus.on('domain.event.completed', async ({ event }) => {
    try {
      const users = await User.find({
        groupId: event.groupId,
        'google.connected': true,
      });

      for (const user of users) {
        try {
          await syncEventForUser(user, event, 'event');
        } catch (err) {
          logger.error({ err, userId: user._id, eventId: event._id }, 'Failed to sync event completion to Google');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error in google.listener on domain.event.completed');
    }
  });

  eventBus.on('domain.event.deleted', async ({ eventId, groupId }) => {
    try {
      const users = await User.find({
        groupId,
        'google.connected': true,
      });

      for (const user of users) {
        try {
          await removeGoogleEvent(user, eventId, 'event');
          await removeGoogleEvent(user, eventId, 'registrationDeadline');
        } catch (err) {
          logger.error({ err, userId: user._id, eventId }, 'Failed to remove event from Google');
        }
      }
    } catch (err) {
      logger.error({ err }, 'Error in google.listener on domain.event.deleted');
    }
  });
};
