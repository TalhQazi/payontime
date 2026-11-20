import mongoose, { Schema, Document, Types } from 'mongoose';
import { EvidenceEntityType } from '../types/index.js';

export interface IEvidence extends Document {
  organizationId?: Types.ObjectId;
  uploadedByUserId: Types.ObjectId;
  relatedEntityType: EvidenceEntityType;
  relatedEntityId?: Types.ObjectId;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  storagePathOrKey: string;
  sha256Checksum: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    uploadedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: ['INVOICE', 'PAYMENT', 'DISPUTE', 'VERIFICATION'],
      required: true,
    },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
    },
    storagePathOrKey: {
      type: String,
      required: true,
    },
    sha256Checksum: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Evidence = mongoose.model<IEvidence>('Evidence', EvidenceSchema);
