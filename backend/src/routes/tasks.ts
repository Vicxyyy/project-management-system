import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { validateQuery } from '../middleware/validateQuery';
import { createTaskSchema, updateTaskSchema, listTasksSchema } from '../validators/task.validators';
import {
  listTasksHandler,
  getTaskHandler,
  createTaskHandler,
  updateTaskHandler,
  deleteTaskHandler,
} from '../controllers/task.controller';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/** GET /api/tasks — list authenticated user's tasks with optional filters */
router.get('/', validateQuery(listTasksSchema), listTasksHandler);

/** GET /api/tasks/:id — get single owned task */
router.get('/:id', getTaskHandler);

/** POST /api/tasks — create task in an owned project */
router.post('/', validate(createTaskSchema), createTaskHandler);

/** PUT /api/tasks/:id — update owned task */
router.put('/:id', validate(updateTaskSchema), updateTaskHandler);

/** DELETE /api/tasks/:id — delete owned task */
router.delete('/:id', deleteTaskHandler);

export default router;
