/**
 * PosalPro MVP2 - Version History React Query Hooks Integration Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 *
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - React Query integration testing
 * ✅ IMPLEMENTS: Hook testing with query client and cache validation
 * ✅ VALIDATES: Data fetching, caching, mutations, and error handling
 *
 * Test Coverage:
 * - Hook initialization and data fetching
 * - Query key generation and caching
 * - Error handling and retry logic
 * - Mutation operations and cache invalidation
 * - Loading states and data transformation
 * - Analytics integration
 */

import { renderHook, waitFor } from '@testing-library/react';
import React, { ReactNode } from 'react';

// Import test utilities
import {
  createTestWrapper,
  mockAnalytics,
  mockLogger,
  cleanupTestMocks,
} from '@/test/test-utils/react-query';

// Import hooks to test
import {
  useDeleteVersionHistoryBulk,
  useInfiniteVersionHistory,
  useProposalVersionHistory,
  useSearchVersionHistory,
  useUserVersionHistory,
  useVersionHistoryDetail,
  useVersionHistoryEntries,
  useVersionHistoryEntry,
  useVersionHistoryStats,
} from '../useVersionHistory';

// Mock service and dependencies
import { versionHistoryKeys } from '@/features/version-history/keys';
import { logError, logInfo } from '@/lib/logger';
import { versionHistoryService } from '@/services/versionHistoryService';

// Mock all dependencies
jest.mock('@/services/versionHistoryService');
jest.mock('@/features/version-history/keys', () => ({
  versionHistoryKeys: {
    all: ['version-history'],
    lists: jest.fn(() => ['version-history', 'list']),
    list: jest.fn(params => ['version-history', 'list', params]),
    infiniteLists: jest.fn(() => ['version-history', 'infinite']),
    infiniteList: jest.fn(params => ['version-history', 'infinite', params]),
    entries: jest.fn(() => ['version-history', 'entries']),
    entry: jest.fn(id => ['version-history', 'entries', id]),
    byId: jest.fn(id => ['version-history', 'entries', id]),
    detail: jest.fn((proposalId, version) => ['version-history', 'detail', proposalId, version]),
    byProposal: jest.fn(proposalId => ['version-history', 'byProposal', proposalId]),
    proposalVersions: jest.fn(proposalId => ['version-history', 'proposal', proposalId]),
    proposalVersion: jest.fn((proposalId, version) => [
      'version-history',
      'proposal',
      proposalId,
      version,
    ]),
    byUser: jest.fn(userId => ['version-history', 'byUser', userId]),
    userVersions: jest.fn(userId => ['version-history', 'user', userId]),
    search: jest.fn(query => ['version-history', 'search', query]),
    searchVersions: jest.fn((query, filters) => ['version-history', 'search', query, filters]),
    stats: jest.fn(() => ['version-history', 'stats']),
    globalStats: jest.fn(() => ['version-history', 'stats', 'global']),
  },
}));
jest.mock('@/lib/logger');
jest.mock('@/hooks/useOptimizedAnalytics', () => ({
  useOptimizedAnalytics: () => ({
    trackOptimized: jest.fn(),
  }),
}));

// Mock data
const mockVersionHistoryEntry = {
  id: 'test-entry-1',
  proposalId: 'test-proposal-1',
  version: 1,
  changeType: 'create' as const,
  changesSummary: 'Initial proposal created',
  totalValue: 10000,
  createdBy: 'user-1',
  createdByName: 'Test User',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  snapshot: { originalValue: 10000 },
};

const mockVersionHistoryList = {
  items: [mockVersionHistoryEntry],
  pagination: {
    limit: 20,
    hasNextPage: false,
    nextCursor: null,
  },
  total: 1,
};

const mockApiResponse = {
  ok: true,
  data: mockVersionHistoryList,
};

// ✅ UPDATED: Use standardized test utilities
const createWrapper = createTestWrapper();

describe('useInfiniteVersionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock service methods
    (versionHistoryService.getVersionHistory as jest.Mock).mockResolvedValue(mockApiResponse);

    // Query keys are already mocked in jest.mock
  });

  it('should fetch version history with default parameters', async () => {
    const { result } = renderHook(() => useInfiniteVersionHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.getVersionHistory).toHaveBeenCalledWith({
      limit: 20,
    });

    expect(result.current.data?.pages[0]).toEqual(mockVersionHistoryList);
    expect(result.current.data?.pages[0].items).toHaveLength(1);
  });

  it('should fetch version history with custom parameters', async () => {
    const params = {
      proposalId: 'test-proposal-1',
      limit: 50,
      changeType: 'update' as const,
      userId: 'user-1',
      dateFrom: '2024-01-01T00:00:00Z',
    };

    const { result } = renderHook(() => useInfiniteVersionHistory(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.getVersionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        ...params,
        cursorCreatedAt: undefined,
        cursorId: undefined,
      })
    );
  });

  it('should handle loading states correctly', async () => {
    const { result } = renderHook(() => useInfiniteVersionHistory(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should handle error states correctly', async () => {
    const mockError = new Error('API Error');
    (versionHistoryService.getVersionHistory as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useInfiniteVersionHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(logError).toHaveBeenCalledWith(
      'Version history query failed',
      expect.objectContaining({
        component: 'useInfiniteVersionHistory',
        error: mockError.message,
      })
    );
  });

  it('should support pagination with fetchNextPage', async () => {
    const mockNextPageResponse = {
      ok: true,
      data: {
        items: [
          {
            ...mockVersionHistoryEntry,
            id: 'test-entry-2',
            version: 2,
          },
        ],
        pagination: {
          limit: 20,
          hasNextPage: false,
          nextCursor: null,
        },
        total: 1,
      },
    };

    // First call returns data with next page
    const firstResponse = {
      ...mockApiResponse,
      data: {
        ...mockVersionHistoryList,
        pagination: {
          ...mockVersionHistoryList.pagination,
          hasNextPage: true,
          nextCursor: {
            cursorCreatedAt: '2024-01-02T00:00:00Z',
            cursorId: 'test-entry-2',
          },
        },
      },
    };

    (versionHistoryService.getVersionHistory as jest.Mock)
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(mockNextPageResponse);

    const { result } = renderHook(() => useInfiniteVersionHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.hasNextPage).toBe(true);
    });

    result.current.fetchNextPage();

    await waitFor(() => {
      expect(result.current.data?.pages).toHaveLength(2);
    });

    expect(versionHistoryService.getVersionHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        cursorCreatedAt: '2024-01-02T00:00:00Z',
        cursorId: 'test-entry-2',
      })
    );
  });

  it('should log analytics on successful fetch', async () => {
    const { result } = renderHook(() => useInfiniteVersionHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(logInfo).toHaveBeenCalledWith(
      'Version history loaded successfully',
      expect.objectContaining({
        component: 'useInfiniteVersionHistory',
        itemCount: 1,
        hasNextPage: false,
        loadTime: expect.any(Number),
      })
    );
  });
});

describe('useVersionHistoryEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionHistoryService.getVersionHistoryEntry as jest.Mock).mockResolvedValue({
      ok: true,
      data: mockVersionHistoryEntry,
    });
    // Query keys are already mocked in jest.mock
  });

  it('should fetch a single version history entry', async () => {
    const { result } = renderHook(() => useVersionHistoryEntry('test-entry-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.getVersionHistoryEntry).toHaveBeenCalledWith('test-entry-1');
    expect(result.current.data).toEqual(mockVersionHistoryEntry);
  });

  it('should handle entry not found', async () => {
    const mockNotFoundError = new Error('Entry not found');
    (versionHistoryService.getVersionHistoryEntry as jest.Mock).mockRejectedValue(
      mockNotFoundError
    );

    const { result } = renderHook(() => useVersionHistoryEntry('non-existent-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockNotFoundError);
  });
});

describe('useProposalVersionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionHistoryService.getProposalVersionHistory as jest.Mock).mockResolvedValue(
      mockApiResponse
    );
    // Query keys are already mocked in jest.mock
  });

  it('should fetch version history for a specific proposal', async () => {
    const { result } = renderHook(() => useProposalVersionHistory('test-proposal-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.getProposalVersionHistory).toHaveBeenCalledWith(
      'test-proposal-1',
      { limit: 20 }
    );
    expect(result.current.data?.pages[0]).toEqual(mockVersionHistoryList);
  });

  it('should support custom parameters', async () => {
    const params = { limit: 50, changeType: 'update' as const };

    const { result } = renderHook(() => useProposalVersionHistory('test-proposal-1', params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.getProposalVersionHistory).toHaveBeenCalledWith(
      'test-proposal-1',
      params
    );
  });
});

describe('useVersionHistoryDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionHistoryService.getVersionHistoryDetail as jest.Mock).mockResolvedValue({
      ok: true,
      data: mockVersionHistoryEntry,
    });
    // Query keys are already mocked in jest.mock
  });

  it('should fetch detailed version history information', async () => {
    const { result } = renderHook(() => useVersionHistoryDetail('test-proposal-1', 1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.getVersionHistoryDetail).toHaveBeenCalledWith(
      'test-proposal-1',
      1
    );
    expect(result.current.data).toEqual(mockVersionHistoryEntry);
  });
});

describe('useVersionHistoryStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionHistoryService.getVersionHistoryStats as jest.Mock).mockResolvedValue({
      ok: true,
      data: {
        totalVersions: 10,
        totalProposals: 5,
        changeTypeBreakdown: { create: 3, update: 5, delete: 2 },
        userActivity: { 'user-1': 4, 'user-2': 6 },
        timeRange: {
          from: new Date('2024-01-01'),
          to: new Date('2024-12-31'),
        },
      },
    });
    // Query keys are already mocked in jest.mock
  });

  it('should fetch version history statistics', async () => {
    const { result } = renderHook(() => useVersionHistoryStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.getVersionHistoryStats).toHaveBeenCalled();
    expect(result.current.data).toBeDefined();
  });
});

describe('useSearchVersionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionHistoryService.searchVersionHistory as jest.Mock).mockResolvedValue(mockApiResponse);
    // Query keys are already mocked in jest.mock
  });

  it('should search version history entries', async () => {
    const { result } = renderHook(() => useSearchVersionHistory('test query'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.searchVersionHistory).toHaveBeenCalledWith('test query', {
      limit: 20,
    });
    expect(result.current.data?.pages[0]).toEqual(mockVersionHistoryList);
  });

  it('should handle empty search query', async () => {
    const { result } = renderHook(() => useSearchVersionHistory(''), {
      wrapper: createWrapper(),
    });

    // Should not make API call for empty query
    expect(versionHistoryService.searchVersionHistory).not.toHaveBeenCalled();
    expect(result.current.isSuccess).toBe(true);
  });
});

describe('useUserVersionHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionHistoryService.getUserVersionHistory as jest.Mock).mockResolvedValue(mockApiResponse);
    // Query keys are already mocked in jest.mock
  });

  it('should fetch version history for a specific user', async () => {
    const { result } = renderHook(() => useUserVersionHistory('user-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.getUserVersionHistory).toHaveBeenCalledWith('user-1', {
      limit: 20,
    });
    expect(result.current.data?.pages[0]).toEqual(mockVersionHistoryList);
  });
});

describe('useVersionHistoryEntries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionHistoryService.getVersionHistoryEntry as jest.Mock).mockResolvedValue({
      ok: true,
      data: mockVersionHistoryEntry,
    });
    // Query keys are already mocked in jest.mock
  });

  it('should fetch multiple version history entries', async () => {
    const entryIds = ['entry-1', 'entry-2', 'entry-3'];

    const { result } = renderHook(() => useVersionHistoryEntries(entryIds), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.every(query => query.isSuccess)).toBe(true);
    });

    expect(result.current).toHaveLength(3);
    expect(versionHistoryService.getVersionHistoryEntry).toHaveBeenCalledTimes(3);
  });
});

describe('useDeleteVersionHistoryBulk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (versionHistoryService.bulkDeleteVersionHistory as jest.Mock).mockResolvedValue({
      ok: true,
      data: { processed: 3, successful: 3, failed: 0 },
    });
  });

  it('should delete multiple version history entries', async () => {
    const { result } = renderHook(() => useDeleteVersionHistoryBulk(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(['entry-1', 'entry-2', 'entry-3']);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryService.bulkDeleteVersionHistory).toHaveBeenCalledWith([
      'entry-1',
      'entry-2',
      'entry-3',
    ]);
    expect(result.current.data).toEqual({ processed: 3, successful: 3, failed: 0 });
  });

  it('should handle mutation errors', async () => {
    const mockError = new Error('Delete failed');
    (versionHistoryService.bulkDeleteVersionHistory as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useDeleteVersionHistoryBulk(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(['entry-1']);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(logError).toHaveBeenCalledWith(
      'Bulk version history deletion failed',
      expect.objectContaining({
        component: 'useDeleteVersionHistoryBulk',
        error: mockError.message,
      })
    );
  });
});

describe('Query Key Integration', () => {
  it('should use correct query keys for caching', async () => {
    const { result } = renderHook(() => useInfiniteVersionHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(versionHistoryKeys.list).toHaveBeenCalledWith({ limit: 20 });
  });

  it('should generate different keys for different parameters', () => {
    const key1 = versionHistoryKeys.list({ limit: 20 });
    const key2 = versionHistoryKeys.list({ limit: 50, proposalId: 'test-proposal-1' });

    expect(key1).not.toEqual(key2);
  });
});

describe('Analytics Integration', () => {
  it('should track successful data fetches', async () => {
    const { result } = renderHook(() => useInfiniteVersionHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(logInfo).toHaveBeenCalledWith(
      'Version history loaded successfully',
      expect.objectContaining({
        component: 'useInfiniteVersionHistory',
        userStory: 'US-5.1',
        hypothesis: 'H8',
      })
    );
  });

  it('should track fetch errors', async () => {
    const mockError = new Error('Network error');
    (versionHistoryService.getVersionHistory as jest.Mock).mockRejectedValue(mockError);

    const { result } = renderHook(() => useInfiniteVersionHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(logError).toHaveBeenCalledWith(
      'Version history query failed',
      expect.objectContaining({
        component: 'useInfiniteVersionHistory',
        error: mockError.message,
      })
    );
  });
});

describe('Cache Behavior', () => {
  it('should cache query results', async () => {
    const wrapper = createWrapper();
    const { rerender } = renderHook(() => useInfiniteVersionHistory(), { wrapper });

    await waitFor(() => {
      expect(versionHistoryService.getVersionHistory).toHaveBeenCalledTimes(1);
    });

    // Rerender should use cached data
    rerender();

    // Should not make another API call
    expect(versionHistoryService.getVersionHistory).toHaveBeenCalledTimes(1);
  });

  it('should invalidate cache on mutations', async () => {
    const wrapper = createWrapper();
    const { result: queryResult } = renderHook(() => useInfiniteVersionHistory(), { wrapper });
    const { result: mutationResult } = renderHook(() => useDeleteVersionHistoryBulk(), { wrapper });

    await waitFor(() => {
      expect(queryResult.current.isSuccess).toBe(true);
    });

    // Perform mutation
    mutationResult.current.mutate(['entry-1']);

    await waitFor(() => {
      expect(mutationResult.current.isSuccess).toBe(true);
    });

    // Query should be invalidated and refetch
    expect(versionHistoryService.getVersionHistory).toHaveBeenCalledTimes(2);
  });
});
