import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { UnauthorizedError } from '../errors/AppError';

/**
 * JWT authentication middleware.
 *
 * Reads the Authorization header, verifies the Bearer token,
 * and attaches `req.user = { id }` for downstream handlers.
 *
 * Rejects with 401 if the token is:
 *  - missing
 *  - malformed / not a Bearer token
 *  - invalid signature
 *  - expired
 *
 * Usage on protected routes:
 *   router.get('/me', authenticate, handler);
 *
 * All future project/task routes use this same middleware:
 *   req.user.id  →  authenticated user's database ID
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No authentication token provided'));
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  if (!token) {
    return next(new UnauthorizedError('No authentication token provided'));
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    next(err); // verifyToken already throws UnauthorizedError
  }
}
