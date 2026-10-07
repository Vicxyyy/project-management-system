import { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from '../services/dashboard.service';

export async function getDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.id;
    const stats = await getDashboardStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}
