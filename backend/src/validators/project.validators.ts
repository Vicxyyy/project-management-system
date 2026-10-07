import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────────

const projectStatusEnum = z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], {
  errorMap: () => ({
    message: 'Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED',
  }),
});

// Accepts ISO date strings and converts to Date — rejects invalid dates
const dateField = z
  .string()
  .refine((v) => !isNaN(Date.parse(v)), { message: 'Must be a valid ISO date string' })
  .transform((v) => new Date(v));

// ── Create ────────────────────────────────────────────────────────────────────

export const createProjectSchema = z
  .object({
    name: z
      .string({ required_error: 'Project name is required' })
      .trim()
      .min(1, 'Project name cannot be empty')
      .max(255, 'Project name must be at most 255 characters'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must be at most 2000 characters')
      .optional(),
    status: projectStatusEnum.optional().default('NOT_STARTED'),
    startDate: dateField.optional(),
    endDate: dateField.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    { message: 'End date must be on or after start date', path: ['endDate'] },
  );

// ── Update ────────────────────────────────────────────────────────────────────

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(1, 'Project name cannot be empty').max(255).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: projectStatusEnum.optional(),
    startDate: dateField.nullable().optional(),
    endDate: dateField.nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    { message: 'End date must be on or after start date', path: ['endDate'] },
  );

// ── Query params ──────────────────────────────────────────────────────────────

export const listProjectsSchema = z.object({
  search: z.string().trim().optional(),
  status: projectStatusEnum.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsSchema>;
