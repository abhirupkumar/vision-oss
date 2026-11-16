import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  // Analytics (at least one must be set - validated at runtime)
  TINYBIRD_URL: z.string().optional(),
  TINYBIRD_TOKEN: z.string().optional(),
  CLICKHOUSE_URL: z.string().optional(),
  // Optional
  REDIS_URL: z.string().optional(),
  CLOUD_MODE: z.string().optional(),
  LOG_QUERY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
});

export const env = envSchema.parse(process.env);
