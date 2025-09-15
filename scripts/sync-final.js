#!/usr/bin/env node

/**
 * Final Database Synchronization Script
 *
 * This script synchronizes data from local to cloud database,
 * using the existing default tenant and handling all required fields.
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

console.log('🔄 Final Database Synchronization');
console.log('==================================\n');

class FinalSync {
  constructor() {
    this.localClient = null;
    this.cloudClient = null;
    this.defaultTenantId = 'tenant_default'; // Use existing tenant
    this.syncStats = {
      tables: 0,
      records: 0,
      newRecords: 0,
      updatedRecords: 0,
      errors: 0
    };
  }

  async connect() {
    try {
      console.log('📡 Connecting to databases...');

      this.localClient = new Client({
        connectionString: process.env.DATABASE_URL
      });
      await this.localClient.connect();
      console.log('✅ Connected to local database');

      this.cloudClient = new Client({
        connectionString: process.env.CLOUD_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await this.cloudClient.connect();
      console.log('✅ Connected to cloud database');

    } catch (error) {
      console.error('❌ Connection error:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.localClient) await this.localClient.end();
    if (this.cloudClient) await this.cloudClient.end();
    console.log('🔌 Database connections closed');
  }

  async verifyDefaultTenant() {
    try {
      console.log('🏢 Verifying default tenant...');

      const existingTenant = await this.cloudClient.query(
        'SELECT id, name, domain FROM tenants WHERE id = $1',
        [this.defaultTenantId]
      );

      if (existingTenant.rows.length > 0) {
        const tenant = existingTenant.rows[0];
        console.log(`✅ Using existing tenant: ${tenant.name} (${tenant.domain})`);
        return true;
      } else {
        console.log('❌ Default tenant not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verifying default tenant:', error.message);
      return false;
    }
  }

  async syncUsers() {
    console.log('\n👥 Syncing users...');

    try {
      const localUsers = await this.localClient.query(`
        SELECT id, email, name, password, department, status, "createdAt", "updatedAt", "lastLogin"
        FROM users
        ORDER BY "updatedAt" DESC
      `);

      console.log(`   📊 Found ${localUsers.rows.length} users in local database`);

      let newCount = 0;
      let updateCount = 0;

      for (const user of localUsers.rows) {
        try {
          const existingUser = await this.cloudClient.query(
            'SELECT id, "updatedAt" FROM users WHERE id = $1',
            [user.id]
          );

          if (existingUser.rows.length === 0) {
            // Insert new user with all required fields
            await this.cloudClient.query(`
              INSERT INTO users (id, "tenantId", email, name, password, department, status, "createdAt", "updatedAt", "lastLogin")
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
              user.id, this.defaultTenantId, user.email, user.name, user.password,
              user.department, user.status, user.createdAt, user.updatedAt, user.lastLogin
            ]);
            newCount++;
            console.log(`   ✅ Added user: ${user.email}`);
          } else {
            const cloudUpdatedAt = new Date(existingUser.rows[0].updatedAt);
            const localUpdatedAt = new Date(user.updatedAt);

            if (localUpdatedAt > cloudUpdatedAt) {
              await this.cloudClient.query(`
                UPDATE users
                SET email = $2, name = $3, password = $4, department = $5,
                    status = $6, "updatedAt" = $7, "lastLogin" = $8
                WHERE id = $1
              `, [
                user.id, user.email, user.name, user.password,
                user.department, user.status, user.updatedAt, user.lastLogin
              ]);
              updateCount++;
              console.log(`   🔄 Updated user: ${user.email}`);
            }
          }
        } catch (error) {
          console.error(`   ❌ Error syncing user ${user.email}:`, error.message);
          this.syncStats.errors++;
        }
      }

      console.log(`   ✅ Users sync complete: ${newCount} new, ${updateCount} updated`);
      this.syncStats.newRecords += newCount;
      this.syncStats.updatedRecords += updateCount;
      this.syncStats.records += newCount + updateCount;

    } catch (error) {
      console.error('❌ Error syncing users:', error.message);
      this.syncStats.errors++;
    }
  }

  async syncCustomers() {
    console.log('\n🏢 Syncing customers...');

    try {
      const localCustomers = await this.localClient.query(`
        SELECT id, name, email, industry, "createdAt", "updatedAt"
        FROM customers
        ORDER BY "updatedAt" DESC
      `);

      console.log(`   📊 Found ${localCustomers.rows.length} customers in local database`);

      let newCount = 0;
      let updateCount = 0;

      for (const customer of localCustomers.rows) {
        try {
          const existingCustomer = await this.cloudClient.query(
            'SELECT id, "updatedAt" FROM customers WHERE id = $1',
            [customer.id]
          );

          if (existingCustomer.rows.length === 0) {
            // Insert with all required fields and defaults
            await this.cloudClient.query(`
              INSERT INTO customers (
                id, "tenantId", name, email, industry, status, tier,
                "createdAt", "updatedAt", "syncStatus"
              )
              VALUES ($1, $2, $3, $4, $5, 'ACTIVE', 'STANDARD', $6, $7, 'SYNCED')
            `, [
              customer.id, this.defaultTenantId, customer.name, customer.email,
              customer.industry, customer.createdAt, customer.updatedAt
            ]);
            newCount++;
            console.log(`   ✅ Added customer: ${customer.name}`);
          } else {
            const cloudUpdatedAt = new Date(existingCustomer.rows[0].updatedAt);
            const localUpdatedAt = new Date(customer.updatedAt);

            if (localUpdatedAt > cloudUpdatedAt) {
              await this.cloudClient.query(`
                UPDATE customers
                SET name = $2, email = $3, industry = $4, "updatedAt" = $5, "syncStatus" = 'SYNCED'
                WHERE id = $1
              `, [customer.id, customer.name, customer.email, customer.industry, customer.updatedAt]);
              updateCount++;
              console.log(`   🔄 Updated customer: ${customer.name}`);
            }
          }
        } catch (error) {
          console.error(`   ❌ Error syncing customer ${customer.name}:`, error.message);
          this.syncStats.errors++;
        }
      }

      console.log(`   ✅ Customers sync complete: ${newCount} new, ${updateCount} updated`);
      this.syncStats.newRecords += newCount;
      this.syncStats.updatedRecords += updateCount;
      this.syncStats.records += newCount + updateCount;

    } catch (error) {
      console.error('❌ Error syncing customers:', error.message);
      this.syncStats.errors++;
    }
  }

  async syncProducts() {
    console.log('\n📦 Syncing products...');

    try {
      const localProducts = await this.localClient.query(`
        SELECT id, name, description, price, category, "createdAt", "updatedAt"
        FROM products
        ORDER BY "updatedAt" DESC
      `);

      console.log(`   📊 Found ${localProducts.rows.length} products in local database`);

      let newCount = 0;
      let updateCount = 0;

      for (const product of localProducts.rows) {
        try {
          const existingProduct = await this.cloudClient.query(
            'SELECT id, "updatedAt" FROM products WHERE id = $1',
            [product.id]
          );

          if (existingProduct.rows.length === 0) {
            // Insert with all required fields and defaults
            await this.cloudClient.query(`
              INSERT INTO products (
                id, "tenantId", name, description, sku, price, currency, category,
                "isActive", version, "createdAt", "updatedAt"
              )
              VALUES ($1, $2, $3, $4, $5, $6, 'USD', $7, true, 1, $8, $9)
            `, [
              product.id, this.defaultTenantId, product.name, product.description,
              product.id, // Use ID as SKU
              product.price, product.category, product.createdAt, product.updatedAt
            ]);
            newCount++;
            console.log(`   ✅ Added product: ${product.name}`);
          } else {
            const cloudUpdatedAt = new Date(existingProduct.rows[0].updatedAt);
            const localUpdatedAt = new Date(product.updatedAt);

            if (localUpdatedAt > cloudUpdatedAt) {
              await this.cloudClient.query(`
                UPDATE products
                SET name = $2, description = $3, price = $4, category = $5, "updatedAt" = $6
                WHERE id = $1
              `, [product.id, product.name, product.description, product.price, product.category, product.updatedAt]);
              updateCount++;
              console.log(`   🔄 Updated product: ${product.name}`);
            }
          }
        } catch (error) {
          console.error(`   ❌ Error syncing product ${product.name}:`, error.message);
          this.syncStats.errors++;
        }
      }

      console.log(`   ✅ Products sync complete: ${newCount} new, ${updateCount} updated`);
      this.syncStats.newRecords += newCount;
      this.syncStats.updatedRecords += updateCount;
      this.syncStats.records += newCount + updateCount;

    } catch (error) {
      console.error('❌ Error syncing products:', error.message);
      this.syncStats.errors++;
    }
  }

  async performFinalSync() {
    try {
      console.log('🚀 Starting final synchronization...');

      const tenantExists = await this.verifyDefaultTenant();
      if (!tenantExists) {
        throw new Error('Default tenant not found - cannot proceed with sync');
      }

      await this.syncUsers();
      await this.syncCustomers();
      await this.syncProducts();

      // Print summary
      console.log('\n📊 Final Sync Summary');
      console.log('=====================');
      console.log(`📝 Total records processed: ${this.syncStats.records}`);
      console.log(`✅ New records: ${this.syncStats.newRecords}`);
      console.log(`🔄 Updated records: ${this.syncStats.updatedRecords}`);
      console.log(`❌ Errors: ${this.syncStats.errors}`);

      if (this.syncStats.errors === 0) {
        console.log('\n🎉 Final sync completed successfully!');
        console.log(`🏢 All data synced to tenant: ${this.defaultTenantId}`);
        console.log('🌐 Your offline data is now available online!');
      } else {
        console.log('\n⚠️  Final sync completed with errors');
      }

    } catch (error) {
      console.error('❌ Final sync failed:', error.message);
      throw error;
    }
  }
}

async function main() {
  const sync = new FinalSync();

  try {
    await sync.connect();
    await sync.performFinalSync();
  } catch (error) {
    console.error('❌ Sync process failed:', error);
    process.exit(1);
  } finally {
    await sync.disconnect();
  }
}

// Run the final sync
main();
