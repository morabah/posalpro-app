/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Global Search API Route - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-1.1, US-1.2, US-1.3
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct search logic from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex search moved to searchService
 * ✅ CURSOR PAGINATION: Uses service layer cursor-based pagination
 * ✅ UNIFIED SEARCH: Centralized search across all entities
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { SearchQuerySchema, type PaginationInfo, type SearchQuery } from '@/features/search';
import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { SearchFilters, searchService } from '@/lib/services/searchService';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/search - Unified search across all entities with cursor pagination
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    query: SearchQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'SearchAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Performing unified search', {
      component: 'SearchAPI',
      operation: 'GET /api/search',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // Parse filters if provided
      let parsedFilters: SearchFilters = {};
      if (query!.filters) {
        try {
          const rawFilters = JSON.parse(query!.filters);
          // Convert single values to arrays for filters that expect arrays
          parsedFilters = {
            ...rawFilters,
            status: rawFilters.status
              ? Array.isArray(rawFilters.status)
                ? rawFilters.status
                : [rawFilters.status as string]
              : undefined,
            tags: rawFilters.tags
              ? Array.isArray(rawFilters.tags)
                ? rawFilters.tags
                : [rawFilters.tags]
              : undefined,
            category: rawFilters.category
              ? Array.isArray(rawFilters.category)
                ? rawFilters.category
                : [rawFilters.category]
              : undefined,
            department: rawFilters.department
              ? Array.isArray(rawFilters.department)
                ? rawFilters.department
                : [rawFilters.department]
              : undefined,
          };
        } catch (error) {
          logError('API: Invalid search filters format', {
            component: 'SearchAPI',
            operation: 'GET /api/search',
            filters: query!.filters,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          return errorHandler.createErrorResponse(error, 'Invalid filters format');
        }
      }

      // Determine pagination strategy (default to cursor for search)
      const useCursorPagination = !query!.page || !!query!.cursor;

      // Construct proper SearchQuery object for service layer
      const searchQuery: SearchQuery = {
        q: query!.q,
        type: (query!.type || 'all') as SearchQuery['type'],
        limit: query!.limit || 20,
        cursor: query!.cursor || undefined,
        page: query!.page || 1,
        sortBy: query!.sortBy || 'relevance',
        sortOrder: (query!.sortOrder || 'desc') as SearchQuery['sortOrder'],
        filters: query!.filters || undefined,
      };

      // Delegate to service layer (business logic belongs here)
      const searchResults = await withAsyncErrorHandler(
        () =>
          searchService.performEnhancedSearch(
            searchQuery as SearchQuery,
            parsedFilters,
            user.id,
            useCursorPagination
          ),
        'GET search failed',
        { component: 'SearchAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Search completed successfully', {
        component: 'SearchAPI',
        operation: 'GET /api/search',
        resultCount: searchResults.items.length,
        totalCount: searchResults.totalCount,
        hasMore: searchResults.hasNextPage,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Build pagination info
      let pagination: PaginationInfo;

      if (useCursorPagination) {
        pagination = {
          page: query!.page || 1,
          limit: query!.limit,
          total: searchResults.totalCount,
          totalPages: Math.ceil(searchResults.totalCount / query!.limit),
          hasMore: searchResults.hasNextPage,
          nextCursor: searchResults.nextCursor,
          nextPage: null, // Not applicable for cursor pagination
          prevPage: null, // Not applicable for cursor pagination
        };
      } else {
        const totalPages = Math.ceil(searchResults.totalCount / query!.limit);
        pagination = {
          page: query!.page,
          limit: query!.limit,
          total: searchResults.totalCount,
          totalPages,
          hasMore: (query!.page || 1) < totalPages,
          nextPage: (query!.page || 1) < totalPages ? (query!.page || 1) + 1 : null,
          prevPage: (query!.page || 1) > 1 ? (query!.page || 1) - 1 : null,
        };
      }

      // Return response with pagination metadata
      return NextResponse.json({
        ok: true,
        data: {
          results: searchResults.items,
          pagination,
          meta: {
            searchTerm: query!.q,
            searchType: query!.type,
            sortBy: query!.sortBy,
            sortOrder: query!.sortOrder,
            responseTimeMs: Math.round(loadTime),
            paginationType: useCursorPagination ? 'cursor' : 'offset',
          },
        },
        message: 'Search completed successfully',
      });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error performing search', {
        component: 'SearchAPI',
        operation: 'GET /api/search',
        searchTerm: query!.q,
        searchType: query!.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Search failed');
    }
  }
);
