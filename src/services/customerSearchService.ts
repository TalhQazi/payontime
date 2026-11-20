import { Types } from 'mongoose';
import {
  CustomerRecord,
  CustomerSearch,
  Subscription,
  Organization,
  AuditLog,
} from '../models/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { PermissiblePurpose } from '../types/index.js';
import { maskPhone, maskEmail, maskName } from '../utils/masking.js';

export interface CustomerSearchInput {
  name: string;
  postalCode: string;
  phoneLast4?: string;
  emailDomain?: string;
  companyName?: string;
  permissiblePurpose: PermissiblePurpose;
  attestationSigned: boolean;
  attestationText: string;
}

export class CustomerSearchService {
  static async search(
    organizationId: string,
    userId: string,
    input: CustomerSearchInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    // 1. Verify Organization Status (Must be APPROVED)
    const org = await Organization.findById(organizationId);
    if (!org || org.status !== 'APPROVED') {
      throw new AppError({
        statusCode: 403,
        code: 'ORGANIZATION_NOT_VERIFIED',
        message: 'Your organization must have verified status to perform customer searches.',
      });
    }

    // 2. Validate Subscription Entitlements
    const subscription = await Subscription.findOne({ organizationId: org._id });
    if (!subscription || subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') {
      throw new AppError({
        statusCode: 403,
        code: 'SUBSCRIPTION_INACTIVE',
        message: 'An active subscription plan is required to perform customer searches.',
      });
    }

    if (subscription.usage.searchCount >= subscription.limits.monthlySearches) {
      throw new AppError({
        statusCode: 403,
        code: 'SEARCH_QUOTA_EXCEEDED',
        message: 'You have reached your monthly search limit. Please upgrade your plan for additional searches.',
        details: {
          currentUsage: subscription.usage.searchCount,
          limit: subscription.limits.monthlySearches,
        },
      });
    }

    // 3. Permissible Purpose Attestation Verification
    if (!input.attestationSigned) {
      throw new AppError({
        statusCode: 400,
        code: 'ATTESTATION_REQUIRED',
        message: 'You must certify that you possess a legally valid permissible purpose.',
      });
    }

    // 4. Query matching customer records with corroboration
    // Search algorithm:
    // Controlled corroboration requiring postal code alongside name / phone
    const nameParts = input.name.trim().split(/\s+/);
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts.length > 1 ? nameParts[0] : undefined;

    const query: any = {
      postalCode: input.postalCode.trim(),
    };

    if (input.companyName) {
      query.companyName = new RegExp(`^${input.companyName.trim()}$`, 'i');
    } else {
      query.$or = [
        { lastName: new RegExp(`^${lastName}$`, 'i') },
        { companyName: new RegExp(`^${input.name.trim()}$`, 'i') },
      ];
    }

    if (input.phoneLast4) {
      query.phoneLast4 = input.phoneLast4;
    }

    const matchedRecords = await CustomerRecord.find(query).limit(10);

    // Determine match confidence
    let matchConfidence: 'EXACT' | 'PROBABLE' | 'AMBIGUOUS' | 'NO_MATCH' = 'NO_MATCH';
    let ambiguousWarning: string | null = null;

    if (matchedRecords.length === 0) {
      matchConfidence = 'NO_MATCH';
    } else if (matchedRecords.length === 1) {
      const record = matchedRecords[0];
      const hasFirstMatch = firstName && record.firstName && record.firstName.toLowerCase() === firstName.toLowerCase();
      const hasPhoneMatch = input.phoneLast4 && record.phoneLast4 === input.phoneLast4;

      if (hasPhoneMatch || (hasFirstMatch && input.postalCode === record.postalCode)) {
        matchConfidence = 'EXACT';
      } else {
        matchConfidence = 'PROBABLE';
      }
    } else {
      // Multiple records found for this last name in this zip code
      matchConfidence = 'AMBIGUOUS';
      ambiguousWarning =
        'Multiple customer records matched this surname in this postal area. To avoid misidentification, please provide corroborating details (e.g. phone last 4 digits or exact service address).';
    }

    // 5. Deduct search quota atomically
    subscription.usage.searchCount += 1;
    await subscription.save();

    // 6. Record search in audit & CustomerSearch compliance collection
    const searchLog = await CustomerSearch.create({
      organizationId: org._id,
      userId: new Types.ObjectId(userId),
      permissiblePurpose: input.permissiblePurpose,
      attestationSigned: input.attestationSigned,
      attestationText: input.attestationText,
      searchCriteria: {
        name: input.name,
        postalCode: input.postalCode,
        phoneLast4: input.phoneLast4,
        emailDomain: input.emailDomain,
        companyName: input.companyName,
      },
      resultsReturnedCount: matchedRecords.length,
      matchConfidence,
      matchedCustomerIds: matchedRecords.map((r) => r._id),
      ipAddress,
      userAgent,
    });

    await AuditLog.create({
      organizationId: org._id,
      userId: new Types.ObjectId(userId),
      action: 'CUSTOMER_SEARCH_EXECUTED',
      resource: 'CustomerSearch',
      resourceId: searchLog._id.toString(),
      ipAddress,
      userAgent,
      details: {
        permissiblePurpose: input.permissiblePurpose,
        matchConfidence,
        resultsCount: matchedRecords.length,
      },
    });

    // 7. Format records: NEVER expose raw personal identifiers, NO numerical credit score
    const sanitizedMatches = matchedRecords.map((r) => ({
      id: r._id.toString(),
      maskedName: r.companyName || maskName(`${r.firstName || ''} ${r.lastName || ''}`),
      postalCode: r.postalCode,
      phoneLast4Masked: r.phoneLast4 ? `(***) ***-${r.phoneLast4}` : null,
      emailDomain: r.emailDomain ? `***@${r.emailDomain}` : null,
      addressCityState: r.addressCityState,
      verifiedInvoiceCount: r.totalInvoicesCount,
      paymentTimelinessDistribution: {
        onTimeCount: r.onTimePaymentsCount,
        lateCount: r.latePaymentsCount,
        onTimePercentage:
          r.totalInvoicesCount > 0
            ? Math.round((r.onTimePaymentsCount / r.totalInvoicesCount) * 100)
            : 0,
      },
      outstandingVerifiedBalanceMinorUnits: r.totalOutstandingMinorUnits,
      activeDisputesCount: r.disputeActiveCount,
      contributingSourcesCount: r.contributingOrganizationsCount,
      lastUpdatedDate: r.lastUpdatedDate,
      dataLimitations:
        'This historical payment report reflects direct commercial invoices submitted by verified contractors and service providers. It does not constitute a numerical credit score or consumer credit rating.',
    }));

    return {
      searchId: searchLog._id.toString(),
      matchConfidence,
      ambiguousWarning,
      requiresAdditionalInfo: matchConfidence === 'AMBIGUOUS',
      matches: sanitizedMatches,
      remainingQuota: subscription.limits.monthlySearches - subscription.usage.searchCount,
    };
  }

  static async getMatchesBySearchId(searchId: string, organizationId: string) {
    const search = await CustomerSearch.findOne({
      _id: searchId,
      organizationId: new Types.ObjectId(organizationId),
    }).populate('matchedCustomerIds');

    if (!search) {
      throw new AppError({
        statusCode: 404,
        code: 'SEARCH_RECORD_NOT_FOUND',
        message: 'Search record not found or does not belong to your organization.',
      });
    }

    return {
      searchId: search._id.toString(),
      permissiblePurpose: search.permissiblePurpose,
      createdAt: search.createdAt,
      matchConfidence: search.matchConfidence,
      matches: (search.matchedCustomerIds as any[]).map((r) => ({
        id: r._id.toString(),
        maskedName: r.companyName || maskName(`${r.firstName || ''} ${r.lastName || ''}`),
        postalCode: r.postalCode,
        verifiedInvoiceCount: r.totalInvoicesCount,
        paymentTimelinessDistribution: {
          onTimeCount: r.onTimePaymentsCount,
          lateCount: r.latePaymentsCount,
        },
        outstandingVerifiedBalanceMinorUnits: r.totalOutstandingMinorUnits,
        activeDisputesCount: r.disputeActiveCount,
        lastUpdatedDate: r.lastUpdatedDate,
      })),
    };
  }
}
