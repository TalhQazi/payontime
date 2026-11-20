import mongoose, { Schema, Document, Types } from 'mongoose';
import { NotificationType } from '../types/index.js';

export interface INotification extends Document {
  userId?: Types.ObjectId;
  organizationId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  bodyMasked: string; // Zero PII in push/lock-screen payloads
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
  readAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    type: {
      type: String,
      enum: [
        'BUSINESS_VERIFICATION',
        'DISPUTE_ACTION',
        'EVIDENCE_REQUEST',
        'OVERDUE_UPDATE',
        'PAYMENT_STATUS',
        'SECURITY_EVENT',
        'SUBSCRIPTION_CHANGE',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    bodyMasked: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    referenceId: {
      type: String,
    },
    referenceType: {
      type: String,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
