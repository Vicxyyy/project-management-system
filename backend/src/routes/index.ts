import { Router } from 'express';
import healthRouter from './health';

const router = Router();

/**
 * Mount all route groups here.
 * Each group is prefixed with its own path.
 */
router.use('/health', healthRouter);

// Phase 2+: auth, projects, tasks routes will be added here

export default router;
