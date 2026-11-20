import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRegisteredDevice extends Document {
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  pushToken?: string;
  appVersion: string;
  deviceModel?: string;
  osVersion?: string;
  lastActiveAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
}

const RegisteredDeviceSchema = new Schema<IRegisteredDevice>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web'],
      required: true,
    },
    pushToken: {
      type: String,
    },
    appVersion: {
      type: String,
      default: '1.0.0',
    },
    deviceModel: {
      type: String,
    },
    osVersion: {
      type: String,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

RegisteredDeviceSchema.index({ userId: 1, isRevoked: 1 });

export const RegisteredDevice = mongoose.model<IRegisteredDevice>(
  'RegisteredDevice',
  RegisteredDeviceSchema
);
