/**
 * PosalPro MVP2 - Search Service
 * Unified search across content, proposals, products, customers, and users
 * Following CORE_REQUIREMENTS.md service layer patterns
 */

import { Prisma } from '@prisma/client';
import { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '../db/database';
import { ErrorCodes, errorHandlingService, StandardError } from '../errors';
import { logDebug, logError, logInfo } from '../logger';
import prisma from '../prisma';
import { getCurrentTenant } from '../tenant';

// Type definitions for search
export interface SearchFilters {
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  status?: string[];
  tags?: string[];
  category?: string[];
  department?: string[];
  industry?: string[];
}

export interface SearchQuery {
  q: string;
  type: 'all' | 'content' | 'proposals' | 'products' | 'customers' | 'users';
  limit: number;
  cursor?: string;
  page?: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  entityType: 'content' | 'proposal' | 'product' | 'customer' | 'user';
  score?: number;
  metadata?: any;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResponse {
  items: SearchResult[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor?: string | null;
}

/**
 * Search Service class with cursor-based pagination
 * Following CORE_REQUIREMENTS.md service layer patterns
 */
export class SearchService {
  /**
   * Perform enhanced search across multiple entities with cursor pagination
   */
  async performEnhancedSearch(
    query: SearchQuery,
    filters: SearchFilters,
    userId: string,
    useCursorPagination: boolean = true
  ): Promise<SearchResponse> {
    try {
      const executionStartTime = performance.now();
      const searchTerm = query.q.toLowerCase();

      logDebug('Search Service: Starting enhanced search', {
        component: 'SearchService',
        operation: 'performEnhancedSearch',
        searchTerm,
        type: query.type,
        userId,
        limit: query.limit,
      });

      let results: SearchResult[] = [];
      let totalCount = 0;

      // Search across entities based on type
      const searchPromises: Promise<SearchResult[]>[] = [];

      if (query.type === 'all' || query.type === 'content') {
        searchPromises.push(this.searchContent(searchTerm, filters, query));
      }

      if (query.type === 'all' || query.type === 'proposals') {
        searchPromises.push(this.searchProposals(searchTerm, filters, query, userId));
      }

      if (query.type === 'all' || query.type === 'products') {
        searchPromises.push(this.searchProducts(searchTerm, filters, query));
      }

      if (query.type === 'all' || query.type === 'customers') {
        searchPromises.push(this.searchCustomers(searchTerm, filters, query));
      }

      if (query.type === 'all' || query.type === 'users') {
        searchPromises.push(this.searchUsers(searchTerm, filters, query));
      }

      // Execute all searches in parallel
      const searchResults = await Promise.all(searchPromises);

      // Flatten results and add entity types
      searchResults.forEach((entityResults, index) => {
        const entityType = ['content', 'proposals', 'products', 'customers', 'users'][index];
        results.push(...entityResults.map(item => ({
          ...item,
          entityType: entityType as any,
        })));
        totalCount += entityResults.length;
      });

      // Sort results
      results = this.sortResults(results, query, searchTerm);

      // Handle pagination
      const paginatedResults = this.paginateResults(results, query, useCursorPagination);

      const executionTime = performance.now() - executionStartTime;

      logInfo('Search Service: Enhanced search completed', {
        component: 'SearchService',
        operation: 'performEnhancedSearch',
        resultCount: paginatedResults.items.length,
        totalCount,
        executionTime: Math.round(executionTime),
        hasNextPage: paginatedResults.hasNextPage,
        userId,
      });

      return {
        items: paginatedResults.items,
        totalCount,
        hasNextPage: paginatedResults.hasNextPage,
        nextCursor: paginatedResults.nextCursor,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to perform enhanced search',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'SearchService',
          operation: 'performEnhancedSearch',
          searchTerm: query.q,
          searchType: query.type,
          userId,
        },
      });
    }
  }

  /**
   * Search content entities
   */
  private async searchContent(
    searchTerm: string,
    filters: SearchFilters,
    query: SearchQuery
  ): Promise<SearchResult[]> {
    try {
      // This would search content entities like RFP documents, templates, etc.
      // For now, return empty array as content search might be implemented differently
      return [];
    } catch (error) {
      logError('Search Service: Error searching content', {
        component: 'SearchService',
        operation: 'searchContent',
        searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Search proposals
   */
  private async searchProposals(
    searchTerm: string,
    filters: SearchFilters,
    query: SearchQuery,
    userId: string
  ): Promise<SearchResult[]> {
    try {
      const tenant = getCurrentTenant();

      const where: Prisma.ProposalWhereInput = {
        tenantId: tenant.tenantId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };

      // Add filters
      if (filters.status && filters.status.length > 0) {
        where.status = { in: filters.status as any };
      }

      if (filters.dateRange) {
        where.createdAt = {};
        if (filters.dateRange.from) where.createdAt.gte = filters.dateRange.from;
        if (filters.dateRange.to) where.createdAt.lte = filters.dateRange.to;
      }

      const proposals = await prisma.proposal.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 50, // Limit per entity type
      });

      return proposals.map(proposal => ({
        id: proposal.id,
        title: proposal.title || '',
        description: proposal.description || '',
        entityType: 'proposal' as const,
        metadata: { status: proposal.status },
        createdAt: proposal.createdAt,
        updatedAt: proposal.updatedAt,
      }));
    } catch (error) {
      logError('Search Service: Error searching proposals', {
        component: 'SearchService',
        operation: 'searchProposals',
        searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Search products
   */
  private async searchProducts(
    searchTerm: string,
    filters: SearchFilters,
    query: SearchQuery
  ): Promise<SearchResult[]> {
    try {
      const tenant = getCurrentTenant();

      const where: Prisma.ProductWhereInput = {
        tenantId: tenant.tenantId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };

      // Add filters
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      if (filters.category && filters.category.length > 0) {
        where.category = { hasSome: filters.category };
      }

      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          sku: true,
          category: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 50, // Limit per entity type
      });

      return products.map(product => ({
        id: product.id,
        title: product.name || '',
        description: product.description || '',
        entityType: 'product' as const,
        metadata: { sku: product.sku, category: product.category },
        tags: product.tags || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      logError('Search Service: Error searching products', {
        component: 'SearchService',
        operation: 'searchProducts',
        searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Search customers
   */
  private async searchCustomers(
    searchTerm: string,
    filters: SearchFilters,
    query: SearchQuery
  ): Promise<SearchResult[]> {
    try {
      const tenant = getCurrentTenant();

      const where: Prisma.CustomerWhereInput = {
        tenantId: tenant.tenantId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { industry: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };

      // Add filters
      if (filters.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      if (filters.industry && filters.industry.length > 0) {
        where.industry = { in: filters.industry };
      }

      const customers = await prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          industry: true,
          status: true,
          tier: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 50, // Limit per entity type
      });

      return customers.map(customer => ({
        id: customer.id,
        title: customer.name || '',
        description: customer.email || '',
        entityType: 'customer' as const,
        metadata: {
          industry: customer.industry,
          status: customer.status,
          tier: customer.tier
        },
        tags: customer.tags || [],
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }));
    } catch (error) {
      logError('Search Service: Error searching customers', {
        component: 'SearchService',
        operation: 'searchCustomers',
        searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Search users
   */
  private async searchUsers(
    searchTerm: string,
    filters: SearchFilters,
    query: SearchQuery
  ): Promise<SearchResult[]> {
    try {
      const where: Prisma.UserWhereInput = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { department: { contains: searchTerm, mode: 'insensitive' } },
        ],
      };

      // Add filters
      if (filters.department && filters.department.length > 0) {
        where.department = { in: filters.department };
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 50, // Limit per entity type
      });

      return users.map(user => ({
        id: user.id,
        title: user.name || '',
        description: user.email || '',
        entityType: 'user' as const,
        metadata: { department: user.department, status: user.status },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } catch (error) {
      logError('Search Service: Error searching users', {
        component: 'SearchService',
        operation: 'searchUsers',
        searchTerm,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResult[], query: SearchQuery, searchTerm: string): SearchResult[] {
    if (query.sortBy === 'relevance') {
      return results.sort((a, b) => {
        const scoreA = this.calculateRelevanceScore(a, searchTerm);
        const scoreB = this.calculateRelevanceScore(b, searchTerm);
        return query.sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      });
    } else {
      return results.sort((a, b) => {
        const valueA = (a as any)[query.sortBy] || '';
        const valueB = (b as any)[query.sortBy] || '';
        const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        return query.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
  }

  /**
   * Calculate relevance score for sorting
   */
  private calculateRelevanceScore(result: SearchResult, searchTerm: string): number {
    let score = 0;
    const title = result.title.toLowerCase();
    const description = result.description.toLowerCase();

    // Title matches get higher score
    if (title.includes(searchTerm)) {
      score += 10;
      if (title.startsWith(searchTerm)) score += 5;
    }

    // Description matches get medium score
    if (description.includes(searchTerm)) {
      score += 5;
      if (description.startsWith(searchTerm)) score += 2;
    }

    // Tag matches get bonus
    if (result.tags?.some(tag => tag.toLowerCase().includes(searchTerm))) {
      score += 3;
    }

    return score;
  }

  /**
   * Handle pagination of results
   */
  private paginateResults(
    results: SearchResult[],
    query: SearchQuery,
    useCursorPagination: boolean
  ): { items: SearchResult[]; hasNextPage: boolean; nextCursor?: string | null } {
    if (useCursorPagination && query.cursor) {
      const cursorIndex = results.findIndex(item => item.id === query.cursor);
      const startIndex = cursorIndex + 1;
      const items = results.slice(startIndex, startIndex + query.limit);
      const hasNextPage = startIndex + query.limit < results.length;
      const nextCursor = hasNextPage ? items[items.length - 1]?.id || null : null;

      return { items, hasNextPage, nextCursor };
    } else {
      const startIndex = (query.page! - 1) * query.limit;
      const items = results.slice(startIndex, startIndex + query.limit);
      const hasNextPage = startIndex + query.limit < results.length;

      return { items, hasNextPage };
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(
    query: string,
    type: 'all' | 'content' | 'proposals' | 'products' | 'customers' | 'users',
    limit: number = 10
  ): Promise<{ suggestions: string[]; entities: SearchResult[] }> {
    try {
      const searchTerm = query.toLowerCase();

      logDebug('Search Service: Getting search suggestions', {
        component: 'SearchService',
        operation: 'getSearchSuggestions',
        searchTerm,
        type,
        limit,
      });

      // Get some basic suggestions based on entity names/titles
      const suggestions: string[] = [];
      const entities: SearchResult[] = [];

      // Simple implementation - get recent/popular entities that match the query
      const tenant = getCurrentTenant();

      if (type === 'all' || type === 'proposals') {
        const proposals = await prisma.proposal.findMany({
          where: {
            tenantId: tenant.tenantId,
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { description: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            title: true,
          },
          take: Math.ceil(limit / 5), // Distribute limit across entity types
          orderBy: { updatedAt: 'desc' },
        });

        proposals.forEach(proposal => {
          if (proposal.title && !suggestions.includes(proposal.title)) {
            suggestions.push(proposal.title);
            entities.push({
              id: proposal.id,
              title: proposal.title,
              description: '',
              entityType: 'proposal',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      }

      if (type === 'all' || type === 'products') {
        const products = await prisma.product.findMany({
          where: {
            tenantId: tenant.tenantId,
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { sku: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            sku: true,
          },
          take: Math.ceil(limit / 5),
          orderBy: { updatedAt: 'desc' },
        });

        products.forEach(product => {
          if (product.name && !suggestions.includes(product.name)) {
            suggestions.push(product.name);
            entities.push({
              id: product.id,
              title: product.name,
              description: product.sku || '',
              entityType: 'product',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      }

      if (type === 'all' || type === 'customers') {
        const customers = await prisma.customer.findMany({
          where: {
            tenantId: tenant.tenantId,
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { email: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
          take: Math.ceil(limit / 5),
          orderBy: { updatedAt: 'desc' },
        });

        customers.forEach(customer => {
          if (customer.name && !suggestions.includes(customer.name)) {
            suggestions.push(customer.name);
            entities.push({
              id: customer.id,
              title: customer.name,
              description: customer.email || '',
              entityType: 'customer',
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        });
      }

      // Limit suggestions to requested limit
      const limitedSuggestions = suggestions.slice(0, limit);
      const limitedEntities = entities.slice(0, limit);

      return {
        suggestions: limitedSuggestions,
        entities: limitedEntities,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get search suggestions',
        code: ErrorCodes.DATA.DATABASE_ERROR,
        cause: error,
        metadata: {
          component: 'SearchService',
          operation: 'getSearchSuggestions',
          query,
          type,
        },
      });
    }
  }
}

// Singleton instance
export const searchService = new SearchService();
