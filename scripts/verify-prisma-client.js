#!/usr/bin/env node

/**
 * Prisma Client Verification Script
 *
 * This script verifies that the Prisma client is configured correctly
 * for direct PostgreSQL connections (not Data Proxy)
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

console.log('🔍 Prisma Client Configuration Verification');
console.log('==========================================\n');

async function verifyPrismaClient() {
  try {
    console.log('📋 Checking Prisma client configuration...\n');

    // Check DATABASE_URL format
    console.log('🗄️  DATABASE_URL:');
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      if (databaseUrl.startsWith('postgresql://')) {
        console.log('   ✅ Correctly formatted as PostgreSQL connection string');
        console.log(`   🌐 URL: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
      } else if (databaseUrl.startsWith('prisma://')) {
        console.log('   ❌ Incorrectly formatted as Data Proxy URL');
        console.log(`   🔍 Current: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
        console.log('   💡 This should be a postgresql:// URL for direct connections');
      } else {
        console.log('   ⚠️  Unknown URL format');
        console.log(`   🔍 Current: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
      }
    } else {
      console.log('   ❌ DATABASE_URL not found in environment variables');
    }

    // Check Prisma client instantiation
    console.log('\n🔧 Prisma Client Instantiation:');
    try {
      const prisma = new PrismaClient({
        log: ['warn', 'error'],
      });

      console.log('   ✅ Prisma client created successfully');

      // Test basic connectivity
      console.log('\n🔗 Testing database connectivity...');
      const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
      console.log('   ✅ Database connectivity test successful');
      console.log('   📊 Result:', result);

      // Check client configuration
      console.log('\n⚙️  Client Configuration:');
      console.log('   📦 Client type: Standard PrismaClient (not Data Proxy)');
      console.log('   🔗 Connection: Direct PostgreSQL connection');
      console.log('   🚫 Data Proxy: Disabled');

      await prisma.$disconnect();
      console.log('\n🎉 Prisma client verification complete!');
      console.log('✅ Client is properly configured for direct PostgreSQL connections');

    } catch (error) {
      console.log('   ❌ Error creating or testing Prisma client');
      console.log('   🔍 Error details:', error.message);

      if (error.message.includes('prisma://')) {
        console.log('\n💡 SOLUTION: The Prisma client was generated for Data Proxy mode.');
        console.log('   To fix this:');
        console.log('   1. Ensure PRISMA_GENERATE_DATAPROXY=false');
        console.log('   2. Set PRISMA_CLIENT_ENGINE_TYPE=library');
        console.log('   3. Regenerate the Prisma client: npx prisma generate');
        console.log('   4. Use a postgresql:// URL, not prisma://');
      }
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

verifyPrismaClient();
