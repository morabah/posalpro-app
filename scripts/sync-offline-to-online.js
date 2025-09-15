#!/usr/bin/env node

/**
 * Offline to Online Database Synchronization
 *
 * This script synchronizes data from the local offline database
 * to the Neon cloud database, handling conflicts and ensuring data integrity.
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

console.log('🔄 Offline to Online Database Synchronization');
console.log('==============================================\n');

class DatabaseSync {
  constructor() {
    this.localClient = null;
    this.cloudClient = null;
    this.syncStats = {
      tables: 0,
      records: 0,
      conflicts: 0,
      errors: 0,
      skipped: 0
    };
  }

  async connect() {
    try {
      console.log('📡 Connecting to databases...');

      // Connect to local database
      this.localClient = new Client({
        connectionString: process.env.DATABASE_URL
      });
      await this.localClient.connect();
      console.log('✅ Connected to local database');

      // Connect to cloud database
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
    if (this.localClient) {
      await this.localClient.end();
      console.log('🔌 Local database connection closed');
    }
    if (this.cloudClient) {
      await this.cloudClient.end();
      console.log('🔌 Cloud database connection closed');
    }
  }

  async getTableList() {
    const result = await this.localClient.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE '_prisma_%'
      ORDER BY table_name
    `);
    return result.rows.map(row => row.table_name);
  }

  async getTableData(tableName) {
    try {
      const result = await this.localClient.query(`SELECT * FROM "${tableName}"`);
      return result.rows;
    } catch (error) {
      console.warn(`⚠️  Could not read table ${tableName}:`, error.message);
      return [];
    }
  }

  async checkCloudTableExists(tableName) {
    const result = await this.cloudClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      )
    `, [tableName]);
    return result.rows[0].exists;
  }

  async getCloudTableColumns(tableName) {
    const result = await this.cloudClient.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
  }

  async syncTable(tableName) {
    console.log(`\n📋 Syncing table: ${tableName}`);

    try {
      // Check if table exists in cloud
      const cloudTableExists = await this.checkCloudTableExists(tableName);
      if (!cloudTableExists) {
        console.log(`⚠️  Table ${tableName} does not exist in cloud database - skipping`);
        this.syncStats.skipped++;
        return;
      }

      // Get local data
      const localData = await this.getTableData(tableName);
      if (localData.length === 0) {
        console.log(`ℹ️  No data in local table ${tableName} - skipping`);
        return;
      }

      // Get cloud table columns
      const cloudColumns = await this.getCloudTableColumns(tableName);
      const cloudColumnNames = cloudColumns.map(col => col.column_name);

      console.log(`   📊 Local records: ${localData.length}`);
      console.log(`   📋 Cloud columns: ${cloudColumnNames.join(', ')}`);

      // Filter local data to only include columns that exist in cloud
      const filteredData = localData.map(record => {
        const filtered = {};
        Object.keys(record).forEach(key => {
          if (cloudColumnNames.includes(key)) {
            filtered[key] = record[key];
          }
        });
        return filtered;
      });

      // Sync data
      let syncedCount = 0;
      let conflictCount = 0;

      for (const record of filteredData) {
        try {
          // Check if record exists in cloud (by ID)
          const idValue = record.id;
          if (!idValue) {
            console.warn(`⚠️  Record without ID in ${tableName} - skipping`);
            continue;
          }

          const existingResult = await this.cloudClient.query(
            `SELECT id FROM "${tableName}" WHERE id = $1`,
            [idValue]
          );

          if (existingResult.rows.length > 0) {
            // Record exists - update it
            const updateColumns = Object.keys(record).filter(key => key !== 'id');
            const updateValues = updateColumns.map((col, index) => `"${col}" = $${index + 2}`);
            const values = [idValue, ...updateColumns.map(col => record[col])];

            await this.cloudClient.query(
              `UPDATE "${tableName}" SET ${updateValues.join(', ')}, "updatedAt" = NOW() WHERE id = $1`,
              values
            );
            conflictCount++;
          } else {
            // Record doesn't exist - insert it
            const insertColumns = Object.keys(record);
            const insertValues = insertColumns.map((_, index) => `$${index + 1}`);
            const values = insertColumns.map(col => record[col]);

            await this.cloudClient.query(
              `INSERT INTO "${tableName}" (${insertColumns.map(col => `"${col}"`).join(', ')}) VALUES (${insertValues.join(', ')})`,
              values
            );
            syncedCount++;
          }
        } catch (error) {
          console.error(`❌ Error syncing record in ${tableName}:`, error.message);
          this.syncStats.errors++;
        }
      }

      console.log(`   ✅ Synced: ${syncedCount} new records`);
      console.log(`   🔄 Updated: ${conflictCount} existing records`);

      this.syncStats.tables++;
      this.syncStats.records += syncedCount + conflictCount;
      this.syncStats.conflicts += conflictCount;

    } catch (error) {
      console.error(`❌ Error syncing table ${tableName}:`, error.message);
      this.syncStats.errors++;
    }
  }

  async performSync() {
    try {
      console.log('🔍 Getting table list...');
      const tables = await this.getTableList();
      console.log(`📋 Found ${tables.length} tables to sync`);

      // Define sync order (tables with dependencies first)
      const syncOrder = [
        'users',
        'roles',
        'customers',
        'products',
        'proposals',
        'proposal_sections',
        'proposal_products',
        'user_roles',
        'role_permissions',
        'permissions'
      ];

      // Sync tables in order
      for (const tableName of syncOrder) {
        if (tables.includes(tableName)) {
          await this.syncTable(tableName);
        }
      }

      // Sync remaining tables
      const remainingTables = tables.filter(table => !syncOrder.includes(table));
      for (const tableName of remainingTables) {
        await this.syncTable(tableName);
      }

      // Print sync summary
      console.log('\n📊 Synchronization Summary');
      console.log('==========================');
      console.log(`✅ Tables processed: ${this.syncStats.tables}`);
      console.log(`📝 Records synced: ${this.syncStats.records}`);
      console.log(`🔄 Conflicts resolved: ${this.syncStats.conflicts}`);
      console.log(`⚠️  Errors: ${this.syncStats.errors}`);
      console.log(`⏭️  Skipped: ${this.syncStats.skipped}`);

      if (this.syncStats.errors === 0) {
        console.log('\n🎉 Synchronization completed successfully!');
      } else {
        console.log('\n⚠️  Synchronization completed with errors');
      }

    } catch (error) {
      console.error('❌ Synchronization failed:', error.message);
      throw error;
    }
  }

  async verifySync() {
    console.log('\n🔍 Verifying synchronization...');

    try {
      // Compare user counts
      const localUsers = await this.localClient.query('SELECT COUNT(*) as count FROM users');
      const cloudUsers = await this.cloudClient.query('SELECT COUNT(*) as count FROM users');

      console.log(`👥 Users - Local: ${localUsers.rows[0].count}, Cloud: ${cloudUsers.rows[0].count}`);

      // Compare customer counts
      const localCustomers = await this.localClient.query('SELECT COUNT(*) as count FROM customers');
      const cloudCustomers = await this.cloudClient.query('SELECT COUNT(*) as count FROM customers');

      console.log(`🏢 Customers - Local: ${localCustomers.rows[0].count}, Cloud: ${cloudCustomers.rows[0].count}`);

      // Compare product counts
      const localProducts = await this.localClient.query('SELECT COUNT(*) as count FROM products');
      const cloudProducts = await this.cloudClient.query('SELECT COUNT(*) as count FROM products');

      console.log(`📦 Products - Local: ${localProducts.rows[0].count}, Cloud: ${cloudProducts.rows[0].count}`);

      // Compare proposal counts
      const localProposals = await this.localClient.query('SELECT COUNT(*) as count FROM proposals');
      const cloudProposals = await this.cloudClient.query('SELECT COUNT(*) as count FROM proposals');

      console.log(`📄 Proposals - Local: ${localProposals.rows[0].count}, Cloud: ${cloudProposals.rows[0].count}`);

      console.log('✅ Verification completed');

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
    }
  }
}

async function main() {
  const sync = new DatabaseSync();

  try {
    await sync.connect();
    await sync.performSync();
    await sync.verifySync();
  } catch (error) {
    console.error('❌ Sync process failed:', error);
    process.exit(1);
  } finally {
    await sync.disconnect();
  }
}

// Run the sync
main();
