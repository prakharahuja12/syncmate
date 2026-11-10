import * as reminderService from '../services/reminder.service.js';
import { successResponse } from '../utils/response.js';

export async function getReminders(req, res) {
  const reminders = await reminderService.getRemindersForEvent({
    eventId: req.params.id,
    userId: req.user._id,
    groupId: req.user.groupId,
  });

  return successResponse(res, reminders);
}

export async function setReminders(req, res) {
  const reminders = await reminderService.setRemindersForEvent({
    eventId: req.params.id,
    userId: req.user._id,
    groupId: req.user.groupId,
    remindersInput: req.body.reminders,
  });

  return successResponse(res, reminders);
}
