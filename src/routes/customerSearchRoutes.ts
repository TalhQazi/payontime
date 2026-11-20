import { Router, Response, NextFunction } from 'express';
import {
  authenticate,
  requireOrganization,
  requireVerifiedBusiness,
} from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { CustomerSearchService } from '../services/customerSearchService.js';
import { customerSearchSchema } from '../validators/index.js';

export const customerSearchRouter = Router();

customerSearchRouter.post(
  '/',
  authenticate,
  requireOrganization,
  requireVerifiedBusiness,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = customerSearchSchema.parse(req.body);
      const result = await CustomerSearchService.search(
        req.user!.organizationId!,
        req.user!.userId,
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

customerSearchRouter.get(
  '/:id/matches',
  authenticate,
  requireOrganization,
  requireVerifiedBusiness,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await CustomerSearchService.getMatchesBySearchId(
        req.params.id as string,
        req.user!.organizationId!
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
