#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Authentication & RBAC Tests for Products
 * Tests authentication, authorization, and role-based access control for product operations
 */

import { ApiClient } from './api-client';

export class AuthTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔐 Testing Product Authentication & RBAC');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Unauthorized access to products should fail',
        test: async () => {
          // Create a new API client without authentication
          const unauthApi = new ApiClient(this.api['baseUrl']);
          const res = await unauthApi.request('GET', '/api/products');
          if (res.status === 401 || res.status === 403) return { success: true };
          throw new Error(`Expected 401/403, got ${res.status}`);
        },
      },
      {
        name: 'Login with valid credentials',
        test: async () => {
          const success = await this.api.login(
            'admin@posalpro.com',
            'ProposalPro2024!',
            'System Administrator'
          );
          if (success) return { success: true };
          throw new Error('Login failed');
        },
      },
      {
        name: 'Authenticated user can access product list',
        test: async () => {
          const res = await this.api.request('GET', '/api/products?limit=5');
          if (res.status === 200) return { success: true };
          throw new Error(`Expected 200, got ${res.status}`);
        },
      },
      {
        name: 'Authenticated user can create products',
        test: async () => {
          const testProduct = {
            name: `Auth Test Product ${Date.now()}`,
            sku: `AUTH-${Date.now()}`,
            price: 49.99,
            stockQuantity: 10,
            category: 'Test',
            status: 'ACTIVE',
          };

          const res = await this.api.request('POST', '/api/products', testProduct);
          if (res.status === 201 || res.status === 200) {
            const data = await res.json();
            const product = data.data || data;

            // Cleanup
            if (product?.id) {
              await this.api.cleanupTestProduct(product.id);
            }

            return { success: true, productId: product?.id };
          }
          throw new Error(`Expected 201/200, got ${res.status}`);
        },
      },
      {
        name: 'RBAC: Admin can delete products',
        test: async () => {
          // Create a test product first
          const testProduct = await this.api.createTestProduct({
            name: `RBAC Test Product ${Date.now()}`,
            sku: `RBAC-${Date.now()}`,
            price: 29.99,
            stockQuantity: 5,
            category: 'Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for RBAC test');
          }

          // Try to delete it
          const deleteRes = await this.api.request('DELETE', `/api/products/${testProduct.id}`);
          if (deleteRes.status === 200 || deleteRes.status === 204) {
            return { success: true, deletedProductId: testProduct.id };
          }

          // Cleanup if delete failed
          await this.api.cleanupTestProduct(testProduct.id);
          throw new Error(`Expected 200/204 for delete, got ${deleteRes.status}`);
        },
      },
      {
        name: 'Session persistence across requests',
        test: async () => {
          // Make multiple requests to ensure session persists
          const requests = [];
          for (let i = 0; i < 3; i++) {
            requests.push(this.api.request('GET', '/api/products?limit=1'));
          }

          const results = await Promise.all(requests);
          const allSuccessful = results.every(res => res.status === 200);

          if (allSuccessful) {
            return { success: true, requestsMade: requests.length };
          }
          throw new Error('Session not persistent across requests');
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
        const isTimeout = error.message.includes('TIMEOUT');
        const isInfiniteLoop = error.message.includes('INFINITE_LOOP_DETECTED');

        results.push({
          test: name,
          status: isTimeout ? 'TIMEOUT' : 'FAIL',
          duration: Date.now() - start,
          error: error.message,
          issues,
        });
      }
    }

    return results;
  }
}
