import { Router, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  mfaVerifySchema,
} from '../validators/index.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { AuthenticatedRequest } from '../types/index.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  authRateLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register(
        validated,
        req.ip,
        req.headers['user-agent']
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  '/login',
  authRateLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(
        validated,
        req.ip,
        req.headers['user-agent']
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  '/refresh',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = refreshTokenSchema.parse(req.body);
      const tokens = await AuthService.refresh(
        validated.refreshToken,
        validated.deviceId
      );
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  '/logout',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const deviceId = (req.body?.deviceId as string) || req.user?.deviceId;
      const result = await AuthService.logout(req.user!.userId, deviceId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

authRouter.post(
  '/mfa/verify',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = mfaVerifySchema.parse(req.body);
      const result = await AuthService.verifyMfa(
        req.user!.userId,
        validated.mfaCode,
        validated.backupCode
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
