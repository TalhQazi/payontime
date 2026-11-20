import { Router, Response, NextFunction } from 'express';
import { authenticate, requireOrganization } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { PaymentService } from '../services/paymentService.js';
import { recordPaymentSchema } from '../validators/index.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { Invoice } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { Types } from 'mongoose';

export const invoiceRouter = Router();

invoiceRouter.get(
  '/',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as string | undefined;

      const result = await PaymentService.getInvoices(
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

invoiceRouter.get(
  '/:id',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const invoice = await Invoice.findOne({
        _id: req.params.id as string,
        organizationId: new Types.ObjectId(req.user!.organizationId!),
      }).populate('customerRecordId evidenceIds');

      if (!invoice) {
        throw new AppError({
          statusCode: 404,
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found.',
        });
      }

      res.status(200).json({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerPostalCode: invoice.customerPostalCode,
        amountMinorUnits: invoice.amountMinorUnits,
        currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        dueDateBasis: invoice.dueDateBasis,
        status: invoice.status,
        isPaidLate: invoice.isPaidLate,
        fullyPaidAt: invoice.fullyPaidAt,
        revision: invoice.revision,
        serviceDescription: invoice.serviceDescription,
        createdAt: invoice.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

invoiceRouter.post(
  '/:id/payments',
  authenticate,
  requireOrganization,
  idempotencyMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const validated = recordPaymentSchema.parse(req.body);
      const result = await PaymentService.recordPayment(
        req.user!.organizationId!,
        req.user!.userId,
        {
          ...validated,
          invoiceId: req.params.id as string,
        },
        req.ip,
        req.headers['user-agent']
      );
      res.status(result.isDuplicateReplay ? 200 : 201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

invoiceRouter.get(
  '/:id/payments',
  authenticate,
  requireOrganization,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await PaymentService.getPaymentsForInvoice(
        req.params.id as string,
        req.user!.organizationId!
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
