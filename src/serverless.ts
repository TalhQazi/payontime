import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDatabase } from './database/connection.js';
import { logger } from './utils/logger.js';

const baseApp = createApp();
const app = express();

// Non-blocking connection initiator: connects in background so root / and /health NEVER block
let isConnecting = false;
function triggerBackgroundConnection() {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;
  connectDatabase()
    .then(() => {
      isConnecting = false;
    })
    .catch((error: any) => {
      isConnecting = false;
      logger.warn({ error: error?.message || error }, 'Background MongoDB connection attempt failed');
    });
}

// Global middleware: normalize URLs and trigger DB connection without blocking
app.use((req: Request, _res: Response, next: NextFunction) => {
  // Support Vercel x-matched-path header
  const matchedPath = req.headers['x-matched-path'] as string | undefined;
  if (matchedPath) {
    req.url = matchedPath;
  } else if (req.url === '/api/index' || req.url === '/api' || req.url === '/api/index.js') {
    req.url = '/';
  } else if (req.url.startsWith('/api/index/')) {
    req.url = req.url.replace('/api/index', '');
  }

  // Trigger DB connection in background without blocking root / or /health
  triggerBackgroundConnection();
  next();
});

// Middleware for /api/v1 data routes: ensure DB is ready or return graceful JSON error
app.use('/api/v1', async (_req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDatabase();
    } catch {
      return res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'MongoDB is currently unreachable. Please verify MONGODB_URI in Vercel and MongoDB Atlas Network Access (allow 0.0.0.0/0).',
          databaseState: mongoose.connection.readyState,
        },
      });
    }
  }
  next();
});

// Mount core application
app.use(baseApp);

export default app;
