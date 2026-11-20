import { Types } from 'mongoose';
import {
  Invoice,
  PaymentEvent,
  CustomerRecord,
  Organization,
  AuditLog,
  Notification,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { withTransaction } from '../database/connection.js';
import { PaymentMethodCategory } from '../types/index.js';

export interface RecordPaymentInput {
  invoiceId: string;
  amountMinorUnits: number; // positive integer cents
  effectivePaymentDate: string; // ISO date string
  paymentMethodCategory: PaymentMethodCategory;
  supportingEvidenceId?: string;
  idempotencyKey: string;
  notes?: string;
  expectedRevision?: number;
}

export class PaymentService {
  static async recordPayment(
    organizationId: string,
    userId: string,
    input: RecordPaymentInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Idempotency Check
    const existingPayment = await PaymentEvent.findOne({
      idempotencyKey: input.idempotencyKey,
      organizationId: new Types.ObjectId(organizationId),
    });

    if (existingPayment) {
      // Return previous result idempotently
      const invoice = await Invoice.findById(existingPayment.invoiceId);
      return {
        isDuplicateReplay: true,
        paymentEvent: {
          id: existingPayment._id.toString(),
          amountMinorUnits: existingPayment.amountMinorUnits,
          effectivePaymentDate: existingPayment.effectivePaymentDate,
          paymentMethodCategory: existingPayment.paymentMethodCategory,
          previousBalanceMinorUnits: existingPayment.previousBalanceMinorUnits,
          resultingBalanceMinorUnits: existingPayment.resultingBalanceMinorUnits,
          idempotencyKey: existingPayment.idempotencyKey,
          createdAt: existingPayment.createdAt,
        },
        invoice: invoice
          ? {
              id: invoice._id.toString(),
              currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
              status: invoice.status,
              isPaidLate: invoice.isPaidLate,
              revision: invoice.revision,
            }
          : null,
      };
    }

    // 2. Fetch Invoice
    const invoice = await Invoice.findOne({
      _id: input.invoiceId,
      organizationId: new Types.ObjectId(organizationId),
    });

    if (!invoice) {
      throw new AppError({
        statusCode: 404,
        code: 'INVOICE_NOT_FOUND',
        message: 'The requested invoice was not found or does not belong to your organization.',
      });
    }

    // 3. Optimistic Concurrency / Conflict Check
    if (
      input.expectedRevision !== undefined &&
      invoice.revision !== input.expectedRevision
    ) {
      throw new AppError({
        statusCode: 409,
        code: 'CONFLICT_REVISION_MISMATCH',
        message:
          'The invoice has been modified concurrently. Please refresh the invoice details to resolve differences.',
        details: {
          currentRevision: invoice.revision,
          expectedRevision: input.expectedRevision,
          currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
        },
      });
    }

    // 4. Validate Payment Amount
    if (input.amountMinorUnits <= 0) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_PAYMENT_AMOUNT',
        message: 'Payment amount must be a positive integer in minor units (cents).',
      });
    }

    if (input.amountMinorUnits > invoice.currentBalanceMinorUnits) {
      throw new AppError({
        statusCode: 400,
        code: 'PAYMENT_EXCEEDS_BALANCE',
        message: `Payment amount (${input.amountMinorUnits} cents) cannot exceed the current outstanding balance (${invoice.currentBalanceMinorUnits} cents).`,
        details: {
          currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
          attemptedPaymentMinorUnits: input.amountMinorUnits,
        },
      });
    }

    return await withTransaction(async (session) => {
      const previousBalance = invoice.currentBalanceMinorUnits;
      const resultingBalance = previousBalance - input.amountMinorUnits;
      const paymentDate = new Date(input.effectivePaymentDate);

      // Check timeliness: If payment is made after the due date, it is historically late!
      const isLatePayment = paymentDate > invoice.dueDate || invoice.isPaidLate;

      // 5. Create PaymentEvent
      const [paymentEvent] = await PaymentEvent.create(
        [
          {
            invoiceId: invoice._id,
            organizationId: invoice.organizationId,
            customerRecordId: invoice.customerRecordId,
            amountMinorUnits: input.amountMinorUnits,
            currency: invoice.currency,
            effectivePaymentDate: paymentDate,
            paymentMethodCategory: input.paymentMethodCategory,
            supportingEvidenceId: input.supportingEvidenceId
              ? new Types.ObjectId(input.supportingEvidenceId)
              : undefined,
            previousBalanceMinorUnits: previousBalance,
            resultingBalanceMinorUnits: resultingBalance,
            idempotencyKey: input.idempotencyKey,
            notes: input.notes,
            recordedByUserId: new Types.ObjectId(userId),
          },
        ],
        { session }
      );

      // 6. Update Invoice Authoritative Balance & Timeliness
      invoice.currentBalanceMinorUnits = resultingBalance;
      invoice.revision += 1;

      if (isLatePayment) {
        invoice.isPaidLate = true;
      }

      if (resultingBalance === 0) {
        invoice.status = 'PAID';
        invoice.fullyPaidAt = paymentDate;
      } else {
        invoice.status = 'PARTIALLY_PAID';
      }

      await invoice.save({ session });

      // 7. Update CustomerRecord Authoritative Stats
      const customer = await CustomerRecord.findById(invoice.customerRecordId).session(session);
      if (customer) {
        customer.totalPaidMinorUnits += input.amountMinorUnits;
        customer.totalOutstandingMinorUnits = Math.max(
          0,
          customer.totalOutstandingMinorUnits - input.amountMinorUnits
        );

        if (resultingBalance === 0) {
          if (invoice.isPaidLate) {
            customer.latePaymentsCount += 1;
          } else {
            customer.onTimePaymentsCount += 1;
          }
        }
        customer.lastUpdatedDate = new Date();
        await customer.save({ session });
      }

      // 8. Audit Log
      await AuditLog.create(
        [
          {
            organizationId: invoice.organizationId,
            userId: new Types.ObjectId(userId),
            action: 'PAYMENT_RECORDED',
            resource: 'Invoice',
            resourceId: invoice._id.toString(),
            ipAddress,
            userAgent,
            details: {
              amountMinorUnits: input.amountMinorUnits,
              previousBalance,
              resultingBalance,
              idempotencyKey: input.idempotencyKey,
              isPaidLate: invoice.isPaidLate,
            },
          },
        ],
        { session }
      );

      // 9. Notification
      await Notification.create(
        [
          {
            userId: new Types.ObjectId(userId),
            organizationId: invoice.organizationId,
            type: 'PAYMENT_STATUS',
            title: 'Payment Recorded',
            bodyMasked: `A payment of $${(input.amountMinorUnits / 100).toFixed(2)} was recorded for invoice #${invoice.invoiceNumber}. Remaining balance: $${(resultingBalance / 100).toFixed(2)}.`,
            referenceId: invoice._id.toString(),
            referenceType: 'Invoice',
          },
        ],
        { session }
      );

      return {
        isDuplicateReplay: false,
        paymentEvent: {
          id: paymentEvent._id.toString(),
          amountMinorUnits: paymentEvent.amountMinorUnits,
          effectivePaymentDate: paymentEvent.effectivePaymentDate,
          paymentMethodCategory: paymentEvent.paymentMethodCategory,
          previousBalanceMinorUnits: paymentEvent.previousBalanceMinorUnits,
          resultingBalanceMinorUnits: paymentEvent.resultingBalanceMinorUnits,
          idempotencyKey: paymentEvent.idempotencyKey,
          createdAt: paymentEvent.createdAt,
        },
        invoice: {
          id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
          status: invoice.status,
          isPaidLate: invoice.isPaidLate,
          revision: invoice.revision,
          fullyPaidAt: invoice.fullyPaidAt,
        },
      };
    });
  }

  static async getPaymentsForInvoice(invoiceId: string, organizationId: string) {
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      organizationId: new Types.ObjectId(organizationId),
    });

    if (!invoice) {
      throw new AppError({
        statusCode: 404,
        code: 'INVOICE_NOT_FOUND',
        message: 'Invoice not found.',
      });
    }

    const payments = await PaymentEvent.find({ invoiceId: invoice._id })
      .sort({ effectivePaymentDate: -1, createdAt: -1 })
      .populate('recordedByUserId', 'firstName lastName email');

    return {
      invoice: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        amountMinorUnits: invoice.amountMinorUnits,
        currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
        status: invoice.status,
        dueDate: invoice.dueDate,
        isPaidLate: invoice.isPaidLate,
        revision: invoice.revision,
      },
      payments: payments.map((p: any) => ({
        id: p._id.toString(),
        amountMinorUnits: p.amountMinorUnits,
        effectivePaymentDate: p.effectivePaymentDate,
        paymentMethodCategory: p.paymentMethodCategory,
        previousBalanceMinorUnits: p.previousBalanceMinorUnits,
        resultingBalanceMinorUnits: p.resultingBalanceMinorUnits,
        idempotencyKey: p.idempotencyKey,
        notes: p.notes,
        recordedBy: `${p.recordedByUserId?.firstName || ''} ${p.recordedByUserId?.lastName || ''}`.trim(),
        createdAt: p.createdAt,
      })),
    };
  }

  static async getInvoices(organizationId: string, status?: string, page = 1, limit = 20) {
    const query: any = { organizationId: new Types.ObjectId(organizationId) };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(query),
    ]);

    return {
      data: invoices.map((inv) => ({
        id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerPostalCode: inv.customerPostalCode,
        amountMinorUnits: inv.amountMinorUnits,
        currentBalanceMinorUnits: inv.currentBalanceMinorUnits,
        currency: inv.currency,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        dueDateBasis: inv.dueDateBasis,
        status: inv.status,
        isPaidLate: inv.isPaidLate,
        fullyPaidAt: inv.fullyPaidAt,
        revision: inv.revision,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }
}
