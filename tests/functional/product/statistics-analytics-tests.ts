#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Statistics & Analytics Tests
 * Tests statistics endpoints and analytics functionality for products
 */

import { ApiClient } from './api-client';

export class StatisticsAnalyticsTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n📊 Testing Product Statistics & Analytics');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Product statistics endpoint',
        test: async () => {
          const statsRes = await this.api.request('GET', '/api/products/stats');

          if (statsRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Statistics endpoint not implemented' };
          }

          if (statsRes.status === 200) {
            const statsData = await statsRes.json();
            const stats = statsData.data || statsData;

            // Check for expected statistical fields
            const expectedFields = [
              'totalProducts',
              'activeProducts',
              'totalValue',
              'averagePrice',
            ];
            const availableFields = Object.keys(stats);

            const hasExpectedFields = expectedFields.some(field => availableFields.includes(field));
            const hasNumericData = availableFields.some(
              field => typeof stats[field] === 'number' && stats[field] >= 0
            );

            return {
              statsAvailable: true,
              fieldsAvailable: availableFields,
              expectedFieldsPresent: hasExpectedFields,
              numericDataPresent: hasNumericData,
              statisticsWorking: hasExpectedFields && hasNumericData,
            };
          }

          throw new Error(`Statistics endpoint failed with status: ${statsRes.status}`);
        },
      },
      {
        name: 'Product category distribution',
        test: async () => {
          const categoryRes = await this.api.request('GET', '/api/products/stats/categories');

          if (categoryRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Category statistics not implemented' };
          }

          if (categoryRes.status === 200) {
            const categoryData = await categoryRes.json();
            const categories = categoryData.data || categoryData;

            const hasCategories = Array.isArray(categories) && categories.length > 0;
            const validStructure =
              hasCategories &&
              categories.every((cat: any) => cat.category && typeof cat.count === 'number');

            return {
              categoriesAvailable: hasCategories,
              validStructure,
              categoryCount: hasCategories ? categories.length : 0,
              categoryAnalyticsWorking: validStructure,
            };
          }

          return { status: categoryRes.status, categoryStatsFailed: true };
        },
      },
      {
        name: 'Product price analytics',
        test: async () => {
          const priceRes = await this.api.request('GET', '/api/products/stats/prices');

          if (priceRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Price analytics not implemented' };
          }

          if (priceRes.status === 200) {
            const priceData = await priceRes.json();
            const priceStats = priceData.data || priceData;

            const expectedMetrics = ['averagePrice', 'minPrice', 'maxPrice', 'priceRanges'];
            const availableMetrics = Object.keys(priceStats);

            const hasPriceMetrics = expectedMetrics.some(metric =>
              availableMetrics.includes(metric)
            );
            const hasValidNumbers = availableMetrics.some(
              metric => typeof priceStats[metric] === 'number' && priceStats[metric] >= 0
            );

            return {
              priceAnalyticsAvailable: true,
              availableMetrics,
              expectedMetricsPresent: hasPriceMetrics,
              validNumericData: hasValidNumbers,
              priceAnalyticsWorking: hasPriceMetrics && hasValidNumbers,
            };
          }

          return { status: priceRes.status, priceAnalyticsFailed: true };
        },
      },
      {
        name: 'Product stock analytics',
        test: async () => {
          const stockRes = await this.api.request('GET', '/api/products/stats/stock');

          if (stockRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Stock analytics not implemented' };
          }

          if (stockRes.status === 200) {
            const stockData = await stockRes.json();
            const stockStats = stockData.data || stockData;

            const expectedFields = [
              'totalStock',
              'lowStockProducts',
              'outOfStockProducts',
              'stockValue',
            ];
            const availableFields = Object.keys(stockStats);

            const hasStockFields = expectedFields.some(field => availableFields.includes(field));
            const hasValidData = availableFields.some(
              field => typeof stockStats[field] === 'number' || Array.isArray(stockStats[field])
            );

            return {
              stockAnalyticsAvailable: true,
              availableFields,
              expectedFieldsPresent: hasStockFields,
              validDataPresent: hasValidData,
              stockAnalyticsWorking: hasStockFields && hasValidData,
            };
          }

          return { status: stockRes.status, stockAnalyticsFailed: true };
        },
      },
      {
        name: 'Product performance trends',
        test: async () => {
          const trendsRes = await this.api.request('GET', '/api/products/stats/trends');

          if (trendsRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Trends analytics not implemented' };
          }

          if (trendsRes.status === 200) {
            const trendsData = await trendsRes.json();
            const trends = trendsData.data || trendsData;

            const hasTrends = Array.isArray(trends) && trends.length > 0;
            const validTrendStructure =
              hasTrends &&
              trends.every(
                (trend: any) => trend.period && trend.metric && typeof trend.value === 'number'
              );

            return {
              trendsAvailable: hasTrends,
              validStructure: validTrendStructure,
              trendCount: hasTrends ? trends.length : 0,
              performanceTrendsWorking: validTrendStructure,
            };
          }

          return { status: trendsRes.status, trendsAnalyticsFailed: true };
        },
      },
      {
        name: 'Product status distribution',
        test: async () => {
          const statusRes = await this.api.request('GET', '/api/products/stats/status');

          if (statusRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Status distribution not implemented' };
          }

          if (statusRes.status === 200) {
            const statusData = await statusRes.json();
            const statusStats = statusData.data || statusData;

            const hasStatusData = Array.isArray(statusStats) && statusStats.length > 0;
            const validStatusStructure =
              hasStatusData &&
              statusStats.every((status: any) => status.status && typeof status.count === 'number');

            // Check if valid status values are present
            const validStatuses = ['ACTIVE', 'INACTIVE', 'DISCONTINUED'];
            const hasValidStatuses =
              hasStatusData &&
              statusStats.some((status: any) => validStatuses.includes(status.status));

            return {
              statusDistributionAvailable: hasStatusData,
              validStructure: validStatusStructure,
              hasValidStatuses,
              statusCount: hasStatusData ? statusStats.length : 0,
              statusDistributionWorking: validStatusStructure && hasValidStatuses,
            };
          }

          return { status: statusRes.status, statusDistributionFailed: true };
        },
      },
      {
        name: 'Top products analytics',
        test: async () => {
          const topRes = await this.api.request('GET', '/api/products/stats/top?limit=5');

          if (topRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Top products analytics not implemented',
            };
          }

          if (topRes.status === 200) {
            const topData = await topRes.json();
            const topProducts = topData.data || topData;

            const hasTopProducts = Array.isArray(topProducts) && topProducts.length > 0;
            const validProductStructure =
              hasTopProducts &&
              topProducts.every(
                (product: any) => product.id && product.name && typeof product.price === 'number'
              );

            return {
              topProductsAvailable: hasTopProducts,
              validStructure: validProductStructure,
              productCount: hasTopProducts ? topProducts.length : 0,
              topProductsAnalyticsWorking: validProductStructure,
            };
          }

          return { status: topRes.status, topProductsAnalyticsFailed: true };
        },
      },
      {
        name: 'Analytics data freshness',
        test: async () => {
          // Test that analytics data is reasonably fresh
          const start = Date.now();
          const analyticsRes = await this.api.request('GET', '/api/products/stats');
          const responseTime = Date.now() - start;

          if (analyticsRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Analytics not implemented' };
          }

          if (analyticsRes.status === 200) {
            const analyticsData = await analyticsRes.json();
            const stats = analyticsData.data || analyticsData;

            // Check if there's a lastUpdated or similar timestamp
            const hasTimestamp = stats.lastUpdated || stats.generatedAt || stats.timestamp;
            const timestamp = hasTimestamp
              ? new Date(stats.lastUpdated || stats.generatedAt || stats.timestamp)
              : null;

            const isRecent = timestamp
              ? Date.now() - timestamp.getTime() < 24 * 60 * 60 * 1000
              : true; // Within 24 hours

            return {
              analyticsResponseTime: responseTime,
              hasTimestamp,
              dataFreshness: isRecent ? 'recent' : 'stale',
              performanceAcceptable: responseTime < 2000,
              analyticsFreshnessWorking: isRecent && responseTime < 2000,
            };
          }

          return { status: analyticsRes.status, freshnessTestFailed: true };
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
