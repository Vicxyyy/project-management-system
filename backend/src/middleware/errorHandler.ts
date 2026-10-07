import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import logger from '../config/logger';

interface ErrorResponse {
  success: false;
  message: string;
  stack?: string;
}

/**
 * Centralized error handling middleware.
 * Must be registered as the LAST middleware in Express.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error (programmer bug):', err);
    } else {
      logger.warn(`Operational error [${err.statusCode}]: ${err.message}`);
    }

    const body: ErrorResponse = {
      success: false,
      message: err.message,
    };

    if (process.env.NODE_ENV !== 'production') {
      body.stack = err.stack;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown / unhandled errors
  logger.error('Unhandled error:', err);

  const body: ErrorResponse = {
    success: false,
    message: 'Internal server error',
  };

  if (process.env.NODE_ENV !== 'production') {
    body.stack = err.stack;
  }

  res.status(500).json(body);
}

/**
 * Middleware for routes that were not matched by any handler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
