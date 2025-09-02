/**
 * PosalPro MVP2 - Version History Client Service
 * Client-side version that uses HTTP calls instead of direct Prisma access
 *
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ FOLLOWS: MIGRATION_LESSONS.md - Client-side service patterns
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - HTTP client patterns
 * ✅ ALIGNS: API route schemas for consistent data flow
 * ✅ IMPLEMENTS: Client-side service with proper error handling
 */

import { ApiResponse } from '@/lib/api/response';
import { ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';

// Import consolidated schemas from features/version-history
import {
  VersionHistoryDetailSchema,
  VersionHistoryListSchema,
  VersionHistoryStatsSchema,
  type VersionHistoryDetail,
  type VersionHistoryEntry,
  type VersionHistoryList,
  type VersionHistoryQuery,
  type VersionHistoryStats,
} from '@/features/version-history/schemas';

// Re-export types for backward compatibility
export type {
  VersionHistoryDetail,
  VersionHistoryEntry,
  VersionHistoryList,
  VersionHistoryQuery,
  VersionHistoryStats,
};

/**
 * Client-side Version History Service
 * Uses HTTP calls to API routes instead of direct database access
 */
export class VersionHistoryServiceClient {
  private static instance: VersionHistoryServiceClient | null = null;
  private errorHandlingService = ErrorHandlingService.getInstance();

  static getInstance(): VersionHistoryServiceClient {
    if (!VersionHistoryServiceClient.instance) {
      VersionHistoryServiceClient.instance = new VersionHistoryServiceClient();
    }
    return VersionHistoryServiceClient.instance;
  }

  private constructor() {}

  /**
   * Get version history list with cursor-based pagination
   */
  async getVersionHistory(
    params: VersionHistoryQuery = { limit: 20 }
  ): Promise<ApiResponse<VersionHistoryList>> {
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

      logDebug('VersionHistoryServiceClient: Fetching version history list', {
        component: 'VersionHistoryServiceClient',
        operation: 'getVersionHistory',
        url,
        params,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Make HTTP request - HTTP client returns unwrapped data
      const response = await http.get<VersionHistoryList>(url);

      logInfo('VersionHistoryServiceClient: HTTP request completed', {
        component: 'VersionHistoryServiceClient',
        operation: 'getVersionHistory',
        url,
        resultCount: response?.items?.length || 0,
        responseType: typeof response,
        responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
        hasItems: !!response?.items,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Parse to coerce date strings -> Date objects
      let parsed;
      try {
        parsed = VersionHistoryListSchema.parse(response);
      } catch (schemaError) {
        logError('Schema validation failed in VersionHistoryServiceClient', {
          component: 'VersionHistoryServiceClient',
          operation: 'getVersionHistory',
          schemaError: schemaError instanceof Error ? schemaError.message : 'Unknown schema error',
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
          responseType: typeof response,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
        throw schemaError;
      }

      // Return in ApiResponse format for hook compatibility
      return { ok: true, data: parsed };
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history via HTTP',
        undefined,
        {
          component: 'VersionHistoryServiceClient',
          operation: 'getVersionHistory',
          params,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get single version history entry by ID
   */
  async getVersionHistoryEntry(id: string): Promise<ApiResponse<VersionHistoryDetail>> {
    try {
      const url = `/api/proposals/versions/${id}`;

      logDebug('VersionHistoryServiceClient: Fetching version history entry', {
        component: 'VersionHistoryServiceClient',
        operation: 'getVersionHistoryEntry',
        id,
        url,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await http.get<VersionHistoryDetail>(url);

      logInfo('VersionHistoryServiceClient: Entry fetch completed', {
        component: 'VersionHistoryServiceClient',
        operation: 'getVersionHistoryEntry',
        id,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Parse with comprehensive error handling (from MIGRATION_LESSONS.md)
      let parsed;
      try {
        parsed = VersionHistoryDetailSchema.parse(response);
      } catch (schemaError) {
        logError('Schema validation failed in VersionHistoryServiceClient', {
          component: 'VersionHistoryServiceClient',
          operation: 'getVersionHistoryEntry',
          schemaError: schemaError instanceof Error ? schemaError.message : 'Unknown schema error',
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
          responseType: typeof response,
          id,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
        throw schemaError;
      }

      return { ok: true, data: parsed };
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history entry via HTTP',
        undefined,
        {
          component: 'VersionHistoryServiceClient',
          operation: 'getVersionHistoryEntry',
          id,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get version history for a specific proposal
   */
  async getProposalVersionHistory(
    proposalId: string,
    params: VersionHistoryQuery = { limit: 20 }
  ): Promise<ApiResponse<VersionHistoryList>> {
    try {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.cursorCreatedAt) searchParams.append('cursorCreatedAt', params.cursorCreatedAt);
      if (params.cursorId) searchParams.append('cursorId', params.cursorId);

      const url = `/api/proposals/${proposalId}/versions?${searchParams.toString()}`;

      logDebug('VersionHistoryServiceClient: Fetching proposal version history', {
        component: 'VersionHistoryServiceClient',
        operation: 'getProposalVersionHistory',
        proposalId,
        url,
        params,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await http.get<VersionHistoryList>(url);

      logInfo('VersionHistoryServiceClient: Proposal versions fetch completed', {
        component: 'VersionHistoryServiceClient',
        operation: 'getProposalVersionHistory',
        proposalId,
        resultCount: response?.items?.length || 0,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Parse with comprehensive error handling (from MIGRATION_LESSONS.md)
      let parsed;
      try {
        parsed = VersionHistoryListSchema.parse(response);
      } catch (schemaError) {
        logError('Schema validation failed in VersionHistoryServiceClient', {
          component: 'VersionHistoryServiceClient',
          operation: 'getProposalVersionHistory',
          schemaError: schemaError instanceof Error ? schemaError.message : 'Unknown schema error',
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
          responseType: typeof response,
          proposalId,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
        throw schemaError;
      }

      return { ok: true, data: parsed };
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to fetch proposal version history via HTTP',
        undefined,
        {
          component: 'VersionHistoryServiceClient',
          operation: 'getProposalVersionHistory',
          proposalId,
          params,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );
      throw processedError;
    }
  }

  /**
   * Search version history
   */
  async searchVersionHistory(
    query: string,
    params: {
      proposalId?: string;
      limit?: number;
      cursorCreatedAt?: string;
      cursorId?: string;
    } = {}
  ): Promise<ApiResponse<VersionHistoryList>> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('query', query);
      if (params.proposalId) searchParams.append('proposalId', params.proposalId);
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.cursorCreatedAt) searchParams.append('cursorCreatedAt', params.cursorCreatedAt);
      if (params.cursorId) searchParams.append('cursorId', params.cursorId);

      const url = `/api/proposals/versions/search?${searchParams.toString()}`;

      logDebug('VersionHistoryServiceClient: Searching version history', {
        component: 'VersionHistoryServiceClient',
        operation: 'searchVersionHistory',
        query,
        url,
        params,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await http.get<VersionHistoryList>(url);

      logInfo('VersionHistoryServiceClient: Search completed', {
        component: 'VersionHistoryServiceClient',
        operation: 'searchVersionHistory',
        query,
        resultCount: response?.items?.length || 0,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Parse with comprehensive error handling (from MIGRATION_LESSONS.md)
      let parsed;
      try {
        parsed = VersionHistoryListSchema.parse(response);
      } catch (schemaError) {
        logError('Schema validation failed in VersionHistoryServiceClient', {
          component: 'VersionHistoryServiceClient',
          operation: 'searchVersionHistory',
          schemaError: schemaError instanceof Error ? schemaError.message : 'Unknown schema error',
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
          responseType: typeof response,
          query,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
        throw schemaError;
      }

      return { ok: true, data: parsed };
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to search version history via HTTP',
        undefined,
        {
          component: 'VersionHistoryServiceClient',
          operation: 'searchVersionHistory',
          query,
          params,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get version history statistics
   */
  async getVersionHistoryStats(
    params: {
      proposalId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {}
  ): Promise<ApiResponse<VersionHistoryStats>> {
    try {
      const searchParams = new URLSearchParams();
      if (params.proposalId) searchParams.append('proposalId', params.proposalId);
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);

      const url = `/api/proposals/versions/stats?${searchParams.toString()}`;

      logDebug('VersionHistoryServiceClient: Fetching version history stats', {
        component: 'VersionHistoryServiceClient',
        operation: 'getVersionHistoryStats',
        url,
        params,
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      const response = await http.get<VersionHistoryStats>(url);

      logInfo('VersionHistoryServiceClient: Stats fetch completed', {
        component: 'VersionHistoryServiceClient',
        operation: 'getVersionHistoryStats',
        totalVersions: response?.totalVersions || 0,
        userStory: 'US-5.2',
        hypothesis: 'H9',
      });

      // Parse with comprehensive error handling (from MIGRATION_LESSONS.md)
      let parsed;
      try {
        parsed = VersionHistoryStatsSchema.parse(response);
      } catch (schemaError) {
        logError('Schema validation failed in VersionHistoryServiceClient', {
          component: 'VersionHistoryServiceClient',
          operation: 'getVersionHistoryStats',
          schemaError: schemaError instanceof Error ? schemaError.message : 'Unknown schema error',
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
          responseType: typeof response,
          params,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        });
        throw schemaError;
      }

      return { ok: true, data: parsed };
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history stats via HTTP',
        undefined,
        {
          component: 'VersionHistoryServiceClient',
          operation: 'getVersionHistoryStats',
          params,
          userStory: 'US-5.2',
          hypothesis: 'H9',
        }
      );
      throw processedError;
    }
  }

  /**
   * Bulk delete version history entries
   */
  async bulkDeleteVersionHistory(
    ids: string[]
  ): Promise<ApiResponse<{ deleted: number; failed: number; details: unknown[] }>> {
    try {
      const url = '/api/proposals/versions/bulk-delete';

      logDebug('VersionHistoryServiceClient: Bulk deleting version history', {
        component: 'VersionHistoryServiceClient',
        operation: 'bulkDeleteVersionHistory',
        url,
        requestedCount: ids.length,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await http.delete<{ deleted: number; failed: number; details: unknown[] }>(
        url,
        {
          body: JSON.stringify({ ids }),
          headers: { 'Content-Type': 'application/json' },
        }
      );

      logInfo('VersionHistoryServiceClient: Bulk delete completed', {
        component: 'VersionHistoryServiceClient',
        operation: 'bulkDeleteVersionHistory',
        requested: ids.length,
        deleted: response?.deleted || 0,
        failed: response?.failed || 0,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      return { ok: true, data: response };
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to bulk delete version history via HTTP',
        undefined,
        {
          component: 'VersionHistoryServiceClient',
          operation: 'bulkDeleteVersionHistory',
          requestedCount: ids.length,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );
      throw processedError;
    }
  }

  /**
   * Get version history detail with diff
   */
  async getVersionHistoryDetail(
    proposalId: string,
    version: number
  ): Promise<ApiResponse<VersionHistoryDetail>> {
    try {
      const url = `/api/proposals/${proposalId}/versions/${version}`;

      logDebug('VersionHistoryServiceClient: Fetching version detail', {
        component: 'VersionHistoryServiceClient',
        operation: 'getVersionHistoryDetail',
        proposalId,
        version,
        url,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      const response = await http.get<VersionHistoryDetail>(url);

      logInfo('VersionHistoryServiceClient: Version detail fetch completed', {
        component: 'VersionHistoryServiceClient',
        operation: 'getVersionHistoryDetail',
        proposalId,
        version,
        userStory: 'US-5.1',
        hypothesis: 'H8',
      });

      // Parse with comprehensive error handling (from MIGRATION_LESSONS.md)
      let parsed;
      try {
        parsed = VersionHistoryDetailSchema.parse(response);
      } catch (schemaError) {
        logError('Schema validation failed in VersionHistoryServiceClient', {
          component: 'VersionHistoryServiceClient',
          operation: 'getVersionHistoryDetail',
          schemaError: schemaError instanceof Error ? schemaError.message : 'Unknown schema error',
          responseKeys: response && typeof response === 'object' ? Object.keys(response) : null,
          responseType: typeof response,
          proposalId,
          version,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        });
        throw schemaError;
      }

      return { ok: true, data: parsed };
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to fetch version history detail via HTTP',
        undefined,
        {
          component: 'VersionHistoryServiceClient',
          operation: 'getVersionHistoryDetail',
          proposalId,
          version,
          userStory: 'US-5.1',
          hypothesis: 'H8',
        }
      );
      throw processedError;
    }
  }
}

// Export singleton instance
export const versionHistoryServiceClient = VersionHistoryServiceClient.getInstance();
