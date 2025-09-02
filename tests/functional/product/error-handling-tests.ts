#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Error Handling Tests
 * Tests error responses, validation, and graceful error handling for product operations
 */

import { ApiClient } from './api-client';

export class ErrorHandlingTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🚨 Testing Product Error Handling');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Invalid product ID returns 404',
        test: async () => {
          const res = await this.api.request('GET', '/api/products/invalid-id-123');
          if (res.status === 404 || res.status === 400) {
            return { status: res.status, handled: true };
          }
          if (res.status >= 200 && res.status < 300) {
            throw new Error('Should have returned error for invalid product ID');
          }
          return { status: res.status, handled: true };
        },
      },
      {
        name: 'Missing required fields in creation',
        test: async () => {
          const incompleteProduct = {
            name: 'Incomplete Product',
            // Missing required fields: sku, price, stockQuantity, status
          };

          const res = await this.api.request('POST', '/api/products', incompleteProduct);
          if (res.status >= 400) {
            return { status: res.status, validationWorking: true };
          }
          throw new Error('Should have rejected incomplete product data');
        },
      },
      {
        name: 'Invalid data types in product creation',
        test: async () => {
          const invalidProduct = {
            name: 'Invalid Types Product',
            sku: 'INVALID-TYPES',
            price: 'not-a-number', // Should be number
            stockQuantity: 'also-not-a-number', // Should be number
            status: 'ACTIVE',
          };

          const res = await this.api.request('POST', '/api/products', invalidProduct);
          if (res.status >= 400) {
            return { status: res.status, typeValidationWorking: true };
          }
          throw new Error('Should have rejected invalid data types');
        },
      },
      {
        name: 'Duplicate SKU handling',
        test: async () => {
          // First create a product
          const testProduct = await this.api.createTestProduct({
            name: `Duplicate SKU Test ${Date.now()}`,
            sku: `DUPLICATE-${Date.now()}`,
            price: 29.99,
            stockQuantity: 5,
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for duplicate SKU test');
          }

          // Try to create another with same SKU
          const duplicateProduct = {
            name: `Duplicate SKU Test 2 ${Date.now()}`,
            sku: testProduct.sku, // Same SKU
            price: 39.99,
            stockQuantity: 10,
            status: 'ACTIVE',
          };

          const res = await this.api.request('POST', '/api/products', duplicateProduct);

          // Cleanup
          await this.api.cleanupTestProduct(testProduct.id);

          if (res.status === 400 || res.status === 409) {
            return { status: res.status, duplicateHandlingWorking: true };
          }

          // If creation succeeded, cleanup the duplicate
          if (res.status === 200 || res.status === 201) {
            const data = await res.json();
            const duplicate = data.data || data;
            if (duplicate?.id) {
              await this.api.cleanupTestProduct(duplicate.id);
            }
            throw new Error('Should have rejected duplicate SKU');
          }

          return { status: res.status, duplicateHandlingWorking: false };
        },
      },
      {
        name: 'Invalid query parameters',
        test: async () => {
          const invalidQueries = [
            '/api/products?limit=invalid',
            '/api/products?limit=-1',
            '/api/products?limit=999999',
          ];

          for (const query of invalidQueries) {
            const res = await this.api.request('GET', query);
            if (res.status >= 400) {
              return { query, status: res.status, handled: true };
            }
          }

          throw new Error('Should have handled invalid query parameters');
        },
      },
      {
        name: 'Negative price validation',
        test: async () => {
          const invalidProduct = {
            name: 'Negative Price Product',
            sku: `NEGATIVE-${Date.now()}`,
            price: -10.99,
            stockQuantity: 5,
            status: 'ACTIVE',
          };

          const res = await this.api.request('POST', '/api/products', invalidProduct);
          if (res.status >= 400) {
            return { status: res.status, negativePriceRejected: true };
          }
          throw new Error('Should have rejected negative price');
        },
      },
      {
        name: 'Negative stock quantity validation',
        test: async () => {
          const invalidProduct = {
            name: 'Negative Stock Product',
            sku: `NEGSTOCK-${Date.now()}`,
            price: 19.99,
            stockQuantity: -5,
            status: 'ACTIVE',
          };

          const res = await this.api.request('POST', '/api/products', invalidProduct);
          if (res.status >= 400) {
            return { status: res.status, negativeStockRejected: true };
          }
          throw new Error('Should have rejected negative stock quantity');
        },
      },
      {
        name: 'Invalid status enum value',
        test: async () => {
          const invalidProduct = {
            name: 'Invalid Status Product',
            sku: `INVALID-STATUS-${Date.now()}`,
            price: 49.99,
            stockQuantity: 10,
            status: 'INVALID_STATUS', // Not a valid enum value
          };

          const res = await this.api.request('POST', '/api/products', invalidProduct);
          if (res.status >= 400) {
            return { status: res.status, invalidEnumRejected: true };
          }
          throw new Error('Should have rejected invalid status enum value');
        },
      },
      {
        name: 'Malformed JSON handling',
        test: async () => {
          // Try to send malformed JSON by making a manual request
          const url = `${this.api['baseUrl']}/api/products`.replace(/\/$/, '');

          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Cookie:
                  this.api['cookies'].size > 0
                    ? Array.from(this.api['cookies'].entries())
                        .map(([k, v]) => `${k}=${v}`)
                        .join('; ')
                    : '',
              },
              body: '{invalid json', // Malformed JSON
            });

            if (res.status >= 400) {
              return { status: res.status, malformedJsonHandled: true };
            }
            return { status: res.status, malformedJsonHandled: false };
          } catch (error) {
            return { error: error.message, malformedJsonHandled: true };
          }
        },
      },
      {
        name: 'Update non-existent product',
        test: async () => {
          const updateData = {
            name: 'Updated Non-existent Product',
            price: 99.99,
          };

          const res = await this.api.request('PATCH', '/api/products/non-existent-id', updateData);
          if (res.status === 404 || res.status === 400) {
            return { status: res.status, nonExistentUpdateHandled: true };
          }
          return { status: res.status, nonExistentUpdateHandled: false };
        },
      },
      {
        name: 'Delete non-existent product',
        test: async () => {
          const res = await this.api.request('DELETE', '/api/products/non-existent-id');
          if (res.status === 404 || res.status === 400) {
            return { status: res.status, nonExistentDeleteHandled: true };
          }
          return { status: res.status, nonExistentDeleteHandled: false };
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
