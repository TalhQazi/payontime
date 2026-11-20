import mongoose, { Schema, Document, Types } from 'mongoose';
import { ComplianceApprovalStatus, ReportStatus } from '../types/index.js';

export interface IReport extends Document {
  organizationId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  customerRecordId: Types.ObjectId;
  status: ReportStatus;
  submissionReceiptNumber: string;
  publishedToNetwork: boolean;
  complianceApprovalStatus: ComplianceApprovalStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    customerRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerRecord',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'ACCEPTED', 'NEEDS_REVIEW', 'REJECTED'],
      default: 'SUBMITTED',
      index: true,
    },
    submissionReceiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publishedToNetwork: {
      type: Boolean,
      default: false,
      index: true,
    },
    complianceApprovalStatus: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'GATED'],
      default: 'GATED',
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ organizationId: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);
