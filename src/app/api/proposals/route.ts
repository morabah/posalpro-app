/**
 * PosalPro MVP2 - Proposals API Routes (Service Layer Architecture)
 * Following CORE_REQUIREMENTS.md service layer patterns
 * Component Traceability: US-3.1, US-3.2, H4
 *
 * ✅ SERVICE LAYER COMPLIANCE: Removed direct Prisma calls from routes
 * ✅ BUSINESS LOGIC SEPARATION: Complex logic moved to proposalService
 * ✅ CURSOR PAGINATION: Uses service layer cursor-based pagination
 * ✅ NORMALIZED TRANSFORMATIONS: Centralized in service layer
 * ✅ CACHING ABSTRACTION: Cache logic belongs in service layer
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { createRoute } from '@/lib/api/route';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { getCache, setCache } from '@/lib/redis';
import { proposalService } from '@/lib/services/proposalService';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { assertIdempotent } from '@/server/api/idempotency';

// Import consolidated schemas from feature folder
import {
  ProposalCreateSchema,
  ProposalListSchema,
  ProposalQuerySchema,
  ProposalSchema,
} from '@/features/proposals';

// Redis cache configuration for proposals
const PROPOSALS_CACHE_PREFIX = 'proposals';
const PROPOSALS_CACHE_TTL = 180; // 3 minutes

// GET /api/proposals - Retrieve proposals with filtering and cursor pagination
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'manager', 'viewer', 'System Administrator', 'Administrator'],
    query: ProposalQuerySchema,
  },
  async ({ query, user, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'ProposalAPI', operation: 'GET' });
    const start = performance.now();

    logDebug('API: Fetching proposals with cursor pagination', {
      component: 'ProposalAPI',
      operation: 'GET /api/proposals',
      query,
      userId: user.id,
      requestId,
    });

    try {
      // Create cache key based on query parameters (excluding cursor for pagination)
      const cacheKeyParams = {
        search: query!.search,
        status: query!.status,
        priority: query!.priority,
        customerId: query!.customerId,
        assignedTo: query!.assignedTo,
        dueBefore: query!.dueBefore,
        dueAfter: query!.dueAfter,
        openOnly: query!.openOnly,
        sortBy: query!.sortBy,
        sortOrder: query!.sortOrder,
        limit: query!.limit,
      };
      const cacheKey = `${PROPOSALS_CACHE_PREFIX}:${JSON.stringify(cacheKeyParams)}`;

      // Check Redis cache first (only for non-cursor requests)
      if (!query!.cursor) {
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
          logInfo('API: Proposals served from cache', {
            component: 'ProposalAPI',
            operation: 'CACHE_HIT',
            userId: user.id,
            requestId,
          });
          return errorHandler.createSuccessResponse(cachedData);
        }
      }

      // Convert query to service filters following CORE_REQUIREMENTS.md patterns
      const filters = {
        search: query!.search,
        status: query!.status ? [query!.status as any] : undefined,
        priority: query!.priority ? [query!.priority as any] : undefined, // Type mismatch between route and service priority values
        customerId: query!.customerId,
        assignedTo: query!.assignedTo,
        dueBefore: query!.dueBefore ? new Date(query!.dueBefore) : undefined,
        dueAfter: query!.dueAfter ? new Date(query!.dueAfter) : undefined,
        openOnly: query!.openOnly,
        sortBy: query!.sortBy,
        sortOrder: query!.sortOrder,
        limit: query!.limit,
        cursor: query!.cursor || undefined, // Convert null to undefined
      };

      // Delegate to service layer (business logic and transformations belong here)
      const result = await withAsyncErrorHandler(
        () => proposalService.listProposalsCursor(filters),
        'GET proposals failed',
        { component: 'ProposalAPI', operation: 'GET' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Proposals fetched successfully', {
        component: 'ProposalAPI',
        operation: 'GET /api/proposals',
        count: result.items.length,
        hasNextPage: !!result.nextCursor,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Validate response against schema
      const validatedResponse = ProposalListSchema.parse({
        items: result.items,
        nextCursor: result.nextCursor,
      });

      // Cache the response for future requests (only for non-cursor requests)
      if (!query!.cursor) {
        await setCache(cacheKey, validatedResponse, PROPOSALS_CACHE_TTL);
      }

      return errorHandler.createSuccessResponse(validatedResponse);
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error fetching proposals', {
        component: 'ProposalAPI',
        operation: 'GET /api/proposals',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Fetch failed');
    }
  }
);

// POST /api/proposals - Create a new proposal
export const POST = createRoute(
  {
    roles: ['admin', 'sales', 'manager', 'System Administrator', 'Administrator'],
    body: ProposalCreateSchema,
  },
  async ({ body, user, req, requestId }) => {
    const errorHandler = getErrorHandler({ component: 'ProposalAPI', operation: 'POST' });
    const start = performance.now();

    logDebug('API: Creating new proposal', {
      component: 'ProposalAPI',
      operation: 'POST /api/proposals',
      data: body,
      userId: user.id,
      requestId,
    });

    try {
      // Add idempotency protection to prevent duplicate proposal creation
      await assertIdempotent(req, '/api/proposals', {
        userId: user.id, // Scope to specific user to prevent key conflicts
        ttlMs: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Prepare data for service layer (route handles input validation only)
      const createData = {
        ...body!.basicInfo,
        createdBy: user.id, // Required by CreateProposalData interface
        priority: body!.basicInfo.priority as any, // Cast priority to match service expectations
        dueDate: body!.basicInfo.dueDate ? new Date(body!.basicInfo.dueDate) : undefined, // Convert string to Date
        projectType: body!.basicInfo.projectType,
        teamData: body!.teamData,
        contentData: body!.contentData,
        productData: body!.productData,
        sectionData: body!.sectionData,
        planType: body!.planType,
        wizardVersion: 'modern',
      };

      // Delegate to service layer (business logic belongs here)
      const createdProposal = await withAsyncErrorHandler(
        () => proposalService.createProposalWithAssignmentsAndProducts(createData, user.id),
        'POST proposal failed',
        { component: 'ProposalAPI', operation: 'POST' }
      );

      const loadTime = performance.now() - start;

      logInfo('API: Proposal created successfully', {
        component: 'ProposalAPI',
        operation: 'POST /api/proposals',
        proposalId: createdProposal.id,
        proposalTitle: createdProposal.title,
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      // Validate response against schema
      const validatedResponse = ProposalSchema.parse(createdProposal);

      const res = errorHandler.createSuccessResponse(validatedResponse, undefined, 201);
      res.headers.set('Location', `/api/proposals/${createdProposal.id}`);
      return res;
    } catch (error) {
      const loadTime = performance.now() - start;

      logError('API: Error creating proposal', {
        component: 'ProposalAPI',
        operation: 'POST /api/proposals',
        error: error instanceof Error ? error.message : 'Unknown error',
        loadTime: Math.round(loadTime),
        userId: user.id,
        requestId,
      });

      return errorHandler.createErrorResponse(error, 'Create failed');
    }
  }
);
