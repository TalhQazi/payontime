import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IIdempotencyRecord extends Document {
  key: string;
  organizationId: Types.ObjectId;
  endpoint: string;
  requestHash: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  responseStatusCode?: number;
  responseBody?: any;
  createdAt: Date;
  expiresAt: Date;
}

const IdempotencyRecordSchema = new Schema<IIdempotencyRecord>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    requestHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PROCESSING',
    },
    responseStatusCode: {
      type: Number,
    },
    responseBody: {
      type: Schema.Types.Mixed,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const IdempotencyRecord = mongoose.model<IIdempotencyRecord>(
  'IdempotencyRecord',
  IdempotencyRecordSchema
);
