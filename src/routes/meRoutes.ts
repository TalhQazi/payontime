import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { User, Organization, Subscription } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

export const meRouter = Router();

meRouter.get(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user!.userId);
      if (!user) {
        throw new AppError({
          statusCode: 404,
          code: 'USER_NOT_FOUND',
          message: 'User profile not found.',
        });
      }

      let organization = null;
      let subscription = null;

      if (user.currentOrganizationId) {
        organization = await Organization.findById(user.currentOrganizationId);
        if (organization) {
          subscription = await Subscription.findOne({
            organizationId: organization._id,
          });
        }
      }

      res.status(200).json({
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          isMfaVerified: req.user!.isMfaVerified,
          status: user.status,
          createdAt: user.createdAt,
        },
        organization: organization
          ? {
              id: organization._id.toString(),
              name: organization.name,
              legalBusinessName: organization.legalBusinessName,
              taxIdMasked: `***-**-${organization.taxId.slice(-4)}`,
              status: organization.status,
              isComplianceApproved: organization.isComplianceApproved,
              businessType: organization.businessType,
              address: organization.address,
              phone: organization.phone,
            }
          : null,
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              limits: subscription.limits,
              usage: subscription.usage,
              currentPeriodEnd: subscription.currentPeriodEnd,
            }
          : null,
        capabilities: {
          canSearchCustomers: Boolean(
            organization &&
              organization.status === 'APPROVED' &&
              subscription &&
              (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING')
          ),
          canSubmitReports: Boolean(
            organization &&
              organization.status === 'APPROVED' &&
              subscription &&
              (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING')
          ),
          canManageTeam: ['OWNER', 'ADMIN'].includes(user.role),
          requiresVerification: !organization || organization.status !== 'APPROVED',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
