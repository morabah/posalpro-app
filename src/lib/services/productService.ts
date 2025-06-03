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
          attributes: data.attributes,
          images: data.images || [],
          userStoryMappings: data.userStoryMappings || [],
        },
      });
    } catch (error) {
      if (isPrismaError(error)) {
        if (error.code === 'P2002') {
          throw new Error('A product with this SKU already exists');
        }
      }
      throw new Error('Failed to create product');
    }
  }

  async updateProduct(data: UpdateProductData): Promise<Product> {
    try {
      const { id, ...updateData } = data;
      return await prisma.product.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (isPrismaError(error)) {
        if (error.code === 'P2025') {
          throw new Error('Product not found');
        }
        if (error.code === 'P2002') {
          throw new Error('SKU already exists');
        }
      }
      throw new Error('Failed to update product');
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      // Check if product is used in any proposals
      const proposalCount = await prisma.proposalProduct.count({
        where: { productId: id },
      });

      if (proposalCount > 0) {
        throw new Error('Cannot delete product that is used in proposals');
      }

      await prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Product not found');
      }
      throw new Error('Failed to delete product');
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await prisma.product.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new Error('Failed to retrieve product');
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
      throw new Error('Failed to retrieve product with relationships');
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
      throw new Error('Failed to retrieve product with validation rules');
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
      throw new Error('Failed to retrieve products');
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
        throw new Error('One or both products not found');
      }

      // Check for circular relationships
      if (data.sourceProductId === data.targetProductId) {
        throw new Error('Cannot create relationship between a product and itself');
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
        throw new Error('Relationship already exists');
      }

      return await prisma.productRelationship.create({
        data: {
          sourceProductId: data.sourceProductId,
          targetProductId: data.targetProductId,
          type: data.type,
          quantity: data.quantity,
          condition: data.condition as any,
          createdBy,
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2003') {
        throw new Error('Referenced product or user not found');
      }
      throw new Error('Failed to create product relationship');
    }
  }

  async deleteProductRelationship(id: string): Promise<void> {
    try {
      await prisma.productRelationship.delete({
        where: { id },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Product relationship not found');
      }
      throw new Error('Failed to delete product relationship');
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
      throw new Error('Failed to retrieve product relationships');
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
        throw new Error('Product not found');
      }

      return await prisma.product.update({
        where: { id },
        data: { isActive: !product.isActive },
      });
    } catch (error) {
      throw new Error('Failed to toggle product status');
    }
  }

  async updateProductVersion(id: string): Promise<Product> {
    try {
      return await prisma.product.update({
        where: { id },
        data: {
          version: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        throw new Error('Product not found');
      }
      throw new Error('Failed to update product version');
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
      throw new Error('Failed to retrieve products by category');
    }
  }

  async searchProducts(query: string, limit?: number): Promise<Product[]> {
    try {
      return await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
            { category: { hasSome: [query] } },
          ],
        },
        orderBy: { name: 'asc' },
        take: limit || 50,
      });
    } catch (error) {
      throw new Error('Failed to search products');
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
        throw new Error('Product not found');
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
      throw new Error('Failed to retrieve product analytics');
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
      throw new Error('Failed to retrieve product statistics');
    }
  }
}

// Singleton instance
export const productService = new ProductService();
