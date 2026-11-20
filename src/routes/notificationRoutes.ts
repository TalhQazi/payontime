import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotificationService } from '../services/notificationService.js';

export const notificationRouter = Router();

notificationRouter.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await NotificationService.getNotifications(
        req.user!.userId,
        page,
        limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

notificationRouter.patch(
  '/:id/read',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await NotificationService.markAsRead(
        req.params.id as string,
        req.user!.userId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
