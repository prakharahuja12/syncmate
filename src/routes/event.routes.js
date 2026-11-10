import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import * as reminderController from '../controllers/reminder.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { updateEventSchema } from '../validators/event.validator.js';
import { putRemindersSchema } from '../validators/reminder.validator.js';

const router = Router();

router.use(authenticate);

router.get('/:id', asyncHandler(eventController.getEventById));
router.patch('/:id', validate(updateEventSchema), asyncHandler(eventController.updateEvent));
router.delete('/:id', asyncHandler(eventController.deleteEvent));
router.post('/:id/complete', asyncHandler(eventController.completeEvent));
router.post('/:id/uncomplete', asyncHandler(eventController.uncompleteEvent));

// Reminders
router.get('/:id/reminders', asyncHandler(reminderController.getReminders));
router.put('/:id/reminders', validate(putRemindersSchema), asyncHandler(reminderController.setReminders));

export default router;
