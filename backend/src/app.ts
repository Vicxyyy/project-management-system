import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env';
import logger from './config/logger';
import v1Routes from './routes';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import dashboardRoutes from './routes/dashboard';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  // ── Security headers (Helmet) ────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // ── Request parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── HTTP request logging ─────────────────────────────────────────────────────
  app.use(
    morgan(config.isDev() ? 'dev' : 'combined', {
      stream: { write: (msg) => logger.http(msg.trimEnd()) },
    }),
  );

  // ── Authentication routes (exact paths required by assignment) ───────────────
  app.use('/api/auth', authRoutes);

  // ── Project & Task routes ────────────────────────────────────────────────────
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // ── Versioned API routes (health, etc.) ──────────────────────────────────────
  app.use('/api/v1', v1Routes);

  // ── 404 catch-all ────────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Centralized error handler (must be last) ─────────────────────────────────
  app.use(errorHandler);

  return app;
}
