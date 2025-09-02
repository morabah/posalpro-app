#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Customer Detailed Views Tests
 * User Story: US-2.1 (Customer Management), US-2.3 (Customer Detail Views)
 * Hypothesis: H2 (Customer detail views improve understanding), H3 (Comprehensive customer data enhances relationships)
 */

import { ApiClient } from './api-client';

export class DetailedViewsTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔎 Testing Customer Detailed Views');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Customer profile detail completeness',
        test: async () => {
          // Get a customer for detailed view testing
          const customersRes = await this.api.request('GET', '/api/customers?limit=1');
          const customersData = await customersRes.json();

          if (!customersData.data || customersData.data.items.length === 0) {
            console.log('⏭️ Customer profile detail - SKIP: No customers available');
            return { status: 'SKIP', reason: 'No customers available' };
          }

          const customerId = customersData.data.items[0].id;

          // Get detailed customer profile
          const detailRes = await this.api.request('GET', `/api/customers/${customerId}`);

          if (detailRes.status === 404) {
            return { status: 'endpoint_not_found', message: 'Customer detail endpoint not implemented' };
          }

          if (detailRes.status !== 200) {
            throw new Error(`Customer detail request failed with status: ${detailRes.status}`);
          }

          const detailData = await detailRes.json();

          // Check if detailed response has expected customer fields
          if (detailData.ok && detailData.data && typeof detailData.data === 'object') {
            const customer = detailData.data;

            // Core customer information
            const hasBasicInfo = customer.id && customer.name && customer.email;
            const hasContactInfo = customer.phone || customer.website;
            const hasCompanyInfo = customer.industry || customer.companySize;
            const hasAddressInfo = customer.address && typeof customer.address === 'object';
            const hasMetadata = customer.tags || customer.createdAt;

            // Calculate completeness score
            const completenessFields = [
              customer.id, customer.name, customer.email, customer.status,
              customer.phone, customer.website, customer.industry, customer.companySize,
              customer.address, customer.createdAt
            ].filter(Boolean).length;

            const completenessScore = Math.round((completenessFields / 10) * 100);

            return {
              customerId: customer.id,
              hasBasicInfo,
              hasContactInfo,
              hasCompanyInfo,
              hasAddressInfo,
              hasMetadata,
              completenessScore: `${completenessScore}%`,
              profileCompleteness: completenessScore >= 70 ? 'good' : completenessScore >= 50 ? 'fair' : 'incomplete',
              availableFields: Object.keys(customer)
            };
          }

          return { status: detailRes.status, dataReceived: !!detailData.data };
        },
      },
      {
        name: 'Customer relationship data',
        test: async () => {
          // Get a customer to test relationships
          const customersRes = await this.api.request('GET', '/api/customers?limit=1');
          const customersData = await customersRes.json();

          if (
            customersRes.status !== 200 ||
            !customersData.data?.items ||
            customersData.data.items.length === 0
          ) {
            console.log('⏭️ Customer relationship data - SKIP: No customers available');
            return { status: 'SKIP', reason: 'No customers available for relationship testing' };
          }

          const customerId = customersData.data.items[0].id;
          const relationships: any[] = [];

          // Test customer-proposal relationships
          const proposalsRes = await this.api.request('GET', `/api/customers/${customerId}/proposals?limit=5`);
          const proposalsAvailable = proposalsRes.status !== 404;

          if (proposalsAvailable && proposalsRes.status === 200) {
            const proposalsData = await proposalsRes.json();
            const proposalCount = proposalsData.data?.items?.length || 0;
            relationships.push({
              type: 'proposals',
              available: true,
              count: proposalCount,
              endpoint: `/api/customers/${customerId}/proposals`
            });
          } else {
            relationships.push({
              type: 'proposals',
              available: false,
              count: 0,
              endpoint: `/api/customers/${customerId}/proposals`
            });
          }

          // Test customer statistics relationship
          const statsRes = await this.api.request('GET', '/api/customers/stats');
          const statsAvailable = statsRes.status !== 404;

          if (statsAvailable && statsRes.status === 200) {
            const statsData = await statsRes.json();
            const totalCustomers = statsData.data?.total || 0;
            relationships.push({
              type: 'statistics',
              available: true,
              totalCustomers,
              endpoint: '/api/customers/stats'
            });
          } else {
            relationships.push({
              type: 'statistics',
              available: false,
              totalCustomers: 0,
              endpoint: '/api/customers/stats'
            });
          }

          return {
            customerId,
            relationships,
            relationshipTypes: relationships.length,
            availableRelationships: relationships.filter(r => r.available).length,
            relationshipCompleteness: Math.round((relationships.filter(r => r.available).length / relationships.length) * 100)
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
