import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../types/index.js';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isEmailVerified: boolean;
  role: UserRole;
  currentOrganizationId?: Types.ObjectId;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes: string[];
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER', 'READONLY', 'CUSTOMER'],
      default: 'MEMBER',
      index: true,
    },
    currentOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaBackupCodes: {
      type: [String],
      default: [],
      select: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
      default: 'ACTIVE',
      index: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
