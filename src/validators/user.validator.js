import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').max(100).optional(),
  avatarColor: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  settings: z
    .object({
      theme: z.enum(['system', 'light', 'dark']).optional(),
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      inAppNotifications: z.boolean().optional(),
      defaultReminderOffsets: z.array(z.number().int().positive()).optional(),
    })
    .optional(),
});

export const addPushTokenSchema = z.object({
  token: z.string().trim().min(1, 'Token is required'),
  platform: z.enum(['web', 'ios', 'android']),
  deviceId: z.string().trim().min(1, 'Device ID is required'),
});

export const removePushTokenSchema = z.object({
  token: z.string().trim().min(1, 'Token is required'),
});
