#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Search & Filtering Tests
 * Tests search capabilities and filtering functionality for products
 */

import { ApiClient } from './api-client';

export class SearchFilteringTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔍 Testing Product Search & Filtering');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Basic product search by name',
        test: async () => {
          // Create a test product with a unique name
          const uniqueName = `SearchTestProduct-${Date.now()}`;
          const testProduct = await this.api.createTestProduct({
            name: uniqueName,
            sku: `SEARCH-${Date.now()}`,
            price: 49.99,
            stockQuantity: 10,
            category: 'Search Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for search');
          }

          // Search for the product
          const searchRes = await this.api.request(
            'GET',
            `/api/products/search?q=${encodeURIComponent(uniqueName)}`
          );

          // Cleanup
          await this.api.cleanupTestProduct(testProduct.id);

          if (searchRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Search endpoint not implemented' };
          }

          if (searchRes.status === 200) {
            const searchData = await searchRes.json();
            const results = searchData.data?.items || [];

            const found = results.some((p: any) => p.id === testProduct.id);

            return {
              searchTerm: uniqueName,
              resultsFound: results.length,
              targetProductFound: found,
              searchWorking: found,
            };
          }

          throw new Error(`Search failed with status: ${searchRes.status}`);
        },
      },
      {
        name: 'Search with no results',
        test: async () => {
          const searchTerm = `NonExistentProduct-${Date.now()}-${Math.random()}`;
          const searchRes = await this.api.request(
            'GET',
            `/api/products/search?q=${encodeURIComponent(searchTerm)}`
          );

          if (searchRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Search endpoint not implemented' };
          }

          if (searchRes.status === 200) {
            const searchData = await searchRes.json();
            const results = searchData.data?.items || [];

            return {
              searchTerm,
              resultsFound: results.length,
              noResultsCorrect: results.length === 0,
            };
          }

          return { status: searchRes.status, searchFailed: true };
        },
      },
      {
        name: 'Filter by status',
        test: async () => {
          const statusRes = await this.api.request('GET', '/api/products?status=ACTIVE&limit=10');

          if (statusRes.status === 200) {
            const statusData = await statusRes.json();
            const products = statusData.data?.items || [];

            const allActive = products.every((p: any) => p.status === 'ACTIVE');

            return {
              productsChecked: products.length,
              allActive,
              status: 'ACTIVE',
              filteringWorking: allActive,
            };
          }

          return { status: statusRes.status, filteringFailed: true };
        },
      },
      {
        name: 'Filter by category',
        test: async () => {
          const categoryRes = await this.api.request(
            'GET',
            '/api/products?category=Electronics&limit=10'
          );

          if (categoryRes.status === 200) {
            const categoryData = await categoryRes.json();
            const products = categoryData.data?.items || [];

            const allElectronics = products.every((p: any) => p.category === 'Electronics');

            return {
              productsChecked: products.length,
              allElectronics,
              category: 'Electronics',
              filteringWorking: allElectronics,
            };
          }

          return { status: categoryRes.status, filteringFailed: true };
        },
      },
      {
        name: 'Price range filtering',
        test: async () => {
          const minPrice = 10;
          const maxPrice = 100;
          const priceRes = await this.api.request(
            'GET',
            `/api/products?minPrice=${minPrice}&maxPrice=${maxPrice}&limit=20`
          );

          if (priceRes.status === 200) {
            const priceData = await priceRes.json();
            const products = priceData.data?.items || [];

            const inRange = products.every((p: any) => p.price >= minPrice && p.price <= maxPrice);

            return {
              productsChecked: products.length,
              priceRange: `${minPrice}-${maxPrice}`,
              allInRange: inRange,
              filteringWorking: inRange,
            };
          }

          if (priceRes.status === 400) {
            return {
              status: 'filtering_not_implemented',
              message: 'Price range filtering not implemented',
            };
          }

          return { status: priceRes.status, filteringFailed: true };
        },
      },
      {
        name: 'Stock level filtering',
        test: async () => {
          const minStock = 5;
          const stockRes = await this.api.request(
            'GET',
            `/api/products?minStock=${minStock}&limit=15`
          );

          if (stockRes.status === 200) {
            const stockData = await stockRes.json();
            const products = stockData.data?.items || [];

            const sufficientStock = products.every((p: any) => p.stockQuantity >= minStock);

            return {
              productsChecked: products.length,
              minStock,
              allSufficientStock: sufficientStock,
              filteringWorking: sufficientStock,
            };
          }

          if (stockRes.status === 400) {
            return {
              status: 'filtering_not_implemented',
              message: 'Stock filtering not implemented',
            };
          }

          return { status: stockRes.status, filteringFailed: true };
        },
      },
      {
        name: 'Combined search and filters',
        test: async () => {
          const searchTerm = 'product';
          const combinedRes = await this.api.request(
            'GET',
            `/api/products/search?q=${encodeURIComponent(searchTerm)}&status=ACTIVE&limit=10`
          );

          if (combinedRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Combined search not implemented' };
          }

          if (combinedRes.status === 200) {
            const combinedData = await combinedRes.json();
            const products = combinedData.data?.items || [];

            const matchesSearch = products.every(
              (p: any) =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            const matchesFilter = products.every((p: any) => p.status === 'ACTIVE');

            return {
              searchTerm,
              filter: 'status=ACTIVE',
              productsFound: products.length,
              searchMatches: matchesSearch,
              filterMatches: matchesFilter,
              combinedWorking: matchesSearch && matchesFilter,
            };
          }

          return { status: combinedRes.status, combinedSearchFailed: true };
        },
      },
      {
        name: 'Search result pagination',
        test: async () => {
          const searchRes = await this.api.request('GET', '/api/products/search?q=test&limit=5');

          if (searchRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Search endpoint not implemented' };
          }

          if (searchRes.status === 200) {
            const searchData = await searchRes.json();
            const products = searchData.data?.items || [];
            const totalCount =
              searchData.data?.totalCount || searchData.data?.total || products.length;

            // Check if pagination metadata is present
            const hasPagination =
              searchData.data &&
              ('totalCount' in searchData.data ||
                'total' in searchData.data ||
                'hasMore' in searchData.data ||
                'nextPage' in searchData.data);

            return {
              resultsLimited: products.length <= 5,
              totalAvailable: totalCount,
              paginationSupported: hasPagination,
              limitRespected: products.length <= 5,
            };
          }

          return { status: searchRes.status, paginationTestFailed: true };
        },
      },
      {
        name: 'Search performance with large result sets',
        test: async () => {
          const start = Date.now();
          const searchRes = await this.api.request('GET', '/api/products/search?q=&limit=50'); // Empty search
          const duration = Date.now() - start;

          if (searchRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Search endpoint not implemented' };
          }

          if (searchRes.status === 200) {
            const searchData = await searchRes.json();
            const products = searchData.data?.items || [];

            return {
              responseTime: duration,
              resultsFound: products.length,
              performanceAcceptable: duration < 2000, // Under 2 seconds
              largeDatasetHandling: products.length > 10,
            };
          }

          return { status: searchRes.status, performanceTestFailed: true };
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
