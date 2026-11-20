import crypto from 'crypto';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import {
  Invoice,
  Report,
  CustomerRecord,
  Organization,
  Subscription,
  AuditLog,
  Evidence,
  Notification,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { withTransaction } from '../database/connection.js';

export interface CreateReportInput {
  customerName: string;
  customerPostalCode: string;
  customerPhoneLast4?: string;
  customerEmailDomain?: string;
  invoiceNumber: string;
  serviceDescription: string;
  amountMinorUnits: number;
  currency?: string;
  issueDate: string;
  dueDate: string;
  dueDateBasis: 'NET_30' | 'NET_15' | 'UPON_RECEIPT' | 'CUSTOM';
  evidenceIds: string[];
  termsAccepted: boolean;
  clientUuid?: string;
  idempotencyKey?: string;
}

export class InvoiceReportService {
  static async createReport(
    organizationId: string,
    userId: string,
    input: CreateReportInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Verify Organization status (Must be APPROVED)
    const org = await Organization.findById(organizationId);
    if (!org || org.status !== 'APPROVED') {
      throw new AppError({
        statusCode: 403,
        code: 'ORGANIZATION_NOT_VERIFIED',
        message: 'Your organization must be verified and approved before submitting customer invoice reports.',
      });
    }

    // 2. Check Subscription Quotas
    const subscription = await Subscription.findOne({ organizationId: org._id });
    if (!subscription || (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING')) {
      throw new AppError({
        statusCode: 403,
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'An active subscription plan is required to submit reports.',
      });
    }

    if (subscription.usage.reportCount >= subscription.limits.monthlyReports) {
      throw new AppError({
        statusCode: 403,
        code: 'REPORT_QUOTA_EXCEEDED',
        message: 'You have reached your monthly report submission quota. Please upgrade your subscription.',
      });
    }

    // 3. Check for duplicate invoice number in this organization
    const existingInvoice = await Invoice.findOne({
      organizationId: org._id,
      invoiceNumber: input.invoiceNumber.trim(),
    });
    if (existingInvoice) {
      throw new AppError({
        statusCode: 409,
        code: 'INVOICE_NUMBER_ALREADY_EXISTS',
        message: `An invoice with invoice number "${input.invoiceNumber}" has already been submitted by your organization.`,
      });
    }

    return await withTransaction(async (session) => {
      // 4. Find or create matching CustomerRecord
      const nameParts = input.customerName.trim().split(/\s+/);
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts.length > 1 ? nameParts[0] : undefined;

      let customer = await CustomerRecord.findOne({
        postalCode: input.customerPostalCode.trim(),
        lastName: new RegExp(`^${lastName}$`, 'i'),
      }).session(session);

      if (!customer) {
        const [newCustomer] = await CustomerRecord.create(
          [
            {
              firstName,
              lastName,
              postalCode: input.customerPostalCode.trim(),
              phoneLast4: input.customerPhoneLast4,
              emailDomain: input.customerEmailDomain,
              totalInvoicesCount: 1,
              onTimePaymentsCount: 0,
              latePaymentsCount: 0,
              totalPaidMinorUnits: 0,
              totalOutstandingMinorUnits: input.amountMinorUnits,
              contributingOrganizationsCount: 1,
              isVerified: true,
            },
          ],
          { session }
        );
        customer = newCustomer;
      } else {
        customer.totalInvoicesCount += 1;
        customer.totalOutstandingMinorUnits += input.amountMinorUnits;
        customer.lastUpdatedDate = new Date();
        await customer.save({ session });
      }

      // 5. Create Invoice
      const [invoice] = await Invoice.create(
        [
          {
            organizationId: org._id,
            customerRecordId: customer._id,
            customerName: input.customerName.trim(),
            customerPostalCode: input.customerPostalCode.trim(),
            invoiceNumber: input.invoiceNumber.trim(),
            serviceDescription: input.serviceDescription.trim(),
            amountMinorUnits: input.amountMinorUnits,
            currency: (input.currency || 'USD').toUpperCase(),
            issueDate: new Date(input.issueDate),
            dueDate: new Date(input.dueDate),
            dueDateBasis: input.dueDateBasis,
            status: 'SUBMITTED',
            currentBalanceMinorUnits: input.amountMinorUnits,
            isPaidLate: false,
            evidenceIds: input.evidenceIds.map((id) => new Types.ObjectId(id)),
            attestation: {
              signedByUserId: new Types.ObjectId(userId),
              signedAt: new Date(),
              termsAccepted: input.termsAccepted,
            },
            revision: 1,
          },
        ],
        { session }
      );

      // 6. Generate unique receipt number
      const receiptNumber = `RP-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Compliance Gate: If live consumer reporting is not enabled, mark as GATED
      const complianceStatus = env.ENABLE_LIVE_CONSUMER_REPORTING ? 'APPROVED' : 'GATED';
      const published = env.ENABLE_LIVE_CONSUMER_REPORTING && org.isComplianceApproved;

      // 7. Create Report
      const [report] = await Report.create(
        [
          {
            organizationId: org._id,
            invoiceId: invoice._id,
            customerRecordId: customer._id,
            status: 'SUBMITTED',
            submissionReceiptNumber: receiptNumber,
            publishedToNetwork: published,
            complianceApprovalStatus: complianceStatus,
            submittedAt: new Date(),
          },
        ],
        { session }
      );

      // 8. Associate evidence records with invoice
      if (input.evidenceIds.length > 0) {
        await Evidence.updateMany(
          { _id: { $in: input.evidenceIds.map((id) => new Types.ObjectId(id)) } },
          { relatedEntityType: 'INVOICE', relatedEntityId: invoice._id }
        ).session(session);
      }

      // 9. Increment Subscription usage
      subscription.usage.reportCount += 1;
      await subscription.save({ session });

      // 10. Audit Log
      await AuditLog.create(
        [
          {
            organizationId: org._id,
            userId: new Types.ObjectId(userId),
            action: 'INVOICE_REPORT_SUBMITTED',
            resource: 'Report',
            resourceId: report._id.toString(),
            ipAddress,
            userAgent,
            details: {
              invoiceNumber: invoice.invoiceNumber,
              amountMinorUnits: invoice.amountMinorUnits,
              receiptNumber,
              complianceStatus,
            },
          },
        ],
        { session }
      );

      // 11. Notification
      await Notification.create(
        [
          {
            userId: new Types.ObjectId(userId),
            organizationId: org._id,
            type: 'PAYMENT_STATUS',
            title: 'Report Submitted',
            bodyMasked: `Invoice report #${invoice.invoiceNumber} has been recorded with receipt ${receiptNumber}.`,
            referenceId: report._id.toString(),
            referenceType: 'Report',
          },
        ],
        { session }
      );

      return {
        report: {
          id: report._id.toString(),
          receiptNumber: report.submissionReceiptNumber,
          status: report.status,
          publishedToNetwork: report.publishedToNetwork,
          complianceApprovalStatus: report.complianceApprovalStatus,
          submittedAt: report.submittedAt,
        },
        invoice: {
          id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amountMinorUnits: invoice.amountMinorUnits,
          currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
          dueDate: invoice.dueDate,
          status: invoice.status,
          revision: invoice.revision,
        },
      };
    });
  }

  static async getReports(organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      Report.find({ organizationId: new Types.ObjectId(organizationId) })
        .populate('invoiceId')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments({ organizationId: new Types.ObjectId(organizationId) }),
    ]);

    return {
      data: reports.map((r: any) => ({
        id: r._id.toString(),
        receiptNumber: r.submissionReceiptNumber,
        status: r.status,
        complianceApprovalStatus: r.complianceApprovalStatus,
        publishedToNetwork: r.publishedToNetwork,
        submittedAt: r.submittedAt,
        invoice: r.invoiceId
          ? {
              id: r.invoiceId._id.toString(),
              invoiceNumber: r.invoiceId.invoiceNumber,
              customerName: r.invoiceId.customerName,
              amountMinorUnits: r.invoiceId.amountMinorUnits,
              currentBalanceMinorUnits: r.invoiceId.currentBalanceMinorUnits,
              dueDate: r.invoiceId.dueDate,
              status: r.invoiceId.status,
              isPaidLate: r.invoiceId.isPaidLate,
            }
          : null,
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

  static async getReportById(reportId: string, organizationId: string) {
    const report: any = await Report.findOne({
      _id: reportId,
      organizationId: new Types.ObjectId(organizationId),
    }).populate('invoiceId customerRecordId');

    if (!report) {
      throw new AppError({
        statusCode: 404,
        code: 'REPORT_NOT_FOUND',
        message: 'Report not found or does not belong to your organization.',
      });
    }

    return {
      id: report._id.toString(),
      receiptNumber: report.submissionReceiptNumber,
      status: report.status,
      complianceApprovalStatus: report.complianceApprovalStatus,
      publishedToNetwork: report.publishedToNetwork,
      submittedAt: report.submittedAt,
      invoice: report.invoiceId,
      customer: report.customerRecordId,
    };
  }
}
