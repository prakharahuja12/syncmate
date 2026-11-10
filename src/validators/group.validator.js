import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100, 'Group name cannot exceed 100 characters'),
});

export const joinGroupSchema = z.object({
  code: z.string().trim().min(1, 'Invite code is required').max(20, 'Invalid invite code'),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(100, 'Group name cannot exceed 100 characters'),
});

export const transferOwnerSchema = z.object({
  userId: z.string().trim().min(1, 'Target user ID is required'),
});

