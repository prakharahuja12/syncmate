import { Router } from 'express';
import * as groupController from '../controllers/group.controller.js';
import * as eventController from '../controllers/event.controller.js';
import * as watchlistController from '../controllers/watchlist.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { verifyGroupAccess, requireGroupOwner } from '../middleware/groupAccess.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  createGroupSchema,
  joinGroupSchema,
  updateGroupSchema,
  transferOwnerSchema,
} from '../validators/group.validator.js';
import {
  createEventSchema,
  listEventsQuerySchema,
} from '../validators/event.validator.js';
import { watchlistQuerySchema } from '../validators/watchlist.validator.js';

const router = Router();

// PUBLIC preview route
router.get('/invite/:code/preview', asyncHandler(groupController.previewInvite));

// Protected routes
router.use(authenticate);

router.post('/', validate(createGroupSchema), asyncHandler(groupController.createGroup));
router.get('/me', asyncHandler(groupController.getGroupMe));
router.post('/join', validate(joinGroupSchema), asyncHandler(groupController.joinGroup));

// Events scoped by group
router.get(
  '/:gid/events',
  verifyGroupAccess,
  validate(listEventsQuerySchema, 'query'),
  asyncHandler(eventController.listGroupEvents)
);

router.post(
  '/:gid/events',
  verifyGroupAccess,
  validate(createEventSchema),
  asyncHandler(eventController.createEvent)
);

// Watchlist scoped by group
router.get(
  '/:gid/watchlist',
  verifyGroupAccess,
  validate(watchlistQuerySchema, 'query'),
  asyncHandler(watchlistController.getWatchlist)
);

// Group resource routes scoped by :gid
router.patch(
  '/:gid',
  verifyGroupAccess,
  requireGroupOwner,
  validate(updateGroupSchema),
  asyncHandler(groupController.updateGroup)
);

router.post(
  '/:gid/invite/regenerate',
  verifyGroupAccess,
  requireGroupOwner,
  asyncHandler(groupController.regenerateInviteCode)
);

router.delete(
  '/:gid/members/:userId',
  verifyGroupAccess,
  requireGroupOwner,
  asyncHandler(groupController.removeMember)
);

router.post(
  '/:gid/leave',
  verifyGroupAccess,
  asyncHandler(groupController.leaveGroup)
);

router.post(
  '/:gid/transfer-owner',
  verifyGroupAccess,
  requireGroupOwner,
  validate(transferOwnerSchema),
  asyncHandler(groupController.transferOwner)
);

router.delete(
  '/:gid',
  verifyGroupAccess,
  requireGroupOwner,
  asyncHandler(groupController.deleteGroup)
);

export default router;

