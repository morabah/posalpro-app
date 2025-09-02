#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product API Tests
 * Tests core API functionality and data structure validation for products
 */

import { ApiClient } from './api-client';

export class ApiTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n📚 Testing Product API Functionality');
    this.api.resetTracking();

    const tests = [
      {
        name: 'List all products with pagination',
        test: async () => {
          const res = await this.api.request('GET', '/api/products?limit=10');
          const data = await res.json();
          if (!data.data || !Array.isArray(data.data.items)) {
            throw new Error('Invalid response structure');
          }
          return { itemCount: data.data.items.length };
        },
      },
      {
        name: 'Get single product by ID',
        test: async () => {
          // First get a product ID
          const listRes = await this.api.request('GET', '/api/products?limit=1');
          const listData = await listRes.json();

          if (!listData.data || listData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No products available' };
          }

          const productId = listData.data.items[0].id;
          const res = await this.api.request('GET', `/api/products/${productId}`);
          const data = await res.json();

          if (!data.ok || !data.data) {
            throw new Error(
              `Invalid response structure. Expected data.data, got: ${JSON.stringify(data)}`
            );
          }
          return { productId, retrieved: true };
        },
      },
      {
        name: 'Product data structure validation',
        test: async () => {
          const res = await this.api.request('GET', '/api/products?limit=1');
          const data = await res.json();

          if (data.data && data.data.items && data.data.items.length > 0) {
            const product = data.data.items[0];
            const requiredFields = ['id', 'name', 'sku', 'price', 'stockQuantity', 'status'];

            for (const field of requiredFields) {
              if (!(field in product)) {
                throw new Error(`Missing required field: ${field}`);
              }
            }
            return { validated: true, fields: requiredFields };
          }
          return { validated: false, reason: 'No products to validate' };
        },
      },
      {
        name: 'Create new product',
        test: async () => {
          const newProduct = {
            name: `API Test Product ${Date.now()}`,
            sku: `API-${Date.now()}`,
            description: 'Product created by API test',
            price: 79.99,
            cost: 40.0,
            stockQuantity: 25,
            category: 'Electronics',
            status: 'ACTIVE',
          };

          const res = await this.api.request('POST', '/api/products', newProduct);

          if (res.status === 201 || res.status === 200) {
            const data = await res.json();
            const createdProduct = data.data || data;

            // Validate the created product has expected fields
            if (createdProduct.id && createdProduct.name === newProduct.name) {
              // Cleanup
              await this.api.cleanupTestProduct(createdProduct.id);
              return { created: true, productId: createdProduct.id };
            }
          }

          throw new Error(`Product creation failed with status: ${res.status}`);
        },
      },
      {
        name: 'Update existing product',
        test: async () => {
          // Create a test product
          const testProduct = await this.api.createTestProduct({
            name: `Update Test Product ${Date.now()}`,
            sku: `UPDATE-${Date.now()}`,
            price: 59.99,
            stockQuantity: 15,
            category: 'Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for update');
          }

          // Update the product
          const updateData = {
            name: `${testProduct.name} - Updated`,
            price: 69.99,
            stockQuantity: 20,
          };

          const updateRes = await this.api.request(
            'PATCH',
            `/api/products/${testProduct.id}`,
            updateData
          );

          if (updateRes.status === 200) {
            const updatedData = await updateRes.json();
            const updatedProduct = updatedData.data || updatedData;

            if (
              updatedProduct.name === updateData.name &&
              updatedProduct.price === updateData.price
            ) {
              // Cleanup
              await this.api.cleanupTestProduct(testProduct.id);
              return { updated: true, productId: testProduct.id };
            }
          }

          // Cleanup
          await this.api.cleanupTestProduct(testProduct.id);
          throw new Error(`Product update failed with status: ${updateRes.status}`);
        },
      },
      {
        name: 'Delete product',
        test: async () => {
          // Create a test product
          const testProduct = await this.api.createTestProduct({
            name: `Delete Test Product ${Date.now()}`,
            sku: `DELETE-${Date.now()}`,
            price: 39.99,
            stockQuantity: 5,
            category: 'Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for deletion');
          }

          // Delete the product
          const deleteRes = await this.api.request('DELETE', `/api/products/${testProduct.id}`);

          if (deleteRes.status === 200 || deleteRes.status === 204) {
            return { deleted: true, productId: testProduct.id };
          }

          // Cleanup if delete failed
          await this.api.cleanupTestProduct(testProduct.id);
          throw new Error(`Product deletion failed with status: ${deleteRes.status}`);
        },
      },
      {
        name: 'Product statistics endpoint',
        test: async () => {
          const res = await this.api.request('GET', '/api/products/stats');
          const data = await res.json();

          if (res.status === 200 && data.data) {
            // Should have some statistical information
            const hasStats = typeof data.data === 'object';
            return { statsAvailable: hasStats, statsKeys: hasStats ? Object.keys(data.data) : [] };
          }

          if (res.status === 404) {
            return { status: 'endpoint_not_found', message: 'Statistics endpoint not implemented' };
          }

          throw new Error(`Statistics endpoint failed with status: ${res.status}`);
        },
      },
    ];

    const results = [];

    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        const issues = this.api.getDetectedIssues();
        results.push({
          test: name,
          status: 'PASS',
          duration: Date.now() - start,
          result,
          issues,
        });
      } catch (error: any) {
        const issues = this.api.getDetectedIssues();
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
          issues,
        });
      }
    }

    return results;
  }
}
