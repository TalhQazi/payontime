import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'READONLY' | 'CUSTOMER';

export type OrganizationStatus =
  | 'PENDING_VERIFICATION'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type VerificationStatus =
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'ADDITIONAL_INFO_REQUIRED';

export type VerificationDocType =
  | 'BUSINESS_LICENSE'
  | 'CERTIFICATE_OF_INCORPORATION'
  | 'TAX_ID_DOCUMENT'
  | 'UTILITY_BILL'
  | 'GOVERNMENT_PHOTO_ID'
  | 'BANK_STATEMENT';

export type SubscriptionPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIALING'
  | 'PAST_DUE'
  | 'CANCELLED';

export type PermissiblePurpose =
  | 'CREDIT_TRANSACTION'
  | 'COLLECTION_OF_ACCOUNT'
  | 'LEGITIMATE_BUSINESS_NEED_WITH_WRITTEN_PERMISSION'
  | 'EMPLOYMENT_WITH_WRITTEN_CONSENT'
  | 'COURT_ORDER';

export type DueDateBasis = 'NET_30' | 'NET_15' | 'UPON_RECEIPT' | 'CUSTOM';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'DEFAULTED'
  | 'DISPUTED';

export type PaymentMethodCategory =
  | 'ACH'
  | 'CREDIT_CARD'
  | 'CHECK'
  | 'WIRE'
  | 'CASH'
  | 'OTHER';

export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'NEEDS_REVIEW'
  | 'REJECTED';

export type ComplianceApprovalStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'GATED';

export type DisputeType =
  | 'INCORRECT_AMOUNT'
  | 'ALREADY_PAID'
  | 'NEVER_RECEIVED_SERVICE'
  | 'IDENTITY_THEFT'
  | 'TERMS_DISPUTE'
  | 'OTHER';

export type DisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'EVIDENCE_REQUESTED'
  | 'RESPONDED'
  | 'RESOLVED_CUSTOMER_FAVOR'
  | 'RESOLVED_BUSINESS_FAVOR'
  | 'APPEALED';

export type NotificationType =
  | 'BUSINESS_VERIFICATION'
  | 'DISPUTE_ACTION'
  | 'EVIDENCE_REQUEST'
  | 'OVERDUE_UPDATE'
  | 'PAYMENT_STATUS'
  | 'SECURITY_EVENT'
  | 'SUBSCRIPTION_CHANGE';

export type EvidenceEntityType =
  | 'INVOICE'
  | 'PAYMENT'
  | 'DISPUTE'
  | 'VERIFICATION';

export type OutboxSyncState =
  | 'LOCAL_DRAFT'
  | 'QUEUED'
  | 'UPLOADING'
  | 'SERVER_RECEIVED'
  | 'ACCEPTED'
  | 'NEEDS_REVIEW'
  | 'RETRY_WAIT'
  | 'USER_ACTION_REQUIRED';

export interface AuthUserPayload {
  userId: string;
  email: string;
  organizationId?: string;
  role: UserRole;
  isMfaVerified: boolean;
  deviceId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
  correlationId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
