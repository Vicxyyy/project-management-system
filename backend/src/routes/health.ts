import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import logger from '../config/logger';

const router = Router();

/**
 * GET /health
 * Returns the service health status and basic diagnostic information.
 */
router.get('/', async (_req: Request, res: Response) => {
  const start = Date.now();

  let dbStatus: 'ok' | 'error' = 'ok';
  let dbLatencyMs: number | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
  } catch (err) {
    dbStatus = 'error';
    logger.error('Health check — DB ping failed:', err);
  }

  const status = dbStatus === 'ok' ? 'ok' : 'degraded';
  const httpStatus = status === 'ok' ? 200 : 503;

  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    version: process.env.npm_package_version ?? '1.0.0',
  });
});

export default router;
