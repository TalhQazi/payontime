import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDisputeResponse extends Document {
  disputeId: Types.ObjectId;
  organizationId: Types.ObjectId;
  respondedByUserId: Types.ObjectId;
  responseText: string;
  evidenceIds: Types.ObjectId[];
  responseType: 'CONTEST' | 'ACCEPT' | 'PROVIDE_INFO';
  submittedAt: Date;
}

const DisputeResponseSchema = new Schema<IDisputeResponse>(
  {
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: 'Dispute',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    respondedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    responseText: {
      type: String,
      required: true,
      trim: true,
    },
    evidenceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Evidence',
      },
    ],
    responseType: {
      type: String,
      enum: ['CONTEST', 'ACCEPT', 'PROVIDE_INFO'],
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const DisputeResponse = mongoose.model<IDisputeResponse>(
  'DisputeResponse',
  DisputeResponseSchema
);
