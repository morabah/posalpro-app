/**
 * Optimized Product Service - PosalPro MVP2
 * Addresses critical performance bottlenecks in product statistics
 * Target: Reduce 18+ second response times to <200ms
 */

import { Prisma } from '@prisma/client';
import { ErrorCodes, errorHandlingService, StandardError } from '../errors';
import { prisma } from '../prisma';

export interface OptimizedProductStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<string, number>;
  totalRevenue: number;
  averagePrice: number;
  mostUsedProducts: Array<{ id: string; name: string; usage: number }>;
}

export class OptimizedProductService {
  /**
   * Optimized product statistics with single aggregated query
   * Replaces the slow multi-query approach in ProductService.getProductStats
   */
  async getOptimizedProductStats(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    category?: string[];
    isActive?: boolean;
  }): Promise<OptimizedProductStats> {
    try {
      console.log('🚀 [OptimizedProductService] Starting optimized product stats query...');
      const startTime = Date.now();

      // Build where clause for products
      const whereClause: Prisma.ProductWhereInput = {};

      if (filters) {
        if (filters.dateFrom || filters.dateTo) {
          whereClause.createdAt = {};
          if (filters.dateFrom) whereClause.createdAt.gte = filters.dateFrom;
          if (filters.dateTo) whereClause.createdAt.lte = filters.dateTo;
        }
        if (filters.category && filters.category.length > 0) {
          whereClause.category = { hasSome: filters.category };
        }
        if (filters.isActive !== undefined) {
          whereClause.isActive = filters.isActive;
        }
      }

      // Single optimized query using raw SQL for maximum performance
      const rawStatsQuery = `
        WITH product_stats AS (
          SELECT
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE "isActive" = true) as active_count,
            COUNT(*) FILTER (WHERE "isActive" = false) as inactive_count,
            AVG(price) as avg_price
          FROM products
          WHERE 1=1
            ${filters?.dateFrom ? `AND "createdAt" >= '${filters.dateFrom.toISOString()}'` : ''}
            ${filters?.dateTo ? `AND "createdAt" <= '${filters.dateTo.toISOString()}'` : ''}
            ${filters?.isActive !== undefined ? `AND "isActive" = ${filters.isActive}` : ''}
            ${filters?.category?.length ? `AND category && ARRAY['${filters.category.join("','")}']` : ''}
        ),
        category_stats AS (
          SELECT
            unnest(category) as category_name,
            COUNT(*) as category_count
          FROM products
          WHERE 1=1
            ${filters?.dateFrom ? `AND "createdAt" >= '${filters.dateFrom.toISOString()}'` : ''}
            ${filters?.dateTo ? `AND "createdAt" <= '${filters.dateTo.toISOString()}'` : ''}
            ${filters?.isActive !== undefined ? `AND "isActive" = ${filters.isActive}` : ''}
            ${filters?.category?.length ? `AND category && ARRAY['${filters.category.join("','")}']` : ''}
          GROUP BY unnest(category)
        ),
        revenue_stats AS (
          SELECT COALESCE(SUM(total), 0) as total_revenue
          FROM proposal_products
        ),
        usage_stats AS (
          SELECT
            pp."productId",
            p.name,
            COUNT(*) as usage_count
          FROM proposal_products pp
          JOIN products p ON p.id = pp."productId"
          GROUP BY pp."productId", p.name
          ORDER BY usage_count DESC
          LIMIT 10
        )
        SELECT
          ps.total_count,
          ps.active_count,
          ps.inactive_count,
          ps.avg_price,
          rs.total_revenue,
          json_object_agg(cs.category_name, cs.category_count) as category_stats,
          json_agg(
            json_build_object(
              'id', us."productId",
              'name', us.name,
              'usage', us.usage_count
            )
          ) as usage_stats
        FROM product_stats ps
        CROSS JOIN revenue_stats rs
        LEFT JOIN category_stats cs ON true
        LEFT JOIN usage_stats us ON true
        GROUP BY ps.total_count, ps.active_count, ps.inactive_count, ps.avg_price, rs.total_revenue
      `;

      const result = await prisma.$queryRawUnsafe(rawStatsQuery);
      const queryTime = Date.now() - startTime;

      console.log(`✅ [OptimizedProductService] Query completed in ${queryTime}ms`);

      // Process the raw result
      const rawData = Array.isArray(result) ? result[0] : result;

      const stats: OptimizedProductStats = {
        total: Number(rawData.total_count) || 0,
        active: Number(rawData.active_count) || 0,
        inactive: Number(rawData.inactive_count) || 0,
        totalRevenue: Number(rawData.total_revenue) || 0,
        averagePrice: Number(rawData.avg_price) || 0,
        byCategory: rawData.category_stats || {},
        mostUsedProducts: rawData.usage_stats || [],
      };

      // Track performance metrics
      if (queryTime > 1000) {
        console.warn(`⚠️ [OptimizedProductService] Slow query detected: ${queryTime}ms`);
      }

      return stats;
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve optimized product statistics',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'OptimizedProductService',
          operation: 'getOptimizedProductStats',
          filters: JSON.stringify(filters),
        },
      });
    }
  }

  /**
   * Fast product search with optimized filtering
   */
  async fastProductSearch(params: {
    search?: string;
    category?: string[];
    priceRange?: { min: number; max: number };
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    try {
      const startTime = Date.now();

      const { search, category, priceRange, isActive = true, limit = 20, offset = 0 } = params;

      // Build optimized where clause
      const where: Prisma.ProductWhereInput = {
        isActive,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (category && category.length > 0) {
        where.category = { hasSome: category };
      }

      if (priceRange) {
        where.price = {
          gte: priceRange.min,
          lte: priceRange.max,
        };
      }

      // Execute optimized query with minimal data selection
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            currency: true,
            category: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                proposalProducts: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.product.count({ where }),
      ]);

      const queryTime = Date.now() - startTime;
      console.log(`✅ [OptimizedProductService] Product search completed in ${queryTime}ms`);

      return {
        products: products.map(p => ({
          ...p,
          usageCount: p._count.proposalProducts,
        })),
        total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
        queryTime,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Fast product search failed',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'OptimizedProductService',
          operation: 'fastProductSearch',
          params: JSON.stringify(params),
        },
      });
    }
  }

  /**
   * Get product usage analytics with optimized queries
   */
  async getProductUsageAnalytics(productId: string) {
    try {
      const startTime = Date.now();

      // Single query to get all product analytics
      const analyticsQuery = `
        SELECT
          p.id,
          p.name,
          p.price,
          p.category,
          COUNT(pp.id) as total_usage,
          COALESCE(SUM(pp.total), 0) as revenue_generated,
          COALESCE(AVG(pp.quantity), 0) as avg_quantity,
          COUNT(DISTINCT pr.id) as proposal_count,
          COUNT(CASE WHEN pr.status = 'APPROVED' THEN 1 END) as approved_proposals,
          COUNT(CASE WHEN vi.status = 'OPEN' THEN 1 END) as validation_issues
        FROM products p
        LEFT JOIN proposal_products pp ON p.id = pp."productId"
        LEFT JOIN proposals pr ON pp."proposalId" = pr.id
        LEFT JOIN validation_issues vi ON pp.id = vi."proposalProductId"
        WHERE p.id = $1
        GROUP BY p.id, p.name, p.price, p.category
      `;

      const result = await prisma.$queryRawUnsafe(analyticsQuery, productId);
      const queryTime = Date.now() - startTime;

      console.log(`✅ [OptimizedProductService] Product analytics completed in ${queryTime}ms`);

      const data = Array.isArray(result) ? result[0] : result;

      if (!data) {
        throw new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: { productId },
        });
      }

      const totalUsage = Number(data.total_usage) || 0;
      const approvedProposals = Number(data.approved_proposals) || 0;
      const successRate = totalUsage > 0 ? (approvedProposals / totalUsage) * 100 : 0;

      return {
        productId: data.id,
        name: data.name,
        price: Number(data.price),
        category: data.category,
        totalUsage,
        revenueGenerated: Number(data.revenue_generated) || 0,
        averageQuantity: Number(data.avg_quantity) || 0,
        proposalCount: Number(data.proposal_count) || 0,
        successRate,
        validationIssues: Number(data.validation_issues) || 0,
        queryTime,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      if (error instanceof StandardError) throw error;

      throw new StandardError({
        message: 'Failed to retrieve product usage analytics',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'OptimizedProductService',
          operation: 'getProductUsageAnalytics',
          productId,
        },
      });
    }
  }

  /**
   * Batch operation for multiple product operations
   */
  async batchProductOperations(
    operations: Array<{
      type: 'stats' | 'search' | 'analytics';
      params: any;
    }>
  ) {
    try {
      const startTime = Date.now();

      const results = await Promise.all(
        operations.map(async op => {
          switch (op.type) {
            case 'stats':
              return { type: 'stats', data: await this.getOptimizedProductStats(op.params) };
            case 'search':
              return { type: 'search', data: await this.fastProductSearch(op.params) };
            case 'analytics':
              return {
                type: 'analytics',
                data: await this.getProductUsageAnalytics(op.params.productId),
              };
            default:
              throw new Error(`Unknown operation type: ${op.type}`);
          }
        })
      );

      const totalTime = Date.now() - startTime;
      console.log(`✅ [OptimizedProductService] Batch operations completed in ${totalTime}ms`);

      return {
        results,
        totalTime,
        operationCount: operations.length,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Batch product operations failed',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'OptimizedProductService',
          operation: 'batchProductOperations',
          operationCount: operations.length,
        },
      });
    }
  }
}

// Singleton instance
export const optimizedProductService = new OptimizedProductService();
