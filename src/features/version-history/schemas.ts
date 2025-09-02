/**
 * PosalPro MVP2 - Version History Schemas
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ CONSOLIDATED: All version history schemas in one location
 * ✅ ALIGNS: API route schemas for consistent frontend-backend integration
 * ✅ FOLLOWS: Feature-based organization pattern from CORE_REQUIREMENTS.md
 * ✅ COMPLIES: Database-first design with Prisma schema alignment
 */

import { databaseIdSchema } from '@/lib/validation/schemas/common';
import { z } from 'zod';

// ====================
// Base Schemas (Reusable)
// ====================

export const VersionHistoryChangeTypeSchema = z.enum([
  'create',
  'update',
  'delete',
  'batch_import',
  'rollback',
  'status_change',
  'INITIAL', // Added to match database data
]);

export const VersionHistoryStatusSchema = z.enum(['active', 'archived', 'deleted']);

// ====================
// Core Entity Schemas
// ====================

/**
 * Version History Entry Schema
 * Represents a single version entry in the proposal version history
 */
export const VersionHistoryEntrySchema = z.object({
  id: databaseIdSchema,
  proposalId: databaseIdSchema,
  version: z.number().int().min(1, 'Version must be a positive integer'),
  changeType: VersionHistoryChangeTypeSchema,
  changesSummary: z.string().optional(),
  totalValue: z.number().optional(),
  createdBy: databaseIdSchema.optional(),
  createdByName: z.string().optional(),
  createdAt: z.coerce.date(),
  snapshot: z.record(z.unknown()).optional(),
  productIds: z.array(databaseIdSchema).optional(),
});

// ====================
// Query Schemas
// ====================

/**
 * Query parameters for version history API
 * Supports cursor-based pagination and filtering
 */
export const VersionHistoryQuerySchema = z.object({
  proposalId: databaseIdSchema.optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursorCreatedAt: z.string().optional(),
  cursorId: databaseIdSchema.optional(),
  changeType: z
    .enum(['create', 'update', 'delete', 'batch_import', 'rollback', 'status_change', 'INITIAL'])
    .optional(),
  userId: databaseIdSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

/**
 * Cursor pagination schema for version history
 */
export const VersionHistoryCursorSchema = z.object({
  cursorCreatedAt: z.string(),
  cursorId: databaseIdSchema,
});

/**
 * Pagination response schema
 */
export const VersionHistoryPaginationSchema = z.object({
  limit: z.number(),
  hasNextPage: z.boolean(),
  nextCursor: VersionHistoryCursorSchema.nullable(),
});

// ====================
// Response Schemas
// ====================

/**
 * Version history list response schema
 */
export const VersionHistoryListSchema = z.object({
  items: z.array(VersionHistoryEntrySchema),
  pagination: VersionHistoryPaginationSchema,
  total: z.number().optional(),
});

/**
 * Single version history entry with additional details
 */
export const VersionHistoryDetailSchema = VersionHistoryEntrySchema.extend({
  proposal: z
    .object({
      id: databaseIdSchema,
      title: z.string(),
      customerName: z.string().optional(),
    })
    .optional(),
  changes: z
    .object({
      added: z.array(
        z.object({
          productId: databaseIdSchema,
          name: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
        })
      ),
      removed: z.array(
        z.object({
          productId: databaseIdSchema,
          name: z.string(),
        })
      ),
      updated: z.array(
        z.object({
          productId: databaseIdSchema,
          name: z.string(),
          changes: z.record(z.unknown()),
        })
      ),
    })
    .optional(),
});

/**
 * Version history statistics schema
 */
export const VersionHistoryStatsSchema = z.object({
  totalVersions: z.number(),
  totalProposals: z.number(),
  changeTypeBreakdown: z.record(z.number()),
  userActivity: z.record(z.number()),
  timeRange: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
});

// ====================
// Mutation Schemas
// ====================

/**
 * Create version history entry schema
 * Used when creating new version entries programmatically
 */
export const CreateVersionHistoryEntrySchema = z.object({
  proposalId: databaseIdSchema,
  changeType: VersionHistoryChangeTypeSchema,
  changesSummary: z.string().optional(),
  snapshot: z.record(z.unknown()).optional(),
  productIds: z.array(databaseIdSchema).optional(),
});

/**
 * Version history filter schema for UI state
 */
export const VersionHistoryFilterSchema = z.object({
  proposalId: databaseIdSchema.optional(),
  changeType: VersionHistoryChangeTypeSchema.optional(),
  userId: databaseIdSchema.optional(),
  dateRange: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .optional(),
  search: z.string().optional(),
});

// ====================
// TypeScript Type Exports
// ====================

export type VersionHistoryEntry = z.infer<typeof VersionHistoryEntrySchema>;
export type VersionHistoryQuery = z.infer<typeof VersionHistoryQuerySchema>;
export type VersionHistoryList = z.infer<typeof VersionHistoryListSchema>;
export type VersionHistoryDetail = z.infer<typeof VersionHistoryDetailSchema>;
export type VersionHistoryStats = z.infer<typeof VersionHistoryStatsSchema>;
export type CreateVersionHistoryEntry = z.infer<typeof CreateVersionHistoryEntrySchema>;
export type VersionHistoryFilter = z.infer<typeof VersionHistoryFilterSchema>;
export type VersionHistoryChangeType = z.infer<typeof VersionHistoryChangeTypeSchema>;
export type VersionHistoryCursor = z.infer<typeof VersionHistoryCursorSchema>;

// ====================
// Schema Validation Helpers
// ====================

/**
 * Validates version history entry data
 * @param data - The data to validate
 * @returns Validated and typed version history entry
 */
export function validateVersionHistoryEntry(data: unknown): VersionHistoryEntry {
  return VersionHistoryEntrySchema.parse(data);
}

/**
 * Validates version history query parameters
 * @param params - The query parameters to validate
 * @returns Validated and typed query parameters
 */
export function validateVersionHistoryQuery(params: unknown): VersionHistoryQuery {
  return VersionHistoryQuerySchema.parse(params);
}

/**
 * Safely parses version history data with error handling
 * @param data - The data to parse
 * @returns Parsed data or null if invalid
 */
export function safeParseVersionHistoryEntry(data: unknown): VersionHistoryEntry | null {
  const result = VersionHistoryEntrySchema.safeParse(data);
  return result.success ? result.data : null;
}

// ====================
// Default Values
// ====================

export const defaultVersionHistoryQuery: VersionHistoryQuery = {
  limit: 20,
};

export const defaultVersionHistoryFilter: VersionHistoryFilter = {};

// ====================
// Export Statement
// ====================

export default {
  VersionHistoryEntrySchema,
  VersionHistoryQuerySchema,
  VersionHistoryListSchema,
  VersionHistoryDetailSchema,
  VersionHistoryStatsSchema,
  CreateVersionHistoryEntrySchema,
  VersionHistoryFilterSchema,
};
