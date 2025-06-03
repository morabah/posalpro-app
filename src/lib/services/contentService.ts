/**
 * Content Service
 * Data access layer for Content entities and access management
 */

import { AccessType, Content, ContentAccessLog, ContentType, Prisma } from '@prisma/client';
import { prisma } from '../prisma';

// Helper function to check if error is a Prisma error
function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
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
      throw new Error('Failed to create content');
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
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Content not found');
      }
      throw new Error('Failed to update content');
    }
  }

  async deleteContent(id: string): Promise<void> {
    try {
      await prisma.content.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Content not found');
      }
      throw new Error('Failed to delete content');
    }
  }

  async getContentById(id: string): Promise<Content | null> {
    try {
      return await prisma.content.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error('Failed to retrieve content');
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
      throw new Error('Failed to retrieve content with creator');
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
      const where: any = {};

      if (filters) {
        if (filters.type) where.type = { in: filters.type };
        if (filters.category && filters.category.length > 0) {
          where.category = { hasSome: filters.category };
        }
        if (filters.tags && filters.tags.length > 0) {
          where.tags = { hasSome: filters.tags };
        }
        if (filters.isPublic !== undefined) where.isPublic = filters.isPublic;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.createdBy) where.createdBy = filters.createdBy;
        if (filters.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { searchableText: { contains: filters.search, mode: 'insensitive' } },
            { keywords: { hasSome: [filters.search] } },
          ];
        }
      }

      // Apply access control
      if (userRoles && userRoles.length > 0) {
        where.OR = [{ isPublic: true }, { allowedRoles: { hasSome: userRoles } }];
      } else {
        where.isPublic = true;
      }

      const orderBy: any = {};
      if (sort) {
        orderBy[sort.field] = sort.direction;
      } else {
        orderBy.createdAt = 'desc';
      }

      const pageSize = limit || 10;
      const currentPage = page || 1;
      const skip = (currentPage - 1) * pageSize;

      const [content, total] = await Promise.all([
        prisma.content.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
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

      return {
        content: content as ContentWithCreator[],
        total,
        page: currentPage,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      throw new Error('Failed to retrieve content');
    }
  }

  // Content access logging
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
        },
      });
    } catch (error) {
      throw new Error('Failed to log content access');
    }
  }

  async getContentAccessLogs(contentId: string, limit?: number): Promise<ContentAccessLog[]> {
    try {
      return await prisma.contentAccessLog.findMany({
        where: { contentId },
        orderBy: { timestamp: 'desc' },
        take: limit || 100,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      throw new Error('Failed to retrieve content access logs');
    }
  }

  // Business logic methods
  async searchContent(query: string, userRoles?: string[], limit?: number): Promise<Content[]> {
    try {
      const where: any = {
        isActive: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { searchableText: { contains: query, mode: 'insensitive' } },
          { keywords: { hasSome: [query] } },
          { tags: { hasSome: [query] } },
          { category: { hasSome: [query] } },
        ],
      };

      // Apply access control
      if (userRoles && userRoles.length > 0) {
        where.AND = {
          OR: [{ isPublic: true }, { allowedRoles: { hasSome: userRoles } }],
        };
      } else {
        where.isPublic = true;
      }

      return await prisma.content.findMany({
        where,
        orderBy: { title: 'asc' },
        take: limit || 50,
      });
    } catch (error) {
      throw new Error('Failed to search content');
    }
  }

  async getContentByCategory(category: string, userRoles?: string[]): Promise<Content[]> {
    try {
      const where: any = {
        category: { has: category },
        isActive: true,
      };

      // Apply access control
      if (userRoles && userRoles.length > 0) {
        where.OR = [{ isPublic: true }, { allowedRoles: { hasSome: userRoles } }];
      } else {
        where.isPublic = true;
      }

      return await prisma.content.findMany({
        where,
        orderBy: { title: 'asc' },
      });
    } catch (error) {
      throw new Error('Failed to retrieve content by category');
    }
  }

  async toggleContentStatus(id: string): Promise<Content> {
    try {
      const content = await prisma.content.findUnique({
        where: { id },
        select: { isActive: true },
      });

      if (!content) {
        throw new Error('Content not found');
      }

      return await prisma.content.update({
        where: { id },
        data: { isActive: !content.isActive },
      });
    } catch (error) {
      throw new Error('Failed to toggle content status');
    }
  }

  async updateContentQuality(id: string, qualityData: any): Promise<Content> {
    try {
      return await prisma.content.update({
        where: { id },
        data: { quality: qualityData },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Content not found');
      }
      throw new Error('Failed to update content quality');
    }
  }

  async updateContentUsage(id: string, usageData: any): Promise<Content> {
    try {
      return await prisma.content.update({
        where: { id },
        data: { usage: usageData },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Content not found');
      }
      throw new Error('Failed to update content usage');
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
        throw new Error('Content not found');
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
      throw new Error('Failed to retrieve content analytics');
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
      throw new Error('Failed to retrieve content statistics');
    }
  }
}

// Singleton instance
export const contentService = new ContentService();
