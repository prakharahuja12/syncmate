import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  unread: z.string().optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a positive integer').optional(),
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid notification ID format'),
});
