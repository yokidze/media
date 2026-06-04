import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().optional(),
  API_BASE_PATH: z.string().default('/api/v1'),
  APP_ORIGIN: z.string().default('http://localhost'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(14),
  CSRF_COOKIE_NAME: z.string().default('college_csrf'),
  ACCESS_TOKEN_COOKIE_NAME: z.string().default('college_access'),
  REFRESH_TOKEN_COOKIE_NAME: z.string().default('college_refresh'),
  STORAGE_DRIVER: z.enum(['LOCAL', 'S3']).default('LOCAL'),
  STORAGE_LOCAL_ROOT: z.string().default('../../storage'),
  FILE_MAX_SIZE_MB: z.coerce.number().default(100),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true)
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
