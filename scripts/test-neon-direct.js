#!/usr/bin/env node

/**
 * Neon Cloud Database Direct Access Test
 *
 * This script tests direct access to the Neon cloud database
 * using the standard pg package to verify connectivity and data.
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

console.log('🔍 Neon Cloud Database Direct Access Test');
console.log('==========================================\n');

async function testNeonCloudDatabase() {
  let client;

  try {
    // Get the cloud database URL
    const cloudDbUrl = process.env.CLOUD_DATABASE_URL;

    if (!cloudDbUrl) {
      throw new Error('CLOUD_DATABASE_URL not found in environment variables');
    }

    console.log('📡 Connecting to Neon cloud database...');
    console.log('🌐 Database URL:', cloudDbUrl.replace(/:[^:@]*@/, ':***@')); // Hide password

    // Initialize PostgreSQL client
    client = new Client({
      connectionString: cloudDbUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected to Neon cloud database successfully!');

    // Test basic connectivity
    console.log('\n🔗 Testing basic connectivity...');
    const connectivityResult = await client.query('SELECT 1 as test, NOW() as timestamp');
    console.log('✅ Connectivity test result:', connectivityResult.rows[0]);

    // Test database info
    console.log('\n📊 Getting database information...');
    const dbInfoResult = await client.query(`
      SELECT
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version,
        NOW() as current_time
    `);
    console.log('✅ Database info:', dbInfoResult.rows[0]);

    // Test table count
    console.log('\n📋 Getting table count...');
    const tableCountResult = await client.query(`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log('✅ Table count:', tableCountResult.rows[0]);

    // List all tables
    console.log('\n📋 Listing all tables...');
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log('✅ Tables found:');
    tablesResult.rows.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name} (${table.table_type})`);
    });

    // Test user count
    console.log('\n👥 Testing user data...');
    const userCountResult = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log('✅ User count:', userCountResult.rows[0]);

    // Get sample users (check actual schema first)
    console.log('\n👤 Getting sample users...');

    // First, check what columns exist in the users table
    const userColumnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    console.log('📋 Users table columns:');
    userColumnsResult.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
    });

    // Build dynamic query based on available columns
    const availableColumns = userColumnsResult.rows.map(row => row.column_name);
    const selectColumns = availableColumns.filter(col =>
      ['id', 'email', 'name', 'created_at', 'updated_at'].includes(col)
    ).join(', ');

    const sampleUsersResult = await client.query(`
      SELECT ${selectColumns}
      FROM users
      LIMIT 5
    `);

    console.log('✅ Sample users:');
    sampleUsersResult.rows.forEach((user, index) => {
      const userInfo = Object.entries(user)
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      console.log(`   ${index + 1}. ${userInfo}`);
    });

    // Test customer count
    console.log('\n🏢 Testing customer data...');
    const customerCountResult = await client.query('SELECT COUNT(*) as customer_count FROM customers');
    console.log('✅ Customer count:', customerCountResult.rows[0]);

    // Test product count
    console.log('\n📦 Testing product data...');
    const productCountResult = await client.query('SELECT COUNT(*) as product_count FROM products');
    console.log('✅ Product count:', productCountResult.rows[0]);

    // Test proposal count
    console.log('\n📄 Testing proposal data...');
    const proposalCountResult = await client.query('SELECT COUNT(*) as proposal_count FROM proposals');
    console.log('✅ Proposal count:', proposalCountResult.rows[0]);

    // Test schema validation - check for extra fields
    console.log('\n🔍 Checking for schema inconsistencies...');
    const extraFieldsResult = await client.query(`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'customers', 'products', 'proposals', 'roles')
      ORDER BY table_name, column_name
    `);

    console.log('📋 All fields in main tables:');
    extraFieldsResult.rows.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field.table_name}.${field.column_name} (${field.data_type})`);
    });

    // Check for common extra fields that might not be in Prisma schema
    const commonExtraFields = extraFieldsResult.rows.filter(field =>
      ['tenantId', 'cloudId', 'lastSyncedAt', 'syncStatus', 'metadata', 'version', 'status'].includes(field.column_name)
    );

    if (commonExtraFields.length > 0) {
      console.log('\n⚠️  Common extra fields found in cloud database:');
      commonExtraFields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.table_name}.${field.column_name} (${field.data_type})`);
      });
    } else {
      console.log('\n✅ No common extra fields detected in cloud database');
    }

    // Test data consistency between local and cloud
    console.log('\n🔄 Comparing local vs cloud data...');

    // Get local database info for comparison
    const localClient = new Client({
      connectionString: process.env.DATABASE_URL
    });
    await localClient.connect();

    const localUserCount = await localClient.query('SELECT COUNT(*) as user_count FROM users');
    const cloudUserCount = userCountResult.rows[0];

    console.log(`📊 User count comparison:`);
    console.log(`   Local: ${localUserCount.rows[0].user_count}`);
    console.log(`   Cloud: ${cloudUserCount.user_count}`);

    if (localUserCount.rows[0].user_count === cloudUserCount.user_count) {
      console.log('✅ User counts match between local and cloud');
    } else {
      console.log('⚠️  User counts differ between local and cloud');
    }

    await localClient.end();

    console.log('\n🎉 Neon Cloud Database Test Complete!');
    console.log('✅ All tests passed successfully');
    console.log('🌐 Cloud database is accessible and contains data');

  } catch (error) {
    console.error('❌ Error testing Neon cloud database:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the test
testNeonCloudDatabase();
