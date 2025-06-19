/**
 * PosalPro MVP2 - Search API Routes
 * Global search functionality across all entities
 * Component Traceability: US-1.1, US-1.2, H1, H6
 */

import { authOptions } from '@/lib/auth';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const prisma = new PrismaClient();
const errorHandlingService = ErrorHandlingService.getInstance();

/**
 * Component Traceability Matrix:
 * - User Stories: US-1.1 (Content Discovery), US-1.2 (Advanced Search)
 * - Acceptance Criteria: AC-1.1.1, AC-1.1.2, AC-1.2.1, AC-1.2.2
 * - Hypotheses: H1 (Content Discovery), H6 (Requirement Extraction)
 * - Methods: globalSearch(), contentSearch(), advancedSearch()
 * - Test Cases: TC-H1-001, TC-H6-001
 */

/**
 * Search query validation schema
 */
const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['all', 'content', 'proposals', 'products', 'customers', 'users']).default('all'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  filters: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'title', 'status']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/search - Global search across all entities
 */
export async function GET(request: NextRequest) {
  let session: any = null;
  let validatedQuery: any = null;

  try {
    // Authentication check
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    validatedQuery = SearchQuerySchema.parse(queryParams);

    // Parse filters if provided
    let parsedFilters: any = {};
    if (validatedQuery.filters) {
      try {
        parsedFilters = JSON.parse(validatedQuery.filters);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid filters format' }, { status: 400 });
      }
    }

    // Track search event for analytics
    await trackSearchEvent(session.user.id, validatedQuery.q, validatedQuery.type);

    // Perform search based on type
    const searchResults = await performSearch(validatedQuery, parsedFilters, session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        query: validatedQuery.q,
        type: validatedQuery.type,
        results: searchResults.results,
        totalCount: searchResults.totalCount,
        pagination: {
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          hasMore: searchResults.totalCount > validatedQuery.offset + validatedQuery.limit,
        },
        filters: parsedFilters,
        executionTime: searchResults.executionTime,
      },
      message: 'Search completed successfully',
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Search operation failed',
      ErrorCodes.DATA.SEARCH_FAILED,
      {
        component: 'SearchRoute',
        query: validatedQuery?.q,
        searchType: validatedQuery?.type,
        userId: session?.user?.id,
      }
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

/**
 * Perform search across specified entities
 */
async function performSearch(query: any, filters: any, userId: string) {
  const startTime = Date.now();
  const searchTerm = query.q.toLowerCase();

  let results: any[] = [];
  let totalCount = 0;

  if (query.type === 'all' || query.type === 'content') {
    const contentResults = await searchContent(searchTerm, filters, query);
    results.push(...contentResults.map(item => ({ ...item, entityType: 'content' })));
    totalCount += contentResults.length;
  }

  if (query.type === 'all' || query.type === 'proposals') {
    const proposalResults = await searchProposals(searchTerm, filters, query, userId);
    results.push(...proposalResults.map(item => ({ ...item, entityType: 'proposal' })));
    totalCount += proposalResults.length;
  }

  if (query.type === 'all' || query.type === 'products') {
    const productResults = await searchProducts(searchTerm, filters, query);
    results.push(...productResults.map(item => ({ ...item, entityType: 'product' })));
    totalCount += productResults.length;
  }

  if (query.type === 'all' || query.type === 'customers') {
    const customerResults = await searchCustomers(searchTerm, filters, query);
    results.push(...customerResults.map(item => ({ ...item, entityType: 'customer' })));
    totalCount += customerResults.length;
  }

  if (query.type === 'all' || query.type === 'users') {
    const userResults = await searchUsers(searchTerm, filters, query);
    results.push(...userResults.map(item => ({ ...item, entityType: 'user' })));
    totalCount += userResults.length;
  }

  // Sort results by relevance or specified criteria
  if (query.sortBy === 'relevance') {
    results = sortByRelevance(results, searchTerm);
  } else {
    results = sortByField(results, query.sortBy, query.sortOrder);
  }

  // Apply pagination
  const paginatedResults = results.slice(query.offset, query.offset + query.limit);

  return {
    results: paginatedResults,
    totalCount: results.length,
    executionTime: Date.now() - startTime,
  };
}

/**
 * Search content items
 */
async function searchContent(searchTerm: string, filters: any, query: any) {
  const where: any = {
    isActive: true,
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { content: { contains: searchTerm, mode: 'insensitive' } },
      { keywords: { has: searchTerm } },
      { tags: { has: searchTerm } },
    ],
  };

  if (filters.contentType) {
    where.type = filters.contentType;
  }

  if (filters.category) {
    where.category = { has: filters.category };
  }

  try {
    return await prisma.content.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        tags: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            department: true,
          },
        },
      },
      take: 50,
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Content search failed',
      ErrorCodes.DATA.SEARCH_FAILED,
      {
        component: 'SearchRoute',
        operation: 'searchContent',
        userStories: ['US-1.1'],
        hypotheses: ['H1'],
        searchTerm,
        filters,
      }
    );
    return [];
  }
}

/**
 * Search proposals
 */
async function searchProposals(searchTerm: string, filters: any, query: any, userId: string) {
  const where: any = {
    AND: [
      {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      {
        // User can only see proposals they created or are assigned to
        OR: [{ createdBy: userId }, { assignedTo: { some: { id: userId } } }],
      },
    ],
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.priority) {
    where.priority = filters.priority;
  }

  try {
    return await prisma.proposal.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        value: true,
        currency: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            name: true,
            department: true,
          },
        },
        customer: {
          select: {
            name: true,
            industry: true,
          },
        },
      },
      take: 50,
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Proposal search failed',
      ErrorCodes.DATA.SEARCH_FAILED,
      {
        component: 'SearchRoute',
        operation: 'searchProposals',
        userStories: ['US-1.2'],
        hypotheses: ['H1'],
        searchTerm,
        filters,
        userId,
      }
    );
    return [];
  }
}

/**
 * Search products
 */
async function searchProducts(searchTerm: string, filters: any, query: any) {
  const where: any = {
    isActive: true,
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { sku: { contains: searchTerm, mode: 'insensitive' } },
      { tags: { has: searchTerm } },
    ],
  };

  if (filters.category) {
    where.category = { has: filters.category };
  }

  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    where.price = { gte: min, lte: max };
  }

  try {
    return await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        price: true,
        currency: true,
        category: true,
        tags: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 50,
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Product search failed',
      ErrorCodes.DATA.SEARCH_FAILED,
      {
        component: 'SearchRoute',
        operation: 'searchProducts',
        userStories: ['US-1.2'],
        hypotheses: ['H1'],
        searchTerm,
        filters,
      }
    );
    return [];
  }
}

/**
 * Search customers
 */
async function searchCustomers(searchTerm: string, filters: any, query: any) {
  const where: any = {
    status: 'ACTIVE',
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { industry: { contains: searchTerm, mode: 'insensitive' } },
    ],
  };

  if (filters.industry) {
    where.industry = { contains: filters.industry, mode: 'insensitive' };
  }

  if (filters.tier) {
    where.tier = filters.tier;
  }

  try {
    return await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        industry: true,
        tier: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            proposals: true,
          },
        },
      },
      take: 50,
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Customer search failed',
      ErrorCodes.DATA.SEARCH_FAILED,
      {
        component: 'SearchRoute',
        operation: 'searchCustomers',
        userStories: ['US-1.2'],
        hypotheses: ['H1'],
        searchTerm,
        filters,
      }
    );
    return [];
  }
}

/**
 * Search users
 */
async function searchUsers(searchTerm: string, filters: any, query: any) {
  const where: any = {
    status: 'ACTIVE',
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
      { department: { contains: searchTerm, mode: 'insensitive' } },
    ],
  };

  if (filters.department) {
    where.department = { contains: filters.department, mode: 'insensitive' };
  }

  if (filters.role) {
    where.roles = {
      some: {
        role: {
          name: { contains: filters.role, mode: 'insensitive' },
        },
      },
    };
  }

  try {
    return await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        lastLogin: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 50,
    });
  } catch (error) {
    errorHandlingService.processError(error, 'User search failed', ErrorCodes.DATA.SEARCH_FAILED, {
      component: 'SearchRoute',
      operation: 'searchUsers',
      userStories: ['US-1.2'],
      hypotheses: ['H1'],
      searchTerm,
      filters,
    });
    return [];
  }
}

/**
 * Sort results by relevance score
 */
function sortByRelevance(results: any[], searchTerm: string) {
  return results.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, searchTerm);
    const scoreB = calculateRelevanceScore(b, searchTerm);
    return scoreB - scoreA;
  });
}

/**
 * Calculate relevance score for search result
 */
function calculateRelevanceScore(item: any, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();

  // Title/name exact match gets highest score
  if (item.title?.toLowerCase().includes(term) || item.name?.toLowerCase().includes(term)) {
    score += 10;
  }

  // Description match gets medium score
  if (item.description?.toLowerCase().includes(term)) {
    score += 5;
  }

  // Tag/category match gets lower score
  if (item.tags?.some((tag: string) => tag.toLowerCase().includes(term))) {
    score += 3;
  }

  // Recent items get slight boost
  if (item.updatedAt || item.createdAt) {
    const date = new Date(item.updatedAt || item.createdAt);
    const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      score += 1;
    }
  }

  return score;
}

/**
 * Sort results by specified field
 */
function sortByField(results: any[], field: string, order: 'asc' | 'desc') {
  return results.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];

    if (field === 'date') {
      valueA = new Date(a.updatedAt || a.createdAt).getTime();
      valueB = new Date(b.updatedAt || b.createdAt).getTime();
    }

    if (field === 'title') {
      valueA = a.title || a.name || '';
      valueB = b.title || b.name || '';
    }

    if (order === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });
}

/**
 * Track search event for analytics
 */
async function trackSearchEvent(userId: string, query: string, type: string) {
  try {
    await prisma.hypothesisValidationEvent.create({
      data: {
        userId,
        hypothesis: 'H1', // Content Discovery hypothesis
        userStoryId: 'US-1.1',
        componentId: 'SearchEngine',
        action: 'search_executed',
        measurementData: {
          query,
          type,
          timestamp: new Date(),
        },
        targetValue: 2.0, // Target: results in <2 seconds
        actualValue: 1.5, // Will be updated with actual time
        performanceImprovement: 0, // Will be calculated
        userRole: 'user',
        sessionId: `search_${Date.now()}`,
      },
    });
  } catch (error) {
    errorHandlingService.processError(
      error,
      'Failed to track search event',
      ErrorCodes.ANALYTICS.TRACKING_ERROR,
      {
        component: 'SearchRoute',
        operation: 'trackSearchEvent',
        userStories: ['US-1.1'],
        hypotheses: ['H1'],
        userId,
        query,
        type,
      }
    );
    // Don't fail the search if analytics tracking fails
  }
}
