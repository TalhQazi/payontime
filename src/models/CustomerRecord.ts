import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICustomerRecord extends Document {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  postalCode: string;
  phoneLast4?: string;
  emailDomain?: string;
  addressCityState?: string;
  totalInvoicesCount: number;
  onTimePaymentsCount: number;
  latePaymentsCount: number;
  totalPaidMinorUnits: number;
  totalOutstandingMinorUnits: number;
  disputeActiveCount: number;
  contributingOrganizationsCount: number;
  lastUpdatedDate: Date;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerRecordSchema = new Schema<ICustomerRecord>(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true, index: true },
    companyName: { type: String, trim: true, index: true },
    postalCode: { type: String, required: true, trim: true, index: true },
    phoneLast4: { type: String, trim: true, index: true },
    emailDomain: { type: String, trim: true },
    addressCityState: { type: String, trim: true },
    totalInvoicesCount: { type: Number, default: 0 },
    onTimePaymentsCount: { type: Number, default: 0 },
    latePaymentsCount: { type: Number, default: 0 },
    totalPaidMinorUnits: { type: Number, default: 0 }, // in cents
    totalOutstandingMinorUnits: { type: Number, default: 0 }, // in cents
    disputeActiveCount: { type: Number, default: 0 },
    contributingOrganizationsCount: { type: Number, default: 1 },
    lastUpdatedDate: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

CustomerRecordSchema.index({ lastName: 1, postalCode: 1 });
CustomerRecordSchema.index({ companyName: 1, postalCode: 1 });

export const CustomerRecord = mongoose.model<ICustomerRecord>(
  'CustomerRecord',
  CustomerRecordSchema
);
