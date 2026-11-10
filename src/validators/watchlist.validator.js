import { z } from 'zod';

export const pinEventSchema = z
  .object({
    visibility: z.enum(['group', 'private']).default('group'),
  })
  .strict();

export const myStatusSchema = z
  .object({
    status: z.enum(['interested', 'planning', 'registered', 'not_interested']),
  })
  .strict();

export const watchlistQuerySchema = z
  .object({
    scope: z.enum(['all', 'mine', 'group']).default('all'),
    status: z.enum(['interested', 'planning', 'registered', 'not_interested']).optional(),
    sort: z.enum(['registrationClosesAt', 'startAt', 'pinnedAt']).default('registrationClosesAt'),
  })
  .strict();

