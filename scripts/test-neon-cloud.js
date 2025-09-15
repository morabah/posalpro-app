#!/usr/bin/env node

/**
 * Neon Cloud Database Direct Access Test
 *
 * This script tests direct access to the Neon cloud database
 * using the @netlify/neon package to verify connectivity and data.
 */

import { neon } from '@netlify/neon';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

console.log('🔍 Neon Cloud Database Direct Access Test');
console.log('==========================================\n');

async function testNeonCloudDatabase() {
  try {
    // Initialize Neon client (automatically uses NETLIFY_DATABASE_URL)
    console.log('📡 Initializing Neon client...');
    const sql = neon();

    // Test basic connectivity
    console.log('🔗 Testing basic connectivity...');
    const connectivityTest = await sql`SELECT 1 as test, NOW() as timestamp`;
    console.log('✅ Connectivity test result:', connectivityTest[0]);

    // Test database info
    console.log('\n📊 Getting database information...');
    const dbInfo = await sql`
      SELECT
        current_database() as database_name,
        current_user as current_user,
        version() as postgres_version,
        NOW() as current_time
    `;
    console.log('✅ Database info:', dbInfo[0]);

    // Test table count
    console.log('\n📋 Getting table count...');
    const tableCount = await sql`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('✅ Table count:', tableCount[0]);

    // List all tables
    console.log('\n📋 Listing all tables...');
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('✅ Tables found:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.table_name} (${table.table_type})`);
    });

    // Test user count
    console.log('\n👥 Testing user data...');
    const userCount = await sql`SELECT COUNT(*) as user_count FROM users`;
    console.log('✅ User count:', userCount[0]);

    // Get sample users
    console.log('\n👤 Getting sample users...');
    const sampleUsers = await sql`
      SELECT id, email, name, role, created_at
      FROM users
      LIMIT 5
    `;
    console.log('✅ Sample users:');
    sampleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.name}`);
    });

    // Test customer count
    console.log('\n🏢 Testing customer data...');
    const customerCount = await sql`SELECT COUNT(*) as customer_count FROM customers`;
    console.log('✅ Customer count:', customerCount[0]);

    // Test product count
    console.log('\n📦 Testing product data...');
    const productCount = await sql`SELECT COUNT(*) as product_count FROM products`;
    console.log('✅ Product count:', productCount[0]);

    // Test proposal count
    console.log('\n📄 Testing proposal data...');
    const proposalCount = await sql`SELECT COUNT(*) as proposal_count FROM proposals`;
    console.log('✅ Proposal count:', proposalCount[0]);

    // Test schema validation - check for extra fields
    console.log('\n🔍 Checking for schema inconsistencies...');
    const extraFields = await sql`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'customers', 'products', 'proposals', 'roles')
        AND column_name NOT IN (
          'id', 'created_at', 'updated_at', 'email', 'name', 'role',
          'company_name', 'contact_email', 'contact_phone',
          'title', 'description', 'price', 'category',
          'title', 'description', 'status', 'customer_id',
          'name', 'description', 'permissions'
        )
      ORDER BY table_name, column_name
    `;

    if (extraFields.length > 0) {
      console.log('⚠️  Extra fields found in database:');
      extraFields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.table_name}.${field.column_name} (${field.data_type})`);
      });
    } else {
      console.log('✅ No extra fields detected');
    }

    console.log('\n🎉 Neon Cloud Database Test Complete!');
    console.log('✅ All tests passed successfully');

  } catch (error) {
    console.error('❌ Error testing Neon cloud database:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Run the test
testNeonCloudDatabase();
