#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Workflow Tests
 * Tests complete product management workflows
 */

import { ApiClient } from './api-client';

export class WorkflowTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔄 Testing Product Workflows');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Complete product lifecycle workflow',
        test: async () => {
          let productId: string | null = null;

          try {
            // 1. Create product with unique identifiers
            const newProduct = {
              name: `Lifecycle Test Product`,
              sku: `LIFECYCLE`,
              description: 'Product for lifecycle testing',
              price: 79.99,
              stockQuantity: 50,
              category: ['Lifecycle Test'],
              tags: ['test'],
              images: [],
              status: 'ACTIVE',
            };

            const createRes = await this.api.request('POST', '/api/products', newProduct);
            if (createRes.status !== 200 && createRes.status !== 201) {
              throw new Error(`Failed to create product: ${createRes.status}`);
            }

            const createData = await createRes.json();
            const product = createData.data || createData;
            productId = product.id;

            if (!productId) {
              throw new Error('Product creation did not return valid ID');
            }

          // 2. Read product
          const readRes = await this.api.request('GET', `/api/products/${productId}`);
          if (readRes.status !== 200) {
            await this.api.cleanupTestProduct(productId);
            throw new Error(`Failed to read product: ${readRes.status}`);
          }

          const readData = await readRes.json();
          const readProduct = readData.data || readData;

          // 3. Update product
          const updateData = {
            name: `${newProduct.name} - Updated`,
            price: 89.99,
            stockQuantity: 45,
            description: `${newProduct.description} - Updated`,
          };

          const updateRes = await this.api.request(
            'PATCH',
            `/api/products/${productId}`,
            updateData
          );
          if (updateRes.status !== 200) {
            await this.api.cleanupTestProduct(productId);
            throw new Error(`Failed to update product: ${updateRes.status}`);
          }

          // 4. Verify update
          const verifyRes = await this.api.request('GET', `/api/products/${productId}`);
          if (verifyRes.status !== 200) {
            await this.api.cleanupTestProduct(productId);
            throw new Error(`Failed to verify update: ${verifyRes.status}`);
          }

          const verifyData = await verifyRes.json();
          const verifyProduct = verifyData.data || verifyData;

          const updateSuccessful =
            verifyProduct.name === updateData.name &&
            verifyProduct.price === updateData.price &&
            verifyProduct.stockQuantity === updateData.stockQuantity;

          // 5. Delete product
          const deleteRes = await this.api.request('DELETE', `/api/products/${productId}`);
          if (deleteRes.status !== 200 && deleteRes.status !== 204) {
            await this.api.cleanupTestProduct(productId);
            throw new Error(`Failed to delete product: ${deleteRes.status}`);
          }

          // 6. Verify deletion
          const verifyDeleteRes = await this.api.request('GET', `/api/products/${productId}`);
          const deletionConfirmed = verifyDeleteRes.status === 404;

          return {
            lifecycleCompleted: true,
            createSuccessful: true,
            readSuccessful: true,
            updateSuccessful,
            deleteSuccessful: deleteRes.status === 200 || deleteRes.status === 204,
            deletionConfirmed,
            workflowComplete: updateSuccessful && deletionConfirmed,
            productId,
          };
          } catch (error) {
            // Ensure cleanup on any error
            if (productId) {
              try {
                await this.api.cleanupTestProduct(productId);
              } catch (cleanupError) {
                console.log(`Warning: Failed to cleanup product ${productId}:`, cleanupError);
              }
            }
            throw error;
          }
        },
      },
      {
        name: 'Product status transition workflow',
        test: async () => {
          // Create a product
          const testProduct = await this.api.createTestProduct({
            name: `Status Transition Test ${Date.now()}`,
            sku: `STATUS-TRANS-${Date.now()}`,
            price: 59.99,
            stockQuantity: 20,
            category: 'Status Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for status transition');
          }

          const productId = testProduct.id;
          const statusTransitions = ['INACTIVE', 'DISCONTINUED', 'ACTIVE'];

          let transitionsSuccessful = 0;

          for (const newStatus of statusTransitions) {
            const updateRes = await this.api.request('PATCH', `/api/products/${productId}`, {
              status: newStatus,
            });

            if (updateRes.status === 200) {
              // Verify the status change
              const verifyRes = await this.api.request('GET', `/api/products/${productId}`);
              if (verifyRes.status === 200) {
                const verifyData = await verifyRes.json();
                const product = verifyData.data || verifyData;
                if (product.status === newStatus) {
                  transitionsSuccessful++;
                }
              }
            }
          }

          // Cleanup
          await this.api.cleanupTestProduct(productId);

          return {
            statusTransitionsAttempted: statusTransitions.length,
            statusTransitionsSuccessful: transitionsSuccessful,
            statusTransitionWorkflow: transitionsSuccessful === statusTransitions.length,
            productId,
          };
        },
      },
      {
        name: 'Product inventory management workflow',
        test: async () => {
          // Create a product with initial stock
          const initialStock = 100;
          const testProduct = await this.api.createTestProduct({
            name: `Inventory Test Product ${Date.now()}`,
            sku: `INVENTORY-${Date.now()}`,
            price: 49.99,
            stockQuantity: initialStock,
            category: 'Inventory Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for inventory test');
          }

          const productId = testProduct.id;

          // Simulate stock changes
          const stockChanges = [50, 25, 75, 0]; // Various stock levels
          let inventoryUpdatesSuccessful = 0;

          for (const newStock of stockChanges) {
            const updateRes = await this.api.request('PATCH', `/api/products/${productId}`, {
              stockQuantity: newStock,
            });

            if (updateRes.status === 200) {
              // Verify the stock change
              const verifyRes = await this.api.request('GET', `/api/products/${productId}`);
              if (verifyRes.status === 200) {
                const verifyData = await verifyRes.json();
                const product = verifyData.data || verifyData;
                if (product.stockQuantity === newStock) {
                  inventoryUpdatesSuccessful++;
                }
              }
            }
          }

          // Test low stock warning (if implemented)
          const lowStockUpdateRes = await this.api.request('PATCH', `/api/products/${productId}`, {
            stockQuantity: 2, // Very low stock
          });

          const lowStockHandled = lowStockUpdateRes.status === 200;

          // Cleanup
          await this.api.cleanupTestProduct(productId);

          return {
            inventoryUpdatesAttempted: stockChanges.length,
            inventoryUpdatesSuccessful,
            lowStockHandling: lowStockHandled,
            inventoryWorkflowComplete: inventoryUpdatesSuccessful === stockChanges.length,
            productId,
          };
        },
      },
      {
        name: 'Product pricing strategy workflow',
        test: async () => {
          // Create a product
          const testProduct = await this.api.createTestProduct({
            name: `Pricing Strategy Test ${Date.now()}`,
            sku: `PRICING-${Date.now()}`,
            price: 99.99,
            cost: 50.0,
            stockQuantity: 30,
            category: 'Pricing Test',
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for pricing test');
          }

          const productId = testProduct.id;

          // Test different pricing scenarios
          const priceScenarios = [
            { price: 79.99, cost: 45.0 }, // Price reduction
            { price: 119.99, cost: 50.0 }, // Price increase
            { price: 99.99, cost: 55.0 }, // Cost increase
            { price: 89.99, cost: 40.0 }, // Both change
          ];

          let pricingUpdatesSuccessful = 0;

          for (const scenario of priceScenarios) {
            const updateRes = await this.api.request('PATCH', `/api/products/${productId}`, {
              price: scenario.price,
              cost: scenario.cost,
            });

            if (updateRes.status === 200) {
              // Verify the pricing change
              const verifyRes = await this.api.request('GET', `/api/products/${productId}`);
              if (verifyRes.status === 200) {
                const verifyData = await verifyRes.json();
                const product = verifyData.data || verifyData;
                if (
                  Math.abs(product.price - scenario.price) < 0.01 &&
                  Math.abs(product.cost - scenario.cost) < 0.01
                ) {
                  pricingUpdatesSuccessful++;
                }
              }
            }
          }

          // Test profit margin calculation (if available)
          const marginRes = await this.api.request('GET', `/api/products/${productId}/margin`);
          const marginCalculated = marginRes.status === 200;

          // Cleanup
          await this.api.cleanupTestProduct(productId);

          return {
            pricingScenariosTested: priceScenarios.length,
            pricingUpdatesSuccessful,
            marginCalculationAvailable: marginCalculated,
            pricingWorkflowComplete: pricingUpdatesSuccessful === priceScenarios.length,
            productId,
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
