// __FILE_DESCRIPTION__: Zod schema skeleton (aligned with feature schemas & DB-first)

import { z } from 'zod';
// Prefer shared common validators per CORE_REQUIREMENTS
// Adjust import path if needed in your project
import { databaseIdSchema } from '@/lib/validation/schemas/common';

export const optionalDatabaseIdSchema = databaseIdSchema.optional();

export const __SCHEMA_NAME__ = z.object({
  id: optionalDatabaseIdSchema,
  title: z.string().min(1),
  // Use UPPERCASE enum values to match DB/enums like proposals
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});

export type __SCHEMA_NAME__Type = z.infer<typeof __SCHEMA_NAME__>;
