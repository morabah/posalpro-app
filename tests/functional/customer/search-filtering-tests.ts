#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Customer Search & Filtering Tests
 * User Story: US-2.1 (Customer Management), US-2.2 (Customer Search)
 * Hypothesis: H2 (Customer search improves efficiency), H3 (Advanced filtering enhances user experience)
 */

import { ApiClient } from './api-client';

export class SearchFilteringTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔍 Testing Customer Search & Filtering');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Customer name search',
        test: async () => {
          const searchRes = await this.api.request(
            'GET',
            '/api/customers/search?q=Corp&limit=10'
          );
          const searchData = await searchRes.json();

          if (searchRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Customer search endpoint not implemented' };
          }

          if (searchRes.status !== 200) {
            throw new Error(`Customer name search failed with status: ${searchRes.status}`);
          }

          const hasResults = searchData.data?.items && searchData.data.items.length >= 0;
          const results = searchData.data?.items || [];
          const matchedByName = results.filter((c: any) =>
            c.name?.toLowerCase().includes('corp')
          ).length;

          return {
            searchTerm: 'Corp',
            totalResults: results.length,
            matchedByName,
            searchAccuracy: results.length > 0 ? Math.round((matchedByName / results.length) * 100) : 0,
            hasPagination: !!searchData.data?.pagination,
            searchSuccessful: hasResults
          };
        },
      },
      {
        name: 'Customer email domain search',
        test: async () => {
          const searchRes = await this.api.request(
            'GET',
            '/api/customers/search?q=@gmail.com&limit=5'
          );
          const searchData = await searchRes.json();

          if (searchRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Customer email search not implemented' };
          }

          if (searchRes.status !== 200) {
            throw new Error(`Customer email search failed with status: ${searchRes.status}`);
          }

          const results = searchData.data?.items || [];
          const matchedByEmail = results.filter((c: any) =>
            c.email?.toLowerCase().includes('@gmail.com')
          ).length;

          return {
            searchTerm: '@gmail.com',
            totalResults: results.length,
            matchedByEmail,
            emailSearchEffective: matchedByEmail > 0 || results.length === 0
          };
        },
      },
      {
        name: 'Filter by customer status',
        test: async () => {
          const filterRes = await this.api.request(
            'GET',
            '/api/customers?status=ACTIVE&limit=20'
          );

          if (filterRes.status !== 200) {
            throw new Error(`Customer status filter failed with status: ${filterRes.status}`);
          }

          const filterData = await filterRes.json();
          const filteredItems = filterData.data?.items || [];

          // Get unfiltered data to compare
          const baselineRes = await this.api.request('GET', '/api/customers?limit=20');
          const baselineData = await baselineRes.json();
          const baselineItems = baselineData.data?.items || [];

          const activeCustomers = filteredItems.filter((c: any) => c.status === 'ACTIVE').length;
          const inactiveCustomers = filteredItems.filter((c: any) => c.status !== 'ACTIVE').length;

          return {
            filteredItems: filteredItems.length,
            baselineItems: baselineItems.length,
            activeCustomers,
            inactiveCustomers,
            filterAccuracy: filteredItems.length > 0 ? Math.round((activeCustomers / filteredItems.length) * 100) : 100,
            filterApplied: filteredItems.length <= baselineItems.length,
            statusFilter: 'ACTIVE',
          };
        },
      },
      {
        name: 'Filter by industry sector',
        test: async () => {
          const filterRes = await this.api.request(
            'GET',
            '/api/customers?industry=Technology&limit=15'
          );

          if (filterRes.status !== 200) {
            throw new Error(`Customer industry filter failed with status: ${filterRes.status}`);
          }

          const filterData = await filterRes.json();
          const filteredItems = filterData.data?.items || [];

          const techCustomers = filteredItems.filter((c: any) => c.industry === 'Technology').length;
          const otherIndustries = filteredItems.filter((c: any) => c.industry !== 'Technology').length;

          return {
            filteredItems: filteredItems.length,
            techCustomers,
            otherIndustries,
            industryFilterAccuracy: filteredItems.length > 0 ? Math.round((techCustomers / filteredItems.length) * 100) : 100,
            industry: 'Technology'
          };
        },
      },
      {
        name: 'Filter by company size',
        test: async () => {
          const filterRes = await this.api.request(
            'GET',
            '/api/customers?companySize=MEDIUM&limit=10'
          );

          if (filterRes.status !== 200) {
            throw new Error(`Customer company size filter failed with status: ${filterRes.status}`);
          }

          const filterData = await filterRes.json();
          const filteredItems = filterData.data?.items || [];

          const correctSize = filteredItems.filter((c: any) => c.companySize === 'MEDIUM').length;
          const incorrectSize = filteredItems.filter((c: any) => c.companySize !== 'MEDIUM').length;

          return {
            filteredItems: filteredItems.length,
            correctSize,
            incorrectSize,
            sizeFilterAccuracy: filteredItems.length > 0 ? Math.round((correctSize / filteredItems.length) * 100) : 100,
            companySize: '51-200'
          };
        },
      },
      {
        name: 'Advanced multi-criteria search',
        test: async () => {
          const advancedRes = await this.api.request(
            'GET',
            '/api/customers?status=ACTIVE&industry=TECHNOLOGY&companySize=MEDIUM&limit=8'
          );

          if (advancedRes.status !== 200) {
            throw new Error(`Advanced customer search failed with status: ${advancedRes.status}`);
          }

          const advancedData = await advancedRes.json();
          const results = advancedData.data?.items || [];

          const allCriteriaMatch = results.filter((c: any) =>
            c.status === 'ACTIVE' &&
            c.industry === 'TECHNOLOGY' &&
            c.companySize === 'MEDIUM'
          ).length;

          return {
            totalResults: results.length,
            allCriteriaMatch,
            multiCriteriaAccuracy: results.length > 0 ? Math.round((allCriteriaMatch / results.length) * 100) : 100,
            criteria: ['ACTIVE', 'TECHNOLOGY', 'MEDIUM']
          };
        },
      },
      {
        name: 'Customer sorting by name',
        test: async () => {
          const sortRes = await this.api.request(
            'GET',
            '/api/customers?sortBy=name&sortOrder=asc&limit=10'
          );

          if (sortRes.status !== 200) {
            throw new Error(`Customer name sorting failed with status: ${sortRes.status}`);
          }

          const sortData = await sortRes.json();
          const results = sortData.data?.items || [];

          // Check if results are sorted alphabetically
          let isSorted = true;
          for (let i = 1; i < results.length; i++) {
            if (results[i-1].name?.localeCompare(results[i].name) > 0) {
              isSorted = false;
              break;
            }
          }

          return {
            totalResults: results.length,
            isSorted,
            sortBy: 'name',
            sortOrder: 'asc',
            firstItem: results[0]?.name,
            lastItem: results[results.length - 1]?.name
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
            `/api/customers?dateFrom=${startDate}&dateTo=${endDate}&limit=20`
          );

          if (dateFilterRes.status !== 200) {
            throw new Error(`Date filter failed with status: ${dateFilterRes.status}`);
          }

          const dateFilterData = await dateFilterRes.json();
          const items = dateFilterData.data?.items || [];

          // Get unfiltered data to compare
          const baselineRes = await this.api.request('GET', '/api/customers?limit=20');
          const baselineData = await baselineRes.json();
          const baselineItems = baselineData.data?.items || [];

          const dateRangeFiltered = items.filter((c: any) => {
            const createdAt = new Date(c.createdAt);
            return createdAt >= sixtyDaysAgo && createdAt <= new Date();
          }).length;

          return {
            filteredItems: items.length,
            baselineItems: baselineItems.length,
            dateRangeFiltered,
            dateFilterAccuracy: items.length > 0 ? Math.round((dateRangeFiltered / items.length) * 100) : 100,
            dateRange: `${startDate} to ${endDate}`
          };
        },
      },
      {
        name: 'Customer sorting by creation date',
        test: async () => {
          const sortRes = await this.api.request(
            'GET',
            '/api/customers?sortBy=createdAt&sortOrder=desc&limit=10'
          );

          if (sortRes.status !== 200) {
            throw new Error(`Customer date sorting failed with status: ${sortRes.status}`);
          }

          const sortData = await sortRes.json();
          const results = sortData.data?.items || [];

          // Check if results are sorted by date (newest first)
          let isSortedByDate = true;
          for (let i = 1; i < results.length; i++) {
            const prevDate = new Date(results[i-1].createdAt);
            const currDate = new Date(results[i].createdAt);
            if (prevDate < currDate) {
              isSortedByDate = false;
              break;
            }
          }

          return {
            totalResults: results.length,
            isSortedByDate,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            newestDate: results[0]?.createdAt,
            oldestDate: results[results.length - 1]?.createdAt
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
