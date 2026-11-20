import mongoose, { Schema, Document, Types } from 'mongoose';
import { PaymentMethodCategory } from '../types/index.js';

export interface IPaymentEvent extends Document {
  invoiceId: Types.ObjectId;
  organizationId: Types.ObjectId;
  customerRecordId: Types.ObjectId;
  amountMinorUnits: number; // in cents
  currency: string;
  effectivePaymentDate: Date;
  paymentMethodCategory: PaymentMethodCategory;
  supportingEvidenceId?: Types.ObjectId;
  previousBalanceMinorUnits: number;
  resultingBalanceMinorUnits: number;
  idempotencyKey: string;
  notes?: string;
  recordedByUserId: Types.ObjectId;
  createdAt: Date;
}

const PaymentEventSchema = new Schema<IPaymentEvent>(
  {
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
    customerRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'CustomerRecord',
      required: true,
      index: true,
    },
    amountMinorUnits: {
      type: Number,
      required: true,
      min: 1, // positive minor units
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    effectivePaymentDate: {
      type: Date,
      required: true,
    },
    paymentMethodCategory: {
      type: String,
      enum: ['ACH', 'CREDIT_CARD', 'CHECK', 'WIRE', 'CASH', 'OTHER'],
      required: true,
    },
    supportingEvidenceId: {
      type: Schema.Types.ObjectId,
      ref: 'Evidence',
    },
    previousBalanceMinorUnits: {
      type: Number,
      required: true,
      min: 0,
    },
    resultingBalanceMinorUnits: {
      type: Number,
      required: true,
      min: 0,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    recordedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PaymentEventSchema.index({ invoiceId: 1, createdAt: 1 });

export const PaymentEvent = mongoose.model<IPaymentEvent>('PaymentEvent', PaymentEventSchema);
