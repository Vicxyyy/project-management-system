import { Prisma, ProjectStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../errors/AppError';

import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from '../validators/project.validators';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the project if it exists AND belongs to userId.
 * Always returns a safe 404 (never reveals whether the project exists
 * under a different owner — prevents IDOR enumeration).
 */
async function findOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) {
    throw new NotFoundError('Project');
  }
  return project;
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * List projects owned by userId.
 * Supports optional name search (case-insensitive) and status filter.
 */
export async function listProjects(userId: string, query: ListProjectsQuery) {
  const where: Prisma.ProjectWhereInput = { userId };

  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }

  if (query.status) {
    where.status = query.status as ProjectStatus;
  }

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return projects;
}

/**
 * Get a single project by ID — verifies ownership.
 */
export async function getProjectById(projectId: string, userId: string) {
  return findOwnedProject(projectId, userId);
}

/**
 * Create a project for the authenticated user.
 */
export async function createProject(userId: string, input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      userId,
      name: input.name,
      description: input.description ?? null,
      status: input.status as ProjectStatus,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    },
  });
  return project;
}

/**
 * Update a project — verifies ownership before writing.
 */
export async function updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
  // Ownership check first (throws 404 if not owned)
  await findOwnedProject(projectId, userId);

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status as ProjectStatus }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
    },
  });

  return updated;
}

/**
 * Delete a project — verifies ownership.
 * Cascade to tasks is handled by Prisma (onDelete: Cascade in schema).
 */
export async function deleteProject(projectId: string, userId: string) {
  // Ownership check first
  await findOwnedProject(projectId, userId);

  await prisma.project.delete({ where: { id: projectId } });
}

// Re-export for use in task service
export { findOwnedProject };
