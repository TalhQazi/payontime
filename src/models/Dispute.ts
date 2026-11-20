import mongoose, { Schema, Document, Types } from 'mongoose';
import { DisputeStatus, DisputeType } from '../types/index.js';

export interface IDispute extends Document {
  customerRecordId: Types.ObjectId;
  invoiceId: Types.ObjectId;
  organizationId: Types.ObjectId;
  filedByCustomerUserId?: Types.ObjectId;
  customerName: string;
  disputeType: DisputeType;
  explanation: string;
  status: DisputeStatus;
  deadline: Date; // Authoritative policy deadline from backend
  evidenceIds: Types.ObjectId[];
  decisionSummary?: string;
  decidedAt?: Date;
  decidedBy?: Types.ObjectId;
  appealDeadline?: Date;
  appealCount: number;
  appealReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema = new Schema<IDispute>(
  {
    customerRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerRecord',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    filedByCustomerUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    disputeType: {
      type: String,
      enum: [
        'INCORRECT_AMOUNT',
        'ALREADY_PAID',
        'NEVER_RECEIVED_SERVICE',
        'IDENTITY_THEFT',
        'TERMS_DISPUTE',
        'OTHER',
      ],
      required: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'UNDER_REVIEW',
        'EVIDENCE_REQUESTED',
        'RESPONDED',
        'RESOLVED_CUSTOMER_FAVOR',
        'RESOLVED_BUSINESS_FAVOR',
        'APPEALED',
      ],
      default: 'OPEN',
      index: true,
    },
    deadline: {
      type: Date,
      required: true,
      index: true,
    },
    evidenceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Evidence',
      },
    ],
    decisionSummary: {
      type: String,
    },
    decidedAt: {
      type: Date,
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    appealDeadline: {
      type: Date,
    },
    appealCount: {
      type: Number,
      default: 0,
    },
    appealReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

DisputeSchema.index({ organizationId: 1, status: 1 });

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
