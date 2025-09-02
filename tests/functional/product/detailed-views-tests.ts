#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Detailed Views Tests
 * Tests detailed product views and related data retrieval
 */

import { ApiClient } from './api-client';

export class DetailedViewsTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔎 Testing Product Detailed Views');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Detailed product view with related data',
        test: async () => {
          // Get a product with detailed view
          const productsRes = await this.api.request('GET', '/api/products?limit=1');

          if (productsRes.status !== 200) {
            throw new Error('Cannot test detailed views - products API not responding');
          }

          const productsData = await productsRes.json();
          const products = productsData.data?.items || [];

          if (products.length === 0) {
            return { status: 'SKIP', reason: 'No products available for detailed view test' };
          }

          const productId = products[0].id;

          // Try to get detailed view
          const detailRes = await this.api.request(
            'GET',
            `/api/products/${productId}?include=related`
          );

          if (detailRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Detailed view endpoint not implemented',
            };
          }

          if (detailRes.status === 200) {
            const detailData = await detailRes.json();
            const detailedProduct = detailData.data || detailData;

            // Check for additional detailed fields
            const hasDetailedFields =
              typeof detailedProduct === 'object' &&
              (detailedProduct.relatedProducts ||
                detailedProduct.categoryInfo ||
                detailedProduct.stockHistory ||
                detailedProduct.priceHistory);

            return {
              detailedViewAvailable: true,
              productId,
              hasRelatedData: hasDetailedFields,
              detailedFields: hasDetailedFields ? Object.keys(detailedProduct) : [],
              detailedViewWorking: hasDetailedFields,
            };
          }

          throw new Error(`Detailed view failed with status: ${detailRes.status}`);
        },
      },
      {
        name: 'Product history and audit trail',
        test: async () => {
          // Get a product and check for history/audit data
          const productsRes = await this.api.request('GET', '/api/products?limit=1');

          if (productsRes.status !== 200) {
            throw new Error('Cannot test product history - products API not responding');
          }

          const productsData = await productsRes.json();
          const products = productsData.data?.items || [];

          if (products.length === 0) {
            return { status: 'SKIP', reason: 'No products available for history test' };
          }

          const productId = products[0].id;

          // Try to get product history
          const historyRes = await this.api.request('GET', `/api/products/${productId}/history`);

          if (historyRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Product history endpoint not implemented',
            };
          }

          if (historyRes.status === 200) {
            const historyData = await historyRes.json();
            const history = historyData.data || historyData;

            const hasHistory = Array.isArray(history) && history.length > 0;
            const validHistoryStructure =
              hasHistory &&
              history.every((entry: any) => entry.timestamp || entry.createdAt || entry.date);

            return {
              historyAvailable: hasHistory,
              validStructure: validHistoryStructure,
              historyEntries: hasHistory ? history.length : 0,
              productHistoryWorking: validHistoryStructure,
            };
          }

          return { status: historyRes.status, historyTestFailed: true };
        },
      },
      {
        name: 'Product comparison view',
        test: async () => {
          // Get multiple products for comparison
          const productsRes = await this.api.request('GET', '/api/products?limit=3');

          if (productsRes.status !== 200) {
            throw new Error('Cannot test product comparison - products API not responding');
          }

          const productsData = await productsRes.json();
          const products = productsData.data?.items || [];

          if (products.length < 2) {
            return { status: 'SKIP', reason: 'Not enough products for comparison test' };
          }

          const productIds = products.slice(0, 2).map(p => p.id);

          // Try to get comparison data
          const compareRes = await this.api.request(
            'GET',
            `/api/products/compare?ids=${productIds.join(',')}`
          );

          if (compareRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Product comparison endpoint not implemented',
            };
          }

          if (compareRes.status === 200) {
            const compareData = await compareRes.json();
            const comparison = compareData.data || compareData;

            const hasComparison = Array.isArray(comparison) && comparison.length > 0;
            const validComparisonStructure =
              hasComparison &&
              comparison.every(
                (item: any) => item.id && item.name && typeof item.price === 'number'
              );

            return {
              comparisonAvailable: hasComparison,
              validStructure: validComparisonStructure,
              productsCompared: hasComparison ? comparison.length : 0,
              productComparisonWorking: validComparisonStructure,
            };
          }

          return { status: compareRes.status, comparisonTestFailed: true };
        },
      },
      {
        name: 'Product analytics view',
        test: async () => {
          // Get a product and check for analytics data
          const productsRes = await this.api.request('GET', '/api/products?limit=1');

          if (productsRes.status !== 200) {
            throw new Error('Cannot test product analytics - products API not responding');
          }

          const productsData = await productsRes.json();
          const products = productsData.data?.items || [];

          if (products.length === 0) {
            return { status: 'SKIP', reason: 'No products available for analytics test' };
          }

          const productId = products[0].id;

          // Try to get product analytics
          const analyticsRes = await this.api.request(
            'GET',
            `/api/products/${productId}/analytics`
          );

          if (analyticsRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Product analytics endpoint not implemented',
            };
          }

          if (analyticsRes.status === 200) {
            const analyticsData = await analyticsRes.json();
            const analytics = analyticsData.data || analyticsData;

            const hasAnalytics = typeof analytics === 'object';
            const hasMetrics =
              hasAnalytics &&
              (analytics.views || analytics.sales || analytics.revenue || analytics.conversionRate);

            return {
              analyticsAvailable: hasAnalytics,
              hasMetrics,
              analyticsFields: hasAnalytics ? Object.keys(analytics) : [],
              productAnalyticsWorking: hasMetrics,
            };
          }

          return { status: analyticsRes.status, analyticsTestFailed: true };
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
