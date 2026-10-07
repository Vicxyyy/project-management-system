// src/types/express.d.ts
// Augments the Express Request type to include authenticated user.
// After authenticate middleware runs, req.user is available on all protected routes.

import 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}
