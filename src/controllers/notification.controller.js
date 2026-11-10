import { asyncHandler } from '../middleware/asyncHandler.js';
import { successResponse } from '../utils/response.js';
import * as notificationService from '../services/notification.service.js';

/**
 * GET /api/v1/notifications
 * Lists paginated notifications for the authenticated user.
 */
export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.listNotifications(req.user._id, req.query);
  return successResponse(res, result.notifications, 200, result.meta);
});

/**
 * GET /api/v1/notifications/unread-count
 * Returns unread notifications count for the authenticated user.
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user._id);
  return successResponse(res, result, 200);
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a single notification as read.
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAsRead(req.params.id, req.user._id);
  return successResponse(res, result, 200);
});

/**
 * POST /api/v1/notifications/read-all
 * Marks all notifications for the authenticated user as read.
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user._id);
  return successResponse(res, result, 200);
});
