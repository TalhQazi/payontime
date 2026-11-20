import { Types } from 'mongoose';
import {
  BusinessVerification,
  Organization,
  Notification,
  AuditLog,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { VerificationDocType } from '../types/index.js';

export class VerificationService {
  static async submit(
    organizationId: string,
    userId: string,
    documents: Array<{ docType: VerificationDocType; evidenceId: string; notes?: string }>
  ) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found.',
      });
    }

    if (documents.length === 0) {
      throw new AppError({
        statusCode: 400,
        code: 'DOCUMENTS_REQUIRED',
        message: 'At least one identity or business document is required for verification.',
      });
    }

    const formattedDocs = documents.map((doc) => ({
      docType: doc.docType,
      evidenceId: new Types.ObjectId(doc.evidenceId),
      status: 'PENDING' as const,
      notes: doc.notes,
    }));

    const verification = await BusinessVerification.findOneAndUpdate(
      { organizationId: org._id },
      {
        organizationId: org._id,
        submittedByUserId: new Types.ObjectId(userId),
        documents: formattedDocs,
        status: 'IN_REVIEW',
        reviewNotes: 'Documents submitted. Pending compliance specialist review.',
      },
      { upsert: true, new: true }
    );

    org.status = 'IN_REVIEW';
    await org.save();

    await AuditLog.create({
      organizationId: org._id,
      userId: new Types.ObjectId(userId),
      action: 'BUSINESS_VERIFICATION_SUBMITTED',
      resource: 'BusinessVerification',
      resourceId: verification._id.toString(),
      details: { documentCount: documents.length },
    });

    await Notification.create({
      userId: new Types.ObjectId(userId),
      organizationId: org._id,
      type: 'BUSINESS_VERIFICATION',
      title: 'Verification In Review',
      bodyMasked: 'Your business verification documents have been received and are in review.',
    });

    return verification;
  }

  static async getStatus(organizationId: string) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found.',
      });
    }

    const verification = await BusinessVerification.findOne({
      organizationId: org._id,
    })
      .populate('documents.evidenceId')
      .sort({ createdAt: -1 });

    return {
      organizationStatus: org.status,
      isApproved: org.status === 'APPROVED',
      verificationDetails: verification
        ? {
            status: verification.status,
            submittedAt: verification.createdAt,
            verifiedAt: verification.verifiedAt,
            reviewNotes: verification.reviewNotes,
            documents: verification.documents,
            rejectionReason: verification.rejectionReason,
          }
        : {
            status: 'NOT_SUBMITTED',
            requirements: [
              'BUSINESS_LICENSE',
              'CERTIFICATE_OF_INCORPORATION',
              'TAX_ID_DOCUMENT',
              'GOVERNMENT_PHOTO_ID',
            ],
          },
    };
  }

  static async approve(organizationId: string, reviewerUserId: string) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found.',
      });
    }

    org.status = 'APPROVED';
    await org.save();

    const verification = await BusinessVerification.findOneAndUpdate(
      { organizationId: org._id },
      {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        reviewedBy: new Types.ObjectId(reviewerUserId),
        reviewNotes: 'Identity and organization documentation verified successfully.',
      },
      { new: true }
    );

    await Notification.create({
      userId: org.ownerId,
      organizationId: org._id,
      type: 'BUSINESS_VERIFICATION',
      title: 'Business Verification Approved',
      bodyMasked: 'Congratulations! Your business verification has been approved. You now have full access to customer search and report publishing.',
    });

    return verification;
  }
}
