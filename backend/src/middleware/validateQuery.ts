import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Like validate(), but validates req.query instead of req.body.
 * Replaces req.query with the parsed/transformed result.
 *
 * Accepts any Zod schema type including ZodObject, ZodEffects (.refine()), etc.
 */
export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Cast needed: Express types req.query as ParsedQs, but Zod handles it fine
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (req as any).query = schema.parse(req.query);
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
