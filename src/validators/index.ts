import { z } from 'zod';

// ==========================================
// Authentication Validators
// ==========================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phone: z.string().optional(),
  organizationName: z.string().min(2, 'Organization name is required').trim(),
  legalBusinessName: z.string().min(2, 'Legal business name is required').trim(),
  taxId: z.string().min(4, 'Tax ID / EIN is required').trim(),
  businessType: z.enum([
    'SOLE_PROPRIETORSHIP',
    'LLC',
    'CORPORATION',
    'PARTNERSHIP',
    'OTHER',
  ]),
  street: z.string().min(3, 'Street address is required').trim(),
  city: z.string().min(2, 'City is required').trim(),
  state: z.string().min(2, 'State is required').trim(),
  postalCode: z.string().min(3, 'Postal code is required').trim(),
  deviceId: z.string().optional(),
  platform: z.enum(['ios', 'android', 'web']).default('web'),
});

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
  deviceId: z.string().default('web-browser'),
  platform: z.enum(['ios', 'android', 'web']).default('web'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
});

export const mfaVerifySchema = z.object({
  mfaCode: z.string().length(6, 'MFA code must be 6 digits').optional(),
  backupCode: z.string().optional(),
});

// ==========================================
// Organization Validators
// ==========================================

export const createOrgSchema = z.object({
  name: z.string().min(2).trim(),
  legalBusinessName: z.string().min(2).trim(),
  taxId: z.string().min(4).trim(),
  businessType: z.enum([
    'SOLE_PROPRIETORSHIP',
    'LLC',
    'CORPORATION',
    'PARTNERSHIP',
    'OTHER',
  ]),
  street: z.string().min(3).trim(),
  city: z.string().min(2).trim(),
  state: z.string().min(2).trim(),
  postalCode: z.string().min(3).trim(),
  phone: z.string().min(7).trim(),
  website: z.string().url().optional().or(z.literal('')),
});

// ==========================================
// Customer Search Validators
// ==========================================

export const customerSearchSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').trim(),
  postalCode: z.string().min(3, 'Postal code is required for corroboration').trim(),
  phoneLast4: z.string().regex(/^\d{4}$/, 'Phone must be exactly last 4 digits').optional(),
  emailDomain: z.string().optional(),
  companyName: z.string().optional(),
  permissiblePurpose: z.enum(
    [
      'CREDIT_TRANSACTION',
      'COLLECTION_OF_ACCOUNT',
      'LEGITIMATE_BUSINESS_NEED_WITH_WRITTEN_PERMISSION',
      'EMPLOYMENT_WITH_WRITTEN_CONSENT',
      'COURT_ORDER',
    ],
    {
      errorMap: () => ({
        message: 'A valid permissible purpose is legally required to search customer records.',
      }),
    }
  ),
  attestationSigned: z.literal(true, {
    errorMap: () => ({
      message: 'You must certify that you have a documented permissible purpose under applicable law.',
    }),
  }),
  attestationText: z.string().min(10, 'Attestation text confirmation is required'),
});

// ==========================================
// Invoice Reporting Validators
// ==========================================

export const createReportSchema = z.object({
  customerName: z.string().min(2, 'Customer name is required').trim(),
  customerPostalCode: z.string().min(3, 'Postal code is required').trim(),
  customerPhoneLast4: z.string().regex(/^\d{4}$/).optional(),
  customerEmailDomain: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required').trim(),
  serviceDescription: z.string().min(5, 'Service description is required').trim(),
  amountMinorUnits: z
    .number()
    .int('Amount must be an integer in minor currency units (cents)')
    .positive('Invoice amount must be positive'),
  currency: z.string().length(3).default('USD'),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  dueDateBasis: z.enum(['NET_30', 'NET_15', 'UPON_RECEIPT', 'CUSTOM']).default('NET_30'),
  evidenceIds: z.array(z.string()).default([]),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must certify the accuracy of the reported invoice data.' }),
  }),
  clientUuid: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

// ==========================================
// Payment Mutation Validators
// ==========================================

export const recordPaymentSchema = z.object({
  amountMinorUnits: z
    .number()
    .int('Amount must be integer minor currency units (cents)')
    .positive('Payment amount must be greater than zero'),
  effectivePaymentDate: z.string().datetime(),
  paymentMethodCategory: z.enum(['ACH', 'CREDIT_CARD', 'CHECK', 'WIRE', 'CASH', 'OTHER']),
  supportingEvidenceId: z.string().optional(),
  idempotencyKey: z.string().min(8, 'Idempotency key is required for all payment mutations'),
  notes: z.string().max(500).optional(),
  expectedRevision: z.number().int().optional(),
});

// ==========================================
// Dispute Validators
// ==========================================

export const createDisputeSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  disputeType: z.enum([
    'INCORRECT_AMOUNT',
    'ALREADY_PAID',
    'NEVER_RECEIVED_SERVICE',
    'IDENTITY_THEFT',
    'TERMS_DISPUTE',
    'OTHER',
  ]),
  explanation: z.string().min(10, 'A detailed explanation is required'),
  evidenceIds: z.array(z.string()).default([]),
});

export const respondDisputeSchema = z.object({
  responseText: z.string().min(10, 'Response text must be at least 10 characters'),
  responseType: z.enum(['CONTEST', 'ACCEPT', 'PROVIDE_INFO']),
  evidenceIds: z.array(z.string()).default([]),
});

export const appealDisputeSchema = z.object({
  appealReason: z.string().min(10, 'Appeal reason must be at least 10 characters'),
});

// ==========================================
// Device Registration Validator
// ==========================================

export const registerDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device identifier is required'),
  platform: z.enum(['ios', 'android', 'web']),
  pushToken: z.string().optional(),
  appVersion: z.string().default('1.0.0'),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
});
