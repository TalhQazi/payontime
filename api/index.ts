import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/database/connection.js';
import { logger } from '../src/utils/logger.js';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    await connectDatabase();
  } catch (error: any) {
    logger.error({ error: error?.message || error }, 'MongoDB connection error during serverless request');
  }

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance(req, res);
}
