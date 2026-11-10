import { z } from 'zod';

export const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.enum(['hackathon', 'college', 'personal', 'meeting', 'competition', 'other']),
  priority: z.enum(['high', 'medium', 'low']),
  startAt: z.string().min(1, 'Start date/time is required'),
  endAt: z.string().min(1, 'End date/time is required'),
  allDay: z.boolean().default(false),
  url: z.string().url('Must be a valid URL (http/https)').optional().or(z.literal('')),
  description: z.string().optional(),
  assignedToAll: z.boolean().default(true),
  assignedTo: z.array(z.string()).default([]),
  kind: z.enum(['event', 'task', 'deadline']).default('event'),
  // Hackathon section
  hackathon: z
    .object({
      name: z.string().min(1, 'Hackathon name is required'),
      registrationUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
      officialUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
      problemStatementUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
      registrationOpensAt: z.string().optional().or(z.literal('')),
      registrationClosesAt: z.string().optional().or(z.literal('')),
      prizePool: z.string().optional(),
      location: z.string().optional(),
      mode: z.enum(['online', 'offline', 'hybrid']).default('online'),
      details: z.string().optional(),
    })
    .optional(),
  saveToWatchlist: z.boolean().default(false),
  selectedReminderOffset: z.number().optional(), // minutes before start: 1440, 720, 60, 30
});

export type EventFormData = z.infer<typeof eventFormSchema>;

