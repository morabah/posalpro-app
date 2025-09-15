/**
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
 * PosalPro MVP2 - Search Suggestions API Route - Service Layer Architecture
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-1.1, US-1.2, H1
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct suggestion logic from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex suggestions moved to searchService
 * ✅ PERFORMANCE OPTIMIZATION: Cached and limited suggestion queries
 * ✅ ERROR HANDLING: Integrated standardized error handling
 */

import { createRoute } from '@/lib/api/route';
import { logDebug, logInfo, logError } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { searchService } from '@/lib/services/searchService';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Component Traceability Matrix:
 * - User Stories: US-1.1 (Content Discovery), US-1.2 (Advanced Search)
 * - Acceptance Criteria: AC-1.1.3, AC-1.2.3
 * - Hypotheses: H1 (Content Discovery)
 * - Methods: getSearchSuggestions(), getAutoComplete()
 * - Test Cases: TC-H1-002
 */

/**
 * Suggestions query validation schema
 */
const SuggestionsQuerySchema = z.object({
  q: z.string().min(1, 'Query is required'),
  type: z.enum(['all', 'content', 'proposals', 'products', 'customers', 'users']).default('all'),
  limit: z.coerce.number().min(1).max(20).default(10),
});

/**
 * GET /api/search/suggestions - Get search suggestions
 */
export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    query: SuggestionsQuerySchema,
    permissions: ['feature.search.suggestions'],
  },
  async ({ query, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'SearchSuggestionsAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Getting search suggestions', {
      component: 'SearchSuggestionsAPI',
      operation: 'GET /api/search/suggestions',
      query,
      userId: user.id,
      requestId,
    });

    try {
      const validatedQuery = query as z.infer<typeof SuggestionsQuerySchema>;

      // Delegate to service layer (business logic belongs here)
      const result = await withAsyncErrorHandler(
        () => searchService.getSearchSuggestions(
          validatedQuery.q,
          validatedQuery.type,
          validatedQuery.limit
        ),
        'GET search suggestions failed',
        { component: 'SearchSuggestionsAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Search suggestions retrieved successfully', {
        component: 'SearchSuggestionsAPI',
        operation: 'GET /api/search/suggestions',
        query: validatedQuery.q,
        type: validatedQuery.type,
        limit: validatedQuery.limit,
        suggestionsCount: result.suggestions.length,
        entitiesCount: result.entities.length,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Format suggestions for frontend consumption
      const formattedSuggestions = result.suggestions.map((suggestion, index) => ({
        text: suggestion,
        type: 'suggestion',
        score: result.entities[index]?.score || 0,
        entityType: result.entities[index]?.entityType || 'unknown',
        entityId: result.entities[index]?.id || null,
      }));

      return NextResponse.json({
        ok: true,
        data: {
          suggestions: formattedSuggestions,
          meta: {
            query: validatedQuery.q,
            type: validatedQuery.type,
            limit: validatedQuery.limit,
            responseTimeMs: Math.round(loadTime),
          },
        },
        message: 'Search suggestions retrieved successfully',
      });
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error getting search suggestions', {
        component: 'SearchSuggestionsAPI',
        operation: 'GET /api/search/suggestions',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Failed to get suggestions');
    }
  }
);
