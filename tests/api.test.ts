import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { Organization } from '../src/models/Organization.js';

let mongoServer: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
  app = createApp();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe('TheyPayOnTime Complete Backend Test Suite', () => {
  let authToken: string;
  let organizationId: string;
  let userId: string;
  let createdInvoiceId: string;
  let createdDisputeId: string;

  it('1. Health check returns UP and compliance gating info', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.complianceGate.liveConsumerReportingEnabled).toBe(false);
  });

  it('2. Registration creates User, Org in PENDING_VERIFICATION, Subscription, and Tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'contractor@apexplumbing.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Apex',
        phone: '555-123-4567',
        organizationName: 'Apex Plumbing Inc',
        legalBusinessName: 'Apex Plumbing Contracting LLC',
        taxId: '12-3456789',
        businessType: 'LLC',
        street: '100 Industrial Parkway',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('contractor@apexplumbing.com');
    expect(res.body.organization.status).toBe('PENDING_VERIFICATION');
    expect(res.body.tokens.accessToken).toBeDefined();

    authToken = res.body.tokens.accessToken;
    organizationId = res.body.organization.id;
    userId = res.body.user.id;
  });

  it('3. Scenario 1 Acceptance: Pending business CANNOT search customers or publish reports', async () => {
    // Attempt customer search before approval
    const searchRes = await request(app)
      .post('/api/v1/customer-searches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Smith',
        postalCode: '78701',
        permissiblePurpose: 'CREDIT_TRANSACTION',
        attestationSigned: true,
        attestationText: 'I certify I have a permissible business purpose.',
      });

    expect(searchRes.status).toBe(403);
    expect(searchRes.body.error.code).toBe('BUSINESS_VERIFICATION_REQUIRED');

    // Attempt report submission before approval
    const reportRes = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerName: 'Bob Vance',
        customerPostalCode: '78701',
        invoiceNumber: 'INV-001',
        serviceDescription: 'Plumbing remodel',
        amountMinorUnits: 250000, // $2,500.00
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        dueDateBasis: 'NET_30',
        evidenceIds: [],
        termsAccepted: true,
      });

    expect(reportRes.status).toBe(403);
    expect(reportRes.body.error.code).toBe('BUSINESS_VERIFICATION_REQUIRED');
  });

  it('4. Approve Business Verification', async () => {
    // Simulate administrative verification approval
    const approveRes = await request(app)
      .post('/api/v1/verification/approve')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ organizationId });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);

    const org = await Organization.findById(organizationId);
    expect(org?.status).toBe('APPROVED');
  });

  it('5. Customer Search requires valid Permissible Purpose and Attestation', async () => {
    // Missing attestation should fail with 400
    const failRes = await request(app)
      .post('/api/v1/customer-searches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Smith',
        postalCode: '78701',
        permissiblePurpose: 'CREDIT_TRANSACTION',
        attestationSigned: false,
        attestationText: 'Certification',
      });

    expect(failRes.status).toBe(400);

    // Valid search should succeed and return sanitized data without raw PII
    const successRes = await request(app)
      .post('/api/v1/customer-searches')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Smith',
        postalCode: '78701',
        permissiblePurpose: 'CREDIT_TRANSACTION',
        attestationSigned: true,
        attestationText: 'I legally certify an active credit transaction review under 15 U.S.C.',
      });

    expect(successRes.status).toBe(200);
    expect(successRes.body.searchId).toBeDefined();
    expect(successRes.body.remainingQuota).toBeDefined();
    expect(Array.isArray(successRes.body.matches)).toBe(true);
  });

  it('6. Submit Invoice Report with integer minor units & compliance gating', async () => {
    const dueDatePast = new Date(Date.now() - 5 * 86400000).toISOString(); // 5 days past due

    const res = await request(app)
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'idem-rep-001')
      .send({
        customerName: 'Robert Vance',
        customerPostalCode: '78701',
        customerPhoneLast4: '4321',
        invoiceNumber: 'INV-2026-001',
        serviceDescription: 'Commercial HVAC Installation and Ductwork',
        amountMinorUnits: 150000, // $1,500.00
        currency: 'USD',
        issueDate: new Date(Date.now() - 35 * 86400000).toISOString(),
        dueDate: dueDatePast,
        dueDateBasis: 'NET_30',
        evidenceIds: [],
        termsAccepted: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.report.receiptNumber).toMatch(/^RP-/);
    // Verified compliance gate: live publishing is gated
    expect(res.body.report.complianceApprovalStatus).toBe('GATED');
    expect(res.body.report.publishedToNetwork).toBe(false);

    expect(res.body.invoice.currentBalanceMinorUnits).toBe(150000);
    createdInvoiceId = res.body.invoice.id;
  });

  it('7. Scenario 3 & 4 Acceptance: Payment Recording, Financial Calculations, and Late Timeliness Preservation', async () => {
    // Payment 1: Partial payment of $500.00 (50000 cents)
    const p1 = await request(app)
      .post(`/api/v1/invoices/${createdInvoiceId}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'pay-idem-part-1')
      .send({
        amountMinorUnits: 50000,
        effectivePaymentDate: new Date().toISOString(),
        paymentMethodCategory: 'CHECK',
        idempotencyKey: 'pay-idem-part-1',
        expectedRevision: 1,
        notes: 'Partial check payment',
      });

    expect(p1.status).toBe(201);
    expect(p1.body.paymentEvent.previousBalanceMinorUnits).toBe(150000);
    expect(p1.body.paymentEvent.resultingBalanceMinorUnits).toBe(100000); // $1000.00 remaining
    expect(p1.body.invoice.status).toBe('PARTIALLY_PAID');
    expect(p1.body.invoice.revision).toBe(2);

    // Scenario 3 Idempotency Test: Repeat same payment with identical key
    const p1Duplicate = await request(app)
      .post(`/api/v1/invoices/${createdInvoiceId}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'pay-idem-part-1')
      .send({
        amountMinorUnits: 50000,
        effectivePaymentDate: new Date().toISOString(),
        paymentMethodCategory: 'CHECK',
        idempotencyKey: 'pay-idem-part-1',
        expectedRevision: 1,
      });

    expect([200, 201]).toContain(p1Duplicate.status);
    expect(p1Duplicate.body.paymentEvent).toBeDefined();
    // Balance must NOT have been deducted a second time
    expect(p1Duplicate.body.paymentEvent.resultingBalanceMinorUnits).toBe(100000);

    // Scenario 4: Fully pay the late invoice ($1000.00 remaining)
    // Invoice was due 5 days ago, so paying now is historically late.
    const p2 = await request(app)
      .post(`/api/v1/invoices/${createdInvoiceId}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('Idempotency-Key', 'pay-idem-final-2')
      .send({
        amountMinorUnits: 100000,
        effectivePaymentDate: new Date().toISOString(),
        paymentMethodCategory: 'ACH',
        idempotencyKey: 'pay-idem-final-2',
        expectedRevision: 2,
        notes: 'Final settlement payment',
      });

    expect(p2.status).toBe(201);
    expect(p2.body.invoice.currentBalanceMinorUnits).toBe(0); // Zero outstanding balance
    expect(p2.body.invoice.status).toBe('PAID');
    // Financial accuracy requirement: Historical late status is preserved!
    expect(p2.body.invoice.isPaidLate).toBe(true);
  });

  it('8. Dispute Management: Authoritative 14-day policy deadline and response workflow', async () => {
    // Customer files dispute
    const disputeRes = await request(app)
      .post('/api/v1/disputes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        invoiceId: createdInvoiceId,
        customerName: 'Robert Vance',
        disputeType: 'INCORRECT_AMOUNT',
        explanation: 'Payment was settled via check #4401 on Nov 10, dispute interest charges.',
        evidenceIds: [],
      });

    expect(disputeRes.status).toBe(201);
    expect(disputeRes.body.status).toBe('OPEN');
    expect(disputeRes.body.deadline).toBeDefined();

    // Verify deadline is ~14 days from now
    const deadlineDate = new Date(disputeRes.body.deadline);
    const diffDays = Math.round((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(14);

    createdDisputeId = disputeRes.body._id;

    // Organization responds to dispute
    const respRes = await request(app)
      .post(`/api/v1/disputes/${createdDisputeId}/responses`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        responseType: 'PROVIDE_INFO',
        responseText: 'Check #4401 was credited on Nov 12 and late fees were waived as requested.',
        evidenceIds: [],
      });

    expect(respRes.status).toBe(201);
    expect(respRes.body.responseType).toBe('PROVIDE_INFO');

    // Fetch dispute details
    const getRes = await request(app)
      .get(`/api/v1/disputes/${createdDisputeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.status).toBe('RESPONDED');
    expect(getRes.body.responses.length).toBe(1);
  });

  it('9. Customer Portal Free Record Access', async () => {
    const verifyRes = await request(app)
      .post('/api/v1/customer-portal/verify')
      .send({
        lastName: 'Vance',
        postalCode: '78701',
        phoneLast4: '4321',
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.verified).toBe(true);
    expect(verifyRes.body.customerId).toBeDefined();

    const recordsRes = await request(app)
      .get(`/api/v1/customer-portal/records/${verifyRes.body.customerId}`);

    expect(recordsRes.status).toBe(200);
    expect(recordsRes.body.consumerDisclosure).toBeDefined();
    expect(recordsRes.body.consumerDisclosure.invoices.length).toBeGreaterThan(0);
    expect(recordsRes.body.consumerDisclosure.consumerRightsNotice).toContain('legal right');
  });
});
