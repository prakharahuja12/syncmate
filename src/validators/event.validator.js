import { z } from 'zod';

const httpUrlRegex = /^https?:\/\/.+/i;

const hackathonBlockSchema = z
  .object({
    name: z.string().trim().min(1, 'Hackathon name is required').optional(),
    registrationUrl: z
      .string()
      .trim()
      .regex(httpUrlRegex, 'Must be a valid HTTP or HTTPS URL')
      .nullable()
      .optional(),
    officialUrl: z
      .string()
      .trim()
      .regex(httpUrlRegex, 'Must be a valid HTTP or HTTPS URL')
      .nullable()
      .optional(),
    problemStatementUrl: z
      .string()
      .trim()
      .regex(httpUrlRegex, 'Must be a valid HTTP or HTTPS URL')
      .nullable()
      .optional(),
    registrationOpensAt: z.string().datetime().nullable().optional(),
    registrationClosesAt: z.string().datetime().nullable().optional(),
    prizePool: z.string().trim().nullable().optional(),
    location: z.string().trim().nullable().optional(),
    mode: z.enum(['online', 'offline', 'hybrid']).optional(),
    details: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.registrationOpensAt && data.registrationClosesAt) {
        return new Date(data.registrationClosesAt) >= new Date(data.registrationOpensAt);
      }
      return true;
    },
    {
      message: 'registrationClosesAt must be greater than or equal to registrationOpensAt',
      path: ['registrationClosesAt'],
    }
  );

const reminderInputSchema = z.object({
  anchor: z.enum(['start', 'registrationClose']),
  offsetMinutes: z.number().int().positive().optional(),
  customAt: z.string().datetime().optional(),
});

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
    description: z.string().trim().max(5000, 'Description cannot exceed 5000 characters').optional().default(''),
    category: z.enum(['hackathon', 'college', 'personal', 'meeting', 'competition', 'other']),
    priority: z.enum(['high', 'medium', 'low']).optional().default('medium'),
    kind: z.enum(['event', 'task', 'deadline']).optional().default('event'),
    startAt: z.string().datetime({ message: 'startAt must be a valid ISO datetime string' }),
    endAt: z.string().datetime({ message: 'endAt must be a valid ISO datetime string' }),
    allDay: z.boolean().optional().default(false),
    url: z.string().trim().regex(httpUrlRegex, 'Must be a valid HTTP or HTTPS URL').nullable().optional(),
    assignedToAll: z.boolean().optional().default(true),
    assignedTo: z.array(z.string().trim()).optional().default([]),
    hackathon: hackathonBlockSchema.nullable().optional(),
    reminders: z.array(reminderInputSchema).optional().default([]),
  })
  .refine(
    (data) => new Date(data.endAt) >= new Date(data.startAt),
    {
      message: 'endAt must be greater than or equal to startAt',
      path: ['endAt'],
    }
  )
  .refine(
    (data) => {
      if (data.category === 'hackathon') {
        return data.hackathon && Boolean(data.hackathon.name);
      }
      return true;
    },
    {
      message: 'hackathon.name is required when category is hackathon',
      path: ['hackathon', 'name'],
    }
  )
  .refine(
    (data) => {
      if (!data.assignedToAll) {
        return Array.isArray(data.assignedTo) && data.assignedTo.length > 0;
      }
      return true;
    },
    {
      message: 'assignedTo must contain at least one member when assignedToAll is false',
      path: ['assignedTo'],
    }
  );

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(5000).optional(),
    category: z.enum(['hackathon', 'college', 'personal', 'meeting', 'competition', 'other']).optional(),
    priority: z.enum(['high', 'medium', 'low']).optional(),
    kind: z.enum(['event', 'task', 'deadline']).optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    allDay: z.boolean().optional(),
    url: z.string().trim().regex(httpUrlRegex, 'Must be a valid HTTP or HTTPS URL').nullable().optional(),
    assignedToAll: z.boolean().optional(),
    assignedTo: z.array(z.string().trim()).optional(),
    hackathon: hackathonBlockSchema.nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startAt && data.endAt) {
        return new Date(data.endAt) >= new Date(data.startAt);
      }
      return true;
    },
    {
      message: 'endAt must be greater than or equal to startAt',
      path: ['endAt'],
    }
  );

export const listEventsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  category: z.enum(['hackathon', 'college', 'personal', 'meeting', 'competition', 'other']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'completed']).optional(),
  assignee: z.string().trim().optional(),
  q: z.string().trim().optional(),
  sort: z.enum(['startAt', 'priority', 'createdAt']).optional().default('startAt'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(500).optional().default(50),
});
