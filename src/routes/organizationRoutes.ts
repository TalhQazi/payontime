import { Router, Response, NextFunction } from 'express';
import { authenticate, requireOrganization } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { OrganizationService } from '../services/organizationService.js';
import { createOrgSchema } from '../validators/index.js';

export const organizationRouter = Router();

organizationRouter.get(
  '/current',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await OrganizationService.getCurrent(req.user!.organizationId!);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
);

organizationRouter.post(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = createOrgSchema.parse(req.body);
      const org = await OrganizationService.create(req.user!.userId, validated);
      res.status(201).json(org);
    } catch (error) {
      next(error);
    }
  }
);

organizationRouter.get(
  '/members',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const members = await OrganizationService.getMembers(req.user!.organizationId!);
      res.status(200).json({ members });
    } catch (error) {
      next(error);
    }
  }
);
