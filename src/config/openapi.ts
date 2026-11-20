export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'TheyPayOnTime REST API',
    version: '1.0.0',
    description:
      'Production REST API backend for TheyPayOnTime.com — Verified Customer Payment-History Network for Contractors and Service Businesses.',
    contact: {
      name: 'TheyPayOnTime Compliance & Security Team',
      url: 'https://theypayontime.com',
      email: 'security@theypayontime.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Default API v1 Base Path',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
              correlationId: { type: 'string' },
            },
          },
        },
      },
      UserRegistration: {
        type: 'object',
        required: [
          'email',
          'password',
          'firstName',
          'lastName',
          'organizationName',
          'legalBusinessName',
          'taxId',
          'businessType',
          'street',
          'city',
          'state',
          'postalCode',
        ],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          organizationName: { type: 'string' },
          legalBusinessName: { type: 'string' },
          taxId: { type: 'string' },
          businessType: {
            type: 'string',
            enum: ['SOLE_PROPRIETORSHIP', 'LLC', 'CORPORATION', 'PARTNERSHIP', 'OTHER'],
          },
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          postalCode: { type: 'string' },
        },
      },
      CustomerSearchRequest: {
        type: 'object',
        required: ['name', 'postalCode', 'permissiblePurpose', 'attestationSigned', 'attestationText'],
        properties: {
          name: { type: 'string', minLength: 2 },
          postalCode: { type: 'string' },
          phoneLast4: { type: 'string' },
          emailDomain: { type: 'string' },
          permissiblePurpose: {
            type: 'string',
            enum: [
              'CREDIT_TRANSACTION',
              'COLLECTION_OF_ACCOUNT',
              'LEGITIMATE_BUSINESS_NEED_WITH_WRITTEN_PERMISSION',
              'EMPLOYMENT_WITH_WRITTEN_CONSENT',
              'COURT_ORDER',
            ],
          },
          attestationSigned: { type: 'boolean', enum: [true] },
          attestationText: { type: 'string' },
        },
      },
      ReportSubmissionRequest: {
        type: 'object',
        required: [
          'customerName',
          'customerPostalCode',
          'invoiceNumber',
          'serviceDescription',
          'amountMinorUnits',
          'issueDate',
          'dueDate',
          'termsAccepted',
        ],
        properties: {
          customerName: { type: 'string' },
          customerPostalCode: { type: 'string' },
          invoiceNumber: { type: 'string' },
          serviceDescription: { type: 'string' },
          amountMinorUnits: { type: 'integer', description: 'Amount in minor currency units (cents)' },
          currency: { type: 'string', default: 'USD' },
          issueDate: { type: 'string', format: 'date-time' },
          dueDate: { type: 'string', format: 'date-time' },
          dueDateBasis: { type: 'string', enum: ['NET_30', 'NET_15', 'UPON_RECEIPT', 'CUSTOM'] },
          evidenceIds: { type: 'array', items: { type: 'string' } },
          termsAccepted: { type: 'boolean', enum: [true] },
        },
      },
      PaymentRecordRequest: {
        type: 'object',
        required: ['amountMinorUnits', 'effectivePaymentDate', 'paymentMethodCategory', 'idempotencyKey'],
        properties: {
          amountMinorUnits: { type: 'integer', description: 'Payment in cents' },
          effectivePaymentDate: { type: 'string', format: 'date-time' },
          paymentMethodCategory: {
            type: 'string',
            enum: ['ACH', 'CREDIT_CARD', 'CHECK', 'WIRE', 'CASH', 'OTHER'],
          },
          idempotencyKey: { type: 'string' },
          expectedRevision: { type: 'integer' },
          notes: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register new contractor business and owner account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UserRegistration' } } },
        },
        responses: {
          '201': { description: 'Registration successful' },
          '409': { description: 'User or business already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user with email and password',
        tags: ['Authentication'],
        responses: {
          '200': { description: 'Authentication successful with JWT tokens' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/customer-searches': {
      post: {
        summary: 'Search customer payment histories with permissible purpose and attestation',
        security: [{ BearerAuth: [] }],
        tags: ['Customer Search'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerSearchRequest' } } },
        },
        responses: {
          '200': { description: 'Controlled payment history search results' },
          '403': { description: 'Business not approved or quota exceeded' },
        },
      },
    },
    '/reports': {
      post: {
        summary: 'Submit customer invoice report with evidence attachments',
        security: [{ BearerAuth: [] }],
        tags: ['Reports'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ReportSubmissionRequest' } } },
        },
        responses: {
          '201': { description: 'Report accepted and receipt issued' },
        },
      },
    },
    '/invoices/{id}/payments': {
      post: {
        summary: 'Record payment update with integer minor units and idempotency',
        security: [{ BearerAuth: [] }],
        tags: ['Invoices & Payments'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/PaymentRecordRequest' } } },
        },
        responses: {
          '201': { description: 'Payment recorded and balance updated' },
          '409': { description: 'Revision conflict or concurrent request' },
        },
      },
    },
  },
};
