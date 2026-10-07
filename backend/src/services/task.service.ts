import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, AppError } from '../errors/AppError';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '../validators/task.validators';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the task if it exists AND belongs to userId.
 * Safe 404 behavior — never reveals whether the task exists under a different owner.
 */
async function findOwnedTask(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });
  if (!task) {
    throw new NotFoundError('Task');
  }
  return task;
}

/**
 * Verifies that a project exists AND belongs to userId.
 * Used when creating or moving a task to ensure ownership of the target project.
 */
async function assertProjectOwnership(projectId: string, userId: string): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) {
    // Deliberately vague — don't reveal whether the project exists at all
    throw new AppError('Project not found or does not belong to you', 404);
  }
}

// ── Service functions ─────────────────────────────────────────────────────────

/**
 * List tasks owned by userId.
 * Supports search, status, priority, and projectId filters.
 * All filters can be combined freely.
 */
export async function listTasks(userId: string, query: ListTasksQuery) {
  const where: Prisma.TaskWhereInput = { userId };

  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }

  if (query.status) {
    where.status = query.status as TaskStatus;
  }

  if (query.priority) {
    where.priority = query.priority as TaskPriority;
  }

  if (query.projectId) {
    // Only return tasks for the given project — still filtered by userId
    where.projectId = query.projectId;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      project: { select: { id: true, name: true, status: true } },
    },
  });

  return tasks;
}

/**
 * Get a single task — verifies ownership.
 */
export async function getTaskById(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    include: {
      project: { select: { id: true, name: true, status: true } },
    },
  });
  if (!task) {
    throw new NotFoundError('Task');
  }
  return task;
}

/**
 * Create a task.
 * Validates that the target project belongs to the authenticated user
 * before creating, preventing cross-user task injection.
 */
export async function createTask(userId: string, input: CreateTaskInput) {
  // Critical: verify the project belongs to this user
  await assertProjectOwnership(input.projectId, userId);

  const task = await prisma.task.create({
    data: {
      userId,
      projectId: input.projectId,
      name: input.name,
      description: input.description ?? null,
      priority: input.priority as TaskPriority,
      status: input.status as TaskStatus,
      dueDate: input.dueDate ?? null,
    },
    include: {
      project: { select: { id: true, name: true, status: true } },
    },
  });

  return task;
}

/**
 * Update a task — verifies task ownership.
 * If projectId is being changed, also verifies the new project belongs to the user.
 */
export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  // Task ownership check
  await findOwnedTask(taskId, userId);

  // If moving the task to a different project, verify new project ownership
  if (input.projectId !== undefined) {
    await assertProjectOwnership(input.projectId, userId);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.projectId !== undefined && { projectId: input.projectId }),
      ...(input.priority !== undefined && { priority: input.priority as TaskPriority }),
      ...(input.status !== undefined && { status: input.status as TaskStatus }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
    },
    include: {
      project: { select: { id: true, name: true, status: true } },
    },
  });

  return updated;
}

/**
 * Delete a task — verifies ownership.
 */
export async function deleteTask(taskId: string, userId: string) {
  await findOwnedTask(taskId, userId);
  await prisma.task.delete({ where: { id: taskId } });
}
