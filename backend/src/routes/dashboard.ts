import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getDashboardHandler } from '../controllers/dashboard.controller';

const router = Router();

// Dashboard routes require authentication
router.use(authenticate);

/** GET /api/dashboard — return user statistics */
router.get('/', getDashboardHandler);

export default router;
