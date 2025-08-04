import { logger } from '@/utils/logger'; /**
 * Content Service
 * Enhanced data access layer for Content entities with semantic search and AI integration
 * Supports H1 hypothesis validation for 45% search time reduction
 * Implements robust error handling with StandardError and ErrorCodes
 */

import { AccessType, Content, ContentAccessLog, ContentType, Prisma } from '@prisma/client';
import { ErrorCodes, StandardError, errorHandlingService } from '../errors';
import { prisma } from '../prisma';
import { isPrismaError } from '../utils/errorUtils';

// ✅ FIXED: Add specific interface for quality data
export interface ContentQualityData {
  readabilityScore: number;
  completenessScore: number;
  accuracyScore: number;
  relevanceScore: number;
  lastEvaluated: Date;
  evaluatorId?: string;
  notes?: string;
}

// ✅ FIXED: Add specific interface for usage data
export interface ContentUsageData {
  viewCount: number;
  useCount: number;
  averageTimeSpent: number;
  userSatisfaction?: number;
  lastAccessed: Date;
  accessPatterns: Record<string, number>;
}

// Enhanced interfaces for semantic search and AI integration
export interface SemanticSearchRequest {
  query: string;
  filters?: ContentFilters;
  userRoles: string[];
  includeRelevanceScore: boolean;
  maxResults: number;
  userId: string;
  sessionId: string;
}

export interface ContentSearchResult extends Content {
  relevanceScore: number;
  highlights: string[];
  contextSnippets: string[];
  relatedContent: string[];
  qualityScore: number;
  usageMetrics: ContentUsageStats;
}

export interface ContentUsageStats {
  totalViews: number;
  totalUses: number;
  avgUsageTime: number;
  clickThroughRate: number;
  lastAccessed: Date;
  popularityScore: number;
}

export interface SearchPerformanceMetrics {
  searchId: string;
  searchStartTime: number;
  timeToFirstResult: number;
  timeToSelection?: number;
  resultsCount: number;
  searchAccuracy: number;
  userSatisfaction?: number;
  hypothesis: 'H1';
  userStory: 'US-1.1' | 'US-1.2' | 'US-1.3';
}

export interface AIContentSuggestions {
  categories: string[];
  tags: string[];
  relatedContent: string[];
  qualityPrediction: number;
  searchOptimizations: string[];
}

// Content interfaces
export interface CreateContentData {
  title: string;
  description?: string;
  type: ContentType;
  content: string;
  tags?: string[];
  category?: string[];
  keywords?: string[];
  isPublic?: boolean;
  allowedRoles?: string[];
}

export interface UpdateContentData {
  id: string;
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  category?: string[];
  keywords?: string[];
  isPublic?: boolean;
  allowedRoles?: string[];
}

export interface ContentFilters {
  type?: ContentType[];
  category?: string[];
  tags?: string[];
  isPublic?: boolean;
  isActive?: boolean;
  createdBy?: string;
  search?: string;
}

export interface ContentSortOptions {
  field: 'title' | 'type' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface ContentWithCreator extends Content {
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ContentAnalytics {
  contentId: string;
  totalAccess: number;
  uniqueUsers: number;
  accessByType: Record<AccessType, number>;
  averageUsageTime: number;
  popularityScore: number;
  recentActivity: number;
  qualityScore: number;
}

export class ContentService {
  // Content CRUD operations
  async createContent(data: CreateContentData, createdBy: string): Promise<Content> {
    try {
      // Generate searchable text from content
      const searchableText = `${data.title} ${data.description || ''} ${data.content}`;

      return await prisma.content.create({
        data: {
          title: data.title,
          description: data.description,
          type: data.type,
          content: data.content,
          tags: data.tags || [],
          category: data.category || [],
          searchableText,
          keywords: data.keywords || [],
          isPublic: data.isPublic || false,
          allowedRoles: data.allowedRoles || [],
          createdBy,
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to create content',
        code: ErrorCodes.DATA.CREATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'createContent',
          contentType: data.type,
        },
      });
    }
  }

  async updateContent(data: UpdateContentData): Promise<Content> {
    try {
      const { id, ...updateData } = data;

      // Update searchable text if title, description, or content changed
      let searchableText: string | undefined;
      if (updateData.title || updateData.description || updateData.content) {
        const current = await prisma.content.findUnique({
          where: { id },
          select: { title: true, description: true, content: true },
        });

        if (current) {
          const title = updateData.title ?? current.title;
          const description = updateData.description ?? current.description;
          const content = updateData.content ?? current.content;
          searchableText = `${title} ${description || ''} ${content}`;
        }
      }

      return await prisma.content.update({
        where: { id },
        data: {
          ...updateData,
          ...(searchableText && { searchableText }),
          version: { increment: 1 },
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new StandardError({
          message: 'Content not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          cause: error instanceof Error ? error : undefined,
          metadata: {
            component: 'ContentService',
            operation: 'updateContent',
            contentId: data.id,
          },
        });
      }
      throw new StandardError({
        message: 'Failed to update content',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'updateContent',
          contentId: data.id,
        },
      });
    }
  }

  async deleteContent(id: string): Promise<void> {
    try {
      await prisma.content.delete({
        where: { id },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to delete content',
        code: ErrorCodes.DATA.DELETE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'deleteContent',
          contentId: id,
        },
      });
    }
  }

  async getContentById(id: string): Promise<Content | null> {
    try {
      return await prisma.content.findUnique({
        where: { id },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get content by ID',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'getContentById',
          contentId: id,
        },
      });
    }
  }

  async getContentWithCreator(id: string): Promise<ContentWithCreator | null> {
    try {
      return await prisma.content.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get content with creator',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'getContentWithCreator',
          contentId: id,
        },
      });
    }
  }

  async getContent(
    filters?: ContentFilters,
    sort?: ContentSortOptions,
    page?: number,
    limit?: number,
    userRoles?: string[]
  ): Promise<{ content: ContentWithCreator[]; total: number; page: number; totalPages: number }> {
    try {
      const where: Prisma.ContentWhereInput = {};
      const orderBy: Prisma.ContentOrderByWithRelationInput = {};

      // Apply filters
      if (filters?.type) where.type = { in: filters.type };
      if (filters?.category) where.category = { hasSome: filters.category };
      if (filters?.tags) where.tags = { hasSome: filters.tags };
      if (filters?.isPublic !== undefined) where.isPublic = filters.isPublic;
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;
      if (filters?.createdBy) where.createdBy = filters.createdBy;
      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { searchableText: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Apply role-based filtering
      if (userRoles && userRoles.length > 0) {
        where.OR = [{ isPublic: true }, { allowedRoles: { hasSome: userRoles } }];
      }

      // Apply sorting
      if (sort) {
        orderBy[sort.field] = sort.direction;
      } else {
        orderBy.createdAt = 'desc';
      }

      // Apply pagination
      const skip = page && limit ? (page - 1) * limit : 0;
      const take = limit || 10;

      const [content, total] = await Promise.all([
        prisma.content.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.content.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);

      return {
        content,
        total,
        page: page || 1,
        totalPages,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get content',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'getContent',
          filters,
          sort,
          page,
          limit,
        },
      });
    }
  }

  async logContentAccess(
    contentId: string,
    userId: string,
    accessType: AccessType,
    userStory?: string
  ): Promise<ContentAccessLog> {
    try {
      return await prisma.contentAccessLog.create({
        data: {
          contentId,
          userId,
          accessType,
          userStory,
          // ✅ FIXED: Use correct field name from schema
          timestamp: new Date(),
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to log content access',
        code: ErrorCodes.DATA.CREATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'logContentAccess',
          contentId,
          userId,
          accessType,
          userStory,
        },
      });
    }
  }

  async getContentAccessLogs(contentId: string, limit?: number): Promise<ContentAccessLog[]> {
    try {
      return await prisma.contentAccessLog.findMany({
        where: { contentId },
        // ✅ FIXED: Use correct field name from schema
        orderBy: { timestamp: 'desc' },
        take: limit || 50,
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get content access logs',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'getContentAccessLogs',
          contentId,
          limit,
        },
      });
    }
  }

  async searchContent(query: string, userRoles?: string[], limit?: number): Promise<Content[]> {
    try {
      const where: Prisma.ContentWhereInput = {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { searchableText: { contains: query, mode: 'insensitive' } },
        ],
      };

      // Apply role-based filtering
      if (userRoles && userRoles.length > 0) {
        where.OR = [{ isPublic: true }, { allowedRoles: { hasSome: userRoles } }];
      }

      return await prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit || 20,
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to search content',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'searchContent',
          query,
          userRoles,
          limit,
        },
      });
    }
  }

  async getContentByCategory(category: string, userRoles?: string[]): Promise<Content[]> {
    try {
      const where: Prisma.ContentWhereInput = {
        category: { has: category },
      };

      // Apply role-based filtering
      if (userRoles && userRoles.length > 0) {
        where.OR = [{ isPublic: true }, { allowedRoles: { hasSome: userRoles } }];
      }

      return await prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to get content by category',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'getContentByCategory',
          category,
          userRoles,
        },
      });
    }
  }

  async toggleContentStatus(id: string): Promise<Content> {
    try {
      const content = await prisma.content.findUnique({
        where: { id },
        select: { isActive: true },
      });

      if (!content) {
        throw new StandardError({
          message: 'Content not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ContentService',
            operation: 'toggleContentStatus',
            contentId: id,
          },
        });
      }

      return await prisma.content.update({
        where: { id },
        data: { isActive: !content.isActive },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to toggle content status',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'toggleContentStatus',
          contentId: id,
        },
      });
    }
  }

  // ✅ FIXED: Use specific interfaces instead of Prisma.InputJsonValue
  async updateContentQuality(id: string, qualityData: ContentQualityData): Promise<Content> {
    try {
      return await prisma.content.update({
        where: { id },
        data: {
          // ✅ FIXED: Use correct field name from schema and proper type conversion
          quality: qualityData as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to update content quality',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'updateContentQuality',
          contentId: id,
        },
      });
    }
  }

  // ✅ FIXED: Use specific interfaces instead of Prisma.InputJsonValue
  async updateContentUsage(id: string, usageData: ContentUsageData): Promise<Content> {
    try {
      return await prisma.content.update({
        where: { id },
        data: {
          // ✅ FIXED: Use correct field name from schema and proper type conversion
          usage: usageData as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to update content usage',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'updateContentUsage',
          contentId: id,
        },
      });
    }
  }

  // Analytics and reporting
  async getContentAnalytics(id: string): Promise<ContentAnalytics> {
    try {
      const [content, accessLogs, accessStats] = await Promise.all([
        prisma.content.findUnique({
          where: { id },
          select: {
            id: true,
            quality: true,
            usage: true,
          },
        }),
        prisma.contentAccessLog.findMany({
          where: { contentId: id },
          select: {
            accessType: true,
            userId: true,
            timestamp: true,
          },
        }),
        prisma.contentAccessLog.groupBy({
          by: ['accessType'],
          where: { contentId: id },
          _count: { accessType: true },
        }),
      ]);

      if (!content) {
        throw new StandardError({
          message: 'Content not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ContentService',
            operation: 'toggleContentStatus',
            contentId: id,
          },
        });
      }

      const totalAccess = accessLogs.length;
      const uniqueUsers = new Set(accessLogs.map(log => log.userId)).size;

      const accessByType = Object.values(AccessType).reduce(
        (acc, type) => {
          acc[type] = accessStats.find(stat => stat.accessType === type)?._count.accessType || 0;
          return acc;
        },
        {} as Record<AccessType, number>
      );

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentActivity = accessLogs.filter(log => log.timestamp >= thirtyDaysAgo).length;

      return {
        contentId: id,
        totalAccess,
        uniqueUsers,
        accessByType,
        averageUsageTime: 0, // This would need additional tracking
        popularityScore: totalAccess * 0.4 + uniqueUsers * 0.6,
        recentActivity,
        qualityScore: (content.quality as any)?.score || 0,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve content analytics',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'getContentAnalytics',
          contentId: id,
        },
      });
    }
  }

  async getContentStats(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    type?: ContentType[];
    category?: string[];
  }): Promise<{
    total: number;
    active: number;
    inactive: number;
    public: number;
    private: number;
    byType: Record<ContentType, number>;
    byCategory: Record<string, number>;
    totalAccess: number;
    mostPopular: Array<{ id: string; title: string; access: number }>;
  }> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.type) where.type = { in: filters.type };
        if (filters.category && filters.category.length > 0) {
          where.category = { hasSome: filters.category };
        }
        if (filters.dateFrom || filters.dateTo) {
          where.createdAt = {};
          if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
          if (filters.dateTo) where.createdAt.lte = filters.dateTo;
        }
      }

      const [
        total,
        active,
        inactive,
        publicContent,
        privateContent,
        typeStats,
        categoryStats,
        accessStats,
        popularContent,
      ] = await Promise.all([
        prisma.content.count({ where }),
        prisma.content.count({ where: { ...where, isActive: true } }),
        prisma.content.count({ where: { ...where, isActive: false } }),
        prisma.content.count({ where: { ...where, isPublic: true } }),
        prisma.content.count({ where: { ...where, isPublic: false } }),
        prisma.content.groupBy({
          by: ['type'],
          where,
          _count: { type: true },
        }),
        prisma.content.findMany({
          where,
          select: { category: true },
        }),
        prisma.contentAccessLog.count(),
        prisma.contentAccessLog.groupBy({
          by: ['contentId'],
          _count: { contentId: true },
          orderBy: { _count: { contentId: 'desc' } },
          take: 10,
        }),
      ]);

      // Calculate category distribution
      const categoryMap = new Map<string, number>();
      categoryStats.forEach(content => {
        content.category.forEach(cat => {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
      });

      const byCategory = Object.fromEntries(categoryMap.entries());

      const byType = Object.values(ContentType).reduce(
        (acc, type) => {
          acc[type] = typeStats.find(stat => stat.type === type)?._count.type || 0;
          return acc;
        },
        {} as Record<ContentType, number>
      );

      // Get popular content details
      const contentIds = popularContent.map(pc => pc.contentId);
      const contentDetails = await prisma.content.findMany({
        where: { id: { in: contentIds } },
        select: { id: true, title: true },
      });

      const mostPopular = popularContent.map(pc => {
        const content = contentDetails.find(c => c.id === pc.contentId);
        return {
          id: pc.contentId,
          title: content?.title || 'Unknown',
          access: pc._count.contentId,
        };
      });

      return {
        total,
        active,
        inactive,
        public: publicContent,
        private: privateContent,
        byType,
        byCategory,
        totalAccess: accessStats,
        mostPopular,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve content statistics',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'getContentStatistics',
          filters: JSON.stringify(filters),
        },
      });
    }
  }

  // Enhanced semantic search with AI integration (US-1.1, US-1.2, US-1.3)
  async semanticSearch(request: SemanticSearchRequest): Promise<{
    results: ContentSearchResult[];
    metrics: SearchPerformanceMetrics;
    aiSuggestions: AIContentSuggestions;
    totalResults: number;
  }> {
    const searchStartTime = Date.now();
    const searchId = `search_${request.userId}_${searchStartTime}`;

    try {
      // Build enhanced search query with semantic understanding
      const semanticQuery = this.buildSemanticQuery(request.query);

      // Apply user role-based access control
      const where: any = {
        isActive: true,
        OR: [{ isPublic: true }, { allowedRoles: { hasSome: request.userRoles } }],
        AND: [
          {
            OR: [
              { title: { contains: semanticQuery, mode: 'insensitive' } },
              { description: { contains: semanticQuery, mode: 'insensitive' } },
              { searchableText: { contains: semanticQuery, mode: 'insensitive' } },
              { keywords: { hasSome: semanticQuery.split(' ') } },
              { tags: { hasSome: semanticQuery.split(' ') } },
              { category: { hasSome: semanticQuery.split(' ') } },
            ],
          },
        ],
      };

      // Apply additional filters
      if (request.filters) {
        if (request.filters.type) where.type = { in: request.filters.type };
        if (request.filters.category && request.filters.category.length > 0) {
          where.category = { hasSome: request.filters.category };
        }
        if (request.filters.tags && request.filters.tags.length > 0) {
          where.tags = { hasSome: request.filters.tags };
        }
      }

      // Get content with enhanced metadata
      const rawResults = await prisma.content.findMany({
        where,
        take: request.maxResults,
        orderBy: [{ updatedAt: 'desc' }, { title: 'asc' }],
      });

      const timeToFirstResult = Date.now() - searchStartTime;

      // Calculate relevance scores and enhance results
      const enhancedResults = await Promise.all(
        rawResults.map(async content => {
          const relevanceScore = this.calculateRelevanceScore(content, request.query);
          const highlights = this.extractHighlights(content, request.query);
          const contextSnippets = this.extractContextSnippets(content, request.query);
          const usageMetrics = await this.getContentUsageStats(content.id);
          const relatedContent = await this.getRelatedContentIds(content.id, 3);
          const qualityScore = await this.calculateQualityScore(content.id);

          return {
            ...content,
            relevanceScore,
            highlights,
            contextSnippets,
            relatedContent,
            qualityScore,
            usageMetrics,
          } as ContentSearchResult;
        })
      );

      // Sort by relevance score
      const sortedResults = enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Generate AI suggestions
      const aiSuggestions = await this.generateAISuggestions(request.query, sortedResults);

      // Calculate search accuracy
      const searchAccuracy = this.calculateSearchAccuracy(sortedResults, request.query);

      // Create performance metrics
      const metrics: SearchPerformanceMetrics = {
        searchId,
        searchStartTime,
        timeToFirstResult,
        resultsCount: sortedResults.length,
        searchAccuracy,
        hypothesis: 'H1',
        userStory: 'US-1.1',
      };

      // Log search analytics for H1 hypothesis validation
      await this.logSearchAnalytics(request, metrics, sortedResults.length);

      return {
        results: sortedResults,
        metrics,
        aiSuggestions,
        totalResults: sortedResults.length,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to perform semantic search',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'semanticSearch',
          query: request.query,
          userId: request.userId,
        },
      });
    }
  }

  // Enhanced content categorization with AI assistance (US-1.2)
  async getAICategories(content?: string, existingCategories?: string[]): Promise<string[]> {
    try {
      // Get all existing categories from database
      const existingCategoriesFromDB = await prisma.content.findMany({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
      });

      const allCategories = new Set<string>();
      existingCategoriesFromDB.forEach(item => {
        item.category.forEach(cat => allCategories.add(cat));
      });

      // AI-powered category suggestion (placeholder for actual AI integration)
      const suggestedCategories = this.suggestCategoriesFromContent(
        content || '',
        Array.from(allCategories)
      );

      // Combine with existing categories and remove duplicates
      const combinedCategories = [...suggestedCategories, ...(existingCategories || [])];

      return Array.from(new Set(combinedCategories)).slice(0, 10);
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'AI categorization failed',
        code: ErrorCodes.AI.PROCESSING_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'getAICategories',
          content: content,
          existingCategories: existingCategories,
        },
      });
    }
  }

  // Content quality scoring with win-rate analysis (US-1.3)
  async calculateContentQualityScore(contentId: string): Promise<number> {
    try {
      const content = await prisma.content.findUnique({
        where: { id: contentId },
        include: {
          accessLogs: {
            take: 100,
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      if (!content) return 0;

      let qualityScore = 0;

      // Base quality from content characteristics
      qualityScore += content.title.length > 10 ? 20 : 10;
      qualityScore += content.description ? 15 : 0;
      qualityScore += content.tags.length * 5;
      qualityScore += content.keywords.length * 3;

      // Usage-based quality scoring
      const totalAccess = content.accessLogs.length;
      const uniqueUsers = new Set(content.accessLogs.map(log => log.userId)).size;
      const recentAccess = content.accessLogs.filter(
        log => log.timestamp > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      qualityScore += Math.min(totalAccess * 2, 30);
      qualityScore += Math.min(uniqueUsers * 5, 25);
      qualityScore += Math.min(recentAccess * 3, 15);

      // Content freshness
      const daysSinceUpdate = Math.floor(
        (Date.now() - content.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      qualityScore += Math.max(0, 10 - daysSinceUpdate / 30);

      return Math.min(100, Math.max(0, qualityScore));
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Quality scoring failed',
        code: ErrorCodes.AI.PROCESSING_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ContentService',
          operation: 'calculateContentQualityScore',
          contentId: contentId,
        },
      });
    }
  }

  // Related content suggestions (US-1.2)
  async getRelatedContent(contentId: string, limit: number = 5): Promise<Content[]> {
    try {
      const baseContent = await prisma.content.findUnique({
        where: { id: contentId },
      });

      if (!baseContent) return [];

      // Find related content based on tags, category, and type
      const relatedContent = await prisma.content.findMany({
        where: {
          AND: [
            { id: { not: contentId } },
            { isActive: true },
            {
              OR: [
                { tags: { hasSome: baseContent.tags } },
                { category: { hasSome: baseContent.category } },
                { type: baseContent.type },
              ],
            },
          ],
        },
        take: limit,
        orderBy: [{ updatedAt: 'desc' }],
      });

      return relatedContent;
    } catch (error) {
      logger.error('Related content lookup failed:', error);
      return [];
    }
  }

  // Performance analytics for H1 hypothesis validation
  async logSearchAnalytics(
    request: SemanticSearchRequest,
    metrics: SearchPerformanceMetrics,
    resultsCount: number
  ): Promise<void> {
    try {
      // Log to analytics system (placeholder - would integrate with actual analytics service)
      const analyticsData = {
        searchId: metrics.searchId,
        userId: request.userId,
        sessionId: request.sessionId,
        query: request.query,
        searchStartTime: metrics.searchStartTime,
        timeToFirstResult: metrics.timeToFirstResult,
        resultsCount: resultsCount,
        searchAccuracy: metrics.searchAccuracy,
        hypothesis: 'H1',
        userStory: 'US-1.1',
        timestamp: new Date(),
        filtersUsed: request.filters ? Object.keys(request.filters) : [],
        userRoles: request.userRoles,
      };

      logger.info('Search Analytics (H1 Validation):', analyticsData);

      // Store in database for analysis (could be separate analytics table)
      // This would typically go to a dedicated analytics service
    } catch (error) {
      logger.error('Failed to log search analytics:', error);
      // Don't throw error - analytics failure shouldn't break search
    }
  }

  // Helper methods for semantic search functionality

  private buildSemanticQuery(query: string): string {
    // Enhanced query building with synonym expansion and semantic understanding
    // This is a simplified version - would integrate with actual NLP service
    const synonymMap: Record<string, string[]> = {
      AI: ['artificial intelligence', 'machine learning', 'ML'],
      security: ['cybersecurity', 'infosec', 'protection'],
      data: ['database', 'information', 'analytics'],
      cloud: ['AWS', 'Azure', 'GCP', 'SaaS'],
      network: ['networking', 'infrastructure', 'connectivity'],
    };

    let enhancedQuery = query.toLowerCase();

    // Expand with synonyms
    Object.entries(synonymMap).forEach(([term, synonyms]) => {
      if (enhancedQuery.includes(term.toLowerCase())) {
        enhancedQuery += ' ' + synonyms.join(' ');
      }
    });

    return enhancedQuery;
  }

  private calculateRelevanceScore(content: Content, query: string): number {
    const queryTerms = query.toLowerCase().split(' ');
    let score = 0;

    // Title matching (highest weight)
    queryTerms.forEach(term => {
      if (content.title.toLowerCase().includes(term)) {
        score += 40;
      }
    });

    // Description matching
    queryTerms.forEach(term => {
      if (content.description?.toLowerCase().includes(term)) {
        score += 25;
      }
    });

    // Tag matching
    queryTerms.forEach(term => {
      if (content.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 20;
      }
    });

    // Content matching
    queryTerms.forEach(term => {
      if (content.content.toLowerCase().includes(term)) {
        score += 10;
      }
    });

    // Boost for content quality indicators
    score += content.tags.length * 2;
    score += content.keywords.length;

    return Math.min(100, score);
  }

  private extractHighlights(content: Content, query: string): string[] {
    const queryTerms = query.toLowerCase().split(' ');
    const highlights: string[] = [];

    // Extract highlights from title
    queryTerms.forEach(term => {
      if (content.title.toLowerCase().includes(term)) {
        highlights.push(content.title);
      }
    });

    // Extract highlights from description
    if (content.description) {
      queryTerms.forEach(term => {
        if (content.description!.toLowerCase().includes(term)) {
          highlights.push(content.description!.substring(0, 100) + '...');
        }
      });
    }

    return highlights.slice(0, 3);
  }

  private extractContextSnippets(content: Content, query: string): string[] {
    const queryTerms = query.toLowerCase().split(' ');
    const snippets: string[] = [];
    const contentText = content.content.toLowerCase();

    queryTerms.forEach(term => {
      const index = contentText.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(contentText.length, index + 150);
        const snippet = content.content.substring(start, end);
        snippets.push('...' + snippet + '...');
      }
    });

    return snippets.slice(0, 2);
  }

  private async getContentUsageStats(contentId: string): Promise<ContentUsageStats> {
    try {
      const accessLogs = await prisma.contentAccessLog.findMany({
        where: { contentId },
        orderBy: { timestamp: 'desc' },
      });

      const totalViews = accessLogs.filter(log => log.accessType === 'VIEW').length;
      const totalUses = accessLogs.filter(log => log.accessType === 'USE').length;
      const uniqueUsers = new Set(accessLogs.map(log => log.userId)).size;
      const lastAccessed = accessLogs[0]?.timestamp || new Date();

      return {
        totalViews,
        totalUses,
        avgUsageTime: 0, // Would calculate from session data
        clickThroughRate: totalUses / Math.max(totalViews, 1),
        lastAccessed,
        popularityScore: (totalViews + totalUses * 2) * Math.min(uniqueUsers / 10, 1),
      };
    } catch (error) {
      return {
        totalViews: 0,
        totalUses: 0,
        avgUsageTime: 0,
        clickThroughRate: 0,
        lastAccessed: new Date(),
        popularityScore: 0,
      };
    }
  }

  private async getRelatedContentIds(contentId: string, limit: number): Promise<string[]> {
    const relatedContent = await this.getRelatedContent(contentId, limit);
    return relatedContent.map(content => content.id);
  }

  private async calculateQualityScore(contentId: string): Promise<number> {
    return await this.calculateContentQualityScore(contentId);
  }

  private async generateAISuggestions(
    query: string,
    results: ContentSearchResult[]
  ): Promise<AIContentSuggestions> {
    // AI-powered suggestions (placeholder for actual AI service integration)
    const categories = new Set<string>();
    const tags = new Set<string>();

    // Extract patterns from search results
    results.forEach(result => {
      result.category.forEach(cat => categories.add(cat));
      result.tags.forEach(tag => tags.add(tag));
    });

    return {
      categories: Array.from(categories).slice(0, 5),
      tags: Array.from(tags).slice(0, 8),
      relatedContent: results.slice(0, 3).map(r => r.id),
      qualityPrediction: results.length > 0 ? results[0].qualityScore : 0,
      searchOptimizations: this.generateSearchOptimizations(query),
    };
  }

  private calculateSearchAccuracy(results: ContentSearchResult[], query: string): number {
    if (results.length === 0) return 0;

    const averageRelevance =
      results.reduce((sum, result) => sum + result.relevanceScore, 0) / results.length;
    return Math.min(100, averageRelevance);
  }

  private suggestCategoriesFromContent(content: string, existingCategories: string[]): string[] {
    // Simple content-based category suggestion (would use actual AI/ML in production)
    const suggestions: string[] = [];
    const contentLower = content.toLowerCase();

    const categoryKeywords: Record<string, string[]> = {
      Technical: ['api', 'database', 'architecture', 'system', 'technical'],
      Security: ['security', 'encryption', 'firewall', 'protection', 'secure'],
      'AI/ML': ['ai', 'artificial intelligence', 'machine learning', 'neural', 'algorithm'],
      Cloud: ['cloud', 'aws', 'azure', 'saas', 'infrastructure'],
      Data: ['data', 'analytics', 'database', 'information', 'metrics'],
      Business: ['business', 'strategy', 'process', 'workflow', 'management'],
    };

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        suggestions.push(category);
      }
    });

    return suggestions;
  }

  private generateSearchOptimizations(query: string): string[] {
    // Generate search optimization suggestions
    const suggestions: string[] = [];

    if (query.length < 3) {
      suggestions.push('Try using more specific terms');
    }

    if (!query.includes(' ')) {
      suggestions.push('Consider adding related terms');
    }

    // Add semantic suggestions
    suggestions.push(`Try: "${query} best practices"`);
    suggestions.push(`Try: "${query} implementation"`);

    return suggestions.slice(0, 3);
  }
}

// Singleton instance
export const contentService = new ContentService();
