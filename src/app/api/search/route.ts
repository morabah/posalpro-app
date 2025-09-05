/**
 * PosalPro MVP2 - Global Search API Route
 * Unified search across content, proposals, products, customers, and users
 * Component Traceability: US-1.1, US-1.2, US-1.3
 */

import {
  SearchQuerySchema,
  sortByField,
  sortByRelevance,
  type PaginationInfo,
  type SearchFilters,
  type SearchQuery,
  type SearchResponse,
  type SearchResult,
} from '@/features/search';
import { authOptions } from '@/lib/auth';
import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
;
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
// import prisma from '@/lib/db/prisma'; // Replaced with dynamic imports
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError, logInfo } from '@/lib/logger';
import { decidePaginationStrategy } from '@/lib/utils/selectiveHydration';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Session types (keeping these local as they're NextAuth specific)
interface SessionUser {
  id: string;
  email?: string;
  name?: string;
  roles?: string[];
}

interface AuthenticatedSession {
  user: SessionUser;
  expires: string;
}

/**
 * Global search endpoint with enhanced filtering and cursor pagination
 */
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  let session: AuthenticatedSession | null = null;
  let validatedQuery: SearchQuery | null = null;

  try {
    // RBAC guard - general authenticated search
    await validateApiPermission(request, { resource: 'search', action: 'read' });
    // Authentication check
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const parsedQuery = SearchQuerySchema.parse(queryParams);
    validatedQuery = parsedQuery as SearchQuery;

    // Determine pagination strategy
    const { useCursorPagination, reason } = decidePaginationStrategy({
      cursor: validatedQuery.cursor,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
      fields: validatedQuery.fields ? validatedQuery.fields.join(',') : undefined,
      page: validatedQuery.page,
    });

    // Parse filters if provided
    let parsedFilters: SearchFilters = {};
    if (validatedQuery.filters) {
      try {
        parsedFilters = JSON.parse(validatedQuery.filters);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid filters format' }, { status: 400 });
      }
    }

    // Track search event for analytics
    await logInfo('Search request initiated', {
      searchTerm: validatedQuery.q,
      searchType: validatedQuery.type,
      userId: session.user.id,
      userEmail: session?.user?.email,
      userRoles: session?.user?.roles,
      timestamp: new Date().toISOString(),
    });

    // Perform enhanced search with cursor pagination
    const searchResults = await performEnhancedSearch(
      validatedQuery,
      parsedFilters,
      session.user.id,
      useCursorPagination
    );

    let pagination: PaginationInfo;

    if (useCursorPagination) {
      pagination = {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: searchResults.totalCount,
        totalPages: Math.ceil(searchResults.totalCount / validatedQuery.limit),
        hasMore: searchResults.hasNextPage,
        nextPage: searchResults.hasNextPage ? validatedQuery.page + 1 : null,
        prevPage: validatedQuery.page > 1 ? validatedQuery.page - 1 : null,
        nextCursor: searchResults.nextCursor,
      };
    } else {
      const totalPages = Math.ceil(searchResults.totalCount / validatedQuery.limit);
      pagination = {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: searchResults.totalCount,
        totalPages,
        hasMore: validatedQuery.page < totalPages,
        nextPage: validatedQuery.page < totalPages ? validatedQuery.page + 1 : null,
        prevPage: validatedQuery.page > 1 ? validatedQuery.page - 1 : null,
      };
    }

    const response: SearchResponse = {
      results: searchResults.results,
      pagination,
      facets: searchResults.facets || {
        types: [],
        statuses: [],
        dateRanges: [],
      },
      searchTerm: validatedQuery.q,
      totalTime: searchResults.executionTime,
      suggestions: searchResults.suggestions || [],
      meta: {
        paginationType: useCursorPagination ? 'cursor' : 'offset',
        paginationReason: reason,
        totalCount: searchResults.totalCount,
        executionTime: searchResults.executionTime,
      },
    };

    await logInfo('Search request success', {
      searchTerm: validatedQuery.q,
      totalCount: response.meta.totalCount,
      executionTime: response.meta.executionTime,
    });
    return NextResponse.json(response);
  } catch (error) {
    await logError('Search request failed', error as unknown, {
      searchTerm: validatedQuery?.q,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRoles: session?.user?.roles,
      timestamp: new Date().toISOString(),
    });

    // Use proper error handling
    const errorHandlingService = ErrorHandlingService.getInstance();
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

    return NextResponse.json({ error: 'Search operation failed' }, { status: 500 });
  }
}

/**
 * Perform enhanced search across multiple entity types
 */
async function performEnhancedSearch(
  query: SearchQuery,
  filters: SearchFilters,
  userId: string,
  useCursorPagination: boolean
) {
  const executionStartTime = performance.now();
  const searchTerm = query.q.toLowerCase();

  let results: SearchResult[] = [];
  let totalCount = 0;

  // Search across entities based on type
  if (query.type === 'all' || query.type === 'content') {
    const contentResults = await searchContent(searchTerm, filters, query);
    results.push(
      ...contentResults.map((item: any) => ({
        ...item,
        entityType: 'content',
        metadata: item.metadata || null,
        tags: item.tags || null,
      }))
    );
    totalCount += contentResults.length;
  }

  if (query.type === 'all' || query.type === 'proposals') {
    const proposalResults = await searchProposals(searchTerm, filters, query, userId);
    results.push(
      ...proposalResults.map((item: any) => ({
        ...item,
        entityType: 'proposal',
        metadata: item.metadata || null,
        tags: item.tags || null,
      }))
    );
    totalCount += proposalResults.length;
  }

  if (query.type === 'all' || query.type === 'products') {
    const productResults = await searchProducts(searchTerm, filters, query);
    results.push(
      ...productResults.map((item: any) => ({
        ...item,
        entityType: 'product',
        metadata: item.metadata || null,
        tags: item.tags || null,
      }))
    );
    totalCount += productResults.length;
  }

  if (query.type === 'all' || query.type === 'customers') {
    const customerResults = await searchCustomers(searchTerm, filters, query);
    results.push(
      ...customerResults.map((item: any) => ({
        ...item,
        entityType: 'customer',
        metadata: item.metadata || null,
        tags: item.tags || null,
      }))
    );
    totalCount += customerResults.length;
  }

  if (query.type === 'all' || query.type === 'users') {
    const userResults = await searchUsers(searchTerm, filters, query);
    results.push(
      ...userResults.map((item: any) => ({
        ...item,
        entityType: 'user',
        metadata: item.metadata || null,
        tags: item.tags || null,
      }))
    );
    totalCount += userResults.length;
  }

  // Sort results
  if (query.sortBy === 'relevance') {
    results = sortByRelevance(results, searchTerm);
  } else {
    results = sortByField(results, query.sortBy, query.sortOrder);
  }

  // Handle pagination
  let paginatedResults: SearchResult[];
  let hasNextPage = false;
  let nextCursor: string | null = null;

  if (useCursorPagination && query.cursor) {
    const cursorIndex = results.findIndex(item => item.id === query.cursor);
    const startIndex = cursorIndex + 1;
    paginatedResults = results.slice(startIndex, startIndex + query.limit);
    hasNextPage = startIndex + query.limit < results.length;
    nextCursor = hasNextPage ? paginatedResults[paginatedResults.length - 1]?.id || null : null;
  } else {
    const startIndex = (query.page - 1) * query.limit;
    paginatedResults = results.slice(startIndex, startIndex + query.limit);
    hasNextPage = startIndex + query.limit < results.length;
    nextCursor = hasNextPage ? paginatedResults[paginatedResults.length - 1]?.id || null : null;
  }

  const executionTime = performance.now() - executionStartTime;

  return {
    results: paginatedResults,
    totalCount,
    hasNextPage,
    nextCursor,
    executionTime,
    facets: {
      types: [],
      statuses: [],
      dateRanges: [],
    },
    suggestions: [],
  };
}

/**
 * Search content items
 */
async function searchContent(searchTerm: string, filters: SearchFilters, query: SearchQuery) {
  interface ContentWhereClause {
    isActive: boolean;
    OR?: Array<{
      title?: { contains: string; mode: 'insensitive' };
      description?: { contains: string; mode: 'insensitive' };
      tags?: { has: string };
    }>;
    type?: string;
    createdAt?: {
      gte?: Date;
      lte?: Date;
    };
    [key: string]: unknown;
  }

  const where: ContentWhereClause = {
    isActive: true,
    OR: [
      { title: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { tags: { has: searchTerm } },
    ],
  };

  if (filters.contentType) {
    where.type = filters.contentType;
  }

  if (filters.dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
  }

  if (filters.dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
  }

  return await prisma.content.findMany({
    where: where as any, // Prisma where clause compatibility
    include: {
      creator: {
        select: { name: true, department: true },
      },
    },
    take: query.limit,
  });
}

/**
 * Search proposals
 */
async function searchProposals(
  searchTerm: string,
  filters: SearchFilters,
  query: SearchQuery,
  userId: string
) {
  interface ProposalWhereClause {
    AND: Array<{
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
      createdBy?: string;
      status?: string;
      priority?: string;
      customerId?: string;
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
      [key: string]: unknown;
    }>;
  }

  const where: ProposalWhereClause = {
    AND: [
      {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      { createdBy: userId }, // Security: user can only search their proposals
    ],
  };

  if (filters.status) {
    where.AND.push({ status: filters.status });
  }

  if (filters.priority) {
    where.AND.push({ priority: filters.priority });
  }

  if (filters.customerId) {
    where.AND.push({ customerId: filters.customerId });
  }

  if (filters.dateFrom || filters.dateTo) {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (filters.dateFrom) dateFilter.gte = new Date(filters.dateFrom);
    if (filters.dateTo) dateFilter.lte = new Date(filters.dateTo);
    where.AND.push({ createdAt: dateFilter });
  }

  return await prisma.proposal.findMany({
    where: where as any, // Prisma where clause compatibility
    include: {
      customer: {
        select: { name: true, industry: true },
      },
      creator: {
        select: { name: true, department: true },
      },
    },
    take: query.limit,
  });
}

/**
 * Search products
 */
async function searchProducts(searchTerm: string, filters: SearchFilters, query: SearchQuery) {
  interface ProductWhereClause {
    isActive: boolean;
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      description?: { contains: string; mode: 'insensitive' };
      sku?: { contains: string; mode: 'insensitive' };
      tags?: { has: string };
    }>;
    price?: {
      gte?: number;
      lte?: number;
    };
    [key: string]: unknown;
  }

  const where: ProductWhereClause = {
    isActive: true,
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { sku: { contains: searchTerm, mode: 'insensitive' } },
      { tags: { has: searchTerm } },
    ],
  };

  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    where.price = { gte: min, lte: max };
  }

  return await prisma.product.findMany({
    where: where as any, // Prisma where clause compatibility
    take: query.limit,
  });
}

/**
 * Search customers
 */
async function searchCustomers(searchTerm: string, filters: SearchFilters, query: SearchQuery) {
  interface CustomerWhereClause {
    status: string;
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      email?: { contains: string; mode: 'insensitive' };
    }>;
    industry?: { contains: string; mode: 'insensitive' };
    tier?: string;
    [key: string]: unknown;
  }

  const where: CustomerWhereClause = {
    status: 'ACTIVE',
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ],
  };

  if (filters.industry) {
    where.industry = { contains: filters.industry, mode: 'insensitive' };
  }

  if (filters.tier) {
    where.tier = filters.tier;
  }

  return await prisma.customer.findMany({
    where: where as any, // Prisma where clause compatibility
    include: {
      _count: {
        select: { proposals: true },
      },
    },
    take: query.limit,
  });
}

/**
 * Search users
 */
async function searchUsers(searchTerm: string, filters: SearchFilters, query: SearchQuery) {
  interface UserWhereClause {
    status: string;
    OR?: Array<{
      name?: { contains: string; mode: 'insensitive' };
      email?: { contains: string; mode: 'insensitive' };
    }>;
    department?: { contains: string; mode: 'insensitive' };
    roles?: {
      some: {
        role: {
          name: { contains: string; mode: 'insensitive' };
        };
      };
    };
    [key: string]: unknown;
  }

  const where: UserWhereClause = {
    status: 'ACTIVE',
    OR: [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
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

  return await prisma.user.findMany({
    where: where as any, // Prisma where clause compatibility
    include: {
      roles: {
        include: {
          role: {
            select: { name: true },
          },
        },
      },
    },
    take: query.limit,
  });
}
