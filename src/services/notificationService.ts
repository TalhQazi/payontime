import { Types } from 'mongoose';
import { Notification, RegisteredDevice, AuditLog } from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class NotificationService {
  static async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ userId: new Types.ObjectId(userId) }),
      Notification.countDocuments({ userId: new Types.ObjectId(userId), isRead: false }),
    ]);

    return {
      data: notifications.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        bodyMasked: n.bodyMasked,
        isRead: n.isRead,
        referenceId: n.referenceId,
        referenceType: n.referenceType,
        createdAt: n.createdAt,
      })),
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: new Types.ObjectId(userId),
      },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      throw new AppError({
        statusCode: 404,
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Notification not found.',
      });
    }

    return notification;
  }

  static async registerDevice(userId: string, organizationId: string | undefined, data: any) {
    const device = await RegisteredDevice.findOneAndUpdate(
      { deviceId: data.deviceId },
      {
        userId: new Types.ObjectId(userId),
        organizationId: organizationId ? new Types.ObjectId(organizationId) : undefined,
        deviceId: data.deviceId,
        platform: data.platform,
        pushToken: data.pushToken,
        appVersion: data.appVersion || '1.0.0',
        deviceModel: data.deviceModel,
        osVersion: data.osVersion,
        lastActiveAt: new Date(),
        isRevoked: false,
      },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      userId: new Types.ObjectId(userId),
      organizationId: organizationId ? new Types.ObjectId(organizationId) : undefined,
      action: 'DEVICE_REGISTERED',
      resource: 'RegisteredDevice',
      resourceId: device._id.toString(),
      details: { platform: data.platform, appVersion: data.appVersion },
    });

    return device;
  }
}
