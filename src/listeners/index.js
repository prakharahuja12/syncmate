import { registerActivityListener } from './activity.listener.js';
import { registerNotificationListener } from './notification.listener.js';
import { registerSocketListener } from './socket.listener.js';
import { logger } from '../config/logger.js';

let listenersRegistered = false;

export const registerAllListeners = () => {
  if (listenersRegistered) return;

  registerActivityListener();
  registerNotificationListener();
  registerSocketListener();
  listenersRegistered = true;
  logger.info('Domain event listeners registered');
};
