/**
 * PosalPro MVP2 - Version History Service
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * FOLLOWS: MIGRATION_LESSONS.md - Service layer patterns
 * FOLLOWS: CORE_REQUIREMENTS.md - HTTP client patterns
 * ALIGNS: API route schemas for consistent data flow
 * IMPLEMENTS: Modern architecture with proper separation of concerns
 */

import { ApiResponse } from '@/lib/api/response';
import { prisma } from '@/lib/db/prisma';
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { logDebug, logError, logInfo } from '@/lib/logger';

import { http } from '@/lib/http';
import { Prisma } from '@prisma/client';

// Type definitions for version history service
interface VersionHistoryWhereClause {
  proposalId?: string;
  changeType?: string;
  createdBy?: string;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

interface VersionHistoryCursor {
  createdAt?: Date;
  id?: string;
}

interface VersionHistorySnapshot {
  createdByName?: string;
  totalValue?: number;
  value?: number;
  changeDetails?: Record<string, unknown>;
  [key: string]: unknown;
}

interface VersionHistoryPrismaResult {
  id: string;
  proposalId: string;
  version: number;
  changeType: string;
  changesSummary: string | null;
  createdAt: Date;
  createdBy: string | null;
  snapshot: Prisma.InputJsonValue | null;
}

interface ChangeTypeStat {
  changeType: string;
  _count: {
    id: number;
  };
}

// Import consolidated schemas from features/version-history
import {
  type VersionHistoryDetail,
  type VersionHistoryEntry,
  type VersionHistoryList,
  type VersionHistoryQuery,
  type VersionHistoryStats,
} from '@/features/version-history/schemas';

// ====================
// Type Definitions (Aligned with Feature Schemas)
// ====================

// Re-export types for backward compatibility and convenience
export type {
  VersionHistoryDetail,
  VersionHistoryEntry,
  VersionHistoryList,
  VersionHistoryQuery,
  VersionHistoryStats,
};

// ====================
// Service Class
// ====================

export class VersionHistoryService {
  private static instance: VersionHistoryService | null = null;
  private errorHandlingService = ErrorHandlingService.getInstance();

  static getInstance(): VersionHistoryService {
    if (!VersionHistoryService.instance) {
      VersionHistoryService.instance = new VersionHistoryService();
    }
    return VersionHistoryService.instance;
  }

  private constructor() {}

  // Normalize raw change types from DB to supported set for the UI/schema
  private normalizeChangeType(
    raw:
      | string
      | 'create'
      | 'update'
      | 'delete'
      | 'batch_import'
      | 'rollback'
      | 'status_change'
      | 'INITIAL'
  ):
    | 'create'
    | 'update'
    | 'delete'
    | 'batch_import'
    | 'rollback'
    | 'status_change'
    | 'INITIAL' {
    const allowed = new Set([
      'create',
      'update',
      'delete',
      'batch_import',
      'rollback',
      'status_change',
      'INITIAL',
    ] as const);
    const v = String(raw || '').toLowerCase();
    if (allowed.has(v as any)) return v as any;
    return 'update';
  }

  /**
   * Get version history list with cursor-based pagination
   */
  async getVersionHistory(
    params: VersionHistoryQuery = { limit: 20 }
  ): Promise<ApiResponse<VersionHistoryList>> {
    // Use HTTP client on client-side, Prisma on server-side
    // In test environment, always use Prisma even if window is defined
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
      return this.getVersionHistoryViaHttp(params);
    } else {
      return this.getVersionHistoryViaPrisma(params);
    }
  }

  /**
   * Get version history via HTTP (client-side)
   */
  private async getVersionHistoryViaHttp(
    params: VersionHistoryQuery
  ): Promise<ApiResponse<VersionHistoryList>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Fetching version history list via HTTP', {
      component: 'VersionHistoryService',
      operation: 'getVersionHistory',
      params,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    try {
      // Build query parameters
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.cursorCreatedAt) searchParams.append('cursorCreatedAt', params.cursorCreatedAt);
      if (params.cursorId) searchParams.append('cursorId', params.cursorId);
      if (params.proposalId) searchParams.append('proposalId', params.proposalId);
      if (params.changeType) searchParams.append('changeType', params.changeType);
      if (params.userId) searchParams.append('userId', params.userId);
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);

      const url = `/api/proposals/versions?${searchParams.toString()}`;

      // Make HTTP request (http returns unwrapped data)
      const data = await http.get<VersionHistoryList>(url);

      const loadTime = performance.now() - start;
      logInfo('VersionHistoryService: HTTP request completed', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistory',
        url,
        loadTime,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Wrap to ApiResponse for compatibility
      return { ok: true, data };
    } catch (error) {
      const loadTime = performance.now() - start;
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history via HTTP',
        undefined,
        {
          component: 'VersionHistoryService',
          operation: 'getVersionHistory',
          params,
          loadTime,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get version history via Prisma (server-side)
   */
  private async getVersionHistoryViaPrisma(
    params: VersionHistoryQuery = { limit: 20 }
  ): Promise<ApiResponse<VersionHistoryList>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Fetching version history list', {
      component: 'VersionHistoryService',
      operation: 'getVersionHistory',
      params,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    try {
      // Build Prisma query
      const where: VersionHistoryWhereClause = {};
      if (params.proposalId) {
        where.proposalId = params.proposalId;
      }

      // Handle cursor-based pagination
      const cursor: VersionHistoryCursor = {};
      if (params.cursorCreatedAt && params.cursorId) {
        cursor.createdAt = new Date(params.cursorCreatedAt);
        cursor.id = params.cursorId;
      }

      const limit = params.limit || 20;
      const skip = cursor.createdAt && cursor.id ? 1 : 0;

      // Fetch version history entries
      const versions = await prisma.proposalVersion.findMany({
        where,
        select: {
          id: true,
          proposalId: true,
          version: true,
          changeType: true,
          changesSummary: true,
          createdAt: true,
          createdBy: true,
          snapshot: true, // Include snapshot for enhanced data
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1, // +1 to check if there's a next page
        skip,
        ...(cursor.createdAt &&
          cursor.id && {
            cursor: {
              id: cursor.id,
            },
          }),
      });

      // Check if there's a next page
      const hasNextPage = versions.length > limit;
      const items = hasNextPage ? versions.slice(0, -1) : versions;

      // Create next cursor
      const nextCursor =
        hasNextPage && items.length > 0
          ? {
              cursorCreatedAt: items[items.length - 1].createdAt.toISOString(),
              cursorId: items[items.length - 1].id,
            }
          : null;

      // Transform to match the expected schema format
      const transformedItems = items.map((version: VersionHistoryPrismaResult) => {
        const snapshot = version.snapshot as VersionHistorySnapshot | null;
        return {
          id: version.id,
          proposalId: version.proposalId,
          version: version.version,
          changeType: this.normalizeChangeType(version.changeType),
          changesSummary: version.changesSummary || undefined,
          createdAt: version.createdAt,
          createdBy: version.createdBy || undefined,

          // Extract enhanced data from snapshot
          createdByName: snapshot?.createdByName || undefined,
          totalValue: snapshot?.totalValue || snapshot?.value || undefined,
          changeDetails: snapshot?.changeDetails || undefined,
        };
      });

      const data: VersionHistoryList = {
        items: transformedItems,
        pagination: {
          limit,
          hasNextPage,
          nextCursor,
        },
      };

      const loadTime = performance.now() - start;

      logInfo('VersionHistoryService: Version history list fetched successfully', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistory',
        count: data.items?.length || 0,
        hasNextPage: !!data.pagination?.nextCursor,
        loadTime: Math.round(loadTime),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return { ok: true, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'VersionHistoryService',
          operation: 'getVersionHistory',
          params,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );

      logError('VersionHistoryService: Failed to fetch version history list', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistory',
        error: processed.message,
        code: processed.code,
        loadTime: Math.round(performance.now() - start),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return {
        ok: false,
        code: processed.code || 'UNKNOWN_ERROR',
        message: processed.message,
      };
    }
  }

  /**
   * Get single version history entry by ID
   */
  async getVersionHistoryEntry(id: string): Promise<ApiResponse<VersionHistoryEntry>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Fetching single version history entry', {
      component: 'VersionHistoryService',
      operation: 'getVersionHistoryEntry',
      versionHistoryId: id,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    try {
      const version = await prisma.proposalVersion.findUnique({
        where: { id },
        select: {
          id: true,
          proposalId: true,
          version: true,
          changeType: true,
          changesSummary: true,
          createdAt: true,
          // updatedAt doesn't exist in ProposalVersion model
          createdBy: true,
          snapshot: true,
          productIds: true,
        },
      });

      if (!version) {
        throw new Error('Version history entry not found');
      }

      // Transform to match expected format
      const data: VersionHistoryEntry = {
        id: version.id,
        proposalId: version.proposalId,
        version: version.version,
        changeType: this.normalizeChangeType(version.changeType),
        changesSummary: version.changesSummary || undefined,
        createdAt: version.createdAt,

        createdBy: version.createdBy || undefined,
        snapshot: version.snapshot as Record<string, unknown> | undefined,
        productIds: version.productIds,
      };

      const loadTime = performance.now() - start;

      logInfo('VersionHistoryService: Version history entry fetched successfully', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistoryEntry',
        versionHistoryId: id,
        loadTime: Math.round(loadTime),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return { ok: true, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history entry',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'VersionHistoryService',
          operation: 'getVersionHistoryEntry',
          versionHistoryId: id,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );

      logError('VersionHistoryService: Failed to fetch version history entry', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistoryEntry',
        error: processed.message,
        code: processed.code,
        versionHistoryId: id,
        loadTime: Math.round(performance.now() - start),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return {
        ok: false,
        code: processed.code || 'UNKNOWN_ERROR',
        message: processed.message,
      };
    }
  }

  /**
   * Get version history for a specific proposal
   */
  async getProposalVersionHistory(
    proposalId: string,
    params: Omit<VersionHistoryQuery, 'proposalId'> = { limit: 20 }
  ): Promise<ApiResponse<VersionHistoryList>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Fetching proposal version history', {
      component: 'VersionHistoryService',
      operation: 'getProposalVersionHistory',
      proposalId,
      params,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    try {
      // First check if the proposal exists
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        select: { id: true },
      });

      if (!proposal) {
        throw new Error('Proposal not found');
      }

      // Build Prisma query
      const where = { proposalId };

      // Handle cursor-based pagination
      const cursor: VersionHistoryCursor = {};
      if (params.cursorCreatedAt && params.cursorId) {
        cursor.createdAt = new Date(params.cursorCreatedAt);
        cursor.id = params.cursorId;
      }

      const limit = params.limit || 20;
      const skip = cursor.createdAt && cursor.id ? 1 : 0;

      // Fetch version history entries for specific proposal
      const versions = await prisma.proposalVersion.findMany({
        where,
        select: {
          id: true,
          proposalId: true,
          version: true,
          changeType: true,
          changesSummary: true,
          createdAt: true,
          createdBy: true,
          snapshot: true, // Include snapshot for enhanced data
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1, // +1 to check if there's a next page
        skip,
        ...(cursor.createdAt &&
          cursor.id && {
            cursor: {
              id: cursor.id,
            },
          }),
      });

      // Check if there's a next page
      const hasNextPage = versions.length > limit;
      const items = hasNextPage ? versions.slice(0, -1) : versions;

      // Create next cursor
      const nextCursor =
        hasNextPage && items.length > 0
          ? {
              cursorCreatedAt: items[items.length - 1].createdAt.toISOString(),
              cursorId: items[items.length - 1].id,
            }
          : null;

      // Transform to match the expected schema format
      const transformedItems = items.map((version: VersionHistoryPrismaResult) => {
        const snapshot = version.snapshot as VersionHistorySnapshot | null;
        return {
          id: version.id,
          proposalId: version.proposalId,
          version: version.version,
          changeType: this.normalizeChangeType(version.changeType),
          changesSummary: version.changesSummary || undefined,
          createdAt: version.createdAt,
          createdBy: version.createdBy || undefined,

          // Extract enhanced data from snapshot
          createdByName: snapshot?.createdByName || undefined,
          totalValue: snapshot?.totalValue || snapshot?.value || undefined,
          changeDetails: snapshot?.changeDetails || undefined,
        };
      });

      const data: VersionHistoryList = {
        items: transformedItems,
        pagination: {
          limit,
          hasNextPage,
          nextCursor,
        },
      };

      const loadTime = performance.now() - start;

      logInfo('VersionHistoryService: Proposal version history fetched successfully', {
        component: 'VersionHistoryService',
        operation: 'getProposalVersionHistory',
        proposalId,
        count: data.items?.length || 0,
        hasNextPage: !!data.pagination?.nextCursor,
        loadTime: Math.round(loadTime),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return { ok: true, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch proposal version history',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'VersionHistoryService',
          operation: 'getProposalVersionHistory',
          proposalId,
          params,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );

      logError('VersionHistoryService: Failed to fetch proposal version history', {
        component: 'VersionHistoryService',
        operation: 'getProposalVersionHistory',
        error: processed.message,
        code: processed.code,
        proposalId,
        loadTime: Math.round(performance.now() - start),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return {
        ok: false,
        code: processed.code || 'UNKNOWN_ERROR',
        message: processed.message,
      };
    }
  }

  /**
   * Get detailed version history entry with diff information
   */
  async getVersionHistoryDetail(
    proposalId: string,
    version: number
  ): Promise<ApiResponse<VersionHistoryDetail>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Fetching version history detail with diff', {
      component: 'VersionHistoryService',
      operation: 'getVersionHistoryDetail',
      proposalId,
      version,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    try {
      // Fetch the specific version entry
      const versionEntry = await prisma.proposalVersion.findFirst({
        where: {
          proposalId,
          version,
        },
        select: {
          id: true,
          proposalId: true,
          version: true,
          changeType: true,
          changesSummary: true,
          createdAt: true,
          // updatedAt doesn't exist in ProposalVersion model
          createdBy: true,
          snapshot: true,
          productIds: true,
          proposal: {
            select: {
              id: true,
              title: true,
              status: true,
              value: true,
            },
          },
        },
      });

      if (!versionEntry) {
        throw new Error('Version not found');
      }

      // Enhance with diff calculation between this version and the previous one
      // Fetch previous version entry
      const previousEntry = await prisma.proposalVersion.findFirst({
        where: { proposalId, version: { lt: version } },
        orderBy: { version: 'desc' },
        select: { snapshot: true, productIds: true },
      });

      const currSnapshot = (versionEntry.snapshot || {}) as any;
      const prevSnapshot = (previousEntry?.snapshot || {}) as any;
      const currProducts: Array<any> = Array.isArray(currSnapshot.products) ? currSnapshot.products : [];
      const prevProducts: Array<any> = Array.isArray(prevSnapshot.products) ? prevSnapshot.products : [];

      const currIds = new Set<string>(((versionEntry.productIds || []) as string[]) ?? []);
      const prevIds = new Set<string>(((previousEntry?.productIds || []) as string[]) ?? []);
      const addedIds = [...currIds].filter(id => !prevIds.has(id));
      const removedIds = [...prevIds].filter(id => !currIds.has(id));
      const commonIds = [...currIds].filter(id => prevIds.has(id));

      const toMap = (arr: Array<any>) => {
        const m = new Map<string, any>();
        for (const p of arr) {
          const pid = String(p.productId ?? p.id ?? '');
          if (pid) m.set(pid, p);
        }
        return m;
      };
      const currMap = toMap(currProducts);
      const prevMap = toMap(prevProducts);

      const changedIds = Array.from(new Set([...addedIds, ...removedIds, ...commonIds]));
      const productsInfo = changedIds.length
        ? await prisma.product.findMany({ where: { id: { in: changedIds } }, select: { id: true, name: true, price: true } })
        : [];
      const nameOf = (id: string) => productsInfo.find(p => p.id === id)?.name || id;
      const num = (v: any): number => (typeof v === 'number' ? v : v ? Number(v) : 0);

      const added = addedIds.map(id => {
        const p = currMap.get(id) || {};
        return { productId: id, name: nameOf(id), quantity: num(p.quantity), unitPrice: num(p.unitPrice ?? productsInfo.find(x => x.id === id)?.price ?? 0) };
      });
      const removed = removedIds.map(id => {
        const p = prevMap.get(id) || {};
        return { productId: id, name: nameOf(id), quantity: num(p.quantity), unitPrice: num(p.unitPrice ?? productsInfo.find(x => x.id === id)?.price ?? 0) };
      });
      const updated = commonIds
        .map(id => {
          const c = currMap.get(id) || {};
          const p = prevMap.get(id) || {};
          const changes: Record<string, unknown> = {};
          if (num(c.quantity) !== num(p.quantity)) changes.quantity = { from: num(p.quantity), to: num(c.quantity) };
          if (num(c.unitPrice) !== num(p.unitPrice)) changes.unitPrice = { from: num(p.unitPrice), to: num(c.unitPrice) };
          if (num(c.discount) !== num(p.discount)) changes.discount = { from: num(p.discount), to: num(c.discount) };
          return Object.keys(changes).length > 0 ? { productId: id, name: nameOf(id), changes } : null;
        })
        .filter(Boolean) as Array<{ productId: string; name: string; changes: Record<string, unknown> }>;

      const sumProducts = (arr: Array<any>) =>
        arr.reduce((sum, x) => sum + (num(x.total) || num(x.quantity) * num(x.unitPrice)), 0);
      const totalBefore = num(prevSnapshot?.totalValue ?? prevSnapshot?.value) || sumProducts(prevProducts);
      const totalAfter = num(currSnapshot?.totalValue ?? currSnapshot?.value) || sumProducts(currProducts);
      const delta = totalAfter - totalBefore;

      const autoSummary = versionEntry.changesSummary || `${added.length} added, ${removed.length} removed, ${updated.length} updated; total ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}`;

      const data: VersionHistoryDetail = {
        id: versionEntry.id,
        proposalId: versionEntry.proposalId,
        version: versionEntry.version,
        changeType: this.normalizeChangeType(versionEntry.changeType),
        changesSummary: autoSummary,
        createdAt: versionEntry.createdAt,
        createdBy: versionEntry.createdBy || undefined,
        proposal: versionEntry.proposal ? { id: versionEntry.proposal.id, title: versionEntry.proposal.title } : undefined,
        snapshot: currSnapshot as Record<string, unknown> | undefined,
        productIds: versionEntry.productIds,
        changes: { added, removed, updated },
        changeDetails: { totalBefore, totalAfter, totalDelta: delta },
      };

      const loadTime = performance.now() - start;

      logInfo('VersionHistoryService: Version history detail fetched successfully', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistoryDetail',
        proposalId,
        version,
        loadTime: Math.round(loadTime),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return { ok: true, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history detail',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'VersionHistoryService',
          operation: 'getVersionHistoryDetail',
          proposalId,
          version,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );

      logError('VersionHistoryService: Failed to fetch version history detail', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistoryDetail',
        error: processed.message,
        code: processed.code,
        proposalId,
        version,
        loadTime: Math.round(performance.now() - start),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return {
        ok: false,
        code: processed.code || 'UNKNOWN_ERROR',
        message: processed.message,
      };
    }
  }

  /**
   * Get version history statistics
   */
  async getVersionHistoryStats(
    params: { proposalId?: string; dateFrom?: string; dateTo?: string } = {}
  ): Promise<ApiResponse<VersionHistoryStats>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Fetching version history statistics', {
      component: 'VersionHistoryService',
      operation: 'getVersionHistoryStats',
      params,
      userStory: 'US-5.2',
      hypothesis: 'H9',
    });

    try {
      // Build where clause for statistics
      const where: VersionHistoryWhereClause = {};
      if (params.proposalId) {
        where.proposalId = params.proposalId;
      }
      if (params.dateFrom || params.dateTo) {
        where.createdAt = {};
        if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
        if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
      }

      // Get total count
      const totalVersions = await prisma.proposalVersion.count({ where });

      // Get statistics by change type
      const changeTypeStats = await prisma.proposalVersion.groupBy({
        by: ['changeType'],
        where,
        _count: {
          id: true,
        },
      });

      // Get total proposals count
      const totalProposals = await prisma.proposal.count({
        where: params.proposalId ? { id: params.proposalId } : {},
      });

      // Get date range stats
      const dateRangeStats = await prisma.proposalVersion.aggregate({
        where,
        _min: {
          createdAt: true,
        },
        _max: {
          createdAt: true,
        },
      });

      // Transform data to match expected format
      const data: VersionHistoryStats = {
        totalVersions,
        totalProposals,
        changeTypeBreakdown: changeTypeStats.reduce(
          (acc: Record<string, number>, stat: ChangeTypeStat) => {
            acc[stat.changeType] = stat._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
        userActivity: {},
        timeRange: {
          from: dateRangeStats._min.createdAt ?? new Date(0),
          to: dateRangeStats._max.createdAt ?? new Date(0),
        },
      };

      const loadTime = performance.now() - start;

      logInfo('VersionHistoryService: Version history statistics fetched successfully', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistoryStats',
        totalVersions: data.totalVersions,
        totalProposals: data.totalProposals,
        loadTime: Math.round(loadTime),
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      return { ok: true, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history statistics',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'VersionHistoryService',
          operation: 'getVersionHistoryStats',
          params,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        }
      );

      logError('VersionHistoryService: Failed to fetch version history statistics', {
        component: 'VersionHistoryService',
        operation: 'getVersionHistoryStats',
        error: processed.message,
        code: processed.code,
        loadTime: Math.round(performance.now() - start),
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      return {
        ok: false,
        code: processed.code || 'UNKNOWN_ERROR',
        message: processed.message,
      };
    }
  }

  /**
   * Search version history entries
   */
  async searchVersionHistory(
    query: string,
    params: Omit<VersionHistoryQuery, 'limit'> & { limit?: number } = {}
  ): Promise<ApiResponse<VersionHistoryList>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Searching version history', {
      component: 'VersionHistoryService',
      operation: 'searchVersionHistory',
      query,
      params,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    try {
      // Build Prisma search query
      const where: VersionHistoryWhereClause & {
        OR: Array<{
          changesSummary?: { contains: string; mode: 'insensitive' };
          proposalId?: { contains: string; mode: 'insensitive' };
        }>;
      } = {
        OR: [
          { changesSummary: { contains: query, mode: 'insensitive' } },
          { proposalId: { contains: query, mode: 'insensitive' } },
        ],
      };

      if (params.proposalId) {
        where.proposalId = params.proposalId;
      }

      // Handle cursor-based pagination
      const cursor: VersionHistoryCursor = {};
      if (params.cursorCreatedAt && params.cursorId) {
        cursor.createdAt = new Date(params.cursorCreatedAt);
        cursor.id = params.cursorId;
      }

      const limit = params.limit || 20;
      const skip = cursor.createdAt && cursor.id ? 1 : 0;

      // Search version history entries
      const versions = await prisma.proposalVersion.findMany({
        where,
        select: {
          id: true,
          proposalId: true,
          version: true,
          changeType: true,
          changesSummary: true,
          createdAt: true,
          createdBy: true,
          snapshot: true, // Include snapshot for enhanced data
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1, // +1 to check if there's a next page
        skip,
        ...(cursor.createdAt &&
          cursor.id && {
            cursor: {
              id: cursor.id,
            },
          }),
      });

      // Check if there's a next page
      const hasNextPage = versions.length > limit;
      const items = hasNextPage ? versions.slice(0, -1) : versions;

      // Create next cursor
      const nextCursor =
        hasNextPage && items.length > 0
          ? {
              cursorCreatedAt: items[items.length - 1].createdAt.toISOString(),
              cursorId: items[items.length - 1].id,
            }
          : null;

      // Transform to match the expected schema format
      const transformedItems = items.map((version: VersionHistoryPrismaResult) => {
        const snapshot = version.snapshot as VersionHistorySnapshot | null;
        return {
          id: version.id,
          proposalId: version.proposalId,
          version: version.version,
          changeType: this.normalizeChangeType(version.changeType),
          changesSummary: version.changesSummary || undefined,
          createdAt: version.createdAt,
          createdBy: version.createdBy || undefined,

          // Extract enhanced data from snapshot
          createdByName: snapshot?.createdByName || undefined,
          totalValue: snapshot?.totalValue || snapshot?.value || undefined,
          changeDetails: snapshot?.changeDetails || undefined,
        };
      });

      const data: VersionHistoryList = {
        items: transformedItems,
        pagination: {
          limit,
          hasNextPage,
          nextCursor,
        },
      };

      const loadTime = performance.now() - start;

      logInfo('VersionHistoryService: Version history search completed successfully', {
        component: 'VersionHistoryService',
        operation: 'searchVersionHistory',
        query,
        count: data.items?.length || 0,
        loadTime: Math.round(loadTime),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return { ok: true, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to search version history',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'VersionHistoryService',
          operation: 'searchVersionHistory',
          query,
          params,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );

      logError('VersionHistoryService: Failed to search version history', {
        component: 'VersionHistoryService',
        operation: 'searchVersionHistory',
        error: processed.message,
        code: processed.code,
        query,
        loadTime: Math.round(performance.now() - start),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return {
        ok: false,
        code: processed.code || 'UNKNOWN_ERROR',
        message: processed.message,
      };
    }
  }

  /**
   * Get version history for a specific user
   */
  async getUserVersionHistory(
    userId: string,
    params: Omit<VersionHistoryQuery, 'limit'> & { limit?: number } = {}
  ): Promise<ApiResponse<VersionHistoryList>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Fetching user version history', {
      component: 'VersionHistoryService',
      operation: 'getUserVersionHistory',
      userId,
      params,
      userStory: 'US-5.2',
      hypothesis: 'H9',
    });

    try {
      // Build Prisma query for user version history
      const where = { createdBy: userId };

      // Handle cursor-based pagination
      const cursor: VersionHistoryCursor = {};
      if (params.cursorCreatedAt && params.cursorId) {
        cursor.createdAt = new Date(params.cursorCreatedAt);
        cursor.id = params.cursorId;
      }

      const limit = params.limit || 20;
      const skip = cursor.createdAt && cursor.id ? 1 : 0;

      // Fetch version history entries for specific user
      const versions = await prisma.proposalVersion.findMany({
        where,
        select: {
          id: true,
          proposalId: true,
          version: true,
          changeType: true,
          changesSummary: true,
          createdAt: true,
          createdBy: true,
          snapshot: true, // Include snapshot for enhanced data
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1, // +1 to check if there's a next page
        skip,
        ...(cursor.createdAt &&
          cursor.id && {
            cursor: {
              id: cursor.id,
            },
          }),
      });

      // Check if there's a next page
      const hasNextPage = versions.length > limit;
      const items = hasNextPage ? versions.slice(0, -1) : versions;

      // Create next cursor
      const nextCursor =
        hasNextPage && items.length > 0
          ? {
              cursorCreatedAt: items[items.length - 1].createdAt.toISOString(),
              cursorId: items[items.length - 1].id,
            }
          : null;

      // Transform to match the expected schema format
      const transformedItems = items.map((version: VersionHistoryPrismaResult) => {
        const snapshot = version.snapshot as VersionHistorySnapshot | null;
        return {
          id: version.id,
          proposalId: version.proposalId,
          version: version.version,
          changeType: version.changeType as 'create' | 'update' | 'delete' | 'batch_import' | 'rollback' | 'status_change' | 'INITIAL',
          changesSummary: version.changesSummary || undefined,
          createdAt: version.createdAt,
          createdBy: version.createdBy || undefined,

          // Extract enhanced data from snapshot
          createdByName: snapshot?.createdByName || undefined,
          totalValue: snapshot?.totalValue || snapshot?.value || undefined,
          changeDetails: snapshot?.changeDetails || undefined,
        };
      });

      const data: VersionHistoryList = {
        items: transformedItems,
        pagination: {
          limit,
          hasNextPage,
          nextCursor,
        },
      };

      const loadTime = performance.now() - start;

      logInfo('VersionHistoryService: User version history fetched successfully', {
        component: 'VersionHistoryService',
        operation: 'getUserVersionHistory',
        userId,
        count: data.items?.length || 0,
        hasNextPage: !!data.pagination?.nextCursor,
        loadTime: Math.round(loadTime),
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      return { ok: true, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch user version history',
        ErrorCodes.DATA.FETCH_FAILED,
        {
          component: 'VersionHistoryService',
          operation: 'getUserVersionHistory',
          userId,
          params,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        }
      );

      logError('VersionHistoryService: Failed to fetch user version history', {
        component: 'VersionHistoryService',
        operation: 'getUserVersionHistory',
        error: processed.message,
        code: processed.code,
        userId,
        loadTime: Math.round(performance.now() - start),
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      return {
        ok: false,
        code: processed.code || 'UNKNOWN_ERROR',
        message: processed.message,
      };
    }
  }

  /**
   * Bulk operations on version history (for admin operations)
   */
  async bulkDeleteVersionHistory(
    versionIds: string[]
  ): Promise<ApiResponse<{ deleted: number; failed: number }>> {
    const start = performance.now();

    logDebug('VersionHistoryService: Bulk deleting version history entries', {
      component: 'VersionHistoryService',
      operation: 'bulkDeleteVersionHistory',
      count: versionIds.length,
      userStory: 'US-5.1',
      hypothesis: 'H8',
    });

    try {
      // Validate input
      if (!versionIds || versionIds.length === 0) {
        return {
          ok: false,
          code: 'VALIDATION_ERROR',
          message: 'No entries provided for deletion',
        };
      }

      // Perform bulk delete using Prisma
      const result = await prisma.proposalVersion.deleteMany({
        where: {
          id: {
            in: versionIds,
          },
        },
      });

      const data = {
        deleted: result.count,
        failed: versionIds.length - result.count,
      };

      const loadTime = performance.now() - start;

      logInfo('VersionHistoryService: Bulk delete completed successfully', {
        component: 'VersionHistoryService',
        operation: 'bulkDeleteVersionHistory',
        requested: versionIds.length,
        deleted: data.deleted,
        failed: data.failed,
        loadTime: Math.round(loadTime),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return { ok: true, data };
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to bulk delete version history entries',
        ErrorCodes.DATA.TRANSACTION_FAILED,
        {
          component: 'VersionHistoryService',
          operation: 'bulkDeleteVersionHistory',
          count: versionIds.length,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );

      logError('VersionHistoryService: Failed to bulk delete version history', {
        component: 'VersionHistoryService',
        operation: 'bulkDeleteVersionHistory',
        error: processed.message,
        code: processed.code,
        count: versionIds.length,
        loadTime: Math.round(performance.now() - start),
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return {
        ok: false,
        code: processed.code || 'UNKNOWN_ERROR',
        message: processed.message,
      };
    }
  }
}

// ====================
// Export Singleton Instance
// ====================

export const versionHistoryService = VersionHistoryService.getInstance();

// ====================
// Export Default
// ====================

export default VersionHistoryService;
