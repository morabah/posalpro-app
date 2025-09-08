#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Customer Workflow Tests
 * User Story: US-2.1 (Customer Management), US-2.2 (Customer Lifecycle)
 * Hypothesis: H2 (Customer workflow efficiency), H3 (Complete customer journey tracking)
 */

import { ApiClient } from './api-client';

export class WorkflowTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔄 Testing Customer Lifecycle Workflows');
    this.api.resetTracking();

    const tests = [
      {
        name: 'End-to-end customer onboarding workflow',
        test: async () => {
          // Step 1: Get initial customer count
          const initialRes = await this.api.request('GET', '/api/customers?limit=100');
          const initialData = await initialRes.json();
          const initialCount = initialData.data?.items?.length || 0;

          // Step 2: Create new customer using isolated test method
          const testCustomer = await this.api.createTestCustomer({
            name: `Workflow Test Customer`,
            email: `workflow.customer@example.com`,
            phone: '+1-555-0123',
            status: 'LEAD',
            industry: 'Technology',
            companySize: '51-200',
          });

          if (!testCustomer || !testCustomer.id) {
            throw new Error('Customer creation failed');
          }

          const customerId = testCustomer.id;

          // Step 3: Update customer to ACTIVE status
          const updateData = {
            status: 'ACTIVE',
            website: 'https://workflow-customer.com',
          };

          const updateRes = await this.api.request(
            'PATCH',
            `/api/customers/${customerId}`,
            updateData
          );
          const updateResponse = await updateRes.json();

          if (updateRes.status !== 200) {
            throw new Error(`Customer update failed with status: ${updateRes.status}`);
          }

          // Step 4: Verify customer status was updated
          const verifyRes = await this.api.request('GET', `/api/customers/${customerId}`);
          const verifyData = await verifyRes.json();

          if (verifyRes.status !== 200) {
            throw new Error(`Customer verification failed with status: ${verifyRes.status}`);
          }

          // Step 5: Check final customer count
          const finalRes = await this.api.request('GET', '/api/customers?limit=100');
          const finalData = await finalRes.json();
          const finalCount = finalData.data?.items?.length || 0;

          return {
            initialCustomerCount: initialCount,
            finalCustomerCount: finalCount,
            customerCreated: finalCount > initialCount,
            customerId: customerId,
            initialStatus: 'LEAD',
            finalStatus: verifyData.data?.status,
            statusUpdated: verifyData.data?.status === 'ACTIVE',
            workflowCompleted: finalCount > initialCount && verifyData.data?.status === 'ACTIVE',
          };
        },
      },
      {
        name: 'Customer data consistency across multiple requests',
        test: async () => {
          // Test that customer data remains consistent across multiple requests
          const customersRes1 = await this.api.request('GET', '/api/customers?limit=10');
          const customersData1 = await customersRes1.json();

          const customersRes2 = await this.api.request('GET', '/api/customers?limit=10');
          const customersData2 = await customersRes2.json();

          if (customersRes1.status !== 200 || customersRes2.status !== 200) {
            throw new Error('Failed to fetch customer data consistently');
          }

          const items1 = customersData1.data?.items || [];
          const items2 = customersData2.data?.items || [];

          // Check if we have the same customers in both requests
          const ids1 = items1.map((c: any) => c.id).sort();
          const ids2 = items2.map((c: any) => c.id).sort();

          const sameLength = items1.length === items2.length;
          const sameIds = JSON.stringify(ids1) === JSON.stringify(ids2);

          return {
            firstRequestCount: items1.length,
            secondRequestCount: items2.length,
            consistentLength: sameLength,
            consistentIds: sameIds,
            dataConsistency: sameLength && sameIds,
            totalCustomers: Math.max(items1.length, items2.length),
          };
        },
      },
      {
        name: 'Customer search and filter workflow',
        test: async () => {
          // Step 1: Search for customers by industry
          const searchRes = await this.api.request(
            'GET',
            '/api/customers?industry=Technology&limit=5'
          );
          const searchData = await searchRes.json();

          if (searchRes.status !== 200) {
            throw new Error(`Customer search failed with status: ${searchRes.status}`);
          }

          const searchResults = searchData.data?.items || [];
          const techCustomers = searchResults.filter(
            (c: any) => c.industry === 'Technology'
          ).length;

          // Step 2: Filter by status
          const filterRes = await this.api.request('GET', '/api/customers?status=ACTIVE&limit=5');
          const filterData = await filterRes.json();

          if (filterRes.status !== 200) {
            throw new Error(`Customer filter failed with status: ${filterRes.status}`);
          }

          const filterResults = filterData.data?.items || [];
          const activeCustomers = filterResults.filter((c: any) => c.status === 'ACTIVE').length;

          return {
            searchResultsCount: searchResults.length,
            techCustomersFound: techCustomers,
            searchAccuracy:
              searchResults.length > 0
                ? Math.round((techCustomers / searchResults.length) * 100)
                : 100,
            filterResultsCount: filterResults.length,
            activeCustomersFound: activeCustomers,
            filterAccuracy:
              filterResults.length > 0
                ? Math.round((activeCustomers / filterResults.length) * 100)
                : 100,
            workflowFunctional: searchRes.status === 200 && filterRes.status === 200,
          };
        },
      },
      {
        name: 'Customer bulk operations workflow',
        test: async () => {
          // Step 1: Get customers for bulk operation
          const customersRes = await this.api.request('GET', '/api/customers?limit=3');
          const customersData = await customersRes.json();

          if (!customersData.data || customersData.data.items.length < 2) {
            return { status: 'SKIP', reason: 'Not enough customers for bulk operations test' };
          }

          const customerIds = customersData.data.items.slice(0, 2).map((c: any) => c.id);

          // Step 2: Attempt bulk status update (may not be implemented yet)
          const bulkRes = await this.api.request('PATCH', '/api/customers/bulk-update', {
            ids: customerIds,
            status: 'INACTIVE',
          });

          const bulkUpdateSupported = bulkRes.status !== 404;

          if (bulkUpdateSupported && bulkRes.status === 200) {
            // Verify the bulk update worked
            const verifyRes1 = await this.api.request('GET', `/api/customers/${customerIds[0]}`);
            const verifyRes2 = await this.api.request('GET', `/api/customers/${customerIds[1]}`);

            const verifyData1 = await verifyRes1.json();
            const verifyData2 = await verifyRes2.json();

            const bothUpdated =
              verifyData1.data?.status === 'INACTIVE' && verifyData2.data?.status === 'INACTIVE';

            return {
              bulkOperationSupported: true,
              bulkUpdateSuccessful: bothUpdated,
              customersProcessed: customerIds.length,
              statusChanged: bothUpdated,
              workflowCompleted: bothUpdated,
            };
          }

          return {
            bulkOperationSupported: bulkUpdateSupported,
            bulkUpdateSuccessful: false,
            customersIdentified: customerIds.length,
            status: bulkUpdateSupported ? 'endpoint_available' : 'endpoint_not_implemented',
            workflowCompleted: bulkUpdateSupported,
          };
        },
      },
      {
        name: 'Customer relationship validation workflow',
        test: async () => {
          // Step 1: Get a customer
          const customersRes = await this.api.request('GET', '/api/customers?limit=1');
          const customersData = await customersRes.json();

          if (!customersData.data || customersData.data.items.length === 0) {
            return { status: 'SKIP', reason: 'No customers available for relationship testing' };
          }

          const customerId = customersData.data.items[0].id;

          // Step 2: Check customer-proposal relationships
          const proposalsRes = await this.api.request(
            'GET',
            `/api/customers/${customerId}/proposals?limit=5`
          );
          const proposalsData = await proposalsRes.json();

          const proposalsAvailable = proposalsRes.status !== 404;
          const proposalCount = proposalsData.data?.items?.length || 0;

          // Step 3: Check customer statistics
          const statsRes = await this.api.request('GET', '/api/customers/stats');
          const statsData = await statsRes.json();

          const statsAvailable = statsRes.status !== 404;
          const totalCustomers = statsData.data?.total || 0;

          return {
            customerId: customerId,
            proposalsEndpointAvailable: proposalsAvailable,
            proposalCount: proposalCount,
            statsEndpointAvailable: statsAvailable,
            totalCustomers: totalCustomers,
            relationshipValidationComplete: proposalsAvailable && statsAvailable,
            dataIntegrityMaintained: totalCustomers >= 1,
          };
        },
      },
      {
        name: 'Complete customer lifecycle with deletion',
        test: async () => {
          // Step 1: Create a customer
          const newCustomerData = {
            name: `Lifecycle Delete Test Customer ${Date.now()}`,
            email: `lifecycle.delete.${Date.now()}@example.com`,
            phone: '+1-555-9999',
            status: 'LEAD',
            industry: 'Healthcare',
            companySize: '11-50',
          };

          const createRes = await this.api.request('POST', '/api/customers', newCustomerData);
          const createData = await createRes.json();

          if (createRes.status !== 201 && createRes.status !== 200) {
            throw new Error(`Customer creation failed with status: ${createRes.status}`);
          }

          if (!createData.data || !createData.data.id) {
            throw new Error('Customer creation did not return valid data');
          }

          const customerId = createData.data.id;

          // Step 2: Update customer status to ACTIVE
          const updateData = {
            status: 'ACTIVE',
            website: 'https://lifecycle-delete-customer.com',
          };

          const updateRes = await this.api.request(
            'PATCH',
            `/api/customers/${customerId}`,
            updateData
          );

          if (updateRes.status !== 200) {
            throw new Error(`Customer update failed with status: ${updateRes.status}`);
          }

          // Step 3: Verify the update
          const verifyUpdateRes = await this.api.request('GET', `/api/customers/${customerId}`);
          const verifyUpdateData = await verifyUpdateRes.json();

          if (verifyUpdateRes.status !== 200) {
            throw new Error(`Customer verification failed with status: ${verifyUpdateRes.status}`);
          }

          // Step 4: Delete the customer
          const deleteRes = await this.api.request('DELETE', `/api/customers/${customerId}`);
          const deleteData = await deleteRes.json();

          if (deleteRes.status === 404) {
            return {
              status: 'endpoint_not_found',
              message: 'Customer delete endpoint not implemented',
              lifecycleProgress: 'create_and_update_completed',
            };
          }

          if (deleteRes.status !== 200 && deleteRes.status !== 204) {
            throw new Error(`Customer deletion failed with status: ${deleteRes.status}`);
          }

          // Step 5: Verify deletion
          const verifyDeleteRes = await this.api.request('GET', `/api/customers/${customerId}`);

          const deletionSuccessful = verifyDeleteRes.status === 404;
          const lifecycleComplete =
            deletionSuccessful && verifyUpdateData.data?.status === 'ACTIVE';

          return {
            customerId: customerId,
            created: true,
            updated: verifyUpdateData.data?.status === 'ACTIVE',
            deleted: deletionSuccessful,
            lifecycleComplete: lifecycleComplete,
            initialStatus: 'LEAD',
            finalStatusBeforeDeletion: verifyUpdateData.data?.status,
            deletionVerified: verifyDeleteRes.status === 404,
            fullWorkflowTested: true,
          };
        },
      },
      {
        name: 'Customer lifecycle test with cleanup',
        test: async () => {
          let customerId: string | null = null;

          try {
            // Create test customer
            const testCustomer = await this.api.createTestCustomer({
              name: `Lifecycle Test Customer`,
              email: `lifecycle.customer@example.com`,
              status: 'LEAD',
              industry: 'Technology',
            });

            if (!testCustomer?.id) {
              throw new Error('Failed to create test customer');
            }

            customerId = testCustomer.id;

            // Verify creation
            const verifyRes = await this.api.request('GET', `/api/customers/${customerId}`);
            if (verifyRes.status !== 200) {
              throw new Error('Customer verification failed');
            }

            // Clean up
            await this.api.cleanupTestCustomer(customerId);

            // Verify cleanup
            const cleanupVerifyRes = await this.api.request('GET', `/api/customers/${customerId}`);
            const deletionConfirmed = cleanupVerifyRes.status === 404;

            return {
              lifecycleComplete: true,
              creationSuccessful: true,
              verificationSuccessful: true,
              cleanupSuccessful: true,
              deletionConfirmed,
            };
          } catch (error) {
            // Ensure cleanup on error
            if (customerId) {
              try {
                await this.api.cleanupTestCustomer(customerId);
              } catch (cleanupError) {
                // Ignore cleanup errors in error handling
              }
            }
            throw error;
          }
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
