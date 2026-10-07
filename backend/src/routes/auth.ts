import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, logout, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validators/auth.validators';

const router = Router();

/**
 * Rate limiter for sensitive auth endpoints.
 * 10 attempts per IP per 15 minutes — prevents brute-force.
 * Skipped in test mode so tests run fast.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * POST /api/auth/register
 * Rate-limited. Validates body with Zod before reaching controller.
 */
router.post('/register', authLimiter, validate(registerSchema), register);

/**
 * POST /api/auth/login
 * Rate-limited. Validates body with Zod before reaching controller.
 */
router.post('/login', authLimiter, validate(loginSchema), login);

/**
 * POST /api/auth/logout
 * Stateless logout — client discards token. No JWT required.
 */
router.post('/logout', logout);

/**
 * GET /api/auth/me
 * Protected — requires valid Bearer JWT.
 */
router.get('/me', authenticate, getMe);

export default router;
