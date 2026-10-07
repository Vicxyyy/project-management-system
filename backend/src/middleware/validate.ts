import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Factory that returns a middleware validating req.body against a Zod schema.
 * On success, req.body is replaced with the parsed (and transformed) data —
 * this means email normalization (toLowerCase) applied in the schema
 * is automatically reflected in downstream handlers.
 *
 * Accepts any Zod schema type including ZodObject, ZodEffects (.refine()), etc.
 *
 * On failure, a 400 AppError is thrown with a human-readable message.
 */
export function validate(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => e.message).join('. ');
        return next(new AppError(message, 400));
      }
      next(err);
    }
  };
}
