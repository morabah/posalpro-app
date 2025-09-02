/**
 * PosalPro MVP2 - Version History Feature Module
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ CONSOLIDATED: All version history exports in one location
 * ✅ ORGANIZED: Feature-based architecture following CORE_REQUIREMENTS.md
 * ✅ TYPE-SAFE: Full TypeScript exports with proper typing
 * ✅ MAINTAINABLE: Clear separation of concerns and single responsibility
 */

// ====================
// Re-export all schemas and types
// ====================

export * from './schemas';
export * from './keys';

// ====================
// Import for default export
// ====================

import {
  VersionHistoryEntrySchema,
  VersionHistoryQuerySchema,
  VersionHistoryListSchema,
  VersionHistoryDetailSchema,
  VersionHistoryStatsSchema,
  CreateVersionHistoryEntrySchema,
  VersionHistoryFilterSchema,
} from './schemas';

import {
  versionHistoryKeys,
  qk,
  invalidateAllVersionHistory,
  invalidateProposalVersions,
  invalidateUserVersions,
  invalidateVersionStats,
} from './keys';

import {
  VersionHistoryService,
  versionHistoryService,
} from '@/services/versionHistoryService';

import {
  useInfiniteVersionHistory,
  useVersionHistoryEntry,
  useProposalVersionHistory,
  useVersionHistoryDetail,
  useVersionHistoryStats,
  useSearchVersionHistory,
  useUserVersionHistory,
  useVersionHistoryEntries,
  useDeleteVersionHistoryBulk,
} from './hooks';

// ====================
// Service Exports
// ====================

export {
  VersionHistoryService,
  versionHistoryService,
} from '@/services/versionHistoryService';

// ====================
// Hook Exports
// ====================

export {
  useInfiniteVersionHistory,
  useVersionHistoryEntry,
  useProposalVersionHistory,
  useVersionHistoryDetail,
  useVersionHistoryStats,
  useSearchVersionHistory,
  useUserVersionHistory,
  useVersionHistoryEntries,
  useDeleteVersionHistoryBulk,
} from './hooks';

// ====================
// Utility Exports (when implemented)
// ====================

// TODO: Export utilities when implemented
// export {
//   formatVersionHistoryEntry,
//   calculateVersionHistoryStats,
//   compareVersionHistoryEntries,
// } from './utils';

// ====================
// Type Guards and Validators (when implemented)
// ====================

// TODO: Export type guards when implemented
// export {
//   isVersionHistoryEntry,
//   isValidVersionHistoryQuery,
//   isVersionHistoryStats,
// } from './types';

// ====================
// Constants and Enums
// ====================

// Note: VersionHistoryChangeTypeSchema and VersionHistoryStatusSchema
// are already exported above from the schemas module

// ====================
// Default Export
// ====================

/**
 * Default export containing the complete version history feature API
 * Provides a single entry point for all version history functionality
 */
const versionHistoryFeature = {
  // Feature metadata
  name: 'Version History',
  version: '1.0.0',
  userStories: ['US-5.1', 'US-5.2'],
  hypotheses: ['H8', 'H9'],

  // Core exports (imported from modules)
  schemas: {
    VersionHistoryEntrySchema: VersionHistoryEntrySchema,
    VersionHistoryQuerySchema: VersionHistoryQuerySchema,
    VersionHistoryListSchema: VersionHistoryListSchema,
    VersionHistoryDetailSchema: VersionHistoryDetailSchema,
    VersionHistoryStatsSchema: VersionHistoryStatsSchema,
    CreateVersionHistoryEntrySchema: CreateVersionHistoryEntrySchema,
    VersionHistoryFilterSchema: VersionHistoryFilterSchema,
  },

  keys: {
    versionHistoryKeys: versionHistoryKeys,
    qk: qk,
    invalidateAllVersionHistory: invalidateAllVersionHistory,
    invalidateProposalVersions: invalidateProposalVersions,
    invalidateUserVersions: invalidateUserVersions,
    invalidateVersionStats: invalidateVersionStats,
  },

  // Service layer
  service: {
    VersionHistoryService: VersionHistoryService,
    versionHistoryService: versionHistoryService,
  },

  // React Query hooks
  hooks: {
    useInfiniteVersionHistory: useInfiniteVersionHistory,
    useVersionHistoryEntry: useVersionHistoryEntry,
    useProposalVersionHistory: useProposalVersionHistory,
    useVersionHistoryDetail: useVersionHistoryDetail,
    useVersionHistoryStats: useVersionHistoryStats,
    useSearchVersionHistory: useSearchVersionHistory,
    useUserVersionHistory: useUserVersionHistory,
    useVersionHistoryEntries: useVersionHistoryEntries,
    useDeleteVersionHistoryBulk: useDeleteVersionHistoryBulk,
  },

  // TODO: Add when implemented
  // utils: {},
  // types: {},
};

export default versionHistoryFeature;

// ====================
// Re-export for convenience
// ====================

// Re-export commonly used types for easier importing
export type {
  VersionHistoryEntry as Entry,
  VersionHistoryQuery as Query,
  VersionHistoryList as List,
  VersionHistoryDetail as Detail,
  VersionHistoryStats as Stats,
  VersionHistoryFilter as Filter,
} from './schemas';
