import { Router, Response, NextFunction } from 'express';
import { authenticate, requireOrganization } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { VerificationService } from '../services/verificationService.js';
import { z } from 'zod';

export const verificationRouter = Router();

const submitVerificationDocsSchema = z.object({
  documents: z
    .array(
      z.object({
        docType: z.enum([
          'BUSINESS_LICENSE',
          'CERTIFICATE_OF_INCORPORATION',
          'TAX_ID_DOCUMENT',
          'UTILITY_BILL',
          'GOVERNMENT_PHOTO_ID',
          'BANK_STATEMENT',
        ]),
        evidenceId: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .min(1, 'At least one document is required'),
});

verificationRouter.post(
  '/',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = submitVerificationDocsSchema.parse(req.body);
      const result = await VerificationService.submit(
        req.user!.organizationId!,
        req.user!.userId,
        validated.documents
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

verificationRouter.get(
  '/status',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const status = await VerificationService.getStatus(req.user!.organizationId!);
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }
);

// Administrative / compliance approval endpoint
verificationRouter.post(
  '/approve',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const targetOrgId = (req.body?.organizationId as string) || req.user!.organizationId!;
      const result = await VerificationService.approve(targetOrgId, req.user!.userId);
      res.status(200).json({ success: true, verification: result });
    } catch (error) {
      next(error);
    }
  }
);
