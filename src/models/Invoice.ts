import mongoose, { Schema, Document, Types } from 'mongoose';
import { DueDateBasis, InvoiceStatus } from '../types/index.js';

export interface IInvoice extends Document {
  organizationId: Types.ObjectId;
  customerRecordId: Types.ObjectId;
  customerName: string;
  customerPostalCode: string;
  invoiceNumber: string;
  serviceDescription: string;
  amountMinorUnits: number; // e.g., $1500.00 = 150000 cents
  currency: string; // e.g., 'USD'
  issueDate: Date;
  dueDate: Date;
  dueDateBasis: DueDateBasis;
  status: InvoiceStatus;
  currentBalanceMinorUnits: number; // Authoritative balance in minor units
  isPaidLate: boolean; // Preserves historical late-payment flag even when balance reaches 0
  fullyPaidAt?: Date;
  evidenceIds: Types.ObjectId[];
  attestation: {
    signedByUserId: Types.ObjectId;
    signedAt: Date;
    termsAccepted: boolean;
  };
  revision: number; // For optimistic concurrency and conflict detection
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
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
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerPostalCode: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    serviceDescription: {
      type: String,
      required: true,
      trim: true,
    },
    amountMinorUnits: {
      type: Number,
      required: true,
      min: 1, // must be positive integer cents
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    dueDateBasis: {
      type: String,
      enum: ['NET_30', 'NET_15', 'UPON_RECEIPT', 'CUSTOM'],
      default: 'NET_30',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'PARTIALLY_PAID', 'PAID', 'DEFAULTED', 'DISPUTED'],
      default: 'SUBMITTED',
      index: true,
    },
    currentBalanceMinorUnits: {
      type: Number,
      required: true,
      min: 0,
    },
    isPaidLate: {
      type: Boolean,
      default: false,
      index: true,
    },
    fullyPaidAt: {
      type: Date,
    },
    evidenceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Evidence',
      },
    ],
    attestation: {
      signedByUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      signedAt: {
        type: Date,
        default: Date.now,
      },
      termsAccepted: {
        type: Boolean,
        required: true,
        default: true,
      },
    },
    revision: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ organizationId: 1, status: 1 });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
