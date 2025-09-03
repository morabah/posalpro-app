import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(16),
  RATE_LIMIT: z.string().optional(),
  FEATURE_API_KEYS: z.string().optional(),
});

export const env = Env.parse(process.env);
