/**
 * PosalPro MVP2 - Content Validation Schemas
 * Zod schemas for content-related operations
 */

import { z } from 'zod';
import { baseEntitySchema } from './shared';

export const contentSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  type: z.enum(['DOCUMENT', 'TEMPLATE', 'REFERENCE']),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const createContentSchema = contentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateContentSchema = contentSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
