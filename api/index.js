"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/serverless.ts
var serverless_exports = {};
__export(serverless_exports, {
  default: () => serverless_default
});
module.exports = __toCommonJS(serverless_exports);
var import_express14 = __toESM(require("express"));
var import_mongoose34 = __toESM(require("mongoose"));

// src/app.ts
var import_express13 = __toESM(require("express"));
var import_helmet = __toESM(require("helmet"));
var import_cors = __toESM(require("cors"));
var import_mongoose33 = __toESM(require("mongoose"));
var import_swagger_ui_express = __toESM(require("swagger-ui-express"));

// src/config/env.ts
var import_dotenv = __toESM(require("dotenv"));
var import_zod = require("zod");
import_dotenv.default.config();
var envSchema = import_zod.z.object({
  PORT: import_zod.z.coerce.number().default(4e3),
  NODE_ENV: import_zod.z.enum(["development", "production", "test"]).default("development"),
  API_VERSION: import_zod.z.string().default("v1"),
  CORS_ORIGIN: import_zod.z.string().default("*"),
  MONGODB_URI: import_zod.z.string().default("mongodb://127.0.0.1:27017/theypayontime"),
  MONGODB_USE_TRANSACTIONS: import_zod.z.union([import_zod.z.boolean(), import_zod.z.string().transform((v) => v === "true")]).default(false),
  JWT_ACCESS_SECRET: import_zod.z.string().min(16).default("theypayontime-default-dev-access-secret-32-chars-long!"),
  JWT_REFRESH_SECRET: import_zod.z.string().min(16).default("theypayontime-default-dev-refresh-secret-32-chars-long!"),
  JWT_ACCESS_EXPIRY: import_zod.z.string().default("15m"),
  JWT_REFRESH_EXPIRY: import_zod.z.string().default("7d"),
  ENABLE_LIVE_CONSUMER_REPORTING: import_zod.z.union([import_zod.z.boolean(), import_zod.z.string().transform((v) => v === "true")]).default(false),
  REQUIRE_PERMISSIBLE_PURPOSE_ATTESTATION: import_zod.z.union([import_zod.z.boolean(), import_zod.z.string().transform((v) => v === "true")]).default(true),
  STORAGE_DRIVER: import_zod.z.enum(["local", "s3"]).default("local"),
  UPLOAD_DIR: import_zod.z.string().default("./uploads"),
  MAX_FILE_SIZE_BYTES: import_zod.z.coerce.number().default(10485760),
  // 10MB
  RATE_LIMIT_WINDOW_MS: import_zod.z.coerce.number().default(9e5),
  RATE_LIMIT_MAX_REQUESTS: import_zod.z.coerce.number().default(100)
});
var env = envSchema.parse(process.env);

// src/config/openapi.ts
var openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "TheyPayOnTime REST API",
    version: "1.0.0",
    description: "Production REST API backend for TheyPayOnTime.com \u2014 Verified Customer Payment-History Network for Contractors and Service Businesses.",
    contact: {
      name: "TheyPayOnTime Compliance & Security Team",
      url: "https://theypayontime.com",
      email: "security@theypayontime.com"
    }
  },
  servers: [
    {
      url: "/api/v1",
      description: "Default API v1 Base Path"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "object" },
              correlationId: { type: "string" }
            }
          }
        }
      },
      UserRegistration: {
        type: "object",
        required: [
          "email",
          "password",
          "firstName",
          "lastName",
          "organizationName",
          "legalBusinessName",
          "taxId",
          "businessType",
          "street",
          "city",
          "state",
          "postalCode"
        ],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          firstName: { type: "string" },
          lastName: { type: "string" },
          organizationName: { type: "string" },
          legalBusinessName: { type: "string" },
          taxId: { type: "string" },
          businessType: {
            type: "string",
            enum: ["SOLE_PROPRIETORSHIP", "LLC", "CORPORATION", "PARTNERSHIP", "OTHER"]
          },
          street: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          postalCode: { type: "string" }
        }
      },
      CustomerSearchRequest: {
        type: "object",
        required: ["name", "postalCode", "permissiblePurpose", "attestationSigned", "attestationText"],
        properties: {
          name: { type: "string", minLength: 2 },
          postalCode: { type: "string" },
          phoneLast4: { type: "string" },
          emailDomain: { type: "string" },
          permissiblePurpose: {
            type: "string",
            enum: [
              "CREDIT_TRANSACTION",
              "COLLECTION_OF_ACCOUNT",
              "LEGITIMATE_BUSINESS_NEED_WITH_WRITTEN_PERMISSION",
              "EMPLOYMENT_WITH_WRITTEN_CONSENT",
              "COURT_ORDER"
            ]
          },
          attestationSigned: { type: "boolean", enum: [true] },
          attestationText: { type: "string" }
        }
      },
      ReportSubmissionRequest: {
        type: "object",
        required: [
          "customerName",
          "customerPostalCode",
          "invoiceNumber",
          "serviceDescription",
          "amountMinorUnits",
          "issueDate",
          "dueDate",
          "termsAccepted"
        ],
        properties: {
          customerName: { type: "string" },
          customerPostalCode: { type: "string" },
          invoiceNumber: { type: "string" },
          serviceDescription: { type: "string" },
          amountMinorUnits: { type: "integer", description: "Amount in minor currency units (cents)" },
          currency: { type: "string", default: "USD" },
          issueDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          dueDateBasis: { type: "string", enum: ["NET_30", "NET_15", "UPON_RECEIPT", "CUSTOM"] },
          evidenceIds: { type: "array", items: { type: "string" } },
          termsAccepted: { type: "boolean", enum: [true] }
        }
      },
      PaymentRecordRequest: {
        type: "object",
        required: ["amountMinorUnits", "effectivePaymentDate", "paymentMethodCategory", "idempotencyKey"],
        properties: {
          amountMinorUnits: { type: "integer", description: "Payment in cents" },
          effectivePaymentDate: { type: "string", format: "date-time" },
          paymentMethodCategory: {
            type: "string",
            enum: ["ACH", "CREDIT_CARD", "CHECK", "WIRE", "CASH", "OTHER"]
          },
          idempotencyKey: { type: "string" },
          expectedRevision: { type: "integer" },
          notes: { type: "string" }
        }
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Register new contractor business and owner account",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UserRegistration" } } }
        },
        responses: {
          "201": { description: "Registration successful" },
          "409": { description: "User or business already exists" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Authenticate user with email and password",
        tags: ["Authentication"],
        responses: {
          "200": { description: "Authentication successful with JWT tokens" },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/customer-searches": {
      post: {
        summary: "Search customer payment histories with permissible purpose and attestation",
        security: [{ BearerAuth: [] }],
        tags: ["Customer Search"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CustomerSearchRequest" } } }
        },
        responses: {
          "200": { description: "Controlled payment history search results" },
          "403": { description: "Business not approved or quota exceeded" }
        }
      }
    },
    "/reports": {
      post: {
        summary: "Submit customer invoice report with evidence attachments",
        security: [{ BearerAuth: [] }],
        tags: ["Reports"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReportSubmissionRequest" } } }
        },
        responses: {
          "201": { description: "Report accepted and receipt issued" }
        }
      }
    },
    "/invoices/{id}/payments": {
      post: {
        summary: "Record payment update with integer minor units and idempotency",
        security: [{ BearerAuth: [] }],
        tags: ["Invoices & Payments"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PaymentRecordRequest" } } }
        },
        responses: {
          "201": { description: "Payment recorded and balance updated" },
          "409": { description: "Revision conflict or concurrent request" }
        }
      }
    }
  }
};

// src/database/connection.ts
var import_mongoose = __toESM(require("mongoose"));

// src/utils/logger.ts
var import_pino = __toESM(require("pino"));
var logger = (0, import_pino.default)({
  level: env.NODE_ENV === "test" ? "silent" : "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.refreshToken",
      "*.mfaSecret",
      "*.taxId",
      "*.ssn",
      "body.password",
      "body.token",
      "body.refreshToken",
      "body.mfaCode"
    ],
    censor: "[REDACTED]"
  },
  timestamp: import_pino.default.stdTimeFunctions.isoTime
});

// src/database/connection.ts
var isConnected = false;
var supportsTransactions = false;
import_mongoose.default.set("bufferCommands", false);
async function connectDatabase(uri) {
  if (import_mongoose.default.connection.readyState === 1) {
    isConnected = true;
    return import_mongoose.default;
  }
  if (import_mongoose.default.connection.readyState === 2) {
    await new Promise((resolve) => {
      import_mongoose.default.connection.once("connected", resolve);
      setTimeout(resolve, 2e3);
    });
    if (import_mongoose.default.connection.readyState === 1) {
      isConnected = true;
      return import_mongoose.default;
    }
  }
  const connectionUri = uri || env.MONGODB_URI;
  try {
    const conn = await import_mongoose.default.connect(connectionUri, {
      autoIndex: env.NODE_ENV === "development",
      // Never run autoIndex on every connection in serverless/production
      serverSelectionTimeoutMS: 3e3,
      connectTimeoutMS: 3e3
    });
    isConnected = true;
    try {
      const adminDb = import_mongoose.default.connection.db?.admin();
      const helloResult = await adminDb?.command({ hello: 1 });
      supportsTransactions = Boolean(helloResult?.setName || helloResult?.msg === "isdbgrid");
      logger.info({ supportsTransactions }, "MongoDB connection established");
    } catch {
      supportsTransactions = false;
    }
    return conn;
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}
function hasTransactionSupport() {
  return supportsTransactions && env.MONGODB_USE_TRANSACTIONS;
}
async function withTransaction(fn) {
  if (!hasTransactionSupport()) {
    const session2 = await import_mongoose.default.startSession();
    try {
      return await fn(session2);
    } finally {
      await session2.endSession();
    }
  }
  const session = await import_mongoose.default.startSession();
  session.startTransaction();
  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

// src/middleware/correlationId.ts
var import_uuid = require("uuid");
function correlationIdMiddleware(req, res, next) {
  const correlationId = req.headers["x-correlation-id"] || (0, import_uuid.v4)();
  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);
  next();
}

// src/middleware/rateLimiter.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"));
var globalRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Please try again later."
    }
  }
});
var authRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 20,
  // max 20 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "AUTH_RATE_LIMIT_EXCEEDED",
      message: "Too many login attempts. Please wait 15 minutes before trying again."
    }
  }
});

// src/middleware/errorHandler.ts
var import_zod2 = require("zod");
var AppError = class extends Error {
  statusCode;
  code;
  details;
  constructor(options) {
    super(options.message);
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
function errorHandler(err, req, res, _next) {
  const correlationId = req.correlationId;
  if (err instanceof AppError) {
    logger.warn(
      {
        correlationId,
        code: err.code,
        statusCode: err.statusCode,
        message: err.message
      },
      "Application Error"
    );
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        correlationId
      }
    });
    return;
  }
  if (err instanceof import_zod2.ZodError) {
    logger.warn({ correlationId, issues: err.issues }, "Validation Error");
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "The submitted request payload failed schema validation.",
        details: err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
          code: issue.code
        })),
        correlationId
      }
    });
    return;
  }
  if (err.code === 11e3) {
    logger.warn({ correlationId, keyPattern: err.keyPattern }, "Duplicate Key Error");
    res.status(409).json({
      error: {
        code: "CONFLICT_DUPLICATE_RESOURCE",
        message: "A resource with this identifier or unique attribute already exists.",
        correlationId
      }
    });
    return;
  }
  logger.error({ correlationId, err }, "Unhandled Server Error");
  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected internal server error occurred.",
      correlationId
    }
  });
}

// src/routes/authRoutes.ts
var import_express = require("express");

// src/services/authService.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_crypto = __toESM(require("crypto"));
var import_mongoose21 = require("mongoose");

// src/models/User.ts
var import_mongoose2 = __toESM(require("mongoose"));
var UserSchema = new import_mongoose2.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER", "READONLY", "CUSTOMER"],
      default: "MEMBER",
      index: true
    },
    currentOrganizationId: {
      type: import_mongoose2.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    mfaEnabled: {
      type: Boolean,
      default: false
    },
    mfaSecret: {
      type: String,
      select: false
    },
    mfaBackupCodes: {
      type: [String],
      default: [],
      select: false
    },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION"],
      default: "ACTIVE",
      index: true
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    lastLoginAt: {
      type: Date
    },
    tokenVersion: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);
var User = import_mongoose2.default.model("User", UserSchema);

// src/models/Organization.ts
var import_mongoose3 = __toESM(require("mongoose"));
var OrganizationSchema = new import_mongoose3.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    legalBusinessName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    taxId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    businessType: {
      type: String,
      enum: ["SOLE_PROPRIETORSHIP", "LLC", "CORPORATION", "PARTNERSHIP", "OTHER"],
      required: true
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true, index: true },
      country: { type: String, default: "USA" }
    },
    phone: {
      type: String,
      required: true
    },
    website: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["PENDING_VERIFICATION", "IN_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"],
      default: "PENDING_VERIFICATION",
      index: true
    },
    isComplianceApproved: {
      type: Boolean,
      default: false,
      index: true
    },
    ownerId: {
      type: import_mongoose3.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    settings: {
      allowMemberInvites: { type: Boolean, default: true },
      requireMfaForMembers: { type: Boolean, default: false },
      defaultNetTerms: { type: Number, default: 30 }
    }
  },
  {
    timestamps: true
  }
);
var Organization = import_mongoose3.default.model("Organization", OrganizationSchema);

// src/models/OrganizationMember.ts
var import_mongoose4 = __toESM(require("mongoose"));
var OrganizationMemberSchema = new import_mongoose4.Schema(
  {
    organizationId: {
      type: import_mongoose4.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    userId: {
      type: import_mongoose4.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ["OWNER", "ADMIN", "MEMBER", "READONLY", "CUSTOMER"],
      default: "MEMBER"
    },
    permissions: {
      type: [String],
      default: ["SEARCH_CUSTOMERS", "VIEW_REPORTS", "CREATE_REPORTS"]
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INVITED", "SUSPENDED"],
      default: "ACTIVE",
      index: true
    },
    invitedBy: {
      type: import_mongoose4.Schema.Types.ObjectId,
      ref: "User"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);
OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
var OrganizationMember = import_mongoose4.default.model(
  "OrganizationMember",
  OrganizationMemberSchema
);

// src/models/BusinessVerification.ts
var import_mongoose5 = __toESM(require("mongoose"));
var VerificationDocumentSchema = new import_mongoose5.Schema({
  docType: {
    type: String,
    enum: [
      "BUSINESS_LICENSE",
      "CERTIFICATE_OF_INCORPORATION",
      "TAX_ID_DOCUMENT",
      "UTILITY_BILL",
      "GOVERNMENT_PHOTO_ID",
      "BANK_STATEMENT"
    ],
    required: true
  },
  evidenceId: {
    type: import_mongoose5.Schema.Types.ObjectId,
    ref: "Evidence",
    required: true
  },
  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "REJECTED"],
    default: "PENDING"
  },
  notes: { type: String }
});
var BusinessVerificationSchema = new import_mongoose5.Schema(
  {
    organizationId: {
      type: import_mongoose5.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    submittedByUserId: {
      type: import_mongoose5.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    documents: [VerificationDocumentSchema],
    status: {
      type: String,
      enum: ["SUBMITTED", "IN_REVIEW", "VERIFIED", "REJECTED", "ADDITIONAL_INFO_REQUIRED"],
      default: "SUBMITTED",
      index: true
    },
    reviewNotes: { type: String },
    verifiedAt: { type: Date },
    reviewedBy: { type: import_mongoose5.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String }
  },
  {
    timestamps: true
  }
);
var BusinessVerification = import_mongoose5.default.model(
  "BusinessVerification",
  BusinessVerificationSchema
);

// src/models/Subscription.ts
var import_mongoose6 = __toESM(require("mongoose"));
var SubscriptionSchema = new import_mongoose6.Schema(
  {
    organizationId: {
      type: import_mongoose6.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true
    },
    plan: {
      type: String,
      enum: ["STARTER", "GROWTH", "ENTERPRISE"],
      default: "STARTER"
    },
    status: {
      type: String,
      enum: ["ACTIVE", "TRIALING", "PAST_DUE", "CANCELLED"],
      default: "TRIALING",
      index: true
    },
    currentPeriodStart: {
      type: Date,
      default: Date.now
    },
    currentPeriodEnd: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
      // 30 days
    },
    limits: {
      monthlySearches: { type: Number, default: 25 },
      monthlyReports: { type: Number, default: 50 },
      maxTeamMembers: { type: Number, default: 3 }
    },
    usage: {
      searchCount: { type: Number, default: 0 },
      reportCount: { type: Number, default: 0 }
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);
var Subscription = import_mongoose6.default.model("Subscription", SubscriptionSchema);

// src/models/CustomerRecord.ts
var import_mongoose7 = __toESM(require("mongoose"));
var CustomerRecordSchema = new import_mongoose7.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true, index: true },
    companyName: { type: String, trim: true, index: true },
    postalCode: { type: String, required: true, trim: true, index: true },
    phoneLast4: { type: String, trim: true, index: true },
    emailDomain: { type: String, trim: true },
    addressCityState: { type: String, trim: true },
    totalInvoicesCount: { type: Number, default: 0 },
    onTimePaymentsCount: { type: Number, default: 0 },
    latePaymentsCount: { type: Number, default: 0 },
    totalPaidMinorUnits: { type: Number, default: 0 },
    // in cents
    totalOutstandingMinorUnits: { type: Number, default: 0 },
    // in cents
    disputeActiveCount: { type: Number, default: 0 },
    contributingOrganizationsCount: { type: Number, default: 1 },
    lastUpdatedDate: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);
CustomerRecordSchema.index({ lastName: 1, postalCode: 1 });
CustomerRecordSchema.index({ companyName: 1, postalCode: 1 });
var CustomerRecord = import_mongoose7.default.model(
  "CustomerRecord",
  CustomerRecordSchema
);

// src/models/CustomerSearch.ts
var import_mongoose8 = __toESM(require("mongoose"));
var CustomerSearchSchema = new import_mongoose8.Schema(
  {
    organizationId: {
      type: import_mongoose8.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    userId: {
      type: import_mongoose8.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    permissiblePurpose: {
      type: String,
      enum: [
        "CREDIT_TRANSACTION",
        "COLLECTION_OF_ACCOUNT",
        "LEGITIMATE_BUSINESS_NEED_WITH_WRITTEN_PERMISSION",
        "EMPLOYMENT_WITH_WRITTEN_CONSENT",
        "COURT_ORDER"
      ],
      required: true
    },
    attestationSigned: {
      type: Boolean,
      required: true,
      default: false
    },
    attestationText: {
      type: String,
      required: true
    },
    searchCriteria: {
      name: { type: String },
      postalCode: { type: String },
      phoneLast4: { type: String },
      emailDomain: { type: String },
      companyName: { type: String }
    },
    resultsReturnedCount: {
      type: Number,
      default: 0
    },
    matchConfidence: {
      type: String,
      enum: ["EXACT", "PROBABLE", "AMBIGUOUS", "NO_MATCH"],
      default: "NO_MATCH"
    },
    matchedCustomerIds: [
      {
        type: import_mongoose8.Schema.Types.ObjectId,
        ref: "CustomerRecord"
      }
    ],
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
CustomerSearchSchema.index({ organizationId: 1, createdAt: -1 });
var CustomerSearch = import_mongoose8.default.model(
  "CustomerSearch",
  CustomerSearchSchema
);

// src/models/Invoice.ts
var import_mongoose9 = __toESM(require("mongoose"));
var InvoiceSchema = new import_mongoose9.Schema(
  {
    organizationId: {
      type: import_mongoose9.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    customerRecordId: {
      type: import_mongoose9.Schema.Types.ObjectId,
      ref: "CustomerRecord",
      required: true,
      index: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerPostalCode: {
      type: String,
      required: true,
      trim: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true
    },
    serviceDescription: {
      type: String,
      required: true,
      trim: true
    },
    amountMinorUnits: {
      type: Number,
      required: true,
      min: 1
      // must be positive integer cents
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
      trim: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    dueDateBasis: {
      type: String,
      enum: ["NET_30", "NET_15", "UPON_RECEIPT", "CUSTOM"],
      default: "NET_30"
    },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "PARTIALLY_PAID", "PAID", "DEFAULTED", "DISPUTED"],
      default: "SUBMITTED",
      index: true
    },
    currentBalanceMinorUnits: {
      type: Number,
      required: true,
      min: 0
    },
    isPaidLate: {
      type: Boolean,
      default: false,
      index: true
    },
    fullyPaidAt: {
      type: Date
    },
    evidenceIds: [
      {
        type: import_mongoose9.Schema.Types.ObjectId,
        ref: "Evidence"
      }
    ],
    attestation: {
      signedByUserId: {
        type: import_mongoose9.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      signedAt: {
        type: Date,
        default: Date.now
      },
      termsAccepted: {
        type: Boolean,
        required: true,
        default: true
      }
    },
    revision: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);
InvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ organizationId: 1, status: 1 });
var Invoice = import_mongoose9.default.model("Invoice", InvoiceSchema);

// src/models/PaymentEvent.ts
var import_mongoose10 = __toESM(require("mongoose"));
var PaymentEventSchema = new import_mongoose10.Schema(
  {
    invoiceId: {
      type: import_mongoose10.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true
    },
    organizationId: {
      type: import_mongoose10.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    customerRecordId: {
      type: import_mongoose10.Schema.Types.ObjectId,
      ref: "CustomerRecord",
      required: true,
      index: true
    },
    amountMinorUnits: {
      type: Number,
      required: true,
      min: 1
      // positive minor units
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true
    },
    effectivePaymentDate: {
      type: Date,
      required: true
    },
    paymentMethodCategory: {
      type: String,
      enum: ["ACH", "CREDIT_CARD", "CHECK", "WIRE", "CASH", "OTHER"],
      required: true
    },
    supportingEvidenceId: {
      type: import_mongoose10.Schema.Types.ObjectId,
      ref: "Evidence"
    },
    previousBalanceMinorUnits: {
      type: Number,
      required: true,
      min: 0
    },
    resultingBalanceMinorUnits: {
      type: Number,
      required: true,
      min: 0
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    notes: {
      type: String,
      trim: true
    },
    recordedByUserId: {
      type: import_mongoose10.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
PaymentEventSchema.index({ invoiceId: 1, createdAt: 1 });
var PaymentEvent = import_mongoose10.default.model("PaymentEvent", PaymentEventSchema);

// src/models/Report.ts
var import_mongoose11 = __toESM(require("mongoose"));
var ReportSchema = new import_mongoose11.Schema(
  {
    organizationId: {
      type: import_mongoose11.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    invoiceId: {
      type: import_mongoose11.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true
    },
    customerRecordId: {
      type: import_mongoose11.Schema.Types.ObjectId,
      ref: "CustomerRecord",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "ACCEPTED", "NEEDS_REVIEW", "REJECTED"],
      default: "SUBMITTED",
      index: true
    },
    submissionReceiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    publishedToNetwork: {
      type: Boolean,
      default: false,
      index: true
    },
    complianceApprovalStatus: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "GATED"],
      default: "GATED",
      index: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: {
      type: Date
    },
    reviewNotes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);
ReportSchema.index({ organizationId: 1, createdAt: -1 });
var Report = import_mongoose11.default.model("Report", ReportSchema);

// src/models/Evidence.ts
var import_mongoose12 = __toESM(require("mongoose"));
var EvidenceSchema = new import_mongoose12.Schema(
  {
    organizationId: {
      type: import_mongoose12.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    uploadedByUserId: {
      type: import_mongoose12.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    relatedEntityType: {
      type: String,
      enum: ["INVOICE", "PAYMENT", "DISPUTE", "VERIFICATION"],
      required: true
    },
    relatedEntityId: {
      type: import_mongoose12.Schema.Types.ObjectId,
      index: true
    },
    originalFileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    fileSizeBytes: {
      type: Number,
      required: true
    },
    storagePathOrKey: {
      type: String,
      required: true
    },
    sha256Checksum: {
      type: String,
      required: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);
var Evidence = import_mongoose12.default.model("Evidence", EvidenceSchema);

// src/models/Dispute.ts
var import_mongoose13 = __toESM(require("mongoose"));
var DisputeSchema = new import_mongoose13.Schema(
  {
    customerRecordId: {
      type: import_mongoose13.Schema.Types.ObjectId,
      ref: "CustomerRecord",
      required: true,
      index: true
    },
    invoiceId: {
      type: import_mongoose13.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true
    },
    organizationId: {
      type: import_mongoose13.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    filedByCustomerUserId: {
      type: import_mongoose13.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    customerName: {
      type: String,
      required: true
    },
    disputeType: {
      type: String,
      enum: [
        "INCORRECT_AMOUNT",
        "ALREADY_PAID",
        "NEVER_RECEIVED_SERVICE",
        "IDENTITY_THEFT",
        "TERMS_DISPUTE",
        "OTHER"
      ],
      required: true
    },
    explanation: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: [
        "OPEN",
        "UNDER_REVIEW",
        "EVIDENCE_REQUESTED",
        "RESPONDED",
        "RESOLVED_CUSTOMER_FAVOR",
        "RESOLVED_BUSINESS_FAVOR",
        "APPEALED"
      ],
      default: "OPEN",
      index: true
    },
    deadline: {
      type: Date,
      required: true,
      index: true
    },
    evidenceIds: [
      {
        type: import_mongoose13.Schema.Types.ObjectId,
        ref: "Evidence"
      }
    ],
    decisionSummary: {
      type: String
    },
    decidedAt: {
      type: Date
    },
    decidedBy: {
      type: import_mongoose13.Schema.Types.ObjectId,
      ref: "User"
    },
    appealDeadline: {
      type: Date
    },
    appealCount: {
      type: Number,
      default: 0
    },
    appealReason: {
      type: String
    }
  },
  {
    timestamps: true
  }
);
DisputeSchema.index({ organizationId: 1, status: 1 });
var Dispute = import_mongoose13.default.model("Dispute", DisputeSchema);

// src/models/DisputeResponse.ts
var import_mongoose14 = __toESM(require("mongoose"));
var DisputeResponseSchema = new import_mongoose14.Schema(
  {
    disputeId: {
      type: import_mongoose14.Schema.Types.ObjectId,
      ref: "Dispute",
      required: true,
      index: true
    },
    organizationId: {
      type: import_mongoose14.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    respondedByUserId: {
      type: import_mongoose14.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    responseText: {
      type: String,
      required: true,
      trim: true
    },
    evidenceIds: [
      {
        type: import_mongoose14.Schema.Types.ObjectId,
        ref: "Evidence"
      }
    ],
    responseType: {
      type: String,
      enum: ["CONTEST", "ACCEPT", "PROVIDE_INFO"],
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
var DisputeResponse = import_mongoose14.default.model(
  "DisputeResponse",
  DisputeResponseSchema
);

// src/models/Notification.ts
var import_mongoose15 = __toESM(require("mongoose"));
var NotificationSchema = new import_mongoose15.Schema(
  {
    userId: {
      type: import_mongoose15.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    organizationId: {
      type: import_mongoose15.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    type: {
      type: String,
      enum: [
        "BUSINESS_VERIFICATION",
        "DISPUTE_ACTION",
        "EVIDENCE_REQUEST",
        "OVERDUE_UPDATE",
        "PAYMENT_STATUS",
        "SECURITY_EVENT",
        "SUBSCRIPTION_CHANGE"
      ],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    bodyMasked: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    referenceId: {
      type: String
    },
    referenceType: {
      type: String
    },
    readAt: {
      type: Date
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
var Notification = import_mongoose15.default.model("Notification", NotificationSchema);

// src/models/RegisteredDevice.ts
var import_mongoose16 = __toESM(require("mongoose"));
var RegisteredDeviceSchema = new import_mongoose16.Schema(
  {
    userId: {
      type: import_mongoose16.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    organizationId: {
      type: import_mongoose16.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    platform: {
      type: String,
      enum: ["ios", "android", "web"],
      required: true
    },
    pushToken: {
      type: String
    },
    appVersion: {
      type: String,
      default: "1.0.0"
    },
    deviceModel: {
      type: String
    },
    osVersion: {
      type: String
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    revokedAt: {
      type: Date
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
RegisteredDeviceSchema.index({ userId: 1, isRevoked: 1 });
var RegisteredDevice = import_mongoose16.default.model(
  "RegisteredDevice",
  RegisteredDeviceSchema
);

// src/models/AuditLog.ts
var import_mongoose17 = __toESM(require("mongoose"));
var AuditLogSchema = new import_mongoose17.Schema(
  {
    organizationId: {
      type: import_mongoose17.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    userId: {
      type: import_mongoose17.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    resource: {
      type: String,
      required: true,
      index: true
    },
    resourceId: {
      type: String
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    details: {
      type: import_mongoose17.Schema.Types.Mixed
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
var AuditLog = import_mongoose17.default.model("AuditLog", AuditLogSchema);

// src/models/IdempotencyRecord.ts
var import_mongoose18 = __toESM(require("mongoose"));
var IdempotencyRecordSchema = new import_mongoose18.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    organizationId: {
      type: import_mongoose18.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    endpoint: {
      type: String,
      required: true
    },
    requestHash: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
      default: "PROCESSING"
    },
    responseStatusCode: {
      type: Number
    },
    responseBody: {
      type: import_mongoose18.Schema.Types.Mixed
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
      // TTL index
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
var IdempotencyRecord = import_mongoose18.default.model(
  "IdempotencyRecord",
  IdempotencyRecordSchema
);

// src/models/RefreshToken.ts
var import_mongoose19 = __toESM(require("mongoose"));
var RefreshTokenSchema = new import_mongoose19.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: import_mongoose19.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    deviceId: {
      type: String,
      required: true
    },
    family: {
      type: String,
      required: true,
      index: true
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }
      // TTL index
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
var RefreshToken = import_mongoose19.default.model("RefreshToken", RefreshTokenSchema);

// src/models/SyncOperation.ts
var import_mongoose20 = __toESM(require("mongoose"));
var SyncOperationSchema = new import_mongoose20.Schema(
  {
    clientUuid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    clientId: {
      type: String,
      required: true
    },
    organizationId: {
      type: import_mongoose20.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    userId: {
      type: import_mongoose20.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    operationType: {
      type: String,
      enum: ["CREATE_REPORT", "RECORD_PAYMENT", "UPDATE_DISPUTE"],
      required: true
    },
    payload: {
      type: import_mongoose20.Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "CONFLICT", "REJECTED"],
      default: "PENDING",
      index: true
    },
    revision: {
      type: Number,
      default: 1
    },
    serverReceivedAt: {
      type: Date,
      default: Date.now
    },
    serverCommittedAt: {
      type: Date
    },
    errorMessage: {
      type: String
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);
var SyncOperation = import_mongoose20.default.model(
  "SyncOperation",
  SyncOperationSchema
);

// src/services/authService.ts
var AuthService = class {
  static generateTokens(userId, email, organizationId, role, isMfaVerified, tokenVersion, deviceId) {
    const accessToken = import_jsonwebtoken.default.sign(
      {
        userId,
        email,
        organizationId,
        role,
        isMfaVerified,
        tokenVersion,
        deviceId
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = import_jsonwebtoken.default.sign(
      {
        userId,
        deviceId,
        tokenId: import_crypto.default.randomUUID()
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: "15m"
    };
  }
  static async register(data, ipAddress, userAgent) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError({
        statusCode: 409,
        code: "USER_ALREADY_EXISTS",
        message: "An account with this email address already exists."
      });
    }
    const salt = await import_bcryptjs.default.genSalt(12);
    const passwordHash = await import_bcryptjs.default.hash(data.password, salt);
    return await withTransaction(async (session) => {
      const [user] = await User.create(
        [
          {
            email: data.email,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: "OWNER",
            status: "ACTIVE",
            isEmailVerified: false
          }
        ],
        { session }
      );
      const [org] = await Organization.create(
        [
          {
            name: data.organizationName,
            legalBusinessName: data.legalBusinessName,
            taxId: data.taxId,
            businessType: data.businessType,
            address: {
              street: data.street,
              city: data.city,
              state: data.state,
              postalCode: data.postalCode,
              country: "USA"
            },
            phone: data.phone || "000-000-0000",
            status: "PENDING_VERIFICATION",
            isComplianceApproved: false,
            ownerId: user._id
          }
        ],
        { session }
      );
      user.currentOrganizationId = org._id;
      await user.save({ session });
      await OrganizationMember.create(
        [
          {
            organizationId: org._id,
            userId: user._id,
            role: "OWNER",
            permissions: ["ALL"],
            status: "ACTIVE"
          }
        ],
        { session }
      );
      await Subscription.create(
        [
          {
            organizationId: org._id,
            plan: "STARTER",
            status: "TRIALING",
            currentPeriodStart: /* @__PURE__ */ new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
            limits: {
              monthlySearches: 25,
              monthlyReports: 50,
              maxTeamMembers: 3
            },
            usage: {
              searchCount: 0,
              reportCount: 0
            }
          }
        ],
        { session }
      );
      const deviceId = data.deviceId || import_crypto.default.randomUUID();
      await RegisteredDevice.findOneAndUpdate(
        { deviceId },
        {
          userId: user._id,
          organizationId: org._id,
          deviceId,
          platform: data.platform || "web",
          lastActiveAt: /* @__PURE__ */ new Date(),
          isRevoked: false
        },
        { upsert: true, new: true, session }
      );
      const tokens = this.generateTokens(
        user._id.toString(),
        user.email,
        org._id.toString(),
        user.role,
        false,
        user.tokenVersion,
        deviceId
      );
      const tokenHash = import_crypto.default.createHash("sha256").update(tokens.refreshToken).digest("hex");
      await RefreshToken.create(
        [
          {
            tokenHash,
            userId: user._id,
            deviceId,
            family: import_crypto.default.randomUUID(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
          }
        ],
        { session }
      );
      await AuditLog.create(
        [
          {
            organizationId: org._id,
            userId: user._id,
            action: "AUTH_REGISTER",
            resource: "User",
            resourceId: user._id.toString(),
            ipAddress,
            userAgent,
            details: { email: user.email, organizationName: org.name }
          }
        ],
        { session }
      );
      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          mfaEnabled: user.mfaEnabled
        },
        organization: {
          id: org._id.toString(),
          name: org.name,
          legalBusinessName: org.legalBusinessName,
          status: org.status,
          isComplianceApproved: org.isComplianceApproved
        },
        tokens
      };
    });
  }
  static async login(data, ipAddress, userAgent) {
    const user = await User.findOne({ email: data.email }).select("+passwordHash");
    if (!user) {
      throw new AppError({
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email address or password."
      });
    }
    if (user.status === "SUSPENDED") {
      throw new AppError({
        statusCode: 403,
        code: "ACCOUNT_SUSPENDED",
        message: "Your account has been suspended. Please contact customer support."
      });
    }
    if (user.lockUntil && user.lockUntil > /* @__PURE__ */ new Date()) {
      throw new AppError({
        statusCode: 403,
        code: "ACCOUNT_LOCKED",
        message: "Account is temporarily locked due to multiple failed login attempts."
      });
    }
    const isMatch = await import_bcryptjs.default.compare(data.password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1e3);
      }
      await user.save();
      throw new AppError({
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email address or password."
      });
    }
    user.failedLoginAttempts = 0;
    user.lockUntil = void 0;
    user.lastLoginAt = /* @__PURE__ */ new Date();
    await user.save();
    const deviceId = data.deviceId || import_crypto.default.randomUUID();
    await RegisteredDevice.findOneAndUpdate(
      { deviceId },
      {
        userId: user._id,
        organizationId: user.currentOrganizationId,
        deviceId,
        platform: data.platform || "web",
        lastActiveAt: /* @__PURE__ */ new Date(),
        isRevoked: false
      },
      { upsert: true, new: true }
    );
    const isMfaVerified = !user.mfaEnabled;
    const tokens = this.generateTokens(
      user._id.toString(),
      user.email,
      user.currentOrganizationId?.toString(),
      user.role,
      isMfaVerified,
      user.tokenVersion,
      deviceId
    );
    const tokenHash = import_crypto.default.createHash("sha256").update(tokens.refreshToken).digest("hex");
    await RefreshToken.create({
      tokenHash,
      userId: user._id,
      deviceId,
      family: import_crypto.default.randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
    });
    let organization = null;
    if (user.currentOrganizationId) {
      organization = await Organization.findById(user.currentOrganizationId);
    }
    await AuditLog.create({
      organizationId: user.currentOrganizationId,
      userId: user._id,
      action: "AUTH_LOGIN",
      resource: "User",
      resourceId: user._id.toString(),
      ipAddress,
      userAgent,
      details: { deviceId, mfaRequired: user.mfaEnabled }
    });
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        mfaEnabled: user.mfaEnabled
      },
      organization: organization ? {
        id: organization._id.toString(),
        name: organization.name,
        legalBusinessName: organization.legalBusinessName,
        status: organization.status,
        isComplianceApproved: organization.isComplianceApproved
      } : null,
      tokens,
      mfaRequired: user.mfaEnabled
    };
  }
  static async refresh(refreshTokenStr, deviceId) {
    let decoded;
    try {
      decoded = import_jsonwebtoken.default.verify(refreshTokenStr, env.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError({
        statusCode: 401,
        code: "INVALID_REFRESH_TOKEN",
        message: "Refresh token is expired or malformed."
      });
    }
    const tokenHash = import_crypto.default.createHash("sha256").update(refreshTokenStr).digest("hex");
    const storedToken = await RefreshToken.findOne({ tokenHash });
    if (!storedToken) {
      await RefreshToken.updateMany(
        { userId: decoded.userId, deviceId },
        { isRevoked: true }
      );
      throw new AppError({
        statusCode: 401,
        code: "TOKEN_REUSE_DETECTED",
        message: "Security violation: Refresh token reuse detected. Session has been revoked."
      });
    }
    if (storedToken.isRevoked) {
      await RefreshToken.updateMany({ family: storedToken.family }, { isRevoked: true });
      throw new AppError({
        statusCode: 401,
        code: "REVOKED_TOKEN_USED",
        message: "Attempted to use a revoked session. All related sessions have been revoked."
      });
    }
    const user = await User.findById(storedToken.userId);
    if (!user || user.status !== "ACTIVE") {
      throw new AppError({
        statusCode: 401,
        code: "USER_INACTIVE",
        message: "User account is no longer active."
      });
    }
    storedToken.isRevoked = true;
    await storedToken.save();
    const newTokens = this.generateTokens(
      user._id.toString(),
      user.email,
      user.currentOrganizationId?.toString(),
      user.role,
      true,
      // already verified session
      user.tokenVersion,
      deviceId
    );
    const newTokenHash = import_crypto.default.createHash("sha256").update(newTokens.refreshToken).digest("hex");
    await RefreshToken.create({
      tokenHash: newTokenHash,
      userId: user._id,
      deviceId,
      family: storedToken.family,
      // preserve family
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
    });
    return newTokens;
  }
  static async logout(userId, deviceId) {
    if (deviceId) {
      await RefreshToken.updateMany({ userId, deviceId }, { isRevoked: true });
      await RegisteredDevice.updateOne({ userId, deviceId }, { isRevoked: true });
    } else {
      await RefreshToken.updateMany({ userId }, { isRevoked: true });
    }
    await AuditLog.create({
      userId: new import_mongoose21.Types.ObjectId(userId),
      action: "AUTH_LOGOUT",
      resource: "User",
      resourceId: userId,
      details: { deviceId }
    });
    return { success: true };
  }
  static async verifyMfa(userId, code, backupCode) {
    const user = await User.findById(userId).select("+mfaSecret +mfaBackupCodes");
    if (!user) {
      throw new AppError({
        statusCode: 404,
        code: "USER_NOT_FOUND",
        message: "User not found."
      });
    }
    const isCodeValid = code && code.length === 6;
    const isBackupValid = backupCode && user.mfaBackupCodes.includes(backupCode);
    if (!isCodeValid && !isBackupValid) {
      throw new AppError({
        statusCode: 400,
        code: "INVALID_MFA_CODE",
        message: "The provided MFA code or backup code is invalid."
      });
    }
    if (isBackupValid && backupCode) {
      user.mfaBackupCodes = user.mfaBackupCodes.filter((c) => c !== backupCode);
      await user.save();
    }
    const tokens = this.generateTokens(
      user._id.toString(),
      user.email,
      user.currentOrganizationId?.toString(),
      user.role,
      true,
      user.tokenVersion,
      "current-device"
    );
    return { success: true, tokens };
  }
};

// src/validators/index.ts
var import_zod3 = require("zod");
var registerSchema = import_zod3.z.object({
  email: import_zod3.z.string().email("Invalid email address").trim().toLowerCase(),
  password: import_zod3.z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number"),
  firstName: import_zod3.z.string().min(1, "First name is required").trim(),
  lastName: import_zod3.z.string().min(1, "Last name is required").trim(),
  phone: import_zod3.z.string().optional(),
  organizationName: import_zod3.z.string().min(2, "Organization name is required").trim(),
  legalBusinessName: import_zod3.z.string().min(2, "Legal business name is required").trim(),
  taxId: import_zod3.z.string().min(4, "Tax ID / EIN is required").trim(),
  businessType: import_zod3.z.enum([
    "SOLE_PROPRIETORSHIP",
    "LLC",
    "CORPORATION",
    "PARTNERSHIP",
    "OTHER"
  ]),
  street: import_zod3.z.string().min(3, "Street address is required").trim(),
  city: import_zod3.z.string().min(2, "City is required").trim(),
  state: import_zod3.z.string().min(2, "State is required").trim(),
  postalCode: import_zod3.z.string().min(3, "Postal code is required").trim(),
  deviceId: import_zod3.z.string().optional(),
  platform: import_zod3.z.enum(["ios", "android", "web"]).default("web")
});
var loginSchema = import_zod3.z.object({
  email: import_zod3.z.string().email().trim().toLowerCase(),
  password: import_zod3.z.string().min(1, "Password is required"),
  deviceId: import_zod3.z.string().default("web-browser"),
  platform: import_zod3.z.enum(["ios", "android", "web"]).default("web")
});
var refreshTokenSchema = import_zod3.z.object({
  refreshToken: import_zod3.z.string().min(1, "Refresh token is required"),
  deviceId: import_zod3.z.string().min(1, "Device ID is required")
});
var mfaVerifySchema = import_zod3.z.object({
  mfaCode: import_zod3.z.string().length(6, "MFA code must be 6 digits").optional(),
  backupCode: import_zod3.z.string().optional()
});
var createOrgSchema = import_zod3.z.object({
  name: import_zod3.z.string().min(2).trim(),
  legalBusinessName: import_zod3.z.string().min(2).trim(),
  taxId: import_zod3.z.string().min(4).trim(),
  businessType: import_zod3.z.enum([
    "SOLE_PROPRIETORSHIP",
    "LLC",
    "CORPORATION",
    "PARTNERSHIP",
    "OTHER"
  ]),
  street: import_zod3.z.string().min(3).trim(),
  city: import_zod3.z.string().min(2).trim(),
  state: import_zod3.z.string().min(2).trim(),
  postalCode: import_zod3.z.string().min(3).trim(),
  phone: import_zod3.z.string().min(7).trim(),
  website: import_zod3.z.string().url().optional().or(import_zod3.z.literal(""))
});
var customerSearchSchema = import_zod3.z.object({
  name: import_zod3.z.string().min(2, "Customer name must be at least 2 characters").trim(),
  postalCode: import_zod3.z.string().min(3, "Postal code is required for corroboration").trim(),
  phoneLast4: import_zod3.z.string().regex(/^\d{4}$/, "Phone must be exactly last 4 digits").optional(),
  emailDomain: import_zod3.z.string().optional(),
  companyName: import_zod3.z.string().optional(),
  permissiblePurpose: import_zod3.z.enum(
    [
      "CREDIT_TRANSACTION",
      "COLLECTION_OF_ACCOUNT",
      "LEGITIMATE_BUSINESS_NEED_WITH_WRITTEN_PERMISSION",
      "EMPLOYMENT_WITH_WRITTEN_CONSENT",
      "COURT_ORDER"
    ],
    {
      errorMap: () => ({
        message: "A valid permissible purpose is legally required to search customer records."
      })
    }
  ),
  attestationSigned: import_zod3.z.literal(true, {
    errorMap: () => ({
      message: "You must certify that you have a documented permissible purpose under applicable law."
    })
  }),
  attestationText: import_zod3.z.string().min(10, "Attestation text confirmation is required")
});
var createReportSchema = import_zod3.z.object({
  customerName: import_zod3.z.string().min(2, "Customer name is required").trim(),
  customerPostalCode: import_zod3.z.string().min(3, "Postal code is required").trim(),
  customerPhoneLast4: import_zod3.z.string().regex(/^\d{4}$/).optional(),
  customerEmailDomain: import_zod3.z.string().optional(),
  invoiceNumber: import_zod3.z.string().min(1, "Invoice number is required").trim(),
  serviceDescription: import_zod3.z.string().min(5, "Service description is required").trim(),
  amountMinorUnits: import_zod3.z.number().int("Amount must be an integer in minor currency units (cents)").positive("Invoice amount must be positive"),
  currency: import_zod3.z.string().length(3).default("USD"),
  issueDate: import_zod3.z.string().datetime(),
  dueDate: import_zod3.z.string().datetime(),
  dueDateBasis: import_zod3.z.enum(["NET_30", "NET_15", "UPON_RECEIPT", "CUSTOM"]).default("NET_30"),
  evidenceIds: import_zod3.z.array(import_zod3.z.string()).default([]),
  termsAccepted: import_zod3.z.literal(true, {
    errorMap: () => ({ message: "You must certify the accuracy of the reported invoice data." })
  }),
  clientUuid: import_zod3.z.string().optional(),
  idempotencyKey: import_zod3.z.string().optional()
});
var recordPaymentSchema = import_zod3.z.object({
  amountMinorUnits: import_zod3.z.number().int("Amount must be integer minor currency units (cents)").positive("Payment amount must be greater than zero"),
  effectivePaymentDate: import_zod3.z.string().datetime(),
  paymentMethodCategory: import_zod3.z.enum(["ACH", "CREDIT_CARD", "CHECK", "WIRE", "CASH", "OTHER"]),
  supportingEvidenceId: import_zod3.z.string().optional(),
  idempotencyKey: import_zod3.z.string().min(8, "Idempotency key is required for all payment mutations"),
  notes: import_zod3.z.string().max(500).optional(),
  expectedRevision: import_zod3.z.number().int().optional()
});
var createDisputeSchema = import_zod3.z.object({
  invoiceId: import_zod3.z.string().min(1, "Invoice ID is required"),
  customerName: import_zod3.z.string().min(1, "Customer name is required"),
  disputeType: import_zod3.z.enum([
    "INCORRECT_AMOUNT",
    "ALREADY_PAID",
    "NEVER_RECEIVED_SERVICE",
    "IDENTITY_THEFT",
    "TERMS_DISPUTE",
    "OTHER"
  ]),
  explanation: import_zod3.z.string().min(10, "A detailed explanation is required"),
  evidenceIds: import_zod3.z.array(import_zod3.z.string()).default([])
});
var respondDisputeSchema = import_zod3.z.object({
  responseText: import_zod3.z.string().min(10, "Response text must be at least 10 characters"),
  responseType: import_zod3.z.enum(["CONTEST", "ACCEPT", "PROVIDE_INFO"]),
  evidenceIds: import_zod3.z.array(import_zod3.z.string()).default([])
});
var appealDisputeSchema = import_zod3.z.object({
  appealReason: import_zod3.z.string().min(10, "Appeal reason must be at least 10 characters")
});
var registerDeviceSchema = import_zod3.z.object({
  deviceId: import_zod3.z.string().min(1, "Device identifier is required"),
  platform: import_zod3.z.enum(["ios", "android", "web"]),
  pushToken: import_zod3.z.string().optional(),
  appVersion: import_zod3.z.string().default("1.0.0"),
  deviceModel: import_zod3.z.string().optional(),
  osVersion: import_zod3.z.string().optional()
});

// src/middleware/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHORIZED_NO_TOKEN",
        message: "Authentication token is missing or malformed."
      });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = import_jsonwebtoken2.default.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new AppError({
          statusCode: 401,
          code: "TOKEN_EXPIRED",
          message: "Access token has expired. Please refresh your session."
        });
      }
      throw new AppError({
        statusCode: 401,
        code: "TOKEN_INVALID",
        message: "Access token is invalid."
      });
    }
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== "ACTIVE") {
      throw new AppError({
        statusCode: 401,
        code: "USER_INACTIVE_OR_NOT_FOUND",
        message: "User account is not active or no longer exists."
      });
    }
    if (user.tokenVersion !== decoded.tokenVersion) {
      throw new AppError({
        statusCode: 401,
        code: "SESSION_REVOKED",
        message: "User session has been revoked. Please sign in again."
      });
    }
    req.user = {
      userId: user._id.toString(),
      email: user.email,
      organizationId: decoded.organizationId || (user.currentOrganizationId ? user.currentOrganizationId.toString() : void 0),
      role: user.role,
      isMfaVerified: Boolean(decoded.isMfaVerified),
      deviceId: decoded.deviceId
    };
    next();
  } catch (error) {
    next(error);
  }
}
function requireOrganization(req, res, next) {
  if (!req.user?.organizationId) {
    return next(
      new AppError({
        statusCode: 403,
        code: "NO_ORGANIZATION_CONTEXT",
        message: "An active organization context is required for this operation."
      })
    );
  }
  next();
}
async function requireVerifiedBusiness(req, res, next) {
  try {
    if (!req.user?.organizationId) {
      throw new AppError({
        statusCode: 403,
        code: "NO_ORGANIZATION_CONTEXT",
        message: "An active organization context is required for this operation."
      });
    }
    const org = await Organization.findById(req.user.organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: "ORGANIZATION_NOT_FOUND",
        message: "Organization not found."
      });
    }
    if (org.status !== "APPROVED") {
      throw new AppError({
        statusCode: 403,
        code: "BUSINESS_VERIFICATION_REQUIRED",
        message: "Your business verification is pending approval. You cannot perform sensitive customer searches or publish reports until approved.",
        details: { currentStatus: org.status }
      });
    }
    next();
  } catch (error) {
    next(error);
  }
}

// src/routes/authRoutes.ts
var authRouter = (0, import_express.Router)();
authRouter.post(
  "/register",
  authRateLimiter,
  async (req, res, next) => {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register(
        validated,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);
authRouter.post(
  "/login",
  authRateLimiter,
  async (req, res, next) => {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(
        validated,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
authRouter.post(
  "/refresh",
  async (req, res, next) => {
    try {
      const validated = refreshTokenSchema.parse(req.body);
      const tokens = await AuthService.refresh(
        validated.refreshToken,
        validated.deviceId
      );
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  }
);
authRouter.post(
  "/logout",
  authenticate,
  async (req, res, next) => {
    try {
      const deviceId = req.body?.deviceId || req.user?.deviceId;
      const result = await AuthService.logout(req.user.userId, deviceId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
authRouter.post(
  "/mfa/verify",
  authenticate,
  async (req, res, next) => {
    try {
      const validated = mfaVerifySchema.parse(req.body);
      const result = await AuthService.verifyMfa(
        req.user.userId,
        validated.mfaCode,
        validated.backupCode
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/meRoutes.ts
var import_express2 = require("express");
var meRouter = (0, import_express2.Router)();
meRouter.get(
  "/",
  authenticate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        throw new AppError({
          statusCode: 404,
          code: "USER_NOT_FOUND",
          message: "User profile not found."
        });
      }
      let organization = null;
      let subscription = null;
      if (user.currentOrganizationId) {
        organization = await Organization.findById(user.currentOrganizationId);
        if (organization) {
          subscription = await Subscription.findOne({
            organizationId: organization._id
          });
        }
      }
      res.status(200).json({
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
          isMfaVerified: req.user.isMfaVerified,
          status: user.status,
          createdAt: user.createdAt
        },
        organization: organization ? {
          id: organization._id.toString(),
          name: organization.name,
          legalBusinessName: organization.legalBusinessName,
          taxIdMasked: `***-**-${organization.taxId.slice(-4)}`,
          status: organization.status,
          isComplianceApproved: organization.isComplianceApproved,
          businessType: organization.businessType,
          address: organization.address,
          phone: organization.phone
        } : null,
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          limits: subscription.limits,
          usage: subscription.usage,
          currentPeriodEnd: subscription.currentPeriodEnd
        } : null,
        capabilities: {
          canSearchCustomers: Boolean(
            organization && organization.status === "APPROVED" && subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIALING")
          ),
          canSubmitReports: Boolean(
            organization && organization.status === "APPROVED" && subscription && (subscription.status === "ACTIVE" || subscription.status === "TRIALING")
          ),
          canManageTeam: ["OWNER", "ADMIN"].includes(user.role),
          requiresVerification: !organization || organization.status !== "APPROVED"
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/organizationRoutes.ts
var import_express3 = require("express");

// src/services/organizationService.ts
var import_mongoose22 = require("mongoose");
var OrganizationService = class {
  static async getCurrent(organizationId) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: "ORGANIZATION_NOT_FOUND",
        message: "Organization not found."
      });
    }
    const subscription = await Subscription.findOne({ organizationId: org._id });
    const verification = await BusinessVerification.findOne({ organizationId: org._id }).sort({
      createdAt: -1
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
        createdAt: org.createdAt
      },
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        limits: subscription.limits,
        usage: subscription.usage,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : null,
      verification: verification ? {
        status: verification.status,
        submittedAt: verification.createdAt,
        verifiedAt: verification.verifiedAt,
        reviewNotes: verification.reviewNotes
      } : null
    };
  }
  static async getMembers(organizationId) {
    const members = await OrganizationMember.find({ organizationId }).populate("userId", "firstName lastName email role").sort({ joinedAt: 1 });
    return members.map((m) => ({
      id: m._id.toString(),
      userId: m.userId?._id?.toString(),
      name: `${m.userId?.firstName || ""} ${m.userId?.lastName || ""}`.trim(),
      email: m.userId?.email,
      role: m.role,
      permissions: m.permissions,
      status: m.status,
      joinedAt: m.joinedAt
    }));
  }
  static async create(userId, data) {
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
        country: "USA"
      },
      phone: data.phone,
      website: data.website,
      status: "PENDING_VERIFICATION",
      isComplianceApproved: false,
      ownerId: new import_mongoose22.Types.ObjectId(userId)
    });
    await OrganizationMember.create({
      organizationId: org._id,
      userId: new import_mongoose22.Types.ObjectId(userId),
      role: "OWNER",
      permissions: ["ALL"],
      status: "ACTIVE"
    });
    await Subscription.create({
      organizationId: org._id,
      plan: "STARTER",
      status: "TRIALING",
      currentPeriodStart: /* @__PURE__ */ new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3),
      limits: {
        monthlySearches: 25,
        monthlyReports: 50,
        maxTeamMembers: 3
      },
      usage: {
        searchCount: 0,
        reportCount: 0
      }
    });
    await User.findByIdAndUpdate(userId, { currentOrganizationId: org._id });
    return org;
  }
};

// src/routes/organizationRoutes.ts
var organizationRouter = (0, import_express3.Router)();
organizationRouter.get(
  "/current",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const data = await OrganizationService.getCurrent(req.user.organizationId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  }
);
organizationRouter.post(
  "/",
  authenticate,
  async (req, res, next) => {
    try {
      const validated = createOrgSchema.parse(req.body);
      const org = await OrganizationService.create(req.user.userId, validated);
      res.status(201).json(org);
    } catch (error) {
      next(error);
    }
  }
);
organizationRouter.get(
  "/members",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const members = await OrganizationService.getMembers(req.user.organizationId);
      res.status(200).json({ members });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/verificationRoutes.ts
var import_express4 = require("express");

// src/services/verificationService.ts
var import_mongoose23 = require("mongoose");
var VerificationService = class {
  static async submit(organizationId, userId, documents) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: "ORGANIZATION_NOT_FOUND",
        message: "Organization not found."
      });
    }
    if (documents.length === 0) {
      throw new AppError({
        statusCode: 400,
        code: "DOCUMENTS_REQUIRED",
        message: "At least one identity or business document is required for verification."
      });
    }
    const formattedDocs = documents.map((doc) => ({
      docType: doc.docType,
      evidenceId: new import_mongoose23.Types.ObjectId(doc.evidenceId),
      status: "PENDING",
      notes: doc.notes
    }));
    const verification = await BusinessVerification.findOneAndUpdate(
      { organizationId: org._id },
      {
        organizationId: org._id,
        submittedByUserId: new import_mongoose23.Types.ObjectId(userId),
        documents: formattedDocs,
        status: "IN_REVIEW",
        reviewNotes: "Documents submitted. Pending compliance specialist review."
      },
      { upsert: true, new: true }
    );
    org.status = "IN_REVIEW";
    await org.save();
    await AuditLog.create({
      organizationId: org._id,
      userId: new import_mongoose23.Types.ObjectId(userId),
      action: "BUSINESS_VERIFICATION_SUBMITTED",
      resource: "BusinessVerification",
      resourceId: verification._id.toString(),
      details: { documentCount: documents.length }
    });
    await Notification.create({
      userId: new import_mongoose23.Types.ObjectId(userId),
      organizationId: org._id,
      type: "BUSINESS_VERIFICATION",
      title: "Verification In Review",
      bodyMasked: "Your business verification documents have been received and are in review."
    });
    return verification;
  }
  static async getStatus(organizationId) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: "ORGANIZATION_NOT_FOUND",
        message: "Organization not found."
      });
    }
    const verification = await BusinessVerification.findOne({
      organizationId: org._id
    }).populate("documents.evidenceId").sort({ createdAt: -1 });
    return {
      organizationStatus: org.status,
      isApproved: org.status === "APPROVED",
      verificationDetails: verification ? {
        status: verification.status,
        submittedAt: verification.createdAt,
        verifiedAt: verification.verifiedAt,
        reviewNotes: verification.reviewNotes,
        documents: verification.documents,
        rejectionReason: verification.rejectionReason
      } : {
        status: "NOT_SUBMITTED",
        requirements: [
          "BUSINESS_LICENSE",
          "CERTIFICATE_OF_INCORPORATION",
          "TAX_ID_DOCUMENT",
          "GOVERNMENT_PHOTO_ID"
        ]
      }
    };
  }
  static async approve(organizationId, reviewerUserId) {
    const org = await Organization.findById(organizationId);
    if (!org) {
      throw new AppError({
        statusCode: 404,
        code: "ORGANIZATION_NOT_FOUND",
        message: "Organization not found."
      });
    }
    org.status = "APPROVED";
    await org.save();
    const verification = await BusinessVerification.findOneAndUpdate(
      { organizationId: org._id },
      {
        status: "VERIFIED",
        verifiedAt: /* @__PURE__ */ new Date(),
        reviewedBy: new import_mongoose23.Types.ObjectId(reviewerUserId),
        reviewNotes: "Identity and organization documentation verified successfully."
      },
      { new: true }
    );
    await Notification.create({
      userId: org.ownerId,
      organizationId: org._id,
      type: "BUSINESS_VERIFICATION",
      title: "Business Verification Approved",
      bodyMasked: "Congratulations! Your business verification has been approved. You now have full access to customer search and report publishing."
    });
    return verification;
  }
};

// src/routes/verificationRoutes.ts
var import_zod4 = require("zod");
var verificationRouter = (0, import_express4.Router)();
var submitVerificationDocsSchema = import_zod4.z.object({
  documents: import_zod4.z.array(
    import_zod4.z.object({
      docType: import_zod4.z.enum([
        "BUSINESS_LICENSE",
        "CERTIFICATE_OF_INCORPORATION",
        "TAX_ID_DOCUMENT",
        "UTILITY_BILL",
        "GOVERNMENT_PHOTO_ID",
        "BANK_STATEMENT"
      ]),
      evidenceId: import_zod4.z.string().min(1),
      notes: import_zod4.z.string().optional()
    })
  ).min(1, "At least one document is required")
});
verificationRouter.post(
  "/",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const validated = submitVerificationDocsSchema.parse(req.body);
      const result = await VerificationService.submit(
        req.user.organizationId,
        req.user.userId,
        validated.documents
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
verificationRouter.get(
  "/status",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const status = await VerificationService.getStatus(req.user.organizationId);
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }
);
verificationRouter.post(
  "/approve",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const targetOrgId = req.body?.organizationId || req.user.organizationId;
      const result = await VerificationService.approve(targetOrgId, req.user.userId);
      res.status(200).json({ success: true, verification: result });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/customerSearchRoutes.ts
var import_express5 = require("express");

// src/services/customerSearchService.ts
var import_mongoose24 = require("mongoose");

// src/utils/masking.ts
function maskName(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return `${parts[0][0]}***`;
  }
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${first[0]}*** ${lastInitial}.`;
}

// src/services/customerSearchService.ts
var CustomerSearchService = class {
  static async search(organizationId, userId, input, ipAddress, userAgent) {
    const org = await Organization.findById(organizationId);
    if (!org || org.status !== "APPROVED") {
      throw new AppError({
        statusCode: 403,
        code: "ORGANIZATION_NOT_VERIFIED",
        message: "Your organization must have verified status to perform customer searches."
      });
    }
    const subscription = await Subscription.findOne({ organizationId: org._id });
    if (!subscription || subscription.status !== "ACTIVE" && subscription.status !== "TRIALING") {
      throw new AppError({
        statusCode: 403,
        code: "SUBSCRIPTION_INACTIVE",
        message: "An active subscription plan is required to perform customer searches."
      });
    }
    if (subscription.usage.searchCount >= subscription.limits.monthlySearches) {
      throw new AppError({
        statusCode: 403,
        code: "SEARCH_QUOTA_EXCEEDED",
        message: "You have reached your monthly search limit. Please upgrade your plan for additional searches.",
        details: {
          currentUsage: subscription.usage.searchCount,
          limit: subscription.limits.monthlySearches
        }
      });
    }
    if (!input.attestationSigned) {
      throw new AppError({
        statusCode: 400,
        code: "ATTESTATION_REQUIRED",
        message: "You must certify that you possess a legally valid permissible purpose."
      });
    }
    const nameParts = input.name.trim().split(/\s+/);
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts.length > 1 ? nameParts[0] : void 0;
    const query = {
      postalCode: input.postalCode.trim()
    };
    if (input.companyName) {
      query.companyName = new RegExp(`^${input.companyName.trim()}$`, "i");
    } else {
      query.$or = [
        { lastName: new RegExp(`^${lastName}$`, "i") },
        { companyName: new RegExp(`^${input.name.trim()}$`, "i") }
      ];
    }
    if (input.phoneLast4) {
      query.phoneLast4 = input.phoneLast4;
    }
    const matchedRecords = await CustomerRecord.find(query).limit(10);
    let matchConfidence = "NO_MATCH";
    let ambiguousWarning = null;
    if (matchedRecords.length === 0) {
      matchConfidence = "NO_MATCH";
    } else if (matchedRecords.length === 1) {
      const record = matchedRecords[0];
      const hasFirstMatch = firstName && record.firstName && record.firstName.toLowerCase() === firstName.toLowerCase();
      const hasPhoneMatch = input.phoneLast4 && record.phoneLast4 === input.phoneLast4;
      if (hasPhoneMatch || hasFirstMatch && input.postalCode === record.postalCode) {
        matchConfidence = "EXACT";
      } else {
        matchConfidence = "PROBABLE";
      }
    } else {
      matchConfidence = "AMBIGUOUS";
      ambiguousWarning = "Multiple customer records matched this surname in this postal area. To avoid misidentification, please provide corroborating details (e.g. phone last 4 digits or exact service address).";
    }
    subscription.usage.searchCount += 1;
    await subscription.save();
    const searchLog = await CustomerSearch.create({
      organizationId: org._id,
      userId: new import_mongoose24.Types.ObjectId(userId),
      permissiblePurpose: input.permissiblePurpose,
      attestationSigned: input.attestationSigned,
      attestationText: input.attestationText,
      searchCriteria: {
        name: input.name,
        postalCode: input.postalCode,
        phoneLast4: input.phoneLast4,
        emailDomain: input.emailDomain,
        companyName: input.companyName
      },
      resultsReturnedCount: matchedRecords.length,
      matchConfidence,
      matchedCustomerIds: matchedRecords.map((r) => r._id),
      ipAddress,
      userAgent
    });
    await AuditLog.create({
      organizationId: org._id,
      userId: new import_mongoose24.Types.ObjectId(userId),
      action: "CUSTOMER_SEARCH_EXECUTED",
      resource: "CustomerSearch",
      resourceId: searchLog._id.toString(),
      ipAddress,
      userAgent,
      details: {
        permissiblePurpose: input.permissiblePurpose,
        matchConfidence,
        resultsCount: matchedRecords.length
      }
    });
    const sanitizedMatches = matchedRecords.map((r) => ({
      id: r._id.toString(),
      maskedName: r.companyName || maskName(`${r.firstName || ""} ${r.lastName || ""}`),
      postalCode: r.postalCode,
      phoneLast4Masked: r.phoneLast4 ? `(***) ***-${r.phoneLast4}` : null,
      emailDomain: r.emailDomain ? `***@${r.emailDomain}` : null,
      addressCityState: r.addressCityState,
      verifiedInvoiceCount: r.totalInvoicesCount,
      paymentTimelinessDistribution: {
        onTimeCount: r.onTimePaymentsCount,
        lateCount: r.latePaymentsCount,
        onTimePercentage: r.totalInvoicesCount > 0 ? Math.round(r.onTimePaymentsCount / r.totalInvoicesCount * 100) : 0
      },
      outstandingVerifiedBalanceMinorUnits: r.totalOutstandingMinorUnits,
      activeDisputesCount: r.disputeActiveCount,
      contributingSourcesCount: r.contributingOrganizationsCount,
      lastUpdatedDate: r.lastUpdatedDate,
      dataLimitations: "This historical payment report reflects direct commercial invoices submitted by verified contractors and service providers. It does not constitute a numerical credit score or consumer credit rating."
    }));
    return {
      searchId: searchLog._id.toString(),
      matchConfidence,
      ambiguousWarning,
      requiresAdditionalInfo: matchConfidence === "AMBIGUOUS",
      matches: sanitizedMatches,
      remainingQuota: subscription.limits.monthlySearches - subscription.usage.searchCount
    };
  }
  static async getMatchesBySearchId(searchId, organizationId) {
    const search = await CustomerSearch.findOne({
      _id: searchId,
      organizationId: new import_mongoose24.Types.ObjectId(organizationId)
    }).populate("matchedCustomerIds");
    if (!search) {
      throw new AppError({
        statusCode: 404,
        code: "SEARCH_RECORD_NOT_FOUND",
        message: "Search record not found or does not belong to your organization."
      });
    }
    return {
      searchId: search._id.toString(),
      permissiblePurpose: search.permissiblePurpose,
      createdAt: search.createdAt,
      matchConfidence: search.matchConfidence,
      matches: search.matchedCustomerIds.map((r) => ({
        id: r._id.toString(),
        maskedName: r.companyName || maskName(`${r.firstName || ""} ${r.lastName || ""}`),
        postalCode: r.postalCode,
        verifiedInvoiceCount: r.totalInvoicesCount,
        paymentTimelinessDistribution: {
          onTimeCount: r.onTimePaymentsCount,
          lateCount: r.latePaymentsCount
        },
        outstandingVerifiedBalanceMinorUnits: r.totalOutstandingMinorUnits,
        activeDisputesCount: r.disputeActiveCount,
        lastUpdatedDate: r.lastUpdatedDate
      }))
    };
  }
};

// src/routes/customerSearchRoutes.ts
var customerSearchRouter = (0, import_express5.Router)();
customerSearchRouter.post(
  "/",
  authenticate,
  requireOrganization,
  requireVerifiedBusiness,
  async (req, res, next) => {
    try {
      const validated = customerSearchSchema.parse(req.body);
      const result = await CustomerSearchService.search(
        req.user.organizationId,
        req.user.userId,
        validated,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
customerSearchRouter.get(
  "/:id/matches",
  authenticate,
  requireOrganization,
  requireVerifiedBusiness,
  async (req, res, next) => {
    try {
      const result = await CustomerSearchService.getMatchesBySearchId(
        req.params.id,
        req.user.organizationId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/reportRoutes.ts
var import_express6 = require("express");
var import_crypto4 = __toESM(require("crypto"));
var import_fs2 = __toESM(require("fs"));

// src/services/invoiceReportService.ts
var import_crypto2 = __toESM(require("crypto"));
var import_mongoose25 = require("mongoose");
var InvoiceReportService = class {
  static async createReport(organizationId, userId, input, ipAddress, userAgent) {
    const org = await Organization.findById(organizationId);
    if (!org || org.status !== "APPROVED") {
      throw new AppError({
        statusCode: 403,
        code: "ORGANIZATION_NOT_VERIFIED",
        message: "Your organization must be verified and approved before submitting customer invoice reports."
      });
    }
    const subscription = await Subscription.findOne({ organizationId: org._id });
    if (!subscription || subscription.status !== "ACTIVE" && subscription.status !== "TRIALING") {
      throw new AppError({
        statusCode: 403,
        code: "SUBSCRIPTION_INACTIVE",
        message: "An active subscription plan is required to submit reports."
      });
    }
    if (subscription.usage.reportCount >= subscription.limits.monthlyReports) {
      throw new AppError({
        statusCode: 403,
        code: "REPORT_QUOTA_EXCEEDED",
        message: "You have reached your monthly report submission quota. Please upgrade your subscription."
      });
    }
    const existingInvoice = await Invoice.findOne({
      organizationId: org._id,
      invoiceNumber: input.invoiceNumber.trim()
    });
    if (existingInvoice) {
      throw new AppError({
        statusCode: 409,
        code: "INVOICE_NUMBER_ALREADY_EXISTS",
        message: `An invoice with invoice number "${input.invoiceNumber}" has already been submitted by your organization.`
      });
    }
    return await withTransaction(async (session) => {
      const nameParts = input.customerName.trim().split(/\s+/);
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts.length > 1 ? nameParts[0] : void 0;
      let customer = await CustomerRecord.findOne({
        postalCode: input.customerPostalCode.trim(),
        lastName: new RegExp(`^${lastName}$`, "i")
      }).session(session);
      if (!customer) {
        const [newCustomer] = await CustomerRecord.create(
          [
            {
              firstName,
              lastName,
              postalCode: input.customerPostalCode.trim(),
              phoneLast4: input.customerPhoneLast4,
              emailDomain: input.customerEmailDomain,
              totalInvoicesCount: 1,
              onTimePaymentsCount: 0,
              latePaymentsCount: 0,
              totalPaidMinorUnits: 0,
              totalOutstandingMinorUnits: input.amountMinorUnits,
              contributingOrganizationsCount: 1,
              isVerified: true
            }
          ],
          { session }
        );
        customer = newCustomer;
      } else {
        customer.totalInvoicesCount += 1;
        customer.totalOutstandingMinorUnits += input.amountMinorUnits;
        customer.lastUpdatedDate = /* @__PURE__ */ new Date();
        await customer.save({ session });
      }
      const [invoice] = await Invoice.create(
        [
          {
            organizationId: org._id,
            customerRecordId: customer._id,
            customerName: input.customerName.trim(),
            customerPostalCode: input.customerPostalCode.trim(),
            invoiceNumber: input.invoiceNumber.trim(),
            serviceDescription: input.serviceDescription.trim(),
            amountMinorUnits: input.amountMinorUnits,
            currency: (input.currency || "USD").toUpperCase(),
            issueDate: new Date(input.issueDate),
            dueDate: new Date(input.dueDate),
            dueDateBasis: input.dueDateBasis,
            status: "SUBMITTED",
            currentBalanceMinorUnits: input.amountMinorUnits,
            isPaidLate: false,
            evidenceIds: input.evidenceIds.map((id) => new import_mongoose25.Types.ObjectId(id)),
            attestation: {
              signedByUserId: new import_mongoose25.Types.ObjectId(userId),
              signedAt: /* @__PURE__ */ new Date(),
              termsAccepted: input.termsAccepted
            },
            revision: 1
          }
        ],
        { session }
      );
      const receiptNumber = `RP-${Date.now().toString(36).toUpperCase()}-${import_crypto2.default.randomBytes(3).toString("hex").toUpperCase()}`;
      const complianceStatus = env.ENABLE_LIVE_CONSUMER_REPORTING ? "APPROVED" : "GATED";
      const published = env.ENABLE_LIVE_CONSUMER_REPORTING && org.isComplianceApproved;
      const [report] = await Report.create(
        [
          {
            organizationId: org._id,
            invoiceId: invoice._id,
            customerRecordId: customer._id,
            status: "SUBMITTED",
            submissionReceiptNumber: receiptNumber,
            publishedToNetwork: published,
            complianceApprovalStatus: complianceStatus,
            submittedAt: /* @__PURE__ */ new Date()
          }
        ],
        { session }
      );
      if (input.evidenceIds.length > 0) {
        await Evidence.updateMany(
          { _id: { $in: input.evidenceIds.map((id) => new import_mongoose25.Types.ObjectId(id)) } },
          { relatedEntityType: "INVOICE", relatedEntityId: invoice._id }
        ).session(session);
      }
      subscription.usage.reportCount += 1;
      await subscription.save({ session });
      await AuditLog.create(
        [
          {
            organizationId: org._id,
            userId: new import_mongoose25.Types.ObjectId(userId),
            action: "INVOICE_REPORT_SUBMITTED",
            resource: "Report",
            resourceId: report._id.toString(),
            ipAddress,
            userAgent,
            details: {
              invoiceNumber: invoice.invoiceNumber,
              amountMinorUnits: invoice.amountMinorUnits,
              receiptNumber,
              complianceStatus
            }
          }
        ],
        { session }
      );
      await Notification.create(
        [
          {
            userId: new import_mongoose25.Types.ObjectId(userId),
            organizationId: org._id,
            type: "PAYMENT_STATUS",
            title: "Report Submitted",
            bodyMasked: `Invoice report #${invoice.invoiceNumber} has been recorded with receipt ${receiptNumber}.`,
            referenceId: report._id.toString(),
            referenceType: "Report"
          }
        ],
        { session }
      );
      return {
        report: {
          id: report._id.toString(),
          receiptNumber: report.submissionReceiptNumber,
          status: report.status,
          publishedToNetwork: report.publishedToNetwork,
          complianceApprovalStatus: report.complianceApprovalStatus,
          submittedAt: report.submittedAt
        },
        invoice: {
          id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          amountMinorUnits: invoice.amountMinorUnits,
          currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
          dueDate: invoice.dueDate,
          status: invoice.status,
          revision: invoice.revision
        }
      };
    });
  }
  static async getReports(organizationId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      Report.find({ organizationId: new import_mongoose25.Types.ObjectId(organizationId) }).populate("invoiceId").sort({ submittedAt: -1 }).skip(skip).limit(limit),
      Report.countDocuments({ organizationId: new import_mongoose25.Types.ObjectId(organizationId) })
    ]);
    return {
      data: reports.map((r) => ({
        id: r._id.toString(),
        receiptNumber: r.submissionReceiptNumber,
        status: r.status,
        complianceApprovalStatus: r.complianceApprovalStatus,
        publishedToNetwork: r.publishedToNetwork,
        submittedAt: r.submittedAt,
        invoice: r.invoiceId ? {
          id: r.invoiceId._id.toString(),
          invoiceNumber: r.invoiceId.invoiceNumber,
          customerName: r.invoiceId.customerName,
          amountMinorUnits: r.invoiceId.amountMinorUnits,
          currentBalanceMinorUnits: r.invoiceId.currentBalanceMinorUnits,
          dueDate: r.invoiceId.dueDate,
          status: r.invoiceId.status,
          isPaidLate: r.invoiceId.isPaidLate
        } : null
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }
  static async getReportById(reportId, organizationId) {
    const report = await Report.findOne({
      _id: reportId,
      organizationId: new import_mongoose25.Types.ObjectId(organizationId)
    }).populate("invoiceId customerRecordId");
    if (!report) {
      throw new AppError({
        statusCode: 404,
        code: "REPORT_NOT_FOUND",
        message: "Report not found or does not belong to your organization."
      });
    }
    return {
      id: report._id.toString(),
      receiptNumber: report.submissionReceiptNumber,
      status: report.status,
      complianceApprovalStatus: report.complianceApprovalStatus,
      publishedToNetwork: report.publishedToNetwork,
      submittedAt: report.submittedAt,
      invoice: report.invoiceId,
      customer: report.customerRecordId
    };
  }
};

// src/middleware/idempotency.ts
var import_crypto3 = __toESM(require("crypto"));
function idempotencyMiddleware(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  const idempotencyKey = req.headers["idempotency-key"] || req.body?.idempotencyKey;
  if (!idempotencyKey) {
    return next();
  }
  const organizationId = req.user?.organizationId;
  if (!organizationId) {
    return next();
  }
  const requestHash = import_crypto3.default.createHash("sha256").update(JSON.stringify(req.body || {})).digest("hex");
  const endpoint = `${req.method} ${req.baseUrl || ""}${req.path}`;
  IdempotencyRecord.findOne({ key: idempotencyKey, organizationId }).then((existingRecord) => {
    if (existingRecord) {
      if (existingRecord.status === "COMPLETED") {
        res.setHeader("X-Idempotency-Status", "REPLAYED");
        return res.status(existingRecord.responseStatusCode || 200).json(existingRecord.responseBody);
      }
      if (existingRecord.status === "PROCESSING") {
        return next(
          new AppError({
            statusCode: 409,
            code: "IDEMPOTENCY_CONCURRENT_REQUEST",
            message: "An operation with this idempotency key is currently processing. Please do not retry immediately."
          })
        );
      }
    }
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1e3);
    IdempotencyRecord.create({
      key: idempotencyKey,
      organizationId,
      endpoint,
      requestHash,
      status: "PROCESSING",
      expiresAt
    }).then(() => {
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        const statusCode = res.statusCode;
        IdempotencyRecord.updateOne(
          { key: idempotencyKey, organizationId },
          {
            status: statusCode < 400 ? "COMPLETED" : "FAILED",
            responseStatusCode: statusCode,
            responseBody: body
          }
        ).catch(() => {
        });
        return originalJson(body);
      };
      next();
    }).catch((err) => {
      if (err.code === 11e3) {
        return next(
          new AppError({
            statusCode: 409,
            code: "IDEMPOTENCY_CONCURRENT_REQUEST",
            message: "A duplicate request with this idempotency key was detected."
          })
        );
      }
      next(err);
    });
  }).catch(next);
}

// src/middleware/upload.ts
var import_multer = __toESM(require("multer"));
var import_path = __toESM(require("path"));
var import_fs = __toESM(require("fs"));
var import_os = __toESM(require("os"));
var import_uuid2 = require("uuid");
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
var uploadDir = isServerless ? import_path.default.join(import_os.default.tmpdir(), "uploads") : import_path.default.resolve(env.UPLOAD_DIR);
try {
  if (!import_fs.default.existsSync(uploadDir)) {
    import_fs.default.mkdirSync(uploadDir, { recursive: true });
  }
} catch {
}
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      if (!import_fs.default.existsSync(uploadDir)) {
        import_fs.default.mkdirSync(uploadDir, { recursive: true });
      }
    } catch {
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = import_path.default.extname(file.originalname).toLowerCase();
    const uniqueName = `${(0, import_uuid2.v4)()}${ext}`;
    cb(null, uniqueName);
  }
});
var allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "image/tiff"
];
var evidenceUpload = (0, import_multer.default)({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
    // 10MB
    files: 5
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new AppError({
          statusCode: 400,
          code: "UNSUPPORTED_FILE_TYPE",
          message: "Only JPEG, PNG, WEBP, PDF, and TIFF files are permitted for evidence documents."
        })
      );
    }
    cb(null, true);
  }
});

// src/routes/reportRoutes.ts
var import_mongoose26 = require("mongoose");
var reportRouter = (0, import_express6.Router)();
reportRouter.post(
  "/",
  authenticate,
  requireOrganization,
  requireVerifiedBusiness,
  idempotencyMiddleware,
  async (req, res, next) => {
    try {
      const validated = createReportSchema.parse(req.body);
      const result = await InvoiceReportService.createReport(
        req.user.organizationId,
        req.user.userId,
        validated,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);
reportRouter.get(
  "/",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const result = await InvoiceReportService.getReports(
        req.user.organizationId,
        page,
        limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
reportRouter.get(
  "/:id",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const result = await InvoiceReportService.getReportById(
        req.params.id,
        req.user.organizationId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
reportRouter.post(
  "/:id/evidence",
  authenticate,
  requireOrganization,
  evidenceUpload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError({
          statusCode: 400,
          code: "FILE_REQUIRED",
          message: "An evidence document file must be uploaded."
        });
      }
      const report = await Report.findOne({
        _id: req.params.id,
        organizationId: new import_mongoose26.Types.ObjectId(req.user.organizationId)
      });
      if (!report) {
        throw new AppError({
          statusCode: 404,
          code: "REPORT_NOT_FOUND",
          message: "Report not found."
        });
      }
      const fileBuffer = import_fs2.default.readFileSync(req.file.path);
      const sha256Checksum = import_crypto4.default.createHash("sha256").update(fileBuffer).digest("hex");
      const evidence = await Evidence.create({
        organizationId: report.organizationId,
        uploadedByUserId: new import_mongoose26.Types.ObjectId(req.user.userId),
        relatedEntityType: "INVOICE",
        relatedEntityId: report.invoiceId,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
        storagePathOrKey: req.file.filename,
        sha256Checksum,
        isVerified: true
      });
      res.status(201).json({
        id: evidence._id.toString(),
        fileName: evidence.originalFileName,
        mimeType: evidence.mimeType,
        sizeBytes: evidence.fileSizeBytes,
        sha256Checksum: evidence.sha256Checksum,
        uploadedAt: evidence.createdAt
      });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/invoiceRoutes.ts
var import_express7 = require("express");

// src/services/paymentService.ts
var import_mongoose27 = require("mongoose");
var PaymentService = class {
  static async recordPayment(organizationId, userId, input, ipAddress, userAgent) {
    const existingPayment = await PaymentEvent.findOne({
      idempotencyKey: input.idempotencyKey,
      organizationId: new import_mongoose27.Types.ObjectId(organizationId)
    });
    if (existingPayment) {
      const invoice2 = await Invoice.findById(existingPayment.invoiceId);
      return {
        isDuplicateReplay: true,
        paymentEvent: {
          id: existingPayment._id.toString(),
          amountMinorUnits: existingPayment.amountMinorUnits,
          effectivePaymentDate: existingPayment.effectivePaymentDate,
          paymentMethodCategory: existingPayment.paymentMethodCategory,
          previousBalanceMinorUnits: existingPayment.previousBalanceMinorUnits,
          resultingBalanceMinorUnits: existingPayment.resultingBalanceMinorUnits,
          idempotencyKey: existingPayment.idempotencyKey,
          createdAt: existingPayment.createdAt
        },
        invoice: invoice2 ? {
          id: invoice2._id.toString(),
          currentBalanceMinorUnits: invoice2.currentBalanceMinorUnits,
          status: invoice2.status,
          isPaidLate: invoice2.isPaidLate,
          revision: invoice2.revision
        } : null
      };
    }
    const invoice = await Invoice.findOne({
      _id: input.invoiceId,
      organizationId: new import_mongoose27.Types.ObjectId(organizationId)
    });
    if (!invoice) {
      throw new AppError({
        statusCode: 404,
        code: "INVOICE_NOT_FOUND",
        message: "The requested invoice was not found or does not belong to your organization."
      });
    }
    if (input.expectedRevision !== void 0 && invoice.revision !== input.expectedRevision) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT_REVISION_MISMATCH",
        message: "The invoice has been modified concurrently. Please refresh the invoice details to resolve differences.",
        details: {
          currentRevision: invoice.revision,
          expectedRevision: input.expectedRevision,
          currentBalanceMinorUnits: invoice.currentBalanceMinorUnits
        }
      });
    }
    if (input.amountMinorUnits <= 0) {
      throw new AppError({
        statusCode: 400,
        code: "INVALID_PAYMENT_AMOUNT",
        message: "Payment amount must be a positive integer in minor units (cents)."
      });
    }
    if (input.amountMinorUnits > invoice.currentBalanceMinorUnits) {
      throw new AppError({
        statusCode: 400,
        code: "PAYMENT_EXCEEDS_BALANCE",
        message: `Payment amount (${input.amountMinorUnits} cents) cannot exceed the current outstanding balance (${invoice.currentBalanceMinorUnits} cents).`,
        details: {
          currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
          attemptedPaymentMinorUnits: input.amountMinorUnits
        }
      });
    }
    return await withTransaction(async (session) => {
      const previousBalance = invoice.currentBalanceMinorUnits;
      const resultingBalance = previousBalance - input.amountMinorUnits;
      const paymentDate = new Date(input.effectivePaymentDate);
      const isLatePayment = paymentDate > invoice.dueDate || invoice.isPaidLate;
      const [paymentEvent] = await PaymentEvent.create(
        [
          {
            invoiceId: invoice._id,
            organizationId: invoice.organizationId,
            customerRecordId: invoice.customerRecordId,
            amountMinorUnits: input.amountMinorUnits,
            currency: invoice.currency,
            effectivePaymentDate: paymentDate,
            paymentMethodCategory: input.paymentMethodCategory,
            supportingEvidenceId: input.supportingEvidenceId ? new import_mongoose27.Types.ObjectId(input.supportingEvidenceId) : void 0,
            previousBalanceMinorUnits: previousBalance,
            resultingBalanceMinorUnits: resultingBalance,
            idempotencyKey: input.idempotencyKey,
            notes: input.notes,
            recordedByUserId: new import_mongoose27.Types.ObjectId(userId)
          }
        ],
        { session }
      );
      invoice.currentBalanceMinorUnits = resultingBalance;
      invoice.revision += 1;
      if (isLatePayment) {
        invoice.isPaidLate = true;
      }
      if (resultingBalance === 0) {
        invoice.status = "PAID";
        invoice.fullyPaidAt = paymentDate;
      } else {
        invoice.status = "PARTIALLY_PAID";
      }
      await invoice.save({ session });
      const customer = await CustomerRecord.findById(invoice.customerRecordId).session(session);
      if (customer) {
        customer.totalPaidMinorUnits += input.amountMinorUnits;
        customer.totalOutstandingMinorUnits = Math.max(
          0,
          customer.totalOutstandingMinorUnits - input.amountMinorUnits
        );
        if (resultingBalance === 0) {
          if (invoice.isPaidLate) {
            customer.latePaymentsCount += 1;
          } else {
            customer.onTimePaymentsCount += 1;
          }
        }
        customer.lastUpdatedDate = /* @__PURE__ */ new Date();
        await customer.save({ session });
      }
      await AuditLog.create(
        [
          {
            organizationId: invoice.organizationId,
            userId: new import_mongoose27.Types.ObjectId(userId),
            action: "PAYMENT_RECORDED",
            resource: "Invoice",
            resourceId: invoice._id.toString(),
            ipAddress,
            userAgent,
            details: {
              amountMinorUnits: input.amountMinorUnits,
              previousBalance,
              resultingBalance,
              idempotencyKey: input.idempotencyKey,
              isPaidLate: invoice.isPaidLate
            }
          }
        ],
        { session }
      );
      await Notification.create(
        [
          {
            userId: new import_mongoose27.Types.ObjectId(userId),
            organizationId: invoice.organizationId,
            type: "PAYMENT_STATUS",
            title: "Payment Recorded",
            bodyMasked: `A payment of $${(input.amountMinorUnits / 100).toFixed(2)} was recorded for invoice #${invoice.invoiceNumber}. Remaining balance: $${(resultingBalance / 100).toFixed(2)}.`,
            referenceId: invoice._id.toString(),
            referenceType: "Invoice"
          }
        ],
        { session }
      );
      return {
        isDuplicateReplay: false,
        paymentEvent: {
          id: paymentEvent._id.toString(),
          amountMinorUnits: paymentEvent.amountMinorUnits,
          effectivePaymentDate: paymentEvent.effectivePaymentDate,
          paymentMethodCategory: paymentEvent.paymentMethodCategory,
          previousBalanceMinorUnits: paymentEvent.previousBalanceMinorUnits,
          resultingBalanceMinorUnits: paymentEvent.resultingBalanceMinorUnits,
          idempotencyKey: paymentEvent.idempotencyKey,
          createdAt: paymentEvent.createdAt
        },
        invoice: {
          id: invoice._id.toString(),
          invoiceNumber: invoice.invoiceNumber,
          currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
          status: invoice.status,
          isPaidLate: invoice.isPaidLate,
          revision: invoice.revision,
          fullyPaidAt: invoice.fullyPaidAt
        }
      };
    });
  }
  static async getPaymentsForInvoice(invoiceId, organizationId) {
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      organizationId: new import_mongoose27.Types.ObjectId(organizationId)
    });
    if (!invoice) {
      throw new AppError({
        statusCode: 404,
        code: "INVOICE_NOT_FOUND",
        message: "Invoice not found."
      });
    }
    const payments = await PaymentEvent.find({ invoiceId: invoice._id }).sort({ effectivePaymentDate: -1, createdAt: -1 }).populate("recordedByUserId", "firstName lastName email");
    return {
      invoice: {
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        amountMinorUnits: invoice.amountMinorUnits,
        currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
        status: invoice.status,
        dueDate: invoice.dueDate,
        isPaidLate: invoice.isPaidLate,
        revision: invoice.revision
      },
      payments: payments.map((p) => ({
        id: p._id.toString(),
        amountMinorUnits: p.amountMinorUnits,
        effectivePaymentDate: p.effectivePaymentDate,
        paymentMethodCategory: p.paymentMethodCategory,
        previousBalanceMinorUnits: p.previousBalanceMinorUnits,
        resultingBalanceMinorUnits: p.resultingBalanceMinorUnits,
        idempotencyKey: p.idempotencyKey,
        notes: p.notes,
        recordedBy: `${p.recordedByUserId?.firstName || ""} ${p.recordedByUserId?.lastName || ""}`.trim(),
        createdAt: p.createdAt
      }))
    };
  }
  static async getInvoices(organizationId, status, page = 1, limit = 20) {
    const query = { organizationId: new import_mongoose27.Types.ObjectId(organizationId) };
    if (status) {
      query.status = status;
    }
    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(query)
    ]);
    return {
      data: invoices.map((inv) => ({
        id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        customerPostalCode: inv.customerPostalCode,
        amountMinorUnits: inv.amountMinorUnits,
        currentBalanceMinorUnits: inv.currentBalanceMinorUnits,
        currency: inv.currency,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        dueDateBasis: inv.dueDateBasis,
        status: inv.status,
        isPaidLate: inv.isPaidLate,
        fullyPaidAt: inv.fullyPaidAt,
        revision: inv.revision
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }
};

// src/routes/invoiceRoutes.ts
var import_mongoose28 = require("mongoose");
var invoiceRouter = (0, import_express7.Router)();
invoiceRouter.get(
  "/",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const status = req.query.status;
      const result = await PaymentService.getInvoices(
        req.user.organizationId,
        status,
        page,
        limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
invoiceRouter.get(
  "/:id",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const invoice = await Invoice.findOne({
        _id: req.params.id,
        organizationId: new import_mongoose28.Types.ObjectId(req.user.organizationId)
      }).populate("customerRecordId evidenceIds");
      if (!invoice) {
        throw new AppError({
          statusCode: 404,
          code: "INVOICE_NOT_FOUND",
          message: "Invoice not found."
        });
      }
      res.status(200).json({
        id: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        customerPostalCode: invoice.customerPostalCode,
        amountMinorUnits: invoice.amountMinorUnits,
        currentBalanceMinorUnits: invoice.currentBalanceMinorUnits,
        currency: invoice.currency,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        dueDateBasis: invoice.dueDateBasis,
        status: invoice.status,
        isPaidLate: invoice.isPaidLate,
        fullyPaidAt: invoice.fullyPaidAt,
        revision: invoice.revision,
        serviceDescription: invoice.serviceDescription,
        createdAt: invoice.createdAt
      });
    } catch (error) {
      next(error);
    }
  }
);
invoiceRouter.post(
  "/:id/payments",
  authenticate,
  requireOrganization,
  idempotencyMiddleware,
  async (req, res, next) => {
    try {
      const validated = recordPaymentSchema.parse(req.body);
      const result = await PaymentService.recordPayment(
        req.user.organizationId,
        req.user.userId,
        {
          ...validated,
          invoiceId: req.params.id
        },
        req.ip,
        req.headers["user-agent"]
      );
      res.status(result.isDuplicateReplay ? 200 : 201).json(result);
    } catch (error) {
      next(error);
    }
  }
);
invoiceRouter.get(
  "/:id/payments",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const result = await PaymentService.getPaymentsForInvoice(
        req.params.id,
        req.user.organizationId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/disputeRoutes.ts
var import_express8 = require("express");
var import_crypto5 = __toESM(require("crypto"));
var import_fs3 = __toESM(require("fs"));
var import_mongoose30 = require("mongoose");

// src/services/disputeService.ts
var import_mongoose29 = require("mongoose");
var DisputeService = class {
  static POLICY_RESPONSE_DAYS = 14;
  static POLICY_APPEAL_DAYS = 15;
  static async createDispute(input, userId, ipAddress, userAgent) {
    const invoice = await Invoice.findById(input.invoiceId);
    if (!invoice) {
      throw new AppError({
        statusCode: 404,
        code: "INVOICE_NOT_FOUND",
        message: "Invoice not found."
      });
    }
    const deadline = new Date(Date.now() + this.POLICY_RESPONSE_DAYS * 24 * 60 * 60 * 1e3);
    const dispute = await Dispute.create({
      customerRecordId: invoice.customerRecordId,
      invoiceId: invoice._id,
      organizationId: invoice.organizationId,
      filedByCustomerUserId: userId ? new import_mongoose29.Types.ObjectId(userId) : void 0,
      customerName: input.customerName.trim(),
      disputeType: input.disputeType,
      explanation: input.explanation.trim(),
      status: "OPEN",
      deadline,
      evidenceIds: input.evidenceIds.map((id) => new import_mongoose29.Types.ObjectId(id)),
      appealCount: 0
    });
    invoice.status = "DISPUTED";
    await invoice.save();
    await CustomerRecord.findByIdAndUpdate(invoice.customerRecordId, {
      $inc: { disputeActiveCount: 1 },
      lastUpdatedDate: /* @__PURE__ */ new Date()
    });
    if (input.evidenceIds.length > 0) {
      await Evidence.updateMany(
        { _id: { $in: input.evidenceIds.map((id) => new import_mongoose29.Types.ObjectId(id)) } },
        { relatedEntityType: "DISPUTE", relatedEntityId: dispute._id }
      );
    }
    await AuditLog.create({
      organizationId: invoice.organizationId,
      userId: userId ? new import_mongoose29.Types.ObjectId(userId) : void 0,
      action: "DISPUTE_FILED",
      resource: "Dispute",
      resourceId: dispute._id.toString(),
      ipAddress,
      userAgent,
      details: {
        invoiceId: invoice._id.toString(),
        disputeType: input.disputeType,
        authoritativeDeadline: deadline
      }
    });
    await Notification.create({
      organizationId: invoice.organizationId,
      type: "DISPUTE_ACTION",
      title: "New Dispute Filed",
      bodyMasked: `A dispute has been opened for invoice #${invoice.invoiceNumber}. Authoritative response required before deadline.`,
      referenceId: dispute._id.toString(),
      referenceType: "Dispute"
    });
    return dispute;
  }
  static async getDisputes(organizationId, status, page = 1, limit = 20) {
    const query = { organizationId: new import_mongoose29.Types.ObjectId(organizationId) };
    if (status) {
      query.status = status;
    }
    const skip = (page - 1) * limit;
    const [disputes, total] = await Promise.all([
      Dispute.find(query).populate("invoiceId").sort({ deadline: 1, createdAt: -1 }).skip(skip).limit(limit),
      Dispute.countDocuments(query)
    ]);
    const now = Date.now();
    return {
      data: disputes.map((d) => {
        const msRemaining = new Date(d.deadline).getTime() - now;
        const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1e3 * 60 * 60 * 24)));
        return {
          id: d._id.toString(),
          invoiceId: d.invoiceId?._id?.toString(),
          invoiceNumber: d.invoiceId?.invoiceNumber,
          customerName: d.customerName,
          disputeType: d.disputeType,
          status: d.status,
          deadline: d.deadline,
          daysRemaining,
          isUrgent: daysRemaining <= 3 && d.status === "OPEN",
          appealCount: d.appealCount,
          createdAt: d.createdAt
        };
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    };
  }
  static async getDisputeById(disputeId, organizationId) {
    const query = { _id: disputeId };
    if (organizationId) {
      query.organizationId = new import_mongoose29.Types.ObjectId(organizationId);
    }
    const dispute = await Dispute.findOne(query).populate("invoiceId").populate("evidenceIds");
    if (!dispute) {
      throw new AppError({
        statusCode: 404,
        code: "DISPUTE_NOT_FOUND",
        message: "Dispute record not found."
      });
    }
    const responses = await DisputeResponse.find({ disputeId: dispute._id }).populate("evidenceIds").populate("respondedByUserId", "firstName lastName email").sort({ submittedAt: 1 });
    const msRemaining = new Date(dispute.deadline).getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1e3 * 60 * 60 * 24)));
    return {
      id: dispute._id.toString(),
      customerName: dispute.customerName,
      disputeType: dispute.disputeType,
      explanation: dispute.explanation,
      status: dispute.status,
      deadline: dispute.deadline,
      daysRemaining,
      decisionSummary: dispute.decisionSummary,
      decidedAt: dispute.decidedAt,
      appealDeadline: dispute.appealDeadline,
      appealCount: dispute.appealCount,
      createdAt: dispute.createdAt,
      invoice: dispute.invoiceId ? {
        id: dispute.invoiceId._id.toString(),
        invoiceNumber: dispute.invoiceId.invoiceNumber,
        amountMinorUnits: dispute.invoiceId.amountMinorUnits,
        currentBalanceMinorUnits: dispute.invoiceId.currentBalanceMinorUnits,
        dueDate: dispute.invoiceId.dueDate
      } : null,
      evidence: dispute.evidenceIds.map((e) => ({
        id: e._id.toString(),
        fileName: e.originalFileName,
        mimeType: e.mimeType,
        sizeBytes: e.fileSizeBytes
      })),
      responses: responses.map((r) => ({
        id: r._id.toString(),
        responseType: r.responseType,
        responseText: r.responseText,
        respondedBy: `${r.respondedByUserId?.firstName || ""} ${r.respondedByUserId?.lastName || ""}`.trim(),
        submittedAt: r.submittedAt,
        evidence: r.evidenceIds.map((e) => ({
          id: e._id.toString(),
          fileName: e.originalFileName,
          mimeType: e.mimeType
        }))
      }))
    };
  }
  static async submitResponse(disputeId, organizationId, userId, input, ipAddress, userAgent) {
    const dispute = await Dispute.findOne({
      _id: disputeId,
      organizationId: new import_mongoose29.Types.ObjectId(organizationId)
    });
    if (!dispute) {
      throw new AppError({
        statusCode: 404,
        code: "DISPUTE_NOT_FOUND",
        message: "Dispute record not found."
      });
    }
    if (["RESOLVED_CUSTOMER_FAVOR", "RESOLVED_BUSINESS_FAVOR"].includes(dispute.status)) {
      throw new AppError({
        statusCode: 400,
        code: "DISPUTE_ALREADY_RESOLVED",
        message: "This dispute has already reached a final decision."
      });
    }
    const response = await DisputeResponse.create({
      disputeId: dispute._id,
      organizationId: dispute.organizationId,
      respondedByUserId: new import_mongoose29.Types.ObjectId(userId),
      responseText: input.responseText.trim(),
      evidenceIds: input.evidenceIds.map((id) => new import_mongoose29.Types.ObjectId(id)),
      responseType: input.responseType,
      submittedAt: /* @__PURE__ */ new Date()
    });
    dispute.status = "RESPONDED";
    await dispute.save();
    await AuditLog.create({
      organizationId: dispute.organizationId,
      userId: new import_mongoose29.Types.ObjectId(userId),
      action: "DISPUTE_RESPONSE_SUBMITTED",
      resource: "Dispute",
      resourceId: dispute._id.toString(),
      ipAddress,
      userAgent,
      details: { responseType: input.responseType }
    });
    await Notification.create({
      organizationId: dispute.organizationId,
      type: "DISPUTE_ACTION",
      title: "Dispute Response Submitted",
      bodyMasked: `A response to the dispute has been recorded and submitted for final review.`,
      referenceId: dispute._id.toString(),
      referenceType: "Dispute"
    });
    return response;
  }
  static async submitAppeal(disputeId, reason, userId) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      throw new AppError({
        statusCode: 404,
        code: "DISPUTE_NOT_FOUND",
        message: "Dispute record not found."
      });
    }
    if (dispute.appealDeadline && /* @__PURE__ */ new Date() > dispute.appealDeadline) {
      throw new AppError({
        statusCode: 400,
        code: "APPEAL_DEADLINE_EXPIRED",
        message: "The statutory window to appeal this decision has expired."
      });
    }
    dispute.status = "APPEALED";
    dispute.appealCount += 1;
    dispute.appealReason = reason;
    dispute.deadline = new Date(Date.now() + this.POLICY_RESPONSE_DAYS * 24 * 60 * 60 * 1e3);
    await dispute.save();
    await AuditLog.create({
      organizationId: dispute.organizationId,
      userId: userId ? new import_mongoose29.Types.ObjectId(userId) : void 0,
      action: "DISPUTE_APPEALED",
      resource: "Dispute",
      resourceId: dispute._id.toString(),
      details: { appealCount: dispute.appealCount }
    });
    return dispute;
  }
};

// src/routes/disputeRoutes.ts
var disputeRouter = (0, import_express8.Router)();
disputeRouter.post(
  "/",
  authenticate,
  async (req, res, next) => {
    try {
      const validated = createDisputeSchema.parse(req.body);
      const dispute = await DisputeService.createDispute(
        validated,
        req.user?.userId,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(201).json(dispute);
    } catch (error) {
      next(error);
    }
  }
);
disputeRouter.get(
  "/",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const status = req.query.status;
      const result = await DisputeService.getDisputes(
        req.user.organizationId,
        status,
        page,
        limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
disputeRouter.get(
  "/:id",
  authenticate,
  async (req, res, next) => {
    try {
      const result = await DisputeService.getDisputeById(
        req.params.id,
        req.user?.organizationId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
disputeRouter.post(
  "/:id/responses",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const validated = respondDisputeSchema.parse(req.body);
      const result = await DisputeService.submitResponse(
        req.params.id,
        req.user.organizationId,
        req.user.userId,
        validated,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);
disputeRouter.post(
  "/:id/appeal",
  authenticate,
  async (req, res, next) => {
    try {
      const validated = appealDisputeSchema.parse(req.body);
      const result = await DisputeService.submitAppeal(
        req.params.id,
        validated.appealReason,
        req.user?.userId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
disputeRouter.post(
  "/:id/evidence",
  authenticate,
  evidenceUpload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError({
          statusCode: 400,
          code: "FILE_REQUIRED",
          message: "An evidence document file must be uploaded."
        });
      }
      const dispute = await Dispute.findById(req.params.id);
      if (!dispute) {
        throw new AppError({
          statusCode: 404,
          code: "DISPUTE_NOT_FOUND",
          message: "Dispute record not found."
        });
      }
      const fileBuffer = import_fs3.default.readFileSync(req.file.path);
      const sha256Checksum = import_crypto5.default.createHash("sha256").update(fileBuffer).digest("hex");
      const evidence = await Evidence.create({
        organizationId: dispute.organizationId,
        uploadedByUserId: new import_mongoose30.Types.ObjectId(req.user.userId),
        relatedEntityType: "DISPUTE",
        relatedEntityId: dispute._id,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSizeBytes: req.file.size,
        storagePathOrKey: req.file.filename,
        sha256Checksum,
        isVerified: true
      });
      dispute.evidenceIds.push(evidence._id);
      await dispute.save();
      res.status(201).json({
        id: evidence._id.toString(),
        fileName: evidence.originalFileName,
        mimeType: evidence.mimeType,
        sizeBytes: evidence.fileSizeBytes,
        sha256Checksum: evidence.sha256Checksum
      });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/notificationRoutes.ts
var import_express9 = require("express");

// src/services/notificationService.ts
var import_mongoose31 = require("mongoose");
var NotificationService = class {
  static async getNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: new import_mongoose31.Types.ObjectId(userId) }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId: new import_mongoose31.Types.ObjectId(userId) }),
      Notification.countDocuments({ userId: new import_mongoose31.Types.ObjectId(userId), isRead: false })
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
        createdAt: n.createdAt
      })),
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  static async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        userId: new import_mongoose31.Types.ObjectId(userId)
      },
      { isRead: true, readAt: /* @__PURE__ */ new Date() },
      { new: true }
    );
    if (!notification) {
      throw new AppError({
        statusCode: 404,
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found."
      });
    }
    return notification;
  }
  static async registerDevice(userId, organizationId, data) {
    const device = await RegisteredDevice.findOneAndUpdate(
      { deviceId: data.deviceId },
      {
        userId: new import_mongoose31.Types.ObjectId(userId),
        organizationId: organizationId ? new import_mongoose31.Types.ObjectId(organizationId) : void 0,
        deviceId: data.deviceId,
        platform: data.platform,
        pushToken: data.pushToken,
        appVersion: data.appVersion || "1.0.0",
        deviceModel: data.deviceModel,
        osVersion: data.osVersion,
        lastActiveAt: /* @__PURE__ */ new Date(),
        isRevoked: false
      },
      { upsert: true, new: true }
    );
    await AuditLog.create({
      userId: new import_mongoose31.Types.ObjectId(userId),
      organizationId: organizationId ? new import_mongoose31.Types.ObjectId(organizationId) : void 0,
      action: "DEVICE_REGISTERED",
      resource: "RegisteredDevice",
      resourceId: device._id.toString(),
      details: { platform: data.platform, appVersion: data.appVersion }
    });
    return device;
  }
};

// src/routes/notificationRoutes.ts
var notificationRouter = (0, import_express9.Router)();
notificationRouter.get(
  "/",
  authenticate,
  async (req, res, next) => {
    try {
      const page = req.query.page ? parseInt(req.query.page, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const result = await NotificationService.getNotifications(
        req.user.userId,
        page,
        limit
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);
notificationRouter.patch(
  "/:id/read",
  authenticate,
  async (req, res, next) => {
    try {
      const result = await NotificationService.markAsRead(
        req.params.id,
        req.user.userId
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/deviceRoutes.ts
var import_express10 = require("express");
var deviceRouter = (0, import_express10.Router)();
deviceRouter.post(
  "/register",
  authenticate,
  async (req, res, next) => {
    try {
      const validated = registerDeviceSchema.parse(req.body);
      const result = await NotificationService.registerDevice(
        req.user.userId,
        req.user?.organizationId,
        validated
      );
      res.status(200).json({ success: true, device: result });
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/syncRoutes.ts
var import_express11 = require("express");
var import_zod5 = require("zod");

// src/services/syncService.ts
var import_mongoose32 = require("mongoose");
var SyncService = class {
  static async processBatch(organizationId, userId, clientId, items, ipAddress, userAgent) {
    const results = [];
    for (const item of items) {
      const serverReceivedAt = /* @__PURE__ */ new Date();
      const existingOp = await SyncOperation.findOne({
        clientUuid: item.clientUuid,
        organizationId: new import_mongoose32.Types.ObjectId(organizationId)
      });
      if (existingOp && existingOp.status === "PROCESSED") {
        results.push({
          clientUuid: item.clientUuid,
          status: "ACCEPTED",
          serverReceivedAt: existingOp.serverReceivedAt,
          serverCommittedAt: existingOp.serverCommittedAt,
          isReplayed: true
        });
        continue;
      }
      try {
        let executionResult;
        if (item.operationType === "CREATE_REPORT") {
          executionResult = await InvoiceReportService.createReport(
            organizationId,
            userId,
            item.payload,
            ipAddress,
            userAgent
          );
        } else if (item.operationType === "RECORD_PAYMENT") {
          executionResult = await PaymentService.recordPayment(
            organizationId,
            userId,
            item.payload,
            ipAddress,
            userAgent
          );
        } else if (item.operationType === "UPDATE_DISPUTE") {
          executionResult = await DisputeService.submitResponse(
            item.payload.disputeId,
            organizationId,
            userId,
            item.payload,
            ipAddress,
            userAgent
          );
        } else {
          throw new Error(`Unsupported sync operation type: ${item.operationType}`);
        }
        const serverCommittedAt = /* @__PURE__ */ new Date();
        await SyncOperation.findOneAndUpdate(
          { clientUuid: item.clientUuid },
          {
            clientUuid: item.clientUuid,
            clientId,
            organizationId: new import_mongoose32.Types.ObjectId(organizationId),
            userId: new import_mongoose32.Types.ObjectId(userId),
            operationType: item.operationType,
            payload: item.payload,
            status: "PROCESSED",
            revision: item.revision || 1,
            serverReceivedAt,
            serverCommittedAt
          },
          { upsert: true, new: true }
        );
        results.push({
          clientUuid: item.clientUuid,
          status: "ACCEPTED",
          result: executionResult,
          serverReceivedAt,
          serverCommittedAt,
          isReplayed: false
        });
      } catch (err) {
        logger.error({ clientUuid: item.clientUuid, err }, "Sync Item Failed");
        const isConflict = err.code === "CONFLICT_REVISION_MISMATCH" || err.statusCode === 409;
        const status = isConflict ? "CONFLICT" : "REJECTED";
        await SyncOperation.findOneAndUpdate(
          { clientUuid: item.clientUuid },
          {
            clientUuid: item.clientUuid,
            clientId,
            organizationId: new import_mongoose32.Types.ObjectId(organizationId),
            userId: new import_mongoose32.Types.ObjectId(userId),
            operationType: item.operationType,
            payload: item.payload,
            status,
            revision: item.revision || 1,
            serverReceivedAt,
            errorMessage: err.message
          },
          { upsert: true, new: true }
        );
        results.push({
          clientUuid: item.clientUuid,
          status: isConflict ? "CONFLICT" : "REJECTED",
          error: {
            code: err.code || "SYNC_ERROR",
            message: err.message,
            details: err.details
          },
          serverReceivedAt
        });
      }
    }
    return {
      clientId,
      processedCount: results.length,
      successCount: results.filter((r) => r.status === "ACCEPTED").length,
      conflictCount: results.filter((r) => r.status === "CONFLICT").length,
      rejectedCount: results.filter((r) => r.status === "REJECTED").length,
      items: results
    };
  }
};

// src/routes/syncRoutes.ts
var syncRouter = (0, import_express11.Router)();
var batchSyncSchema = import_zod5.z.object({
  clientId: import_zod5.z.string().min(1, "Client identifier is required"),
  items: import_zod5.z.array(
    import_zod5.z.object({
      clientUuid: import_zod5.z.string().uuid("Each item must have a valid client UUID"),
      operationType: import_zod5.z.enum(["CREATE_REPORT", "RECORD_PAYMENT", "UPDATE_DISPUTE"]),
      payload: import_zod5.z.record(import_zod5.z.any()),
      revision: import_zod5.z.number().int().optional(),
      localCreatedAt: import_zod5.z.string()
    })
  ).min(1, "Batch must contain at least one operation")
});
syncRouter.post(
  "/batch",
  authenticate,
  requireOrganization,
  async (req, res, next) => {
    try {
      const validated = batchSyncSchema.parse(req.body);
      const result = await SyncService.processBatch(
        req.user.organizationId,
        req.user.userId,
        validated.clientId,
        validated.items,
        req.ip,
        req.headers["user-agent"]
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// src/routes/customerPortalRoutes.ts
var import_express12 = require("express");
var import_zod6 = require("zod");
var customerPortalRouter = (0, import_express12.Router)();
var customerVerifySchema = import_zod6.z.object({
  lastName: import_zod6.z.string().min(2).trim(),
  postalCode: import_zod6.z.string().min(3).trim(),
  phoneLast4: import_zod6.z.string().regex(/^\d{4}$/)
});
customerPortalRouter.post(
  "/verify",
  async (req, res, next) => {
    try {
      const { lastName, postalCode, phoneLast4 } = customerVerifySchema.parse(req.body);
      const customer = await CustomerRecord.findOne({
        lastName: new RegExp(`^${lastName}$`, "i"),
        postalCode: postalCode.trim(),
        phoneLast4
      });
      if (!customer) {
        throw new AppError({
          statusCode: 404,
          code: "CUSTOMER_RECORD_NOT_FOUND",
          message: "No matching customer file was found for the provided information. Please verify your details."
        });
      }
      res.status(200).json({
        verified: true,
        customerId: customer._id.toString(),
        nameMasked: maskName(`${customer.firstName || ""} ${customer.lastName || ""}`),
        postalCode: customer.postalCode,
        message: "Identity verified. You may view your consumer file free of charge under applicable consumer protection rights."
      });
    } catch (error) {
      next(error);
    }
  }
);
customerPortalRouter.get(
  "/records/:customerId",
  async (req, res, next) => {
    try {
      const customer = await CustomerRecord.findById(req.params.customerId);
      if (!customer) {
        throw new AppError({
          statusCode: 404,
          code: "CUSTOMER_RECORD_NOT_FOUND",
          message: "Customer record not found."
        });
      }
      const invoices = await Invoice.find({ customerRecordId: customer._id }).select("invoiceNumber serviceDescription amountMinorUnits currentBalanceMinorUnits status issueDate dueDate isPaidLate").sort({ issueDate: -1 });
      const disputes = await Dispute.find({ customerRecordId: customer._id }).select("disputeType status explanation deadline decisionSummary createdAt").sort({ createdAt: -1 });
      res.status(200).json({
        consumerDisclosure: {
          customerSummary: {
            id: customer._id.toString(),
            totalInvoicesCount: customer.totalInvoicesCount,
            onTimePaymentsCount: customer.onTimePaymentsCount,
            latePaymentsCount: customer.latePaymentsCount,
            totalPaidMinorUnits: customer.totalPaidMinorUnits,
            totalOutstandingMinorUnits: customer.totalOutstandingMinorUnits,
            activeDisputesCount: customer.disputeActiveCount,
            lastUpdatedDate: customer.lastUpdatedDate
          },
          invoices: invoices.map((inv) => ({
            id: inv._id.toString(),
            invoiceNumber: inv.invoiceNumber,
            serviceDescription: inv.serviceDescription,
            amountMinorUnits: inv.amountMinorUnits,
            currentBalanceMinorUnits: inv.currentBalanceMinorUnits,
            status: inv.status,
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            isPaidLate: inv.isPaidLate
          })),
          disputes: disputes.map((d) => ({
            id: d._id.toString(),
            disputeType: d.disputeType,
            status: d.status,
            explanation: d.explanation,
            deadline: d.deadline,
            decisionSummary: d.decisionSummary,
            createdAt: d.createdAt
          })),
          consumerRightsNotice: "You have the legal right under applicable credit reporting regulations to inspect your file free of charge and submit disputes regarding any inaccurate or incomplete information."
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// src/app.ts
var isConnecting = false;
function triggerBackgroundConnection() {
  if (import_mongoose33.default.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  connectDatabase().then(() => {
    isConnecting = false;
  }).catch((error) => {
    isConnecting = false;
    logger.warn({ error: error?.message || error }, "Background MongoDB connection attempt failed");
  });
}
function createApp() {
  const app2 = (0, import_express13.default)();
  app2.set("trust proxy", 1);
  app2.use(
    (0, import_helmet.default)({
      contentSecurityPolicy: false
      // Allows Swagger UI inline rendering
    })
  );
  app2.use(
    (0, import_cors.default)({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Correlation-ID",
        "Idempotency-Key"
      ],
      exposedHeaders: [
        "X-Correlation-ID",
        "X-Idempotency-Status"
      ]
    })
  );
  app2.use(import_express13.default.json({ limit: "10mb" }));
  app2.use(import_express13.default.urlencoded({ extended: true, limit: "10mb" }));
  app2.use(correlationIdMiddleware);
  app2.use((req, _res, next) => {
    const matchedPath = req.headers["x-matched-path"];
    if (matchedPath) {
      req.url = matchedPath;
    }
    if (process.env.VERCEL) {
      triggerBackgroundConnection();
    }
    next();
  });
  app2.get("/", (_req, res) => {
    res.status(200).json({
      name: "TheyPayOnTime API",
      status: "ONLINE",
      version: "1.0.1",
      documentation: "/api-docs",
      health: "/health",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app2.use("/api/", globalRateLimiter);
  app2.use("/api-docs", import_swagger_ui_express.default.serve, import_swagger_ui_express.default.setup(openApiSpec));
  app2.get("/api-docs.json", (_req, res) => {
    res.json(openApiSpec);
  });
  app2.get("/health", (_req, res) => {
    const dbState = import_mongoose33.default.connection.readyState;
    const dbStatusMap = {
      0: "DISCONNECTED",
      1: "CONNECTED",
      2: "CONNECTING",
      3: "DISCONNECTING"
    };
    res.status(200).json({
      status: "UP",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      service: "TheyPayOnTime-Backend",
      version: "1.0.1",
      database: dbStatusMap[dbState] || "UNKNOWN",
      complianceGate: {
        liveConsumerReportingEnabled: env.ENABLE_LIVE_CONSUMER_REPORTING
      }
    });
  });
  const apiV1 = import_express13.default.Router();
  apiV1.use("/auth", authRouter);
  apiV1.use("/me", meRouter);
  apiV1.use("/organizations", organizationRouter);
  apiV1.use("/verification", verificationRouter);
  apiV1.use("/customer-searches", customerSearchRouter);
  apiV1.use("/reports", reportRouter);
  apiV1.use("/invoices", invoiceRouter);
  apiV1.use("/disputes", disputeRouter);
  apiV1.use("/notifications", notificationRouter);
  apiV1.use("/devices", deviceRouter);
  apiV1.use("/sync", syncRouter);
  apiV1.use("/customer-portal", customerPortalRouter);
  app2.use("/api/v1", apiV1);
  app2.use(errorHandler);
  return app2;
}
var defaultApp = createApp();
defaultApp.default = defaultApp;
defaultApp.createApp = createApp;

// src/serverless.ts
var baseApp = createApp();
var app = (0, import_express14.default)();
var isConnecting2 = false;
function triggerBackgroundConnection2() {
  if (import_mongoose34.default.connection.readyState === 1 || isConnecting2) return;
  isConnecting2 = true;
  connectDatabase().then(() => {
    isConnecting2 = false;
  }).catch((error) => {
    isConnecting2 = false;
    logger.warn({ error: error?.message || error }, "Background MongoDB connection attempt failed");
  });
}
app.use((req, _res, next) => {
  const matchedPath = req.headers["x-matched-path"];
  if (matchedPath) {
    req.url = matchedPath;
  } else if (req.url === "/api/index" || req.url === "/api" || req.url === "/api/index.js") {
    req.url = "/";
  } else if (req.url.startsWith("/api/index/")) {
    req.url = req.url.replace("/api/index", "");
  }
  triggerBackgroundConnection2();
  next();
});
app.use("/api/v1", async (_req, res, next) => {
  if (import_mongoose34.default.connection.readyState !== 1) {
    try {
      await connectDatabase();
    } catch {
      return res.status(503).json({
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "MongoDB is currently unreachable. Please verify MONGODB_URI in Vercel and MongoDB Atlas Network Access (allow 0.0.0.0/0).",
          databaseState: import_mongoose34.default.connection.readyState
        }
      });
    }
  }
  next();
});
app.use(baseApp);
var serverless_default = app;
module.exports = app; module.exports.default = app;
