import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CustomerRecord, Invoice, Dispute } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { maskName } from '../utils/masking.js';
import { AuthenticatedRequest } from '../types/index.js';

export const customerPortalRouter = Router();

const customerVerifySchema = z.object({
  lastName: z.string().min(2).trim(),
  postalCode: z.string().min(3).trim(),
  phoneLast4: z.string().regex(/^\d{4}$/),
});

customerPortalRouter.post(
  '/verify',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { lastName, postalCode, phoneLast4 } = customerVerifySchema.parse(req.body);

      const customer = await CustomerRecord.findOne({
        lastName: new RegExp(`^${lastName}$`, 'i'),
        postalCode: postalCode.trim(),
        phoneLast4,
      });

      if (!customer) {
        throw new AppError({
          statusCode: 404,
          code: 'CUSTOMER_RECORD_NOT_FOUND',
          message:
            'No matching customer file was found for the provided information. Please verify your details.',
        });
      }

      // Return consumer access token / identifier
      res.status(200).json({
        verified: true,
        customerId: customer._id.toString(),
        nameMasked: maskName(`${customer.firstName || ''} ${customer.lastName || ''}`),
        postalCode: customer.postalCode,
        message: 'Identity verified. You may view your consumer file free of charge under applicable consumer protection rights.',
      });
    } catch (error) {
      next(error);
    }
  }
);

customerPortalRouter.get(
  '/records/:customerId',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const customer = await CustomerRecord.findById(req.params.customerId);
      if (!customer) {
        throw new AppError({
          statusCode: 404,
          code: 'CUSTOMER_RECORD_NOT_FOUND',
          message: 'Customer record not found.',
        });
      }

      const invoices = await Invoice.find({ customerRecordId: customer._id })
        .select('invoiceNumber serviceDescription amountMinorUnits currentBalanceMinorUnits status issueDate dueDate isPaidLate')
        .sort({ issueDate: -1 });

      const disputes = await Dispute.find({ customerRecordId: customer._id })
        .select('disputeType status explanation deadline decisionSummary createdAt')
        .sort({ createdAt: -1 });

      res.status(200).json({
        consumerDisclosure: {
          customerSummary: {
            id: customer._id.toString(),
            totalInvoicesCount: customer.totalInvoicesCount,
            onTimePaymentsCount: customer.onTimePaymentsCount,
            latePaymentsCount: customer.latePaymentsCount,
            totalPaidMinorUnits: customer.totalPaidMinorUnits,
            totalOutstandingMinorUnits: customer.totalOutstandingMinorUnits,
            activeDisputesCount: customer.disputeActiveCount,
            lastUpdatedDate: customer.lastUpdatedDate,
          },
          invoices: invoices.map((inv) => ({
            id: inv._id.toString(),
            invoiceNumber: inv.invoiceNumber,
            serviceDescription: inv.serviceDescription,
            amountMinorUnits: inv.amountMinorUnits,
            currentBalanceMinorUnits: inv.currentBalanceMinorUnits,
            status: inv.status,
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            isPaidLate: inv.isPaidLate,
          })),
          disputes: disputes.map((d) => ({
            id: d._id.toString(),
            disputeType: d.disputeType,
            status: d.status,
            explanation: d.explanation,
            deadline: d.deadline,
            decisionSummary: d.decisionSummary,
            createdAt: d.createdAt,
          })),
          consumerRightsNotice:
            'You have the legal right under applicable credit reporting regulations to inspect your file free of charge and submit disputes regarding any inaccurate or incomplete information.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);
