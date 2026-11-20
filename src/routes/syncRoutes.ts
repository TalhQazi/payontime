import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireOrganization } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { SyncService, BatchSyncItem } from '../services/syncService.js';

export const syncRouter = Router();

const batchSyncSchema = z.object({
  clientId: z.string().min(1, 'Client identifier is required'),
  items: z
    .array(
      z.object({
        clientUuid: z.string().uuid('Each item must have a valid client UUID'),
        operationType: z.enum(['CREATE_REPORT', 'RECORD_PAYMENT', 'UPDATE_DISPUTE']),
        payload: z.record(z.any()),
        revision: z.number().int().optional(),
        localCreatedAt: z.string(),
      })
    )
    .min(1, 'Batch must contain at least one operation'),
});

syncRouter.post(
  '/batch',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = batchSyncSchema.parse(req.body);
      const result = await SyncService.processBatch(
        req.user!.organizationId!,
        req.user!.userId,
        validated.clientId,
        validated.items as BatchSyncItem[],
        req.ip,
        req.headers['user-agent']
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
