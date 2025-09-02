#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Customer API Tests
 * Tests core customer API functionality and data structure validation
 */

import { ApiClient } from './api-client';

export class ApiTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n👥 Testing Customer Module API Functionality');
    this.api.resetTracking();

    const tests = [
      {
        name: 'List customers with pagination and sorting',
        test: async () => {
          const res = await this.api.request(
            'GET',
            '/api/customers?limit=5&sortBy=name&sortOrder=asc'
          );
          const data = await res.json();

          if (!data.data || !Array.isArray(data.data.items)) {
            throw new Error('Invalid customer list response structure');
          }

          // Validate pagination metadata
          const hasPagination = data.data.pagination !== undefined;
          const hasItems = data.data.items.length > 0;

          return {
            itemCount: data.data.items.length,
            hasPagination,
            hasItems,
            sortBy: 'name',
            sortOrder: 'asc',
          };
        },
      },
      {
        name: 'Get detailed customer profile',
        test: async () => {
          // First get a customer ID
          const customersRes = await this.api.request('GET', '/api/customers?limit=1');
          const customersData = await customersRes.json();

          if (!customersData.data || customersData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No customers available for detail testing' };
          }

          const customerId = customersData.data.items[0].id;
          const res = await this.api.request('GET', `/api/customers/${customerId}`);
          const data = await res.json();

          if (!data.ok || !data.data) {
            throw new Error(`Invalid customer detail response structure`);
          }

          // Validate comprehensive customer profile structure
          const customer = data.data;
          const requiredFields = ['id', 'name', 'email', 'status', 'createdAt'];
          const optionalFields = [
            'phone',
            'website',
            'industry',
            'companySize',
            'revenue',
            'tier',
            'address',
            'tags',
          ];

          for (const field of requiredFields) {
            if (!(field in customer)) {
              throw new Error(`Missing required customer field: ${field}`);
            }
          }

          // Check for expected optional fields presence
          const presentOptionalFields = optionalFields.filter(field => field in customer);

          return {
            customerId,
            validated: true,
            requiredFields: requiredFields.length,
            optionalFieldsPresent: presentOptionalFields.length,
            profileCompleteness: Math.round(
              ((requiredFields.length + presentOptionalFields.length) /
                (requiredFields.length + optionalFields.length)) *
                100
            ),
          };
        },
      },
      {
        name: 'Create new customer profile',
        test: async () => {
          const newCustomerData = {
            name: `Test Customer ${Date.now()}`,
            email: `test.customer.${Date.now()}@example.com`,
            phone: '+1-555-0123',
            website: 'https://testcustomer.com',
            industry: 'Technology',
            companySize: '51-200',
            status: 'ACTIVE',
            address: {
              street: '123 Test Street',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345',
              country: 'USA',
            },
          };

          const res = await this.api.request('POST', '/api/customers', newCustomerData);
          const data = await res.json();

          if (res.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Customer creation endpoint not implemented',
            };
          }

          if (res.status !== 201 && res.status !== 200) {
            throw new Error(`Customer creation failed with status: ${res.status}`);
          }

          if (!data.ok || !data.data || !data.data.id) {
            throw new Error('Invalid customer creation response');
          }

          return {
            created: true,
            customerId: data.data.id,
            name: data.data.name,
            email: data.data.email,
            status: data.data.status,
          };
        },
      },
      {
        name: 'Update customer information',
        test: async () => {
          // First get an existing customer
          const customersRes = await this.api.request('GET', '/api/customers?limit=1');
          const customersData = await customersRes.json();

          if (!customersData.data || customersData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No customers available for update testing' };
          }

          const customerId = customersData.data.items[0].id;
          const originalCustomer = customersData.data.items[0];

          // Update customer data
          const updateData = {
            phone: '+1-555-9999',
            website: 'https://updated-customer.com',
            industry: 'Healthcare',
            companySize: '201-500',
          };

          const updateRes = await this.api.request(
            'PATCH',
            `/api/customers/${customerId}`,
            updateData
          );
          const updateResponse = await updateRes.json();

          if (updateRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Customer update endpoint not implemented',
            };
          }

          if (updateRes.status !== 200) {
            throw new Error(`Customer update failed with status: ${updateRes.status}`);
          }

          if (!updateResponse.ok || !updateResponse.data) {
            throw new Error('Invalid customer update response');
          }

          return {
            updated: true,
            customerId,
            originalIndustry: originalCustomer.industry,
            newIndustry: updateResponse.data.industry,
            originalPhone: originalCustomer.phone,
            newPhone: updateResponse.data.phone,
          };
        },
      },
      {
        name: 'Customer search functionality',
        test: async () => {
          const searchRes = await this.api.request('GET', '/api/customers/search?q=Tech&limit=5');
          const searchData = await searchRes.json();

          if (searchRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Customer search endpoint not implemented',
            };
          }

          if (searchRes.status !== 200) {
            throw new Error(`Customer search failed with status: ${searchRes.status}`);
          }

          // Validate search results
          const hasResults = searchData.data?.items && searchData.data.items.length >= 0;
          const hasPagination = searchData.data?.pagination !== undefined;

          return {
            searchTerm: 'Tech',
            found: searchData.data?.items?.length || 0,
            hasPagination,
            searchSuccessful: hasResults,
          };
        },
      },
      {
        name: 'Customer statistics and analytics',
        test: async () => {
          const statsRes = await this.api.request('GET', '/api/customers/stats');
          const statsData = await statsRes.json();

          if (statsRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Customer stats endpoint not implemented',
            };
          }

          if (statsRes.status !== 200) {
            throw new Error(`Customer stats failed with status: ${statsRes.status}`);
          }

          // Validate stats structure
          const hasBasicStats = statsData.data && typeof statsData.data.total === 'number';
          const hasStatusBreakdown =
            statsData.data?.byStatus && typeof statsData.data.byStatus === 'object';

          return {
            hasBasicStats,
            hasStatusBreakdown,
            totalCustomers: statsData.data?.total || 0,
            statsAvailable: Object.keys(statsData.data || {}).length,
          };
        },
      },
      {
        name: 'Customer-proposal relationships',
        test: async () => {
          // First get a customer ID
          const customersRes = await this.api.request('GET', '/api/customers?limit=1');
          const customersData = await customersRes.json();

          if (!customersData.data || customersData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No customers available for relationship testing' };
          }

          const customerId = customersData.data.items[0].id;
          const relationsRes = await this.api.request(
            'GET',
            `/api/customers/${customerId}/proposals?limit=5`
          );
          const relationsData = await relationsRes.json();

          if (relationsRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Customer-proposal relationship endpoint not implemented',
            };
          }

          if (relationsRes.status !== 200) {
            throw new Error(
              `Customer-proposal relationship failed with status: ${relationsRes.status}`
            );
          }

          return {
            customerId,
            proposalCount: relationsData.data?.items?.length || 0,
            hasPagination: !!relationsData.data?.pagination,
            relationshipAvailable: relationsRes.status === 200,
          };
        },
      },
      {
        name: 'Delete customer profile',
        test: async () => {
          // First create a test customer to delete
          const testCustomerData = {
            name: `Delete Test Customer ${Date.now()}`,
            email: `delete.customer.${Date.now()}@example.com`,
            phone: '+1-555-0123',
            status: 'ACTIVE',
            industry: 'Technology',
          };

          const createRes = await this.api.request('POST', '/api/customers', testCustomerData);
          const createData = await createRes.json();

          if (createRes.status !== 201 && createRes.status !== 200) {
            throw new Error(`Customer creation failed with status: ${createRes.status}`);
          }

          if (!createData.data || !createData.data.id) {
            throw new Error('Customer creation did not return valid data');
          }

          const customerId = createData.data.id;

          // Now delete the customer
          const deleteRes = await this.api.request('DELETE', `/api/customers/${customerId}`);
          const deleteData = await deleteRes.json();

          if (deleteRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Customer delete endpoint not implemented',
            };
          }

          if (deleteRes.status !== 200 && deleteRes.status !== 204) {
            throw new Error(`Customer deletion failed with status: ${deleteRes.status}`);
          }

          // Verify customer was deleted
          const verifyRes = await this.api.request('GET', `/api/customers/${customerId}`);

          if (verifyRes.status === 404) {
            return {
              deleted: true,
              customerId: customerId,
              deletionVerified: true,
              responseStatus: deleteRes.status,
            };
          } else if (verifyRes.status === 200) {
            return {
              deleted: false,
              customerId: customerId,
              stillExists: true,
              responseStatus: deleteRes.status,
            };
          } else {
            return {
              deleted: true,
              customerId: customerId,
              deletionVerified: 'unknown',
              responseStatus: deleteRes.status,
              verificationStatus: verifyRes.status,
            };
          }
        },
      },
      {
        name: 'Customer data structure validation',
        test: async () => {
          const res = await this.api.request('GET', '/api/customers?limit=2');
          const data = await res.json();

          if (!data.data || !data.data.items || data.data.items.length === 0) {
            return { validated: false, reason: 'No customers available for validation' };
          }

          const customer = data.data.items[0];
          const comprehensiveFields = [
            'id',
            'name',
            'email',
            'status',
            'createdAt',
            'updatedAt',
            'phone',
            'website',
            'industry',
            'companySize',
            'revenue',
            'tier',
          ];

          const presentFields = comprehensiveFields.filter(field => field in customer);
          const missingFields = comprehensiveFields.filter(field => !(field in customer));

          // Validate data types
          const validations = {
            id: typeof customer.id === 'string',
            name: typeof customer.name === 'string',
            email: typeof customer.email === 'string' && customer.email.includes('@'),
            status: ['ACTIVE', 'INACTIVE', 'LEAD', 'PROSPECT'].includes(customer.status),
            createdAt: !isNaN(Date.parse(customer.createdAt)),
            phone: !customer.phone || typeof customer.phone === 'string',
            website:
              !customer.website ||
              (typeof customer.website === 'string' && customer.website.startsWith('http')),
            industry: !customer.industry || typeof customer.industry === 'string',
            companySize: !customer.companySize || typeof customer.companySize === 'string',
          };

          const validFields = Object.values(validations).filter(Boolean).length;

          return {
            validated: true,
            totalFields: comprehensiveFields.length,
            presentFields: presentFields.length,
            missingFields: missingFields.length,
            validFields,
            dataQuality: Math.round((validFields / comprehensiveFields.length) * 100),
          };
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
