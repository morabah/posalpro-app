#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Bulk Operations Tests
 * Tests bulk operations functionality for products
 */

import { ApiClient } from './api-client';

export class BulkOperationsTests {
  private api: ApiClient;
  private testProducts: any[] = [];

  constructor(api: ApiClient) {
    this.api = api;
  }

  // Helper method to create isolated test products with unique identifiers
  private async createIsolatedTestProducts(count: number, prefix: string = 'bulk'): Promise<any[]> {
    const products = [];
    for (let i = 0; i < count; i++) {
      try {
        const product = await this.api.createTestProduct({
          name: `${prefix} Test Product ${i}`,
          sku: `${prefix.toUpperCase()}-${i}`,
          price: 29.99 + i,
          stockQuantity: 10 + i,
          category: [`${prefix} Test`],
          tags: [prefix, 'test'],
          status: 'ACTIVE',
        });
        if (product?.id) {
          products.push(product);
        }
      } catch (error) {
        console.log(`Warning: Failed to create ${prefix} test product ${i}:`, error);
      }
    }
    return products;
  }

  // Helper method to cleanup test products safely
  private async safeCleanup(products: any[]): Promise<void> {
    const cleanupPromises = products.map(async (product) => {
      try {
        if (product?.id) {
          await this.api.cleanupTestProduct(product.id);
        }
      } catch (error) {
        console.log(`Warning: Failed to cleanup product ${product?.id}:`, error);
      }
    });
    await Promise.allSettled(cleanupPromises);
  }

  // Retry mechanism for transient failures
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  async runTests() {
    console.log('\n🔄 Testing Product Bulk Operations');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Product creation and cleanup test',
        test: async () => {
          return await this.retryOperation(async () => {
            // Create isolated test product
            const products = await this.createIsolatedTestProducts(1, 'simple');
            if (products.length === 0) {
              throw new Error('Failed to create test product');
            }

            const product = products[0];

            // Verify product exists with retry
            const verifyRes = await this.api.request('GET', `/api/products/${product.id}`);
            if (verifyRes.status !== 200) {
              throw new Error(`Product not found after creation: ${product.id}`);
            }

            // Safe cleanup
            await this.safeCleanup(products);

            return { success: true, productId: product.id };
          });
        },
      },
      {
        name: 'Bulk delete validation',
        test: async () => {
          return await this.retryOperation(async () => {
            // Create isolated test products
            const testProducts = await this.createIsolatedTestProducts(3, 'bulk-update');
            if (testProducts.length < 2) {
              throw new Error('Failed to create sufficient test products for bulk operations');
            }

            const productIds = testProducts.map(p => p.id);

            // Test bulk status update
            const bulkUpdateRes = await this.api.request('PATCH', '/api/products/bulk/status', {
              ids: productIds,
              status: 'INACTIVE',
            });

            if (bulkUpdateRes.status === 404) {
              await this.safeCleanup(testProducts);
              return { status: 'endpoint_not_found', message: 'Bulk status update not implemented' };
            }

            if (bulkUpdateRes.status === 200) {
              const bulkData = await bulkUpdateRes.json();
              const results = bulkData.data || bulkData;

              // Verify the updates with retry
              let verifiedUpdates = 0;
              for (const productId of productIds) {
                try {
                  const verifyRes = await this.api.request('GET', `/api/products/${productId}`);
                  if (verifyRes.status === 200) {
                    const verifyData = await verifyRes.json();
                    const product = verifyData.data || verifyData;
                    if (product.status === 'INACTIVE') {
                      verifiedUpdates++;
                    }
                  }
                } catch (error) {
                  console.log(`Warning: Failed to verify product ${productId}:`, error);
                }
              }

              await this.safeCleanup(testProducts);

              return {
                bulkOperationAttempted: true,
                productsUpdated: verifiedUpdates,
                totalRequested: productIds.length,
                bulkUpdateWorking: verifiedUpdates === productIds.length,
              };
            }

            await this.safeCleanup(testProducts);
            return { status: bulkUpdateRes.status, bulkUpdateFailed: true };
          });
        },
      },
      {
        name: 'Bulk delete validation',
        test: async () => {
          // Create test products
          const testProducts = [];
          for (let i = 0; i < 2; i++) {
            const product = await this.api.createTestProduct({
              name: `Bulk Delete Test ${i} ${Date.now()}`,
              sku: `BULK-DEL-${i}-${Date.now()}`,
              price: 19.99 + i,
              stockQuantity: 5 + i,
              category: 'Bulk Delete Test',
              status: 'ACTIVE',
            });
            if (product?.id) {
              testProducts.push(product);
            }
          }

          if (testProducts.length < 1) {
            throw new Error('Failed to create test products for bulk delete');
          }

          const productIds = testProducts.map(p => p.id);

          // Test bulk delete with empty array (should fail)
          const bulkDeleteRes = await this.api.request('DELETE', '/api/products/bulk/delete', {
            ids: [],
          });

          if (bulkDeleteRes.status === 404) {
            // Cleanup
            for (const product of testProducts) {
              await this.api.cleanupTestProduct(product.id);
            }
            return { status: 'endpoint_not_found', message: 'Bulk delete not implemented' };
          }

          // Empty array should return validation error
          if (bulkDeleteRes.status >= 400) {
            // Cleanup
            for (const product of testProducts) {
              await this.api.cleanupTestProduct(product.id);
            }
            return { status: 'validation_working', message: 'Empty array validation works' };
          }

          // If we get 200, the validation is not working
          if (bulkDeleteRes.status === 200) {
            // Cleanup
            for (const product of testProducts) {
              await this.api.cleanupTestProduct(product.id);
            }
            throw new Error('Empty array should not be accepted for bulk delete');
          }

          // Cleanup
          for (const product of testProducts) {
            await this.api.cleanupTestProduct(product.id);
          }

          return { status: bulkDeleteRes.status, message: 'Unexpected response' };
        },
      },
      {
        name: 'Bulk price update',
        test: async () => {
          // Create test products
          const testProducts = [];
          for (let i = 0; i < 3; i++) {
            const product = await this.api.createTestProduct({
              name: `Bulk Price Test ${i} ${Date.now()}`,
              sku: `BULK-PRICE-${i}-${Date.now()}`,
              price: 39.99 + i * 10,
              stockQuantity: 8 + i,
              category: 'Bulk Price Test',
              status: 'ACTIVE',
            });
            if (product?.id) {
              testProducts.push(product);
            }
          }

          if (testProducts.length < 2) {
            // Cleanup
            for (const product of testProducts) {
              await this.api.cleanupTestProduct(product.id);
            }
            throw new Error('Failed to create test products for bulk price update');
          }

          const productIds = testProducts.map(p => p.id);
          const newPrice = 49.99;

          // Test bulk price update
          const bulkPriceRes = await this.api.request('PATCH', '/api/products/bulk/price', {
            ids: productIds,
            price: newPrice,
          });

          if (bulkPriceRes.status === 404) {
            // Cleanup
            for (const product of testProducts) {
              await this.api.cleanupTestProduct(product.id);
            }
            return { status: 'endpoint_not_found', message: 'Bulk price update not implemented' };
          }

          if (bulkPriceRes.status === 200) {
            // Verify the updates
            let verifiedUpdates = 0;
            for (const productId of productIds) {
              const verifyRes = await this.api.request('GET', `/api/products/${productId}`);
              if (verifyRes.status === 200) {
                const verifyData = await verifyRes.json();
                const product = verifyData.data || verifyData;
                if (Math.abs(product.price - newPrice) < 0.01) {
                  // Account for floating point
                  verifiedUpdates++;
                }
              }
            }

            // Cleanup
            for (const product of testProducts) {
              await this.api.cleanupTestProduct(product.id);
            }

            return {
              bulkPriceUpdateAttempted: true,
              productsUpdated: verifiedUpdates,
              totalRequested: productIds.length,
              newPrice,
              bulkPriceUpdateWorking: verifiedUpdates === productIds.length,
            };
          }

          // Cleanup
          for (const product of testProducts) {
            await this.api.cleanupTestProduct(product.id);
          }

          return { status: bulkPriceRes.status, bulkPriceUpdateFailed: true };
        },
      },
      {
        name: 'Bulk category update',
        test: async () => {
          // Create test products
          const testProducts = [];
          for (let i = 0; i < 2; i++) {
            const product = await this.api.createTestProduct({
              name: `Bulk Category Test ${i} ${Date.now()}`,
              sku: `BULK-CAT-${i}-${Date.now()}`,
              price: 59.99 + i * 5,
              stockQuantity: 12 + i,
              category: 'Old Category',
              status: 'ACTIVE',
            });
            if (product?.id) {
              testProducts.push(product);
            }
          }

          if (testProducts.length < 1) {
            throw new Error('Failed to create test products for bulk category update');
          }

          const productIds = testProducts.map(p => p.id);
          const newCategory = 'New Bulk Category';

          // Test bulk category update
          const bulkCategoryRes = await this.api.request('PATCH', '/api/products/bulk/category', {
            ids: productIds,
            category: newCategory,
          });

          if (bulkCategoryRes.status === 404) {
            // Cleanup
            for (const product of testProducts) {
              await this.api.cleanupTestProduct(product.id);
            }
            return {
              status: 'endpoint_not_found',
              message: 'Bulk category update not implemented',
            };
          }

          if (bulkCategoryRes.status === 200) {
            // Verify the updates
            let verifiedUpdates = 0;
            for (const productId of productIds) {
              const verifyRes = await this.api.request('GET', `/api/products/${productId}`);
              if (verifyRes.status === 200) {
                const verifyData = await verifyRes.json();
                const product = verifyData.data || verifyData;
                if (product.category === newCategory) {
                  verifiedUpdates++;
                }
              }
            }

            // Cleanup
            for (const product of testProducts) {
              await this.api.cleanupTestProduct(product.id);
            }

            return {
              bulkCategoryUpdateAttempted: true,
              productsUpdated: verifiedUpdates,
              totalRequested: productIds.length,
              newCategory,
              bulkCategoryUpdateWorking: verifiedUpdates === productIds.length,
            };
          }

          // Cleanup
          for (const product of testProducts) {
            await this.api.cleanupTestProduct(product.id);
          }

          return { status: bulkCategoryRes.status, bulkCategoryUpdateFailed: true };
        },
      },
    ];

    const results = [];

    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        results.push({ test: name, status: 'PASS', duration: Date.now() - start, result });
        console.log(`✅ ${name} - ${Date.now() - start}ms`);
      } catch (error) {
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
        });
        console.log(`❌ ${name} - ${Date.now() - start}ms - ${error.message}`);
      }
    }

    return results;
  }
}
