/**
 * PosalPro MVP2 - Content Validation Schemas
 * Zod schemas for content-related operations
 */

import { z } from 'zod';
import { baseEntitySchema } from './shared';

export const contentSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['TEXT', 'TEMPLATE', 'IMAGE', 'DOCUMENT', 'MEDIA']),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  isActive: z.boolean().default(true),
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
  createdBy: true,
});
