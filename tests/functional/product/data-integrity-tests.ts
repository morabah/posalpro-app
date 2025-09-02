#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Data Integrity Tests
 * Tests data consistency, SKU uniqueness, and referential integrity for products
 */

import { ApiClient } from './api-client';

export class DataIntegrityTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔒 Testing Product Data Integrity');
    this.api.resetTracking();

    const tests = [
      {
        name: 'SKU uniqueness constraint',
        test: async () => {
          // Create a product with a specific SKU
          const baseSku = `UNIQUE-${Date.now()}`;
          const product1 = await this.api.createTestProduct({
            name: `Unique Test Product 1 ${Date.now()}`,
            sku: baseSku,
            price: 49.99,
            stockQuantity: 10,
            category: 'Test',
            status: 'ACTIVE',
          });

          if (!product1?.id) {
            throw new Error('Failed to create first test product');
          }

          // Try to create another product with the same SKU
          const duplicateRes = await this.api.request('POST', '/api/products', {
            name: `Duplicate SKU Test ${Date.now()}`,
            sku: baseSku, // Same SKU
            price: 59.99,
            stockQuantity: 15,
            category: 'Test',
            status: 'ACTIVE',
          });

          // Cleanup first product
          await this.api.cleanupTestProduct(product1.id);

          if (duplicateRes.status === 400 || duplicateRes.status === 409) {
            return { uniquenessEnforced: true, status: duplicateRes.status };
          }

          // If creation succeeded, cleanup the duplicate and fail the test
          if (duplicateRes.status === 200 || duplicateRes.status === 201) {
            const duplicateData = await duplicateRes.json();
            const duplicateProduct = duplicateData.data || duplicateData;
            if (duplicateProduct?.id) {
              await this.api.cleanupTestProduct(duplicateProduct.id);
            }
            throw new Error('SKU uniqueness constraint not enforced');
          }

          return { uniquenessEnforced: false, status: duplicateRes.status };
        },
      },
      {
        name: 'Price validation (non-negative)',
        test: async () => {
          const invalidPrices = [-10, -0.01, -100];

          for (const price of invalidPrices) {
            const res = await this.api.request('POST', '/api/products', {
              name: `Invalid Price Test ${Date.now()}`,
              sku: `PRICE-${Date.now()}-${price}`,
              price: price,
              stockQuantity: 5,
              category: 'Test',
              status: 'ACTIVE',
            });

            if (res.status === 200 || res.status === 201) {
              // Cleanup if creation succeeded unexpectedly
              const data = await res.json();
              const product = data.data || data;
              if (product?.id) {
                await this.api.cleanupTestProduct(product.id);
              }
              throw new Error(`Price validation failed for negative price: ${price}`);
            }
          }

          return { validationWorking: true, testedPrices: invalidPrices };
        },
      },
      {
        name: 'Stock quantity validation (non-negative)',
        test: async () => {
          const invalidStocks = [-1, -5, -100];

          for (const stock of invalidStocks) {
            const res = await this.api.request('POST', '/api/products', {
              name: `Invalid Stock Test ${Date.now()}`,
              sku: `STOCK-${Date.now()}-${stock}`,
              price: 29.99,
              stockQuantity: stock,
              category: 'Test',
              status: 'ACTIVE',
            });

            if (res.status === 200 || res.status === 201) {
              // Cleanup if creation succeeded unexpectedly
              const data = await res.json();
              const product = data.data || data;
              if (product?.id) {
                await this.api.cleanupTestProduct(product.id);
              }
              throw new Error(`Stock validation failed for negative quantity: ${stock}`);
            }
          }

          return { validationWorking: true, testedStocks: invalidStocks };
        },
      },
      {
        name: 'Required field validation',
        test: async () => {
          const requiredFields = ['name', 'sku', 'price', 'stockQuantity', 'status'];
          const missingFieldTests = [];

          for (const field of requiredFields) {
            const productData: any = {
              name: `Required Field Test ${Date.now()}`,
              sku: `REQ-${Date.now()}`,
              price: 39.99,
              stockQuantity: 8,
              category: 'Test',
              status: 'ACTIVE',
            };

            // Remove the required field
            delete productData[field];

            const res = await this.api.request('POST', '/api/products', productData);

            if (res.status === 200 || res.status === 201) {
              // Cleanup if creation succeeded unexpectedly
              const data = await res.json();
              const product = data.data || data;
              if (product?.id) {
                await this.api.cleanupTestProduct(product.id);
              }
              missingFieldTests.push({ field, validationFailed: false });
            } else {
              missingFieldTests.push({ field, validationFailed: true });
            }
          }

          const allValidated = missingFieldTests.every(test => test.validationFailed);

          if (!allValidated) {
            const failedFields = missingFieldTests
              .filter(test => !test.validationFailed)
              .map(test => test.field);
            throw new Error(`Required field validation failed for: ${failedFields.join(', ')}`);
          }

          return { validationWorking: true, testedFields: requiredFields };
        },
      },
      {
        name: 'Product status enum validation',
        test: async () => {
          const validStatuses = ['ACTIVE', 'INACTIVE', 'DISCONTINUED'];
          const invalidStatuses = ['INVALID', 'PENDING', 'DELETED', null, undefined];

          // Test valid statuses
          for (const status of validStatuses) {
            const res = await this.api.request('POST', '/api/products', {
              name: `Valid Status Test ${Date.now()}`,
              sku: `STATUS-${Date.now()}-${status}`,
              price: 19.99,
              stockQuantity: 3,
              category: 'Test',
              status: status,
            });

            if (res.status === 200 || res.status === 201) {
              const data = await res.json();
              const product = data.data || data;
              if (product?.id) {
                await this.api.cleanupTestProduct(product.id);
              }
            } else {
              throw new Error(`Valid status rejected: ${status}`);
            }
          }

          // Test invalid statuses
          for (const status of invalidStatuses) {
            const res = await this.api.request('POST', '/api/products', {
              name: `Invalid Status Test ${Date.now()}`,
              sku: `STATUS-${Date.now()}-${status || 'null'}`,
              price: 19.99,
              stockQuantity: 3,
              category: 'Test',
              status: status,
            });

            if (res.status === 200 || res.status === 201) {
              // Cleanup if creation succeeded unexpectedly
              const data = await res.json();
              const product = data.data || data;
              if (product?.id) {
                await this.api.cleanupTestProduct(product.id);
              }
              throw new Error(`Invalid status accepted: ${status}`);
            }
          }

          return {
            enumValidationWorking: true,
            validStatusesTested: validStatuses,
            invalidStatusesTested: invalidStatuses,
          };
        },
      },
      {
        name: 'Data consistency after updates',
        test: async () => {
          // Create a test product
          const testProduct = await this.api.createTestProduct({
            name: `Consistency Test Product ${Date.now()}`,
            sku: `CONSISTENCY-${Date.now()}`,
            price: 89.99,
            stockQuantity: 12,
            category: 'Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for consistency check');
          }

          // Update the product
          const updateData = {
            price: 99.99,
            stockQuantity: 15,
            category: 'Updated Test',
          };

          const updateRes = await this.api.request(
            'PATCH',
            `/api/products/${testProduct.id}`,
            updateData
          );
          if (updateRes.status !== 200) {
            await this.api.cleanupTestProduct(testProduct.id);
            throw new Error(`Update failed with status: ${updateRes.status}`);
          }

          // Verify the update
          const verifyRes = await this.api.request('GET', `/api/products/${testProduct.id}`);
          if (verifyRes.status !== 200) {
            await this.api.cleanupTestProduct(testProduct.id);
            throw new Error(`Verification failed with status: ${verifyRes.status}`);
          }

          const verifyData = await verifyRes.json();
          const updatedProduct = verifyData.data || verifyData;

          // Check data consistency
          const isConsistent =
            updatedProduct.price === updateData.price &&
            updatedProduct.stockQuantity === updateData.stockQuantity &&
            updatedProduct.category === updateData.category &&
            updatedProduct.name === testProduct.name && // Should remain unchanged
            updatedProduct.sku === testProduct.sku; // Should remain unchanged

          // Cleanup
          await this.api.cleanupTestProduct(testProduct.id);

          if (!isConsistent) {
            throw new Error('Data consistency check failed after update');
          }

          return {
            consistencyMaintained: true,
            verifiedFields: ['price', 'stockQuantity', 'category', 'name', 'sku'],
          };
        },
      },
      {
        name: 'Product relationships integrity',
        test: async () => {
          // Get some products
          const productsRes = await this.api.request('GET', '/api/products?limit=5');
          const productsData = await productsRes.json();

          if (!productsData.data?.items || productsData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No products available for relationship test' };
          }

          const products = productsData.data.items;
          let relationshipsValid = 0;
          let totalRelationships = 0;

          // Check if products have consistent relationships (if any)
          for (const product of products) {
            // If product has a category, it should be a string
            if (product.category !== undefined) {
              totalRelationships++;
              if (typeof product.category === 'string' && product.category.length > 0) {
                relationshipsValid++;
              }
            }

            // Check createdAt and updatedAt consistency
            if (product.createdAt && product.updatedAt) {
              totalRelationships++;
              const created = new Date(product.createdAt);
              const updated = new Date(product.updatedAt);
              if (created <= updated) {
                relationshipsValid++;
              }
            }
          }

          const relationshipIntegrity =
            totalRelationships === 0 ? 1 : relationshipsValid / totalRelationships;

          return {
            relationshipsChecked: totalRelationships,
            relationshipsValid,
            integrityScore: `${(relationshipIntegrity * 100).toFixed(1)}%`,
            dataRelationshipsConsistent: relationshipIntegrity === 1,
          };
        },
      },
    ];

    const results = [];

    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        results.push({
          test: name,
          status: 'PASS',
          duration: Date.now() - start,
          result,
        });
      } catch (error: any) {
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
        });
      }
    }

    return results;
  }
}
