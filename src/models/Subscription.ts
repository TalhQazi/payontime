import mongoose, { Schema, Document, Types } from 'mongoose';
import { SubscriptionPlan, SubscriptionStatus } from '../types/index.js';

export interface ISubscription extends Document {
  organizationId: Types.ObjectId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  limits: {
    monthlySearches: number;
    monthlyReports: number;
    maxTeamMembers: number;
  };
  usage: {
    searchCount: number;
    reportCount: number;
  };
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['STARTER', 'GROWTH', 'ENTERPRISE'],
      default: 'STARTER',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELLED'],
      default: 'TRIALING',
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    limits: {
      monthlySearches: { type: Number, default: 25 },
      monthlyReports: { type: Number, default: 50 },
      maxTeamMembers: { type: Number, default: 3 },
    },
    usage: {
      searchCount: { type: Number, default: 0 },
      reportCount: { type: Number, default: 0 },
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
