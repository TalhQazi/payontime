import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_VERSION: z.string().default('v1'),
  CORS_ORIGIN: z.string().default('*'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/theypayontime'),
  MONGODB_USE_TRANSACTIONS: z.string().transform((v) => v === 'true').default('false'),
  JWT_ACCESS_SECRET: z.string().min(16).default('theypayontime-default-dev-access-secret-32-chars-long!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('theypayontime-default-dev-refresh-secret-32-chars-long!'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  ENABLE_LIVE_CONSUMER_REPORTING: z.string().transform((v) => v === 'true').default('false'),
  REQUIRE_PERMISSIBLE_PURPOSE_ATTESTATION: z.string().transform((v) => v === 'true').default('true'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(10485760), // 10MB
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export const env = envSchema.parse(process.env);
