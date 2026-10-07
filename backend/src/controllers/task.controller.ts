import { Request, Response, NextFunction } from 'express';
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../services/task.service';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  ListTasksQuery,
} from '../validators/task.validators';

export async function listTasksHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const query = req.query as unknown as ListTasksQuery;
    const tasks = await listTasks(userId, query);

    res.status(200).json({
      success: true,
      data: { tasks, count: tasks.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const task = await getTaskById(req.params['id'] as string, userId);

    res.status(200).json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
}

export async function createTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const input = req.body as CreateTaskInput;
    const task = await createTask(userId, input);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const input = req.body as UpdateTaskInput;
    const task = await updateTask(req.params['id'] as string, userId, input);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTaskHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    await deleteTask(req.params['id'] as string, userId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
