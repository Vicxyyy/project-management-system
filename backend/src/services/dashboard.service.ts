import { prisma } from '../lib/prisma';
import { ProjectStatus, TaskStatus } from '@prisma/client';

export async function getDashboardStats(userId: string) {
  const [totalProjects, projectsInProgress, totalTasks, completedTasks, pendingTasks] =
    await Promise.all([
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, status: ProjectStatus.IN_PROGRESS } }),
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: TaskStatus.COMPLETED } }),
      prisma.task.count({ where: { userId, status: TaskStatus.PENDING } }),
    ]);

  return {
    totalProjects,
    projectsInProgress,
    totalTasks,
    completedTasks,
    pendingTasks,
  };
}
