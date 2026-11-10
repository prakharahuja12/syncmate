/**
 * templates/listener.template.js
 * Standard pattern for domain event listeners in SyncMate.
 */

// src/listeners/<module>.listener.js
import { eventBus } from '../utils/eventBus.js';
import { logger } from '../config/logger.js';

export function registerListeners() {
  eventBus.on('domain.<entity>.<action>', async (payload) => {
    try {
      // 1. Validate payload
      const { entityId, groupId, actorId } = payload;

      // 2. Perform decoupled side-effect (safe async execution)
      // e.g. Activity logging, Notification dispatch, Socket broadcast, Google Sync enqueue

    } catch (err) {
      // Never crash the eventBus or parent request
      logger.error({ err, payload }, 'Failed to process domain.<entity>.<action>');
    }
  });
}

