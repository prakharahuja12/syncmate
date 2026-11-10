import { Router } from 'express';
import * as googleController from '../controllers/google.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  authUrlQuerySchema,
  updateGooglePreferencesSchema,
  deleteGoogleIntegrationQuerySchema,
} from '../validators/google.validator.js';

const router = Router();

// PUBLIC callback route
router.get('/callback', asyncHandler(googleController.handleCallback));

// Protected routes
router.use(authenticate);

router.get('/auth-url', validate(authUrlQuerySchema, 'query'), asyncHandler(googleController.getAuthUrl));
router.get('/status', asyncHandler(googleController.getStatus));
router.patch('/preferences', validate(updateGooglePreferencesSchema), asyncHandler(googleController.updatePreferences));
router.post('/sync-now', asyncHandler(googleController.syncNow));
router.delete('/', validate(deleteGoogleIntegrationQuerySchema, 'query'), asyncHandler(googleController.disconnect));

export default router;
