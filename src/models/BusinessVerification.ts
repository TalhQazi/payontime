import mongoose, { Schema, Document, Types } from 'mongoose';
import { VerificationDocType, VerificationStatus } from '../types/index.js';

export interface IVerificationDocument {
  docType: VerificationDocType;
  evidenceId: Types.ObjectId;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
}

export interface IBusinessVerification extends Document {
  organizationId: Types.ObjectId;
  submittedByUserId: Types.ObjectId;
  documents: IVerificationDocument[];
  status: VerificationStatus;
  reviewNotes?: string;
  verifiedAt?: Date;
  reviewedBy?: Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationDocumentSchema = new Schema<IVerificationDocument>({
  docType: {
    type: String,
    enum: [
      'BUSINESS_LICENSE',
      'CERTIFICATE_OF_INCORPORATION',
      'TAX_ID_DOCUMENT',
      'UTILITY_BILL',
      'GOVERNMENT_PHOTO_ID',
      'BANK_STATEMENT',
    ],
    required: true,
  },
  evidenceId: {
    type: Schema.Types.ObjectId,
    ref: 'Evidence',
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING',
  },
  notes: { type: String },
});

const BusinessVerificationSchema = new Schema<IBusinessVerification>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    submittedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documents: [VerificationDocumentSchema],
    status: {
      type: String,
      enum: ['SUBMITTED', 'IN_REVIEW', 'VERIFIED', 'REJECTED', 'ADDITIONAL_INFO_REQUIRED'],
      default: 'SUBMITTED',
      index: true,
    },
    reviewNotes: { type: String },
    verifiedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

export const BusinessVerification = mongoose.model<IBusinessVerification>(
  'BusinessVerification',
  BusinessVerificationSchema
);
