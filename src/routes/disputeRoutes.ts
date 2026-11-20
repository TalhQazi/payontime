import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { Types } from 'mongoose';
import { authenticate, requireOrganization } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { DisputeService } from '../services/disputeService.js';
import {
  createDisputeSchema,
  respondDisputeSchema,
  appealDisputeSchema,
} from '../validators/index.js';
import { evidenceUpload } from '../middleware/upload.js';
import { Dispute, Evidence } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

export const disputeRouter = Router();

disputeRouter.post(
  '/',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = createDisputeSchema.parse(req.body);
      const dispute = await DisputeService.createDispute(
        validated,
        req.user?.userId,
        req.ip,
        req.headers['user-agent']
      );
      res.status(201).json(dispute);
    } catch (error) {
      next(error);
    }
  }
);

disputeRouter.get(
  '/',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as string | undefined;

      const result = await DisputeService.getDisputes(
        req.user!.organizationId!,
        status,
        page,
        limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

disputeRouter.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await DisputeService.getDisputeById(
        req.params.id as string,
        req.user?.organizationId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

disputeRouter.post(
  '/:id/responses',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = respondDisputeSchema.parse(req.body);
      const result = await DisputeService.submitResponse(
        req.params.id as string,
        req.user!.organizationId!,
        req.user!.userId,
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

disputeRouter.post(
  '/:id/appeal',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = appealDisputeSchema.parse(req.body);
      const result = await DisputeService.submitAppeal(
        req.params.id as string,
        validated.appealReason,
        req.user?.userId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

disputeRouter.post(
  '/:id/evidence',
  authenticate,
  evidenceUpload.single('file'),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new AppError({
          statusCode: 400,
          code: 'FILE_REQUIRED',
          message: 'An evidence document file must be uploaded.',
        });
      }

      const dispute = await Dispute.findById(req.params.id as string);
      if (!dispute) {
        throw new AppError({
          statusCode: 404,
          code: 'DISPUTE_NOT_FOUND',
          message: 'Dispute record not found.',
        });
      }

      const fileBuffer = fs.readFileSync(req.file.path);
      const sha256Checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const evidence = await Evidence.create({
        organizationId: dispute.organizationId,
        uploadedByUserId: new Types.ObjectId(req.user!.userId),
        relatedEntityType: 'DISPUTE',
        relatedEntityId: dispute._id,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
        storagePathOrKey: req.file.filename,
        sha256Checksum,
        isVerified: true,
      });

      dispute.evidenceIds.push(evidence._id as Types.ObjectId);
      await dispute.save();

      res.status(201).json({
        id: evidence._id.toString(),
        fileName: evidence.originalFileName,
        mimeType: evidence.mimeType,
        sizeBytes: evidence.fileSizeBytes,
        sha256Checksum: evidence.sha256Checksum,
      });
    } catch (error) {
      next(error);
    }
  }
);
