import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISyncOperation extends Document {
  clientUuid: string;
  clientId: string;
  organizationId: Types.ObjectId;
  userId: Types.ObjectId;
  operationType: 'CREATE_REPORT' | 'RECORD_PAYMENT' | 'UPDATE_DISPUTE';
  payload: any;
  status: 'PENDING' | 'PROCESSED' | 'CONFLICT' | 'REJECTED';
  revision: number;
  serverReceivedAt: Date;
  serverCommittedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

const SyncOperationSchema = new Schema<ISyncOperation>(
  {
    clientUuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: String,
      required: true,
    },
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
    operationType: {
      type: String,
      enum: ['CREATE_REPORT', 'RECORD_PAYMENT', 'UPDATE_DISPUTE'],
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'CONFLICT', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    revision: {
      type: Number,
      default: 1,
    },
    serverReceivedAt: {
      type: Date,
      default: Date.now,
    },
    serverCommittedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const SyncOperation = mongoose.model<ISyncOperation>(
  'SyncOperation',
  SyncOperationSchema
);
