// Product Service - New Architecture
import { ApiResponse } from '@/lib/api/response';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ====================
// Zod Schemas
// ====================

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive').optional().or(z.null()),
  currency: z.string().default('USD'),
  sku: z.string(),
  category: z.array(z.string()),
  tags: z.array(z.string()),
  attributes: z.record(z.unknown()).optional(),
  images: z.array(z.string()),
  isActive: z.boolean().default(true),
  version: z.number().default(1),
  usageAnalytics: z.record(z.unknown()).optional(),
  userStoryMappings: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProductRelationshipSchema = z.object({
  id: z.string(),
  sourceProductId: z.string(),
  targetProductId: z.string(),
  type: z.enum(['REQUIRES', 'RECOMMENDS', 'INCOMPATIBLE', 'ALTERNATIVE', 'OPTIONAL']),
  quantity: z.number().optional(),
  condition: z.record(z.unknown()).optional(),
  validationHistory: z.record(z.unknown()).optional(),
  performanceImpact: z.record(z.unknown()).optional(),
  createdBy: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProductWithRelationshipsSchema = ProductSchema.extend({
  relationships: z.array(
    ProductRelationshipSchema.extend({
      targetProduct: ProductSchema,
    })
  ),
  relatedFrom: z.array(
    ProductRelationshipSchema.extend({
      sourceProduct: ProductSchema,
    })
  ),
});

export const ProductListSchema = z.object({
  items: z.array(ProductSchema),
  nextCursor: z.string().nullable(),
});

export const ProductCreateSchema = ProductSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const ProductQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['createdAt', 'name', 'price', 'isActive']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const ProductRelationshipCreateSchema = z.object({
  targetProductId: z.string(),
  type: z.enum(['REQUIRES', 'RECOMMENDS', 'INCOMPATIBLE', 'ALTERNATIVE', 'OPTIONAL']),
  quantity: z.number().optional(),
  condition: z.record(z.unknown()).optional(),
});

export const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

// ====================
// TypeScript Types
// ====================

export type Product = z.infer<typeof ProductSchema>;
export type ProductRelationship = z.infer<typeof ProductRelationshipSchema>;
export type ProductWithRelationships = z.infer<typeof ProductWithRelationshipsSchema>;
export type ProductList = z.infer<typeof ProductListSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type ProductRelationshipCreate = z.infer<typeof ProductRelationshipCreateSchema>;
export type BulkDelete = z.infer<typeof BulkDeleteSchema>;

// ====================
// Service Class
// ====================

export class ProductService {
  private baseUrl = '/api/products';

  /**
   * Get list of products with cursor pagination
   */
  async getProducts(params: ProductQuery): Promise<ApiResponse<ProductList>> {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to fetch products', {
        component: 'ProductService',
        operation: 'getProducts',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get single product by ID
   */
  async getProduct(id: string): Promise<ApiResponse<Product>> {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to fetch product', {
        component: 'ProductService',
        operation: 'getProduct',
        productId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get product with relationships
   */
  async getProductWithRelationships(id: string): Promise<ApiResponse<ProductWithRelationships>> {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to fetch product with relationships', {
        component: 'ProductService',
        operation: 'getProductWithRelationships',
        productId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create new product
   */
  async createProduct(data: ProductCreate): Promise<ApiResponse<Product>> {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to create product', {
        component: 'ProductService',
        operation: 'createProduct',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update existing product
   */
  async updateProduct(id: string, data: ProductUpdate): Promise<ApiResponse<Product>> {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to update product', {
        component: 'ProductService',
        operation: 'updateProduct',
        productId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
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

      return { ok: true, data: undefined };
    } catch (error) {
      logError('Failed to delete product', {
        component: 'ProductService',
        operation: 'deleteProduct',
        productId: id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Bulk delete products
   */
  async deleteProductsBulk(ids: string[]): Promise<ApiResponse<{ deleted: number }>> {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to bulk delete products', {
        component: 'ProductService',
        operation: 'deleteProductsBulk',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit: number = 10): Promise<ApiResponse<Product[]>> {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to search products', {
        component: 'ProductService',
        operation: 'searchProducts',
        query,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create product relationship
   */
  async createRelationship(
    sourceProductId: string,
    data: ProductRelationshipCreate
  ): Promise<ApiResponse<ProductRelationship>> {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to create product relationship', {
        component: 'ProductService',
        operation: 'createRelationship',
        sourceProductId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete product relationship
   */
  async deleteRelationship(
    sourceProductId: string,
    relationshipId: string
  ): Promise<ApiResponse<void>> {
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

      return { ok: true, data: undefined };
    } catch (error) {
      logError('Failed to delete product relationship', {
        component: 'ProductService',
        operation: 'deleteRelationship',
        sourceProductId,
        relationshipId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      draft: number;
      categories: Record<string, number>;
    }>
  > {
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

      return { ok: true, data: response };
    } catch (error) {
      logError('Failed to fetch product statistics', {
        component: 'ProductService',
        operation: 'getProductStats',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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
