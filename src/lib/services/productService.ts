/**
 * Product Service
 * Data access layer for Product entities and relationships
 */

import { Prisma, Product, ProductRelationship, RelationshipType } from '@prisma/client';
import {
    CreateProductData,
    CreateProductRelationshipData,
    ProductFilters,
    ProductSortOptions,
    UpdateProductData,
} from '../../types/entities/product';
import { prisma } from '../prisma';
import { StandardError, ErrorCodes, errorHandlingService } from '../errors';
import { toPrismaJson, relationshipConditionToPrisma } from '../utils/prismaUtils';

// Helper function to check if error is a Prisma error
function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

// Extended types with relations
export interface ProductWithRelationships extends Product {
  relationships: Array<
    ProductRelationship & {
      targetProduct: Product;
    }
  >;
  relatedFrom: Array<
    ProductRelationship & {
      sourceProduct: Product;
    }
  >;
}

export interface ProductWithValidation extends Product {
  validationRules: Array<{
    id: string;
    name: string;
    category: string;
    severity: string;
    isActive: boolean;
  }>;
}

export interface ProductAnalytics {
  productId: string;
  totalUsage: number;
  successRate: number;
  averageConfigurationTime: number;
  validationFailures: number;
  relationshipIssues: number;
  revenueGenerated: number;
  proposalsIncluded: number;
  averageQuantity: number;
  topCategories: string[];
}

export class ProductService {
  // Product CRUD operations
  async createProduct(data: CreateProductData, createdBy: string): Promise<Product> {
    try {
      return await prisma.product.create({
        data: {
          name: data.name,
          description: data.description,
          sku: data.sku,
          price: data.price,
          currency: data.currency || 'USD',
          category: data.category || [],
          tags: data.tags || [],
          attributes: data.attributes ? toPrismaJson(data.attributes) : undefined,
          images: data.images || [],
          userStoryMappings: data.userStoryMappings || [],
        },
      });
    } catch (error) {
      // Log the error for observability
      errorHandlingService.processError(error);
      
      if (isPrismaError(error) && error.code === 'P2002') {
        throw new StandardError({
          message: 'A product with this SKU already exists',
          code: ErrorCodes.DATA.CONFLICT,
          cause: error,
          metadata: {
            component: 'ProductService',
            operation: 'createProduct',
            sku: data.sku,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to create product',
        code: ErrorCodes.DATA.CREATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'createProduct',
        },
      });
    }
  }

  async updateProduct(data: UpdateProductData): Promise<Product> {
    try {
      const { id, ...updateData } = data;
      
      // Handle JSON fields with proper type conversion
      const prismaData: Prisma.ProductUpdateInput = {
        ...updateData,
        attributes: updateData.attributes ? toPrismaJson(updateData.attributes) : undefined,
      };
      
      return await prisma.product.update({
        where: { id },
        data: prismaData,
      });
    } catch (error) {
      errorHandlingService.processError(error);

      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new StandardError({
            message: 'Product not found',
            code: ErrorCodes.DATA.NOT_FOUND,
            cause: error,
            metadata: {
              component: 'ProductService',
              operation: 'updateProduct',
              productId: data.id,
            },
          });
        }
        if (error.code === 'P2002') {
          throw new StandardError({
            message: 'SKU already exists',
            code: ErrorCodes.DATA.CONFLICT,
            cause: error,
            metadata: {
              component: 'ProductService',
              operation: 'updateProduct',
              productId: data.id,
              sku: data.sku,
            },
          });
        }
      }

      throw new StandardError({
        message: 'Failed to update product',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'updateProduct',
          productId: data.id,
        },
      });
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      // Check if product is used in any proposals
      const proposalCount = await prisma.proposalProduct.count({
        where: { productId: id },
      });

      if (proposalCount > 0) {
        throw new StandardError({
          message: 'Cannot delete product that is used in proposals',
          code: ErrorCodes.VALIDATION.BUSINESS_RULE_VIOLATION,
          metadata: {
            component: 'ProductService',
            operation: 'deleteProduct',
            productId: id,
            proposalCount,
          },
        });
      }

      await prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      errorHandlingService.processError(error);

      if (isPrismaError(error) && error.code === 'P2025') {
        throw new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          cause: error,
          metadata: {
            component: 'ProductService',
            operation: 'deleteProduct',
            productId: id,
          },
        });
      }

      throw new StandardError({
        message: 'Failed to delete product',
        code: ErrorCodes.DATA.DELETE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'deleteProduct',
          productId: id,
        },
      });
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await prisma.product.findUnique({
        where: { id },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve product',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'getProductById',
          productId: id,
        },
      });
    }
  }

  async getProductWithRelationships(id: string): Promise<ProductWithRelationships | null> {
    try {
      return await prisma.product.findUnique({
        where: { id },
        include: {
          relationships: {
            include: {
              targetProduct: true,
            },
          },
          relatedFrom: {
            include: {
              sourceProduct: true,
            },
          },
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve product with relationships',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'getProductWithRelationships',
          productId: id,
        },
      });
    }
  }

  async getProductWithValidation(id: string): Promise<ProductWithValidation | null> {
    try {
      return await prisma.product.findUnique({
        where: { id },
        include: {
          validationRules: {
            select: {
              id: true,
              name: true,
              category: true,
              severity: true,
              isActive: true,
            },
          },
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve product with validation rules',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'getProductWithValidation',
          productId: id,
        },
      });
    }
  }

  async getProducts(
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    page?: number,
    limit?: number
  ): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.category && filters.category.length > 0) {
          where.category = { hasSome: filters.category };
        }
        if (filters.tags && filters.tags.length > 0) {
          where.tags = { hasSome: filters.tags };
        }
        if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
          where.price = {};
          if (filters.priceMin !== undefined) where.price.gte = filters.priceMin;
          if (filters.priceMax !== undefined) where.price.lte = filters.priceMax;
        }
        if (filters.sku) {
          where.sku = { contains: filters.sku, mode: 'insensitive' };
        }
        if (filters.search) {
          where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { sku: { contains: filters.search, mode: 'insensitive' } },
          ];
        }
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

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: pageSize,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        products,
        total,
        page: currentPage,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve products',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'getProducts',
          filters: JSON.stringify(filters),
          sort: sort ? JSON.stringify(sort) : undefined,
          page,
          limit,
        },
      });
    }
  }

  // Product Relationship operations
  async createProductRelationship(
    data: CreateProductRelationshipData,
    createdBy: string
  ): Promise<ProductRelationship> {
    try {
      // Validate that both products exist
      const [sourceProduct, targetProduct] = await Promise.all([
        prisma.product.findUnique({ where: { id: data.sourceProductId }, select: { id: true } }),
        prisma.product.findUnique({ where: { id: data.targetProductId }, select: { id: true } }),
      ]);

      if (!sourceProduct || !targetProduct) {
        throw new StandardError({
          message: 'One or both products not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProductService',
            operation: 'createProductRelationship',
            sourceProductId: data.sourceProductId,
            targetProductId: data.targetProductId,
          },
        });
      }

      // Check for circular relationships
      if (data.sourceProductId === data.targetProductId) {
        throw new StandardError({
          message: 'Business rule violation: Cannot create circular product relationships',
          code: ErrorCodes.VALIDATION.BUSINESS_RULE_VIOLATION,
          metadata: {
            component: 'ProductService',
            operation: 'createProductRelationship',
            sourceProductId: data.sourceProductId,
            targetProductId: data.targetProductId,
          },
        });
      }

      // Check if relationship already exists
      const existingRelationship = await prisma.productRelationship.findFirst({
        where: {
          sourceProductId: data.sourceProductId,
          targetProductId: data.targetProductId,
          type: data.type,
        },
      });

      if (existingRelationship) {
        throw new StandardError({
          message: 'Product relationship already exists',
          code: ErrorCodes.DATA.CONFLICT,
          metadata: {
            component: 'ProductService',
            operation: 'createProductRelationship',
            sourceProductId: data.sourceProductId,
            targetProductId: data.targetProductId,
            type: data.type,
          },
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { id: createdBy } });
      if (!user) {
        throw new StandardError({
          message: 'User not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProductService',
            operation: 'createProductRelationship',
            userId: createdBy,
          },
        });
      }

      // Handle JSON fields with proper type conversion
      const prismaData: Prisma.ProductRelationshipCreateInput = {
        sourceProductId: data.sourceProductId,
        targetProductId: data.targetProductId,
        type: data.type,
        quantity: data.quantity,
        condition: relationshipConditionToPrisma(data.condition),
        createdBy,
      };

      return await prisma.productRelationship.create({
        data: prismaData,
      });
    } catch (error) {
      errorHandlingService.processError(error);
      
      // If it's already a StandardError, just rethrow it
      if (error instanceof StandardError) {
        throw error;
      }
      
      throw new StandardError({
        message: 'Failed to create product relationship',
        code: ErrorCodes.DATA.CREATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'createProductRelationship',
          sourceProductId: data.sourceProductId,
          targetProductId: data.targetProductId,
          type: data.type,
          createdBy,
        },
      });
    }
  }

  async getProductRelationships(
    productId: string,
    type?: RelationshipType
  ): Promise<ProductRelationship[]> {
    try {
      const where: any = {
        OR: [{ sourceProductId: productId }, { targetProductId: productId }],
      };

      if (type) {
        where.type = type;
      }

      return await prisma.productRelationship.findMany({
        where,
        include: {
          sourceProduct: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          targetProduct: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve product relationships',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'getProductRelationships',
          productId,
          type,
        },
      });
    }
  }

  // Business logic methods
  async toggleProductStatus(id: string): Promise<Product> {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        select: { isActive: true },
      });

      if (!product) {
        throw new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: { component: 'ProductService', operation: 'toggleProductStatus', productId: id },
        });
      }

      return await prisma.product.update({
        where: { id },
        data: { isActive: !product.isActive },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      if (error instanceof StandardError) throw error;
      throw new StandardError({
        message: 'Failed to toggle product status',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: { component: 'ProductService', operation: 'toggleProductStatus', productId: id },
      });
    }
  }

  async updateProductVersion(id: string): Promise<Product> {
    try {
      return await prisma.product.update({
        where: { id },
        data: {
          version: { increment: 1 },
        },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          cause: error,
          metadata: { component: 'ProductService', operation: 'updateProductVersion', productId: id },
        });
      }
      throw new StandardError({
        message: 'Failed to update product version',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: { component: 'ProductService', operation: 'updateProductVersion', productId: id },
      });
    }
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        where: {
          category: { has: category },
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve products by category',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService',
          operation: 'getProductsByCategory',
          category,
        },
      });
    }
  }

  async searchProducts(query: string, limit?: number): Promise<Product[]> {
    try {
      const searchLimit = limit || 20;
      const searchQuery = query.trim().toLowerCase();

      return await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { sku: { contains: searchQuery, mode: 'insensitive' } },
            { tags: { hasSome: [searchQuery] } },
          ],
          isActive: true,
        },
        take: searchLimit,
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to search products',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProductService', 
          operation: 'searchProducts',
          query,
          limit,
        },
      });
    }
  }

  async getProductAnalytics(id: string): Promise<ProductAnalytics> {
    try {
      const [product, proposalProducts, validationIssues] = await Promise.all([
        prisma.product.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            category: true,
            usageAnalytics: true,
          },
        }),
        prisma.proposalProduct.findMany({
          where: { productId: id },
          include: {
            proposal: {
              select: {
                status: true,
                value: true,
              },
            },
          },
        }),
        prisma.validationIssue.count({
          where: {
            proposalProduct: {
              productId: id,
            },
            status: 'OPEN',
          },
        }),
      ]);

      if (!product) {
        throw new StandardError({
          message: 'Product not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: { component: 'ProductService', operation: 'getProductAnalytics', productId: id },
        });
      }

      const totalUsage = proposalProducts.length;
      const revenueGenerated = proposalProducts.reduce((sum, pp) => sum + pp.total, 0);
      const averageQuantity =
        totalUsage > 0
          ? proposalProducts.reduce((sum, pp) => sum + pp.quantity, 0) / totalUsage
          : 0;

      const successfulProposals = proposalProducts.filter(
        pp => pp.proposal.status === 'ACCEPTED' || pp.proposal.status === 'APPROVED'
      ).length;

      const successRate = totalUsage > 0 ? (successfulProposals / totalUsage) * 100 : 0;

      return {
        productId: id,
        totalUsage,
        successRate,
        averageConfigurationTime: 0, // This would come from actual tracking data
        validationFailures: validationIssues,
        relationshipIssues: 0, // This would need specific tracking
        revenueGenerated,
        proposalsIncluded: totalUsage,
        averageQuantity,
        topCategories: product.category,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      if (error instanceof StandardError) throw error;
      throw new StandardError({
        message: 'Failed to retrieve product analytics',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: { component: 'ProductService', operation: 'getProductAnalytics', productId: id },
      });
    }
  }

  // Statistics and reporting
  async getProductStats(filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    category?: string[];
    isActive?: boolean;
  }): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    totalRevenue: number;
    averagePrice: number;
    mostUsedProducts: Array<{ id: string; name: string; usage: number }>;
  }> {
    try {
      const where: any = {};

      if (filters) {
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.category && filters.category.length > 0) {
          where.category = { hasSome: filters.category };
        }
        if (filters.dateFrom || filters.dateTo) {
          where.createdAt = {};
          if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
          if (filters.dateTo) where.createdAt.lte = filters.dateTo;
        }
      }

      const [total, active, inactive, priceStats, categoryStats, usageStats] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.count({ where: { ...where, isActive: true } }),
        prisma.product.count({ where: { ...where, isActive: false } }),
        prisma.product.aggregate({
          where,
          _avg: { price: true },
        }),
        prisma.product.findMany({
          where,
          select: { category: true },
        }),
        prisma.proposalProduct.groupBy({
          by: ['productId'],
          _count: { productId: true },
          orderBy: { _count: { productId: 'desc' } },
          take: 10,
        }),
      ]);

      // Calculate category distribution
      const categoryMap = new Map<string, number>();
      categoryStats.forEach(product => {
        product.category.forEach(cat => {
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
      });

      const byCategory = Object.fromEntries(categoryMap.entries());

      // Get most used products with details
      const productIds = usageStats.map(stat => stat.productId);
      const productDetails = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });

      const mostUsedProducts = usageStats.map(stat => {
        const product = productDetails.find(p => p.id === stat.productId);
        return {
          id: stat.productId,
          name: product?.name || 'Unknown',
          usage: stat._count.productId,
        };
      });

      // Calculate total revenue from product sales
      const revenueResult = await prisma.proposalProduct.aggregate({
        _sum: { total: true },
      });

      return {
        total,
        active,
        inactive,
        byCategory,
        totalRevenue: revenueResult._sum.total || 0,
        averagePrice: priceStats._avg.price || 0,
        mostUsedProducts,
      };
    } catch (error) {
      errorHandlingService.processError(error);
      throw new StandardError({
        message: 'Failed to retrieve product statistics',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: { 
          component: 'ProductService', 
          operation: 'getProductStats',
          filters: JSON.stringify(filters),
        },
      });
    }
  }
}

// Singleton instance
export const productService = new ProductService();
