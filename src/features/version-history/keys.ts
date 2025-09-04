/**
 * PosalPro MVP2 - Version History Query Keys
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ CENTRALIZED: All version history query keys in one location
 * ✅ CONSISTENT: Follows established query key patterns from CORE_REQUIREMENTS.md
 * ✅ OPTIMIZED: Proper key structure for cache invalidation and updates
 * ✅ TYPE-SAFE: Full TypeScript support with proper typing
 */

/**
 * Version History Query Keys
 * Follows the established pattern from other feature modules
 * Structure: [domain, operation, ...params]
 */
export const versionHistoryKeys = {
  // Root key for all version history queries
  all: ['version-history'] as const,

  // List operations
  lists: () => [...versionHistoryKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...versionHistoryKeys.lists(), params] as const,

  // Infinite scroll lists (cursor-based pagination)
  infiniteLists: () => [...versionHistoryKeys.all, 'infinite'] as const,
  infiniteList: (params: Record<string, unknown>) => [...versionHistoryKeys.infiniteLists(), params] as const,

  // Individual entries
  entries: () => [...versionHistoryKeys.all, 'entries'] as const,
  entry: (id: string) => [...versionHistoryKeys.entries(), id] as const,

  // Proposal-specific version history
  byProposal: (proposalId: string) => [...versionHistoryKeys.all, 'byProposal', proposalId] as const,
  proposalVersions: (proposalId: string) => [...versionHistoryKeys.byProposal(proposalId), 'versions'] as const,
  proposalVersion: (proposalId: string, version: number) => [
    ...versionHistoryKeys.proposalVersions(proposalId),
    version
  ] as const,

  // Statistics and analytics
  stats: () => [...versionHistoryKeys.all, 'stats'] as const,
  proposalStats: (proposalId: string) => [...versionHistoryKeys.byProposal(proposalId), 'stats'] as const,
  globalStats: () => [...versionHistoryKeys.stats(), 'global'] as const,

  // Search operations
  search: () => [...versionHistoryKeys.all, 'search'] as const,
  searchVersions: (query: string, filters?: Record<string, unknown>) => [
    ...versionHistoryKeys.search(),
    query,
    filters || {}
  ] as const,

  // User-specific history
  byUser: (userId: string) => [...versionHistoryKeys.all, 'byUser', userId] as const,
  userVersions: (userId: string) => [...versionHistoryKeys.byUser(userId), 'versions'] as const,

  // Change type filtering
  byChangeType: (changeType: string) => [...versionHistoryKeys.all, 'byChangeType', changeType] as const,
  changeTypeVersions: (changeType: string) => [...versionHistoryKeys.byChangeType(changeType), 'versions'] as const,

  // Date range filtering
  byDateRange: (from: string, to: string) => [...versionHistoryKeys.all, 'byDateRange', from, to] as const,
  dateRangeVersions: (from: string, to: string) => [...versionHistoryKeys.byDateRange(from, to), 'versions'] as const,

  // Bulk operations
  bulk: () => [...versionHistoryKeys.all, 'bulk'] as const,
  bulkDelete: () => [...versionHistoryKeys.bulk(), 'delete'] as const,
  bulkExport: () => [...versionHistoryKeys.bulk(), 'export'] as const,

  // Export operations
  exports: () => [...versionHistoryKeys.all, 'exports'] as const,
  exportVersions: (format: string, filters?: Record<string, unknown>) => [
    ...versionHistoryKeys.exports(),
    format,
    filters || {}
  ] as const,

  // Diff operations (comparing versions)
  diffs: () => [...versionHistoryKeys.all, 'diffs'] as const,
  versionDiff: (proposalId: string, fromVersion: number, toVersion: number) => [
    ...versionHistoryKeys.diffs(),
    proposalId,
    fromVersion,
    toVersion
  ] as const,

  // Rollback operations
  rollbacks: () => [...versionHistoryKeys.all, 'rollbacks'] as const,
  rollbackVersions: (proposalId: string) => [...versionHistoryKeys.rollbacks(), proposalId] as const,
} as const;

/**
 * Type-safe query key functions
 * Provides compile-time safety for query key construction
 */
export const qk = {
  versionHistory: versionHistoryKeys,
} as const;

// ====================
// Query Key Utilities
// ====================

/**
 * Invalidates all version history queries
 * Useful after bulk operations or system-wide changes
 */
export const invalidateAllVersionHistory = () => versionHistoryKeys.all;

/**
 * Invalidates version history for a specific proposal
 * Useful after proposal-specific changes
 */
export const invalidateProposalVersions = (proposalId: string) => versionHistoryKeys.byProposal(proposalId);

/**
 * Invalidates version history for a specific user
 * Useful after user-specific changes
 */
export const invalidateUserVersions = (userId: string) => versionHistoryKeys.byUser(userId);

/**
 * Invalidates version history statistics
 * Useful after changes that affect statistics
 */
export const invalidateVersionStats = () => versionHistoryKeys.stats();

// ====================
// Export Statement
// ====================

export default versionHistoryKeys;






