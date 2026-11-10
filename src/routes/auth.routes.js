import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import {
  signupSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Apply stricter rate limiter to auth routes
router.use(authRateLimiter);

router.post('/signup', validate(signupSchema), asyncHandler(authController.signup));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', validate(refreshSchema), asyncHandler(authController.refresh));
router.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  asyncHandler(authController.logout)
);
router.get('/me', authenticate, asyncHandler(authController.getMe));

export default router;
