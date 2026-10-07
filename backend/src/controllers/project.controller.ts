import { Request, Response, NextFunction } from 'express';
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../services/project.service';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsQuery,
} from '../validators/project.validators';

export async function listProjectsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const query = req.query as unknown as ListProjectsQuery;
    const projects = await listProjects(userId, query);

    res.status(200).json({
      success: true,
      data: { projects, count: projects.length },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const project = await getProjectById(req.params['id'] as string, userId);

    res.status(200).json({ success: true, data: { project } });
  } catch (err) {
    next(err);
  }
}

export async function createProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const input = req.body as CreateProjectInput;
    const project = await createProject(userId, input);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const input = req.body as UpdateProjectInput;
    const project = await updateProject(req.params['id'] as string, userId, input);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: { project },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteProjectHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    await deleteProject(req.params['id'] as string, userId);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
