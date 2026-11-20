import express, { Request, Response, NextFunction } from 'express';
import { createApp } from './app.js';
import { connectDatabase } from './database/connection.js';
import { logger } from './utils/logger.js';

const baseApp = createApp();
const app = express();

// Serverless DB connection middleware: safely connect without throwing unhandled exceptions
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDatabase();
  } catch (error: any) {
    logger.error({ error: error?.message || error }, 'MongoDB connection error in serverless request');
  }
  next();
});

// URL rewrite normalizer: handles /api/index, /api, or rewritten paths
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.url === '/api/index' || req.url === '/api') {
    req.url = '/';
  } else if (req.url.startsWith('/api/index/')) {
    req.url = req.url.replace('/api/index', '');
  }
  next();
});

// Mount the core application
app.use(baseApp);

export default app;
