import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { logger } from './utils/logger.js';

export async function bootstrap() {
  try {
    logger.info('Connecting to MongoDB...');
    await connectDatabase();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          apiDocs: `http://localhost:${env.PORT}/api-docs`,
          healthCheck: `http://localhost:${env.PORT}/health`,
        },
        'TheyPayOnTime Backend Server is running successfully.'
      );
    });

    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Graceful shutdown initiated');
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.fatal({ error }, 'Fatal error during server startup');
    process.exit(1);
  }
}

// In local or traditional containers, run immediately. In serverless (Vercel), entrypoint handles invocations.
if (!process.env.VERCEL) {
  bootstrap();
}
