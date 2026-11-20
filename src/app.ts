import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openApiSpec } from './config/openapi.js';
import { correlationIdMiddleware } from './middleware/correlationId.js';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import { authRouter } from './routes/authRoutes.js';
import { meRouter } from './routes/meRoutes.js';
import { organizationRouter } from './routes/organizationRoutes.js';
import { verificationRouter } from './routes/verificationRoutes.js';
import { customerSearchRouter } from './routes/customerSearchRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';
import { invoiceRouter } from './routes/invoiceRoutes.js';
import { disputeRouter } from './routes/disputeRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { deviceRouter } from './routes/deviceRoutes.js';
import { syncRouter } from './routes/syncRoutes.js';
import { customerPortalRouter } from './routes/customerPortalRoutes.js';

export function createApp(): Application {
  const app: Application = express();

  // Trust proxy for rate limiting behind reverse proxies/load balancers (e.g. Vercel)
  app.set('trust proxy', 1);

  // Security HTTP headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI inline rendering
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Correlation-ID',
        'Idempotency-Key',
      ],
      exposedHeaders: [
        'X-Correlation-ID',
        'X-Idempotency-Status',
      ],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Correlation ID Tracking
  app.use(correlationIdMiddleware);

  // Root welcome endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'TheyPayOnTime API',
      status: 'ONLINE',
      version: '1.0.1',
      documentation: '/api-docs',
      health: '/health',
      timestamp: new Date().toISOString(),
    });
  });

  // Global Rate Limiting
  app.use('/api/', globalRateLimiter);

  // OpenAPI Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // Health and Readiness Check
  app.get('/health', (_req: Request, res: Response) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: 'DISCONNECTED',
      1: 'CONNECTED',
      2: 'CONNECTING',
      3: 'DISCONNECTING',
    };
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'TheyPayOnTime-Backend',
      version: '1.0.1',
      database: dbStatusMap[dbState] || 'UNKNOWN',
      complianceGate: {
        liveConsumerReportingEnabled: env.ENABLE_LIVE_CONSUMER_REPORTING,
      },
    });
  });

  // API v1 Versioned Routes
  const apiV1 = express.Router();
  apiV1.use('/auth', authRouter);
  apiV1.use('/me', meRouter);
  apiV1.use('/organizations', organizationRouter);
  apiV1.use('/verification', verificationRouter);
  apiV1.use('/customer-searches', customerSearchRouter);
  apiV1.use('/reports', reportRouter);
  apiV1.use('/invoices', invoiceRouter);
  apiV1.use('/disputes', disputeRouter);
  apiV1.use('/notifications', notificationRouter);
  apiV1.use('/devices', deviceRouter);
  apiV1.use('/sync', syncRouter);
  apiV1.use('/customer-portal', customerPortalRouter);

  app.use('/api/v1', apiV1);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
