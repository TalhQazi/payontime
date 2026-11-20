import { Router, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import {
  authenticate,
  requireOrganization,
  requireVerifiedBusiness,
} from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { InvoiceReportService } from '../services/invoiceReportService.js';
import { createReportSchema } from '../validators/index.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { evidenceUpload } from '../middleware/upload.js';
import { Evidence, Report } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { Types } from 'mongoose';

export const reportRouter = Router();

reportRouter.post(
  '/',
  authenticate,
  requireOrganization,
  requireVerifiedBusiness,
  idempotencyMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = createReportSchema.parse(req.body);
      const result = await InvoiceReportService.createReport(
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

reportRouter.get(
  '/',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await InvoiceReportService.getReports(
        req.user!.organizationId!,
        page,
        limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

reportRouter.get(
  '/:id',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await InvoiceReportService.getReportById(
        req.params.id as string,
        req.user!.organizationId!
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

reportRouter.post(
  '/:id/evidence',
  authenticate,
  requireOrganization,
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

      const report = await Report.findOne({
        _id: req.params.id as string,
        organizationId: new Types.ObjectId(req.user!.organizationId!),
      });

      if (!report) {
        throw new AppError({
          statusCode: 404,
          code: 'REPORT_NOT_FOUND',
          message: 'Report not found.',
        });
      }

      // Compute SHA256 file checksum
      const fileBuffer = fs.readFileSync(req.file.path);
      const sha256Checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const evidence = await Evidence.create({
        organizationId: report.organizationId,
        uploadedByUserId: new Types.ObjectId(req.user!.userId),
        relatedEntityType: 'INVOICE',
        relatedEntityId: report.invoiceId,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
        storagePathOrKey: req.file.filename,
        sha256Checksum,
        isVerified: true,
      });

      res.status(201).json({
        id: evidence._id.toString(),
        fileName: evidence.originalFileName,
        mimeType: evidence.mimeType,
        sizeBytes: evidence.fileSizeBytes,
        sha256Checksum: evidence.sha256Checksum,
        uploadedAt: evidence.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);
