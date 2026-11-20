import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User, Organization } from '../models/index.js';
import { AuthenticatedRequest, UserRole } from '../types/index.js';
import { AppError } from './errorHandler.js';

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError({
        statusCode: 401,
        code: 'UNAUTHORIZED_NO_TOKEN',
        message: 'Authentication token is missing or malformed.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError({
          statusCode: 401,
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh your session.',
        });
      }
      throw new AppError({
        statusCode: 401,
        code: 'TOKEN_INVALID',
        message: 'Access token is invalid.',
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError({
        statusCode: 401,
        code: 'USER_INACTIVE_OR_NOT_FOUND',
        message: 'User account is not active or no longer exists.',
      });
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new AppError({
        statusCode: 401,
        code: 'SESSION_REVOKED',
        message: 'User session has been revoked. Please sign in again.',
      });
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      organizationId: decoded.organizationId || (user.currentOrganizationId ? user.currentOrganizationId.toString() : undefined),
      role: user.role,
      isMfaVerified: Boolean(decoded.isMfaVerified),
      deviceId: decoded.deviceId,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new AppError({
          statusCode: 401,
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        })
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError({
          statusCode: 403,
          code: 'FORBIDDEN_INSUFFICIENT_ROLE',
          message: 'You do not have the required role to perform this operation.',
        })
      );
    }

    next();
  };
}

export function requireOrganization(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.organizationId) {
    return next(
      new AppError({
        statusCode: 403,
        code: 'NO_ORGANIZATION_CONTEXT',
        message: 'An active organization context is required for this operation.',
      })
    );
  }
  next();
}

/**
 * Enforcement: Unapproved businesses must not be allowed to perform sensitive customer searches or publish reports.
 */
export async function requireVerifiedBusiness(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.organizationId) {
      throw new AppError({
        statusCode: 403,
        code: 'NO_ORGANIZATION_CONTEXT',
        message: 'An active organization context is required for this operation.',
      });
    }

    const org = await Organization.findById(req.user.organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found.',
      });
    }

    if (org.status !== 'APPROVED') {
      throw new AppError({
        statusCode: 403,
        code: 'BUSINESS_VERIFICATION_REQUIRED',
        message:
          'Your business verification is pending approval. You cannot perform sensitive customer searches or publish reports until approved.',
        details: { currentStatus: org.status },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireMfa(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.isMfaVerified) {
    return next(
      new AppError({
        statusCode: 403,
        code: 'MFA_STEP_UP_REQUIRED',
        message: 'Step-up multi-factor authentication is required for this sensitive action.',
      })
    );
  }
  next();
}
