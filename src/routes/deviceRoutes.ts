import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { NotificationService } from '../services/notificationService.js';
import { registerDeviceSchema } from '../validators/index.js';

export const deviceRouter = Router();

deviceRouter.post(
  '/register',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = registerDeviceSchema.parse(req.body);
      const result = await NotificationService.registerDevice(
        req.user!.userId,
        req.user?.organizationId,
        validated
      );
      res.status(200).json({ success: true, device: result });
    } catch (error) {
      next(error);
    }
  }
);
