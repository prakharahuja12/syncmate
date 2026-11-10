import { z } from 'zod';

export const authUrlQuerySchema = z
  .object({
    platform: z.enum(['web', 'mobile']).default('web'),
  })
  .strict();

export const updateGooglePreferencesSchema = z
  .object({
    mode: z.enum(['all', 'categories', 'assigned_to_me', 'none']).default('all'),
    categories: z.array(z.string().trim()).optional().default([]),
    priorities: z.array(z.string().trim()).optional().default([]),
    includeRegistrationDeadlines: z.boolean().optional().default(false),
  })
  .strict();

export const deleteGoogleIntegrationQuerySchema = z
  .object({
    removeEvents: z
      .union([z.boolean(), z.enum(['true', 'false'])])
      .transform((val) => val === true || val === 'true')
      .default(false),
  })
  .strict();
