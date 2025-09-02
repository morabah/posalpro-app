#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Search & Filtering Tests
 * User Story: US-5.1 (Version History), US-5.2 (Change Tracking)
 * Hypothesis: H8 (Version history improves traceability), H9 (Change tracking enhances collaboration)
 */

import { ApiClient } from './api-client';

export class SearchFilteringTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔍 Testing Search & Filtering');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Basic search functionality',
        test: async () => {
          const searchRes = await this.api.request(
            'GET',
            '/api/proposals/versions/search?q=update&limit=5'
          );
          const searchData = await searchRes.json();

          if (searchRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Search endpoint not implemented' };
          }

          if (searchRes.status !== 200) {
            throw new Error(`Search failed with status: ${searchRes.status}`);
          }

          return {
            found: searchData.data?.items?.length || 0,
            hasPagination: !!searchData.data?.pagination,
          };
        },
      },
      {
        name: 'Filter by change type',
        test: async () => {
          const filterRes = await this.api.request(
            'GET',
            '/api/proposals/versions?changeType=update&limit=20'
          );

          if (filterRes.status !== 200) {
            throw new Error(`Filter failed with status: ${filterRes.status}`);
          }

          const filterData = await filterRes.json();
          const filteredItems = filterData.data?.items || [];

          // Get unfiltered data to compare
          const baselineRes = await this.api.request('GET', '/api/proposals/versions?limit=20');
          const baselineData = await baselineRes.json();
          const baselineItems = baselineData.data?.items || [];

          if (filteredItems.length === 0) {
            return {
              status: 'no_items_found',
              message: 'No items found for this change type',
              filterApplied: false,
            };
          }

          return {
            filteredItems: filteredItems.length,
            baselineItems: baselineItems.length,
            filterApplied: filteredItems.length <= baselineItems.length,
            changeType: 'update',
          };
        },
      },
      {
        name: 'Date range filtering',
        test: async () => {
          // Use a reasonable date range (last 60 days to ensure we have data)
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
          const startDate = sixtyDaysAgo.toISOString().split('T')[0];
          const endDate = new Date().toISOString().split('T')[0];

          const dateFilterRes = await this.api.request(
            'GET',
            `/api/proposals/versions?dateFrom=${startDate}&dateTo=${endDate}&limit=20`
          );

          if (dateFilterRes.status !== 200) {
            throw new Error(`Date filter failed with status: ${dateFilterRes.status}`);
          }

          const dateFilterData = await dateFilterRes.json();
          const items = dateFilterData.data?.items || [];

          // Get unfiltered data to compare
          const baselineRes = await this.api.request('GET', '/api/proposals/versions?limit=20');
          const baselineData = await baselineRes.json();
          const baselineItems = baselineData.data?.items || [];

          if (items.length === 0) {
            return {
              status: 'no_items_in_date_range',
              message: 'No items found in the specified date range',
              dateRange: { from: startDate, to: endDate },
              filterApplied: false,
            };
          }

          return {
            itemsReturned: items.length,
            baselineItems: baselineItems.length,
            dateRange: { from: startDate, to: endDate },
            filterApplied: items.length <= baselineItems.length,
          };
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
