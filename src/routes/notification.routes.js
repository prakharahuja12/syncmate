import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../validators/notification.validator.js';
import * as notificationController from '../controllers/notification.controller.js';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

router.get(
  '/',
  validate(listNotificationsQuerySchema, 'query'),
  notificationController.listNotifications
);

router.get('/unread-count', notificationController.getUnreadCount);

router.patch(
  '/:id/read',
  validate(notificationIdParamSchema, 'params'),
  notificationController.markAsRead
);

router.post('/read-all', notificationController.markAllAsRead);

export default router;
