import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../types/index.js';

export interface IOrganizationMember extends Document {
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: UserRole;
  permissions: string[];
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  invitedBy?: Types.ObjectId;
  joinedAt: Date;
  updatedAt: Date;
}

const OrganizationMemberSchema = new Schema<IOrganizationMember>(
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
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER', 'READONLY', 'CUSTOMER'],
      default: 'MEMBER',
    },
    permissions: {
      type: [String],
      default: ['SEARCH_CUSTOMERS', 'VIEW_REPORTS', 'CREATE_REPORTS'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INVITED', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMember = mongoose.model<IOrganizationMember>(
  'OrganizationMember',
  OrganizationMemberSchema
);
