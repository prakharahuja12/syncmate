/**
 * templates/endpoint.template.js
 * Reference structure for adding a new SyncMate REST endpoint.
 */

// 1. Validator: src/validators/<module>.validator.js
import { z } from 'zod';

export const actionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  priority: z.enum(['high', 'medium', 'low']).default('medium')
}).strict(); // Strip unknown keys

// 2. Route: src/routes/<module>.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireGroup } from '../middleware/groupAccess.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as controller from '../controllers/<module>.controller.js';

const router = Router();
router.use(authenticate, requireGroup);

router.post(
  '/:id/action',
  validate(actionSchema),
  asyncHandler(controller.handleAction)
);

export default router;

// 3. Controller: src/controllers/<module>.controller.js
import * as service from '../services/<module>.service.js';
import { sendSuccess } from '../utils/response.js';
import { serializeResource } from '../utils/serializers.js';

export async function handleAction(req, res) {
  const result = await service.executeAction({
    resourceId: req.params.id,
    groupId: req.groupId,
    userId: req.user.id,
    data: req.body
  });
  return sendSuccess(res, serializeResource(result, req.user.id), 200);
}

// 4. Service: src/services/<module>.service.js
import { ApiError } from '../utils/ApiError.js';
import { eventBus } from '../utils/eventBus.js';

export async function executeAction({ resourceId, groupId, userId, data }) {
  // Authorization check: resource belongs to caller's group
  // Business logic mutations
  // Persist to DB
  // Emit domain event for decoupling
  eventBus.emit('domain.<entity>.<action>', { resourceId, groupId, userId });
  return {};
}
