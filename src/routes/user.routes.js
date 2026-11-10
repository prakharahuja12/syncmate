import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  updateProfileSchema,
  addPushTokenSchema,
  removePushTokenSchema,
} from '../validators/user.validator.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.patch('/me', validate(updateProfileSchema), asyncHandler(userController.updateProfile));
router.post(
  '/me/push-tokens',
  validate(addPushTokenSchema),
  asyncHandler(userController.addPushToken)
);
router.delete(
  '/me/push-tokens',
  validate(removePushTokenSchema),
  asyncHandler(userController.removePushToken)
);

export default router;
