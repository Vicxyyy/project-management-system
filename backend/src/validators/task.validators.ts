import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────────

const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH'], {
  errorMap: () => ({ message: 'Priority must be one of: LOW, MEDIUM, HIGH' }),
});

const taskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
  errorMap: () => ({
    message: 'Status must be one of: PENDING, IN_PROGRESS, COMPLETED',
  }),
});

const dateField = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), { message: 'Must be a valid ISO date string' })
  .transform((v) => new Date(v));

// ── Create ────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  projectId: z
    .string({ required_error: 'projectId is required' })
    .trim()
    .min(1, 'projectId cannot be empty'),
  name: z
    .string({ required_error: 'Task name is required' })
    .trim()
    .min(1, 'Task name cannot be empty')
    .max(255, 'Task name must be at most 255 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
  priority: taskPriorityEnum.optional().default('MEDIUM'),
  status: taskStatusEnum.optional().default('PENDING'),
  dueDate: dateField.optional(),
});

// ── Update ────────────────────────────────────────────────────────────────────

export const updateTaskSchema = z.object({
  projectId: z.string().trim().min(1, 'projectId cannot be empty').optional(),
  name: z.string().trim().min(1, 'Task name cannot be empty').max(255).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: dateField.nullable().optional(),
});

// ── Query params ──────────────────────────────────────────────────────────────

export const listTasksSchema = z.object({
  search: z.string().trim().optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  projectId: z.string().trim().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksSchema>;
