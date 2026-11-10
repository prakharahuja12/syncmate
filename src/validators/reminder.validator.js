import { z } from 'zod';

const reminderItemSchema = z
  .object({
    anchor: z.enum(['start', 'registrationClose']),
    offsetMinutes: z.number().int().positive().nullable().optional(),
    customAt: z.string().datetime().nullable().optional(),
  })
  .strict()
  .refine(
    (data) => data.offsetMinutes != null || data.customAt != null,
    {
      message: 'Either offsetMinutes or customAt must be provided',
      path: ['offsetMinutes'],
    }
  );

export const putRemindersSchema = z
  .object({
    reminders: z.array(reminderItemSchema).default([]),
  })
  .strict();
