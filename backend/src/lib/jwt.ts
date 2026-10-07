import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UnauthorizedError } from '../errors/AppError';

export interface JwtPayload {
  /** Subject — the user's ID */
  sub: string;
}

/**
 * Signs a JWT containing only the user ID in the `sub` claim.
 */
export function signToken(userId: string): string {
  const secret = config.jwt.secret;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ sub: userId }, secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifies a JWT and returns its payload.
 * Throws UnauthorizedError for any verification failure.
 */
export function verifyToken(token: string): JwtPayload {
  const secret = config.jwt.secret;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid token');
  }
}
