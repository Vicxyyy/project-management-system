import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { validateQuery } from '../middleware/validateQuery';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
} from '../validators/project.validators';
import {
  listProjectsHandler,
  getProjectHandler,
  createProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from '../controllers/project.controller';

const router = Router();

// All project routes require authentication
router.use(authenticate);

/** GET /api/projects — list authenticated user's projects with optional filters */
router.get('/', validateQuery(listProjectsSchema), listProjectsHandler);

/** GET /api/projects/:id — get single owned project */
router.get('/:id', getProjectHandler);

/** POST /api/projects — create new project */
router.post('/', validate(createProjectSchema), createProjectHandler);

/** PUT /api/projects/:id — update owned project */
router.put('/:id', validate(updateProjectSchema), updateProjectHandler);

/** DELETE /api/projects/:id — delete owned project (cascades to tasks) */
router.delete('/:id', deleteProjectHandler);

export default router;
