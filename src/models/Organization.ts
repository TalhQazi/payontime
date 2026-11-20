import mongoose, { Schema, Document, Types } from 'mongoose';
import { OrganizationStatus } from '../types/index.js';

export interface IOrganization extends Document {
  name: string;
  legalBusinessName: string;
  taxId: string; // EIN / SSN
  businessType: 'SOLE_PROPRIETORSHIP' | 'LLC' | 'CORPORATION' | 'PARTNERSHIP' | 'OTHER';
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  website?: string;
  status: OrganizationStatus;
  isComplianceApproved: boolean; // Must be true before publishing reports to live network
  ownerId: Types.ObjectId;
  settings: {
    allowMemberInvites: boolean;
    requireMfaForMembers: boolean;
    defaultNetTerms: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    legalBusinessName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    taxId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    businessType: {
      type: String,
      enum: ['SOLE_PROPRIETORSHIP', 'LLC', 'CORPORATION', 'PARTNERSHIP', 'OTHER'],
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true, index: true },
      country: { type: String, default: 'USA' },
    },
    phone: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING_VERIFICATION', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    isComplianceApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    settings: {
      allowMemberInvites: { type: Boolean, default: true },
      requireMfaForMembers: { type: Boolean, default: false },
      defaultNetTerms: { type: Number, default: 30 },
    },
  },
  {
    timestamps: true,
  }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
