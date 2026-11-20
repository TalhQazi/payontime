import { Types } from 'mongoose';
import {
  Organization,
  OrganizationMember,
  Subscription,
  BusinessVerification,
  User,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';

export class OrganizationService {
  static async getCurrent(organizationId: string) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found.',
      });
    }

    const subscription = await Subscription.findOne({ organizationId: org._id });
    const verification = await BusinessVerification.findOne({ organizationId: org._id }).sort({
      createdAt: -1,
    });

    return {
      organization: {
        id: org._id.toString(),
        name: org.name,
        legalBusinessName: org.legalBusinessName,
        taxIdMasked: `***-**-${org.taxId.slice(-4)}`,
        businessType: org.businessType,
        address: org.address,
        phone: org.phone,
        website: org.website,
        status: org.status,
        isComplianceApproved: org.isComplianceApproved,
        createdAt: org.createdAt,
      },
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            limits: subscription.limits,
            usage: subscription.usage,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      verification: verification
        ? {
            status: verification.status,
            submittedAt: verification.createdAt,
            verifiedAt: verification.verifiedAt,
            reviewNotes: verification.reviewNotes,
          }
        : null,
    };
  }

  static async getMembers(organizationId: string) {
    const members = await OrganizationMember.find({ organizationId })
      .populate('userId', 'firstName lastName email role')
      .sort({ joinedAt: 1 });

    return members.map((m: any) => ({
      id: m._id.toString(),
      userId: m.userId?._id?.toString(),
      name: `${m.userId?.firstName || ''} ${m.userId?.lastName || ''}`.trim(),
      email: m.userId?.email,
      role: m.role,
      permissions: m.permissions,
      status: m.status,
      joinedAt: m.joinedAt,
    }));
  }

  static async create(userId: string, data: any) {
    const org = await Organization.create({
      name: data.name,
      legalBusinessName: data.legalBusinessName,
      taxId: data.taxId,
      businessType: data.businessType,
      address: {
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: 'USA',
      },
      phone: data.phone,
      website: data.website,
      status: 'PENDING_VERIFICATION',
      isComplianceApproved: false,
      ownerId: new Types.ObjectId(userId),
    });

    await OrganizationMember.create({
      organizationId: org._id,
      userId: new Types.ObjectId(userId),
      role: 'OWNER',
      permissions: ['ALL'],
      status: 'ACTIVE',
    });

    await Subscription.create({
      organizationId: org._id,
      plan: 'STARTER',
      status: 'TRIALING',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      limits: {
        monthlySearches: 25,
        monthlyReports: 50,
        maxTeamMembers: 3,
      },
      usage: {
        searchCount: 0,
        reportCount: 0,
      },
    });

    // Update user's current organization
    await User.findByIdAndUpdate(userId, { currentOrganizationId: org._id });

    return org;
  }
}
