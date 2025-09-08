#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Performance Tests
 * Tests response times, pagination, and caching behavior for product operations
 */

import { ApiClient } from './api-client';

export class PerformanceTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n⚡ Testing Product Performance');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Product list response time',
        test: async () => {
          const start = Date.now();
          const res = await this.api.request('GET', '/api/products?limit=20');
          const duration = Date.now() - start;

          if (res.status !== 200) {
            throw new Error(`Request failed with status: ${res.status}`);
          }

          const data = await res.json();
          const itemCount = data.data?.items?.length || 0;

          return {
            responseTime: duration,
            acceptable: duration < 1000, // Under 1 second
            itemCount,
            throughput: itemCount / (duration / 1000), // items per second
          };
        },
      },
      {
        name: 'Single product retrieval performance',
        test: async () => {
          // Get a product ID first
          const listRes = await this.api.request('GET', '/api/products?limit=1');
          const listData = await listRes.json();

          if (!listData.data?.items || listData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No products available' };
          }

          const productId = listData.data.items[0].id;

          const start = Date.now();
          const res = await this.api.request('GET', `/api/products/${productId}`);
          const duration = Date.now() - start;

          if (res.status !== 200) {
            throw new Error(`Request failed with status: ${res.status}`);
          }

          return {
            responseTime: duration,
            acceptable: duration < 500, // Under 500ms
            productId,
          };
        },
      },
      {
        name: 'Pagination performance consistency',
        test: async () => {
          const pageSizes = [5, 10, 20, 50];
          const results = [];

          for (const limit of pageSizes) {
            const start = Date.now();
            const res = await this.api.request('GET', `/api/products?limit=${limit}`);
            const duration = Date.now() - start;

            if (res.status === 200) {
              const data = await res.json();
              const itemCount = data.data?.items?.length || 0;

              results.push({
                pageSize: limit,
                responseTime: duration,
                itemsRetrieved: itemCount,
                efficiency: duration / Math.max(itemCount, 1),
              });
            } else {
              results.push({
                pageSize: limit,
                responseTime: duration,
                itemsRetrieved: 0,
                efficiency: 0,
                error: res.status,
              });
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const avgResponseTime =
            results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
          const scalingEfficiency =
            results.length > 1 ? results[results.length - 1].efficiency / results[0].efficiency : 1;

          return {
            pageSizesTested: pageSizes,
            averageResponseTime: Math.round(avgResponseTime),
            scalingEfficiency: scalingEfficiency.toFixed(2),
            paginationConsistent: scalingEfficiency < 3, // Less than 3x slower for largest page
            results,
          };
        },
      },
      {
        name: 'Product creation performance',
        test: async () => {
          const testProduct = {
            name: `Performance Test Product ${Date.now()}`,
            sku: `PERF-${Date.now()}`,
            description: 'Product created for performance testing',
            price: 49.99,
            cost: 25.0,
            stockQuantity: 100,
            category: 'Performance Test',
            status: 'ACTIVE',
          };

          const start = Date.now();
          const res = await this.api.request('POST', '/api/products', testProduct);
          const duration = Date.now() - start;

          let productId = null;
          if (res.status === 200 || res.status === 201) {
            const data = await res.json();
            const product = data.data || data;
            productId = product?.id;

            // Cleanup
            if (productId) {
              await this.api.cleanupTestProduct(productId);
            }
          }

          return {
            responseTime: duration,
            acceptable: duration < 1000, // Under 1 second
            success: res.status === 200 || res.status === 201,
            status: res.status,
            productId,
          };
        },
      },
      {
        name: 'Product update performance',
        test: async () => {
          // Create a test product
          const testProduct = await this.api.createTestProduct({
            name: `Update Performance Test ${Date.now()}`,
            sku: `UPDATE-PERF-${Date.now()}`,
            price: 59.99,
            stockQuantity: 20,
            category: 'Performance Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for update performance test');
          }

          // Update the product
          const updateData = {
            price: 69.99,
            stockQuantity: 25,
          };

          const start = Date.now();
          const updateRes = await this.api.request(
            'PATCH',
            `/api/products/${testProduct.id}`,
            updateData
          );
          const duration = Date.now() - start;

          // Cleanup
          await this.api.cleanupTestProduct(testProduct.id);

          if (updateRes.status !== 200) {
            throw new Error(`Update failed with status: ${updateRes.status}`);
          }

          return {
            responseTime: duration,
            acceptable: duration < 800, // Under 800ms
            success: updateRes.status === 200,
            productId: testProduct.id,
          };
        },
      },
      {
        name: 'Concurrent product operations',
        test: async () => {
          const concurrentOperations = 5;
          const operations = [];

          // Create multiple concurrent read operations
          for (let i = 0; i < concurrentOperations; i++) {
            operations.push(this.api.request('GET', '/api/products?limit=5'));
          }

          const start = Date.now();
          const results = await Promise.allSettled(operations);
          const totalDuration = Date.now() - start;

          const successful = results.filter(
            r => r.status === 'fulfilled' && (r.value as any).status === 200
          ).length;
          const failed = results.filter(
            r =>
              r.status === 'rejected' ||
              ((r.value as any)?.status && (r.value as any).status !== 200)
          ).length;

          const avgResponseTime = totalDuration / concurrentOperations;

          return {
            concurrentOperations,
            totalDuration,
            averageResponseTime: Math.round(avgResponseTime),
            successful,
            failed,
            successRate: `${((successful / concurrentOperations) * 100).toFixed(1)}%`,
            concurrentPerformance: successful === concurrentOperations && avgResponseTime < 1000,
          };
        },
      },
      {
        name: 'Product search performance',
        test: async () => {
          const searchTerms = ['test', 'product', 'active'];

          for (const term of searchTerms) {
            const start = Date.now();
            const res = await this.api.request(
              'GET',
              `/api/products/search?q=${encodeURIComponent(term)}&limit=10`
            );
            const duration = Date.now() - start;

            if (res.status === 200) {
              const data = await res.json();
              const resultCount = data.data?.items?.length || 0;

              return {
                searchTerm: term,
                responseTime: duration,
                acceptable: duration < 800, // Under 800ms for search
                resultCount,
                searchPerformance: duration < 800,
              };
            }

            if (res.status === 404) {
              // Search endpoint might not exist
              return {
                searchTerm: term,
                status: 'endpoint_not_found',
                message: 'Search endpoint not implemented',
              };
            }
          }

          return {
            searchTermsTested: searchTerms,
            endpointAvailable: false,
          };
        },
      },
      {
        name: 'Caching behavior verification',
        test: async () => {
          // Make the same request twice to check for caching
          const endpoint = '/api/products?limit=5';

          const start1 = Date.now();
          const res1 = await this.api.request('GET', endpoint);
          const duration1 = Date.now() - start1;

          await new Promise(resolve => setTimeout(resolve, 200)); // Small delay

          const start2 = Date.now();
          const res2 = await this.api.request('GET', endpoint);
          const duration2 = Date.now() - start2;

          if (res1.status !== 200 || res2.status !== 200) {
            throw new Error('One or both requests failed');
          }

          const cachingEffective = duration2 < duration1 * 0.7; // Second request significantly faster
          const cacheHeaders = res2.headers.get('cache-control') || res2.headers.get('etag');

          return {
            firstRequestTime: duration1,
            secondRequestTime: duration2,
            cachingEffective,
            cacheHeadersPresent: !!cacheHeaders,
            performanceImprovement: cachingEffective
              ? `${Math.round((1 - duration2 / duration1) * 100)}%`
              : 'none',
          };
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
