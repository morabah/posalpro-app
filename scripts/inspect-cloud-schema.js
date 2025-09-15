#!/usr/bin/env node

/**
 * Cloud Database Schema Inspector
 *
 * This script inspects the cloud database schema to understand
 * the required fields for synchronization.
 */

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

console.log('🔍 Cloud Database Schema Inspector');
console.log('==================================\n');

async function inspectSchema() {
  let client;

  try {
    // Connect to cloud database
    client = new Client({
      connectionString: process.env.CLOUD_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    console.log('✅ Connected to cloud database');

    // Inspect tenants table
    console.log('\n🏢 Tenants Table Schema:');
    const tenantsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tenants' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    tenantsSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'none'}`);
    });

    // Inspect users table
    console.log('\n👥 Users Table Schema:');
    const usersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    usersSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'none'}`);
    });

    // Inspect customers table
    console.log('\n🏢 Customers Table Schema:');
    const customersSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'customers' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    customersSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'none'}`);
    });

    // Inspect products table
    console.log('\n📦 Products Table Schema:');
    const productsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);

    productsSchema.rows.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable} - Default: ${col.column_default || 'none'}`);
    });

    // Check if there are existing tenants
    console.log('\n🏢 Existing Tenants:');
    const existingTenants = await client.query('SELECT * FROM tenants LIMIT 5');
    if (existingTenants.rows.length > 0) {
      existingTenants.rows.forEach((tenant, index) => {
        console.log(`   ${index + 1}. ID: ${tenant.id}, Name: ${tenant.name}, Domain: ${tenant.domain || 'null'}`);
      });
    } else {
      console.log('   No tenants found');
    }

  } catch (error) {
    console.error('❌ Error inspecting schema:', error.message);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

inspectSchema();
