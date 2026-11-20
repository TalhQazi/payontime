import mongoose, { Schema, Document, Types } from 'mongoose';
import { PermissiblePurpose } from '../types/index.js';

export interface ICustomerSearch extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  permissiblePurpose: PermissiblePurpose;
  attestationSigned: boolean;
  attestationText: string;
  searchCriteria: {
    name?: string;
    postalCode?: string;
    phoneLast4?: string;
    emailDomain?: string;
    companyName?: string;
  };
  resultsReturnedCount: number;
  matchConfidence: 'EXACT' | 'PROBABLE' | 'AMBIGUOUS' | 'NO_MATCH';
  matchedCustomerIds: Types.ObjectId[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const CustomerSearchSchema = new Schema<ICustomerSearch>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    permissiblePurpose: {
      type: String,
      enum: [
        'CREDIT_TRANSACTION',
        'COLLECTION_OF_ACCOUNT',
        'LEGITIMATE_BUSINESS_NEED_WITH_WRITTEN_PERMISSION',
        'EMPLOYMENT_WITH_WRITTEN_CONSENT',
        'COURT_ORDER',
      ],
      required: true,
    },
    attestationSigned: {
      type: Boolean,
      required: true,
      default: false,
    },
    attestationText: {
      type: String,
      required: true,
    },
    searchCriteria: {
      name: { type: String },
      postalCode: { type: String },
      phoneLast4: { type: String },
      emailDomain: { type: String },
      companyName: { type: String },
    },
    resultsReturnedCount: {
      type: Number,
      default: 0,
    },
    matchConfidence: {
      type: String,
      enum: ['EXACT', 'PROBABLE', 'AMBIGUOUS', 'NO_MATCH'],
      default: 'NO_MATCH',
    },
    matchedCustomerIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CustomerRecord',
      },
    ],
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

CustomerSearchSchema.index({ organizationId: 1, createdAt: -1 });

export const CustomerSearch = mongoose.model<ICustomerSearch>(
  'CustomerSearch',
  CustomerSearchSchema
);
