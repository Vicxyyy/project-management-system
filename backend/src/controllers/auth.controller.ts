import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, getUserById } from '../services/auth.service';
import type { RegisterInput, LoginInput } from '../validators/auth.validators';

/**
 * POST /api/auth/register
 * Public — no authentication required.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as RegisterInput;
    const result = await registerUser(input);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Public — no authentication required.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = req.body as LoginInput;
    const result = await loginUser(input);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Public — the client discards its token.
 *
 * This implementation uses stateless JWTs. The server has no token store,
 * so it cannot revoke a token. Logout is handled client-side by deleting
 * the stored token. This endpoint acknowledges the action and serves as a
 * clean contract for clients.
 *
 * If token blacklisting is needed in the future, a Redis store can be
 * introduced here without changing the client contract.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please remove the token from your client.',
  });
}

/**
 * GET /api/auth/me
 * Protected — requires valid JWT (authenticate middleware).
 * Returns the currently authenticated user.
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // req.user is guaranteed by authenticate middleware
    const userId = req.user!.id;
    const user = await getUserById(userId);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}
