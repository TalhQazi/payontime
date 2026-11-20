# TheyPayOnTime — Production REST API Backend

Production-ready backend API for **TheyPayOnTime.com** built with Node.js, Express, TypeScript, and MongoDB.

---

## Features

- **MongoDB Primary Database** with Mongoose schemas, indexes, and ACID multi-document transactions.
- **Strict Role-Based Centralized Authorization** (Contractor Business, Representative, Customer Portal, Admin).
- **Compliance-Gated Reporting Engine**: Live consumer reporting remains disabled until regulatory approvals are configured.
- **Permissible Purpose Attestation** enforced for every customer payment history lookup.
- **Accurate Financial Engine**: Calculations in integer minor currency units (cents) — no floating-point inaccuracies. Authoritative dispute response deadlines and balance recalculations.
- **OpenAPI / Swagger UI Documentation** served at `/api-docs`.
- **Serverless & Container Ready**: Natively configured for Vercel Serverless Functions (`api/index.ts`, `vercel.json`) as well as long-running Node.js containers (`npm start`).

---

## Vercel Serverless Deployment Guide

### 1. Environment Variables in Vercel
In your Vercel Dashboard, navigate to **Project Settings** $\rightarrow$ **Environment Variables** and add:

| Variable | Example / Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment mode |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster0.ikxmqa8.mongodb.net/theypayontime?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
| `MONGODB_USE_TRANSACTIONS` | `true` | Enables ACID transactions (Atlas replica sets support this) |
| `JWT_ACCESS_SECRET` | *(Random 32+ char string)* | Signing secret for access tokens |
| `JWT_REFRESH_SECRET` | *(Random 32+ char string)* | Signing secret for refresh tokens |
| `CORS_ORIGIN` | `*` or `https://theypayontime.com` | Allowed CORS origins |
| `ENABLE_LIVE_CONSUMER_REPORTING` | `false` | Regulatory compliance gate (must remain `false` until approved) |
| `REQUIRE_PERMISSIBLE_PURPOSE_ATTESTATION` | `true` | Mandatory FCRA permissible purpose attestation |

> **IMPORTANT: MongoDB Atlas IP Access List**
> Serverless functions (like Vercel) execute across dynamic IP addresses.
> In your **MongoDB Atlas Console** $\rightarrow$ **Network Access**:
> 1. Click **Add IP Address**.
> 2. Select **Allow Access From Anywhere** (`0.0.0.0/0`).
> 3. Click **Confirm**.

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server with live reload
npm run dev

# 4. Build TypeScript
npm run build

# 5. Run Integration Test Suite
npm test
```

---

## API Endpoints Overview

- **Root Status**: `GET /`
- **Health Check**: `GET /health` (returns service status and MongoDB connection status)
- **Interactive Swagger Docs**: `GET /api-docs`
- **OpenAPI JSON**: `GET /api-docs.json`
- **Authentication**: `/api/v1/auth/*` (register, login, refresh, MFA, logout)
- **Account & Profile**: `/api/v1/me/*`
- **Organizations**: `/api/v1/organizations/*`
- **Verification**: `/api/v1/verification/*`
- **Customer Searches**: `/api/v1/customer-searches/*` (permissible purpose required)
- **Invoice Reports**: `/api/v1/reports/*`
- **Invoices & Payments**: `/api/v1/invoices/*` (idempotent payment recording)
- **Disputes**: `/api/v1/disputes/*` (14-day authoritative statutory deadlines)
- **Customer Portal**: `/api/v1/customer-portal/*` (free customer record access & disputes)
