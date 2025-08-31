// Product Service - New Architecture
import { ErrorCodes, ErrorHandlingService } from '@/lib/errors';
import { http } from '@/lib/http';
import { logDebug, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ====================
// Import consolidated schemas
// ====================

import {
  BulkDeleteSchema,
  ProductCreateSchema,
  ProductQuerySchema,
  ProductRelationshipCreateSchema,
  ProductUpdateSchema,
  type Product,
  type ProductCreate,
  type ProductList,
  type ProductQuery,
  type ProductRelationship,
  type ProductRelationshipCreate,
  type ProductUpdate,
  type ProductWithRelationships,
} from '@/features/products/schemas';

// Re-export types for backward compatibility
export type {
  Product,
  ProductCreate,
  ProductList,
  ProductQuery,
  ProductRelationship,
  ProductRelationshipCreate,
  ProductUpdate,
  ProductWithRelationships,
};

// ====================
// Use consolidated types from features/products/schemas
// ====================

export type BulkDelete = z.infer<typeof BulkDeleteSchema>;

// ====================
// Service Class
// ====================

export class ProductService {
  private baseUrl = '/api/products';
  private errorHandlingService = ErrorHandlingService.getInstance();

  /**
   * Get list of products with cursor pagination
   */
  async getProducts(params: ProductQuery): Promise<ProductList> {
    const validatedParams = ProductQuerySchema.parse(params);
    const searchParams = new URLSearchParams();

    Object.entries(validatedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    logDebug('Fetching products', {
      component: 'ProductService',
      operation: 'getProducts',
      params: validatedParams,
    });

    try {
      const response = await http.get<ProductList>(`${this.baseUrl}?${searchParams.toString()}`);

      logInfo('Products fetched successfully', {
        component: 'ProductService',
        operation: 'getProducts',
        count: response?.items?.length || 0,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch products',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProductService',
          operation: 'getProducts',
        }
      );
      throw processed;
    }
  }

  /**
   * Get product categories (simplified list)
   */
  async getCategories(options: { includeStats?: boolean; activeOnly?: boolean } = {}): Promise<{
    categories: Array<{ name: string; count: number; avgPrice: number; totalUsage: number }>;
  }> {
    const includeStats = options.includeStats === true;
    const activeOnly = options.activeOnly !== false; // default true

    logDebug('Fetching product categories', {
      component: 'ProductService',
      operation: 'getCategories',
      includeStats,
      activeOnly,
    });

    try {
      const params = new URLSearchParams();
      if (includeStats) params.set('includeStats', 'true');
      if (!activeOnly) params.set('activeOnly', 'false');
      const response = await http.get<{
        categories: Array<{ name: string; count: number; avgPrice: number; totalUsage: number }>;
      }>(`${this.baseUrl}/categories?${params.toString()}`);
      logInfo('Product categories fetched successfully', {
        component: 'ProductService',
        operation: 'getCategories',
        count: response?.categories?.length || 0,
      });
      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch product categories',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProductService',
          operation: 'getCategories',
        }
      );
      throw processed;
    }
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    logDebug('Fetching product', {
      component: 'ProductService',
      operation: 'getProduct',
      productId: id,
    });

    try {
      const response = await http.get<Product>(`${this.baseUrl}/${id}`);

      logInfo('Product fetched successfully', {
        component: 'ProductService',
        operation: 'getProduct',
        productId: id,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch product',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProductService',
          operation: 'getProduct',
          productId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Get product with relationships
   */
  async getProductWithRelationships(id: string): Promise<ProductWithRelationships> {
    logDebug('Fetching product with relationships', {
      component: 'ProductService',
      operation: 'getProductWithRelationships',
      productId: id,
    });

    try {
      const response = await http.get<ProductWithRelationships>(
        `${this.baseUrl}/${id}/relationships`
      );

      logInfo('Product with relationships fetched successfully', {
        component: 'ProductService',
        operation: 'getProductWithRelationships',
        productId: id,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch product with relationships',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProductService',
          operation: 'getProductWithRelationships',
          productId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Create new product
   */
  async createProduct(data: ProductCreate): Promise<Product> {
    const validatedData = ProductCreateSchema.parse(data);

    logDebug('Creating product', {
      component: 'ProductService',
      operation: 'createProduct',
      productData: validatedData,
    });

    try {
      const response = await http.post<Product>(this.baseUrl, validatedData);

      logInfo('Product created successfully', {
        component: 'ProductService',
        operation: 'createProduct',
        productId: response?.id || 'unknown',
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create product',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'ProductService',
          operation: 'createProduct',
        }
      );
      throw processed;
    }
  }

  /**
   * Update existing product
   */
  async updateProduct(id: string, data: ProductUpdate): Promise<Product> {
    const validatedData = ProductUpdateSchema.parse(data);

    logDebug('Updating product', {
      component: 'ProductService',
      operation: 'updateProduct',
      productId: id,
      productData: validatedData,
      dataKeys: Object.keys(validatedData),
    });

    try {
      const response = await http.patch<Product>(`${this.baseUrl}/${id}`, validatedData);

      logInfo('Product updated successfully', {
        component: 'ProductService',
        operation: 'updateProduct',
        productId: id,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to update product',
        ErrorCodes.DATA.UPDATE_FAILED,
        {
          component: 'ProductService',
          operation: 'updateProduct',
          productId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<void> {
    logDebug('Deleting product', {
      component: 'ProductService',
      operation: 'deleteProduct',
      productId: id,
    });

    try {
      const response = await http.delete(`${this.baseUrl}/${id}`);

      logInfo('Product deleted successfully', {
        component: 'ProductService',
        operation: 'deleteProduct',
        productId: id,
      });

      return;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete product',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'ProductService',
          operation: 'deleteProduct',
          productId: id,
        }
      );
      throw processed;
    }
  }

  /**
   * Bulk delete products
   */
  async deleteProductsBulk(ids: string[]): Promise<{ deleted: number }> {
    const validatedData = BulkDeleteSchema.parse({ ids });

    logDebug('Bulk deleting products', {
      component: 'ProductService',
      operation: 'deleteProductsBulk',
      productIds: validatedData.ids,
    });

    try {
      const response = await http.post<{ deleted: number }>(
        `${this.baseUrl}/bulk-delete`,
        validatedData
      );

      logInfo('Products bulk deleted successfully', {
        component: 'ProductService',
        operation: 'deleteProductsBulk',
        deletedCount: response?.deleted || 0,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to bulk delete products',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'ProductService',
          operation: 'deleteProductsBulk',
        }
      );
      throw processed;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    logDebug('Searching products', {
      component: 'ProductService',
      operation: 'searchProducts',
      query,
      limit,
    });

    try {
      const response = await http.get<Product[]>(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );

      logInfo('Products search completed', {
        component: 'ProductService',
        operation: 'searchProducts',
        query,
        resultCount: response?.length || 0,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to search products',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProductService',
          operation: 'searchProducts',
          query,
        }
      );
      throw processed;
    }
  }

  /**
   * Create product relationship
   */
  async createRelationship(
    sourceProductId: string,
    data: ProductRelationshipCreate
  ): Promise<ProductRelationship> {
    const validatedData = ProductRelationshipCreateSchema.parse(data);

    logDebug('Creating product relationship', {
      component: 'ProductService',
      operation: 'createRelationship',
      sourceProductId,
      relationshipData: validatedData,
    });

    try {
      const response = await http.post<ProductRelationship>(
        `${this.baseUrl}/${sourceProductId}/relationships`,
        validatedData
      );

      logInfo('Product relationship created successfully', {
        component: 'ProductService',
        operation: 'createRelationship',
        sourceProductId,
        targetProductId: validatedData.targetProductId,
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to create product relationship',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'ProductService',
          operation: 'createRelationship',
          sourceProductId,
        }
      );
      throw processed;
    }
  }

  /**
   * Delete product relationship
   */
  async deleteRelationship(sourceProductId: string, relationshipId: string): Promise<void> {
    logDebug('Deleting product relationship', {
      component: 'ProductService',
      operation: 'deleteRelationship',
      sourceProductId,
      relationshipId,
    });

    try {
      const response = await http.delete(
        `${this.baseUrl}/${sourceProductId}/relationships/${relationshipId}`
      );

      logInfo('Product relationship deleted successfully', {
        component: 'ProductService',
        operation: 'deleteRelationship',
        sourceProductId,
        relationshipId,
      });

      return;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to delete product relationship',
        ErrorCodes.DATA.DELETE_FAILED,
        {
          component: 'ProductService',
          operation: 'deleteRelationship',
          sourceProductId,
          relationshipId,
        }
      );
      throw processed;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    draft: number;
    categories: Record<string, number>;
  }> {
    logDebug('Fetching product statistics', {
      component: 'ProductService',
      operation: 'getProductStats',
    });

    try {
      const response = await http.get<{
        total: number;
        active: number;
        inactive: number;
        draft: number;
        categories: Record<string, number>;
      }>(`${this.baseUrl}/stats`);

      logInfo('Product statistics fetched successfully', {
        component: 'ProductService',
        operation: 'getProductStats',
      });

      return response;
    } catch (error: unknown) {
      const processed = this.errorHandlingService.processError(
        error,
        'Failed to fetch product statistics',
        ErrorCodes.DATA.QUERY_FAILED,
        {
          component: 'ProductService',
          operation: 'getProductStats',
        }
      );
      throw processed;
    }
  }

  // Static schema properties for API routes
  static ProductQuerySchema = ProductQuerySchema;
  static ProductCreateSchema = ProductCreateSchema;
  static ProductUpdateSchema = ProductUpdateSchema;
  static ProductRelationshipCreateSchema = ProductRelationshipCreateSchema;
  static BulkDeleteSchema = BulkDeleteSchema;
}

// ====================
// Export Default Instance
// ====================

export const productService = new ProductService();
export default productService;
