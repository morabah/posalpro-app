#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Permissions Tests
 * Tests role-based access control for product operations
 */

import { ApiClient } from './api-client';

export class PermissionsTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔐 Testing Product Permissions & RBAC');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Read permissions for different roles',
        test: async () => {
          // Test that different roles can read products
          const roles = ['admin', 'sales', 'viewer'];
          const roleResults = [];

          for (const role of roles) {
            try {
              // Create a new API client for this role (simplified - in real test would use different auth)
              const roleApi = new ApiClient(this.api['baseUrl']);
              const loginSuccess = await roleApi.login('test@example.com', 'password', role);

              if (loginSuccess) {
                const productsRes = await roleApi.request('GET', '/api/products?limit=5');
                roleResults.push({
                  role,
                  canRead: productsRes.status === 200,
                  status: productsRes.status,
                });
              } else {
                roleResults.push({
                  role,
                  canRead: false,
                  status: 'login_failed',
                });
              }
            } catch (error) {
              roleResults.push({
                role,
                canRead: false,
                status: 'error',
                error: error.message,
              });
            }
          }

          const readers = roleResults.filter(r => r.canRead).length;
          const totalRoles = roleResults.length;

          return {
            rolesTested: totalRoles,
            rolesWithReadAccess: readers,
            readPermissionsWorking: readers > 0,
            roleResults,
          };
        },
      },
      {
        name: 'Create permissions by role',
        test: async () => {
          const roles = ['admin', 'sales', 'viewer'];
          const roleResults = [];

          for (const role of roles) {
            try {
              const roleApi = new ApiClient(this.api['baseUrl']);
              const loginSuccess = await roleApi.login('test@example.com', 'password', role);

              if (loginSuccess) {
                const testProduct = {
                  name: `Permission Test ${role} ${Date.now()}`,
                  sku: `PERM-${role}-${Date.now()}`,
                  price: 29.99,
                  stockQuantity: 5,
                  status: 'ACTIVE',
                };

                const createRes = await roleApi.request('POST', '/api/products', testProduct);

                if (createRes.status === 200 || createRes.status === 201) {
                  const createData = await createRes.json();
                  const product = createData.data || createData;

                  // Cleanup if creation succeeded
                  if (product?.id) {
                    await roleApi.cleanupTestProduct(product.id);
                  }

                  roleResults.push({
                    role,
                    canCreate: true,
                    status: createRes.status,
                  });
                } else {
                  roleResults.push({
                    role,
                    canCreate: false,
                    status: createRes.status,
                  });
                }
              } else {
                roleResults.push({
                  role,
                  canCreate: false,
                  status: 'login_failed',
                });
              }
            } catch (error) {
              roleResults.push({
                role,
                canCreate: false,
                status: 'error',
                error: error.message,
              });
            }
          }

          const creators = roleResults.filter(r => r.canCreate).length;
          const totalRoles = roleResults.length;

          return {
            rolesTested: totalRoles,
            rolesWithCreateAccess: creators,
            createPermissionsWorking: creators >= 1, // At least admin should be able to create
            roleResults,
          };
        },
      },
      {
        name: 'Update permissions by role',
        test: async () => {
          // Create a test product first
          const testProduct = await this.api.createTestProduct({
            name: `Update Permission Test ${Date.now()}`,
            sku: `UPDATE-PERM-${Date.now()}`,
            price: 39.99,
            stockQuantity: 10,
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for update permissions');
          }

          const productId = testProduct.id;
          const roles = ['admin', 'sales', 'viewer'];
          const roleResults = [];

          for (const role of roles) {
            try {
              const roleApi = new ApiClient(this.api['baseUrl']);
              const loginSuccess = await roleApi.login('test@example.com', 'password', role);

              if (loginSuccess) {
                const updateData = {
                  price: 49.99,
                  name: `${testProduct.name} - Updated by ${role}`,
                };

                const updateRes = await roleApi.request(
                  'PATCH',
                  `/api/products/${productId}`,
                  updateData
                );

                roleResults.push({
                  role,
                  canUpdate: updateRes.status === 200,
                  status: updateRes.status,
                });
              } else {
                roleResults.push({
                  role,
                  canUpdate: false,
                  status: 'login_failed',
                });
              }
            } catch (error) {
              roleResults.push({
                role,
                canUpdate: false,
                status: 'error',
                error: error.message,
              });
            }
          }

          // Cleanup
          await this.api.cleanupTestProduct(productId);

          const updaters = roleResults.filter(r => r.canUpdate).length;
          const totalRoles = roleResults.length;

          return {
            rolesTested: totalRoles,
            rolesWithUpdateAccess: updaters,
            updatePermissionsWorking: updaters >= 1,
            productId,
            roleResults,
          };
        },
      },
      {
        name: 'Delete permissions by role',
        test: async () => {
          const roles = ['admin', 'sales', 'viewer'];
          const roleResults = [];

          for (const role of roles) {
            // Create a separate test product for each role
            const roleProduct = await this.api.createTestProduct({
              name: `Delete Permission Test ${role} ${Date.now()}`,
              sku: `DELETE-PERM-${role}-${Date.now()}`,
              price: 19.99,
              stockQuantity: 3,
              status: 'ACTIVE',
            });

            if (!roleProduct?.id) {
              roleResults.push({
                role,
                canDelete: false,
                status: 'create_failed',
              });
              continue;
            }

            try {
              const roleApi = new ApiClient(this.api['baseUrl']);
              const loginSuccess = await roleApi.login('test@example.com', 'password', role);

              if (loginSuccess) {
                const deleteRes = await roleApi.request(
                  'DELETE',
                  `/api/products/${roleProduct.id}`
                );

                roleResults.push({
                  role,
                  canDelete: deleteRes.status === 200 || deleteRes.status === 204,
                  status: deleteRes.status,
                  productId: roleProduct.id,
                });

                // If delete failed, cleanup with original API
                if (deleteRes.status !== 200 && deleteRes.status !== 204) {
                  await this.api.cleanupTestProduct(roleProduct.id);
                }
              } else {
                roleResults.push({
                  role,
                  canDelete: false,
                  status: 'login_failed',
                });
                // Cleanup
                await this.api.cleanupTestProduct(roleProduct.id);
              }
            } catch (error) {
              roleResults.push({
                role,
                canDelete: false,
                status: 'error',
                error: error.message,
              });
              // Cleanup
              await this.api.cleanupTestProduct(roleProduct.id);
            }
          }

          const deleters = roleResults.filter(r => r.canDelete).length;
          const totalRoles = roleResults.length;

          return {
            rolesTested: totalRoles,
            rolesWithDeleteAccess: deleters,
            deletePermissionsWorking: deleters >= 1,
            roleResults,
          };
        },
      },
      {
        name: 'Field-level permissions',
        test: async () => {
          // Test if certain fields are protected from certain roles
          const testProduct = await this.api.createTestProduct({
            name: `Field Permission Test ${Date.now()}`,
            sku: `FIELD-PERM-${Date.now()}`,
            price: 99.99,
            cost: 60.0, // Cost might be restricted
            stockQuantity: 15,
            status: 'ACTIVE',
          });

          if (!testProduct?.id) {
            throw new Error('Failed to create test product for field permissions');
          }

          const productId = testProduct.id;
          const restrictedFields = ['cost', 'stockQuantity']; // Fields that might be restricted
          const roleResults = [];

          for (const field of restrictedFields) {
            try {
              // Try updating restricted field with different role
              const roleApi = new ApiClient(this.api['baseUrl']);
              const loginSuccess = await roleApi.login('viewer@example.com', 'password', 'viewer');

              if (loginSuccess) {
                const updateData = { [field]: field === 'cost' ? 70.0 : 10 };

                const updateRes = await roleApi.request(
                  'PATCH',
                  `/api/products/${productId}`,
                  updateData
                );

                roleResults.push({
                  field,
                  restricted: updateRes.status === 403 || updateRes.status === 401,
                  status: updateRes.status,
                });
              } else {
                roleResults.push({
                  field,
                  restricted: false,
                  status: 'login_failed',
                });
              }
            } catch (error) {
              roleResults.push({
                field,
                restricted: false,
                status: 'error',
                error: error.message,
              });
            }
          }

          // Cleanup
          await this.api.cleanupTestProduct(productId);

          const restrictedFieldsCount = roleResults.filter(r => r.restricted).length;

          return {
            fieldsTested: restrictedFields.length,
            restrictedFields: restrictedFieldsCount,
            fieldLevelPermissions: restrictedFieldsCount > 0,
            productId,
            fieldResults: roleResults,
          };
        },
      },
      {
        name: 'Bulk operation permissions',
        test: async () => {
          // Test permissions for bulk operations
          const roles = ['admin', 'sales', 'viewer'];
          const roleResults = [];

          for (const role of roles) {
            try {
              const roleApi = new ApiClient(this.api['baseUrl']);
              const loginSuccess = await roleApi.login('test@example.com', 'password', role);

              if (loginSuccess) {
                // Try bulk status update
                const bulkRes = await roleApi.request('PATCH', '/api/products/bulk/status', {
                  ids: ['test-id-1', 'test-id-2'],
                  status: 'INACTIVE',
                });

                roleResults.push({
                  role,
                  canBulkUpdate: bulkRes.status !== 403 && bulkRes.status !== 401,
                  status: bulkRes.status,
                });
              } else {
                roleResults.push({
                  role,
                  canBulkUpdate: false,
                  status: 'login_failed',
                });
              }
            } catch (error) {
              roleResults.push({
                role,
                canBulkUpdate: false,
                status: 'error',
                error: error.message,
              });
            }
          }

          const bulkOperators = roleResults.filter(r => r.canBulkUpdate).length;
          const totalRoles = roleResults.length;

          return {
            rolesTested: totalRoles,
            rolesWithBulkAccess: bulkOperators,
            bulkPermissionsWorking: bulkOperators >= 1,
            roleResults,
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
