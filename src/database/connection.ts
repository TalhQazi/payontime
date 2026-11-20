import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;
let supportsTransactions = false;

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  // If already connected, reuse existing connection (crucial for serverless warm starts)
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose;
  }

  // If currently connecting, await completion
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
      setTimeout(resolve, 3000);
    });
    if ((mongoose.connection.readyState as number) === 1) {
      isConnected = true;
      return mongoose;
    }
  }

  const connectionUri = uri || env.MONGODB_URI;
  try {
    const conn = await mongoose.connect(connectionUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;

    // Check if MongoDB deployment supports multi-document transactions (replica set or sharded cluster)
    try {
      const adminDb = mongoose.connection.db?.admin();
      const helloResult = await adminDb?.command({ hello: 1 });
      supportsTransactions = Boolean(helloResult?.setName || helloResult?.msg === 'isdbgrid');
      logger.info({ supportsTransactions }, 'MongoDB connection established');
    } catch {
      supportsTransactions = false;
    }

    return conn;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected');
  }
}

export function hasTransactionSupport(): boolean {
  return supportsTransactions && env.MONGODB_USE_TRANSACTIONS;
}

export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  if (!hasTransactionSupport()) {
    // Graceful fallback for non-replica set local dev environments while keeping operations consistent
    const session = await mongoose.startSession();
    try {
      return await fn(session);
    } finally {
      await session.endSession();
    }
  }

  const session = await mongoose.startSession();
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
