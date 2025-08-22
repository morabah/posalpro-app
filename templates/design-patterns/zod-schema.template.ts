// __FILE_DESCRIPTION__: Zod schema skeleton with CUID-friendly ID validation

import { z } from 'zod';

export const databaseIdSchema = z.string().min(1);
export const optionalDatabaseIdSchema = databaseIdSchema.optional();

export const __SCHEMA_NAME__ = z.object({
  id: databaseIdSchema.optional(),
  title: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type __SCHEMA_NAME__Type = z.infer<typeof __SCHEMA_NAME__>;
