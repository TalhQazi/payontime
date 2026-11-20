import { Types } from 'mongoose';
import {
  Dispute,
  DisputeResponse,
  Invoice,
  CustomerRecord,
  Evidence,
  AuditLog,
  Notification,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { DisputeType, DisputeStatus } from '../types/index.js';

export interface CreateDisputeInput {
  invoiceId: string;
  customerName: string;
  disputeType: DisputeType;
  explanation: string;
  evidenceIds: string[];
}

export interface RespondDisputeInput {
  responseText: string;
  responseType: 'CONTEST' | 'ACCEPT' | 'PROVIDE_INFO';
  evidenceIds: string[];
}

export class DisputeService {
  private static POLICY_RESPONSE_DAYS = 14;
  private static POLICY_APPEAL_DAYS = 15;

  static async createDispute(
    input: CreateDisputeInput,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const invoice = await Invoice.findById(input.invoiceId);
    if (!invoice) {
      throw new AppError({
        statusCode: 404,
        code: 'INVOICE_NOT_FOUND',
        message: 'Invoice not found.',
      });
    }

    // Authoritative backend deadline policy: exactly 14 days from filing
    const deadline = new Date(Date.now() + this.POLICY_RESPONSE_DAYS * 24 * 60 * 60 * 1000);

    const dispute = await Dispute.create({
      customerRecordId: invoice.customerRecordId,
      invoiceId: invoice._id,
      organizationId: invoice.organizationId,
      filedByCustomerUserId: userId ? new Types.ObjectId(userId) : undefined,
      customerName: input.customerName.trim(),
      disputeType: input.disputeType,
      explanation: input.explanation.trim(),
      status: 'OPEN',
      deadline,
      evidenceIds: input.evidenceIds.map((id) => new Types.ObjectId(id)),
      appealCount: 0,
    });

    // Mark invoice status as DISPUTED
    invoice.status = 'DISPUTED';
    await invoice.save();

    // Increment CustomerRecord disputeActiveCount
    await CustomerRecord.findByIdAndUpdate(invoice.customerRecordId, {
      $inc: { disputeActiveCount: 1 },
      lastUpdatedDate: new Date(),
    });

    // Link uploaded evidence
    if (input.evidenceIds.length > 0) {
      await Evidence.updateMany(
        { _id: { $in: input.evidenceIds.map((id) => new Types.ObjectId(id)) } },
        { relatedEntityType: 'DISPUTE', relatedEntityId: dispute._id }
      );
    }

    await AuditLog.create({
      organizationId: invoice.organizationId,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      action: 'DISPUTE_FILED',
      resource: 'Dispute',
      resourceId: dispute._id.toString(),
      ipAddress,
      userAgent,
      details: {
        invoiceId: invoice._id.toString(),
        disputeType: input.disputeType,
        authoritativeDeadline: deadline,
      },
    });

    // Send notification to organization members
    await Notification.create({
      organizationId: invoice.organizationId,
      type: 'DISPUTE_ACTION',
      title: 'New Dispute Filed',
      bodyMasked: `A dispute has been opened for invoice #${invoice.invoiceNumber}. Authoritative response required before deadline.`,
      referenceId: dispute._id.toString(),
      referenceType: 'Dispute',
    });

    return dispute;
  }

  static async getDisputes(organizationId: string, status?: string, page = 1, limit = 20) {
    const query: any = { organizationId: new Types.ObjectId(organizationId) };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate('invoiceId')
        .sort({ deadline: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Dispute.countDocuments(query),
    ]);

    const now = Date.now();

    return {
      data: disputes.map((d: any) => {
        const msRemaining = new Date(d.deadline).getTime() - now;
        const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

        return {
          id: d._id.toString(),
          invoiceId: d.invoiceId?._id?.toString(),
          invoiceNumber: d.invoiceId?.invoiceNumber,
          customerName: d.customerName,
          disputeType: d.disputeType,
          status: d.status,
          deadline: d.deadline,
          daysRemaining,
          isUrgent: daysRemaining <= 3 && d.status === 'OPEN',
          appealCount: d.appealCount,
          createdAt: d.createdAt,
        };
      }),
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

  static async getDisputeById(disputeId: string, organizationId?: string) {
    const query: any = { _id: disputeId };
    if (organizationId) {
      query.organizationId = new Types.ObjectId(organizationId);
    }

    const dispute: any = await Dispute.findOne(query)
      .populate('invoiceId')
      .populate('evidenceIds');

    if (!dispute) {
      throw new AppError({
        statusCode: 404,
        code: 'DISPUTE_NOT_FOUND',
        message: 'Dispute record not found.',
      });
    }

    const responses = await DisputeResponse.find({ disputeId: dispute._id })
      .populate('evidenceIds')
      .populate('respondedByUserId', 'firstName lastName email')
      .sort({ submittedAt: 1 });

    const msRemaining = new Date(dispute.deadline).getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    return {
      id: dispute._id.toString(),
      customerName: dispute.customerName,
      disputeType: dispute.disputeType,
      explanation: dispute.explanation,
      status: dispute.status,
      deadline: dispute.deadline,
      daysRemaining,
      decisionSummary: dispute.decisionSummary,
      decidedAt: dispute.decidedAt,
      appealDeadline: dispute.appealDeadline,
      appealCount: dispute.appealCount,
      createdAt: dispute.createdAt,
      invoice: dispute.invoiceId
        ? {
            id: dispute.invoiceId._id.toString(),
            invoiceNumber: dispute.invoiceId.invoiceNumber,
            amountMinorUnits: dispute.invoiceId.amountMinorUnits,
            currentBalanceMinorUnits: dispute.invoiceId.currentBalanceMinorUnits,
            dueDate: dispute.invoiceId.dueDate,
          }
        : null,
      evidence: dispute.evidenceIds.map((e: any) => ({
        id: e._id.toString(),
        fileName: e.originalFileName,
        mimeType: e.mimeType,
        sizeBytes: e.fileSizeBytes,
      })),
      responses: responses.map((r: any) => ({
        id: r._id.toString(),
        responseType: r.responseType,
        responseText: r.responseText,
        respondedBy: `${r.respondedByUserId?.firstName || ''} ${r.respondedByUserId?.lastName || ''}`.trim(),
        submittedAt: r.submittedAt,
        evidence: (r.evidenceIds as any[]).map((e) => ({
          id: e._id.toString(),
          fileName: e.originalFileName,
          mimeType: e.mimeType,
        })),
      })),
    };
  }

  static async submitResponse(
    disputeId: string,
    organizationId: string,
    userId: string,
    input: RespondDisputeInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const dispute = await Dispute.findOne({
      _id: disputeId,
      organizationId: new Types.ObjectId(organizationId),
    });

    if (!dispute) {
      throw new AppError({
        statusCode: 404,
        code: 'DISPUTE_NOT_FOUND',
        message: 'Dispute record not found.',
      });
    }

    if (['RESOLVED_CUSTOMER_FAVOR', 'RESOLVED_BUSINESS_FAVOR'].includes(dispute.status)) {
      throw new AppError({
        statusCode: 400,
        code: 'DISPUTE_ALREADY_RESOLVED',
        message: 'This dispute has already reached a final decision.',
      });
    }

    const response = await DisputeResponse.create({
      disputeId: dispute._id,
      organizationId: dispute.organizationId,
      respondedByUserId: new Types.ObjectId(userId),
      responseText: input.responseText.trim(),
      evidenceIds: input.evidenceIds.map((id) => new Types.ObjectId(id)),
      responseType: input.responseType,
      submittedAt: new Date(),
    });

    dispute.status = 'RESPONDED';
    await dispute.save();

    await AuditLog.create({
      organizationId: dispute.organizationId,
      userId: new Types.ObjectId(userId),
      action: 'DISPUTE_RESPONSE_SUBMITTED',
      resource: 'Dispute',
      resourceId: dispute._id.toString(),
      ipAddress,
      userAgent,
      details: { responseType: input.responseType },
    });

    await Notification.create({
      organizationId: dispute.organizationId,
      type: 'DISPUTE_ACTION',
      title: 'Dispute Response Submitted',
      bodyMasked: `A response to the dispute has been recorded and submitted for final review.`,
      referenceId: dispute._id.toString(),
      referenceType: 'Dispute',
    });

    return response;
  }

  static async submitAppeal(disputeId: string, reason: string, userId?: string) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      throw new AppError({
        statusCode: 404,
        code: 'DISPUTE_NOT_FOUND',
        message: 'Dispute record not found.',
      });
    }

    if (dispute.appealDeadline && new Date() > dispute.appealDeadline) {
      throw new AppError({
        statusCode: 400,
        code: 'APPEAL_DEADLINE_EXPIRED',
        message: 'The statutory window to appeal this decision has expired.',
      });
    }

    dispute.status = 'APPEALED';
    dispute.appealCount += 1;
    dispute.appealReason = reason;
    // New 14-day appeal review window
    dispute.deadline = new Date(Date.now() + this.POLICY_RESPONSE_DAYS * 24 * 60 * 60 * 1000);
    await dispute.save();

    await AuditLog.create({
      organizationId: dispute.organizationId,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      action: 'DISPUTE_APPEALED',
      resource: 'Dispute',
      resourceId: dispute._id.toString(),
      details: { appealCount: dispute.appealCount },
    });

    return dispute;
  }
}
