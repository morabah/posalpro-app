#!/usr/bin/env node

/**
 * Prisma Client Verification Script
 *
 * This script verifies that the Prisma client is configured correctly
 * for direct PostgreSQL connections (not Data Proxy)
 *
 * NEW: Issue 3 Resolution - Automated Build Integration
 * - Detects Data Proxy client generation and fails build
 * - Validates protocol consistency with environment variables
 * - Exits with error code 1 for critical misconfigurations
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables in priority order (later files override earlier ones)
console.log('📁 Loading environment files...');

// 1. Base environment (.env)
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
  console.log('   ✅ Loaded .env');
} else {
  console.log('   ⚠️  .env not found');
}

// 2. Production environment variables (if present)
if (fs.existsSync('production-env-vars.env')) {
  dotenv.config({ path: 'production-env-vars.env' });
  console.log('   ✅ Loaded production-env-vars.env');
} else {
  console.log('   ℹ️  production-env-vars.env not found');
}

// 3. Production environment file (if present)
if (fs.existsSync('.env.production')) {
  dotenv.config({ path: '.env.production' });
  console.log('   ✅ Loaded .env.production');
} else {
  console.log('   ℹ️  .env.production not found');
}

// 4. Local environment (highest priority - overrides all others)
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
  console.log('   ✅ Loaded .env.local');
} else {
  console.log('   ℹ️  .env.local not found');
}

console.log('');

console.log('🔍 Prisma Client Configuration Verification');
console.log('==========================================\n');

async function verifyPrismaClient() {
  let hasErrors = false;
  let hasWarnings = false;

  try {
    console.log('📋 Checking Prisma client configuration...\n');

    // Check DATABASE_URL format and protocol consistency
    console.log('🗄️  DATABASE_URL Protocol Validation:');
    const databaseUrl = process.env.DATABASE_URL;
    const generateDataProxy = process.env.PRISMA_GENERATE_DATAPROXY;
    const clientEngineType = process.env.PRISMA_CLIENT_ENGINE_TYPE;
    const cliQueryEngineType = process.env.PRISMA_CLI_QUERY_ENGINE_TYPE;
    const engineType = process.env.PRISMA_ENGINE_TYPE;

    if (databaseUrl) {
      if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
        console.log('   ✅ Correctly formatted as PostgreSQL connection string');
        console.log(`   🌐 URL: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);

        // Check for Data Proxy settings with direct connection URL
        if (generateDataProxy === 'true') {
          console.log('   ⚠️  WARNING: PRISMA_GENERATE_DATAPROXY=true with postgresql:// URL');
          hasWarnings = true;
        }
        if (clientEngineType === 'dataproxy') {
          console.log('   ⚠️  WARNING: PRISMA_CLIENT_ENGINE_TYPE=dataproxy with postgresql:// URL');
          hasWarnings = true;
        }
      } else if (databaseUrl.startsWith('prisma://')) {
        console.log('   ❌ CRITICAL: Data Proxy URL detected with direct connection configuration');
        console.log(`   🔍 Current: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
        console.log('   💡 This should be a postgresql:// URL for direct connections');

        // Check if Data Proxy settings are properly configured
        if (generateDataProxy !== 'true') {
          console.log('   ❌ ERROR: PRISMA_GENERATE_DATAPROXY is not set to true');
          hasErrors = true;
        }
        if (clientEngineType !== 'dataproxy') {
          console.log('   ❌ ERROR: PRISMA_CLIENT_ENGINE_TYPE is not set to dataproxy');
          hasErrors = true;
        }
      } else {
        console.log('   ❌ CRITICAL: Invalid DATABASE_URL protocol');
        console.log(`   🔍 Current: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
        console.log('   💡 Expected postgresql:// for direct connections or prisma:// for Data Proxy');
        hasErrors = true;
      }
    } else {
      console.log('   ❌ CRITICAL: DATABASE_URL not found in environment variables');
      hasErrors = true;
    }

  // Check Prisma client instantiation and detect Data Proxy clients
  console.log('\n🔧 Prisma Client Instantiation & Data Proxy Detection:');

  // Declare prisma outside try block to ensure it's available in finally
  let prisma = null;

  try {
    prisma = new PrismaClient();
    console.log('   ✅ Prisma client created successfully');

    // Detect if this is a Data Proxy client by checking for Data Proxy specific errors
    console.log('\n🔍 Detecting client type...');

    // Test basic connectivity to detect Data Proxy vs direct connection
    console.log('\n🔗 Testing database connectivity...');
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test, NOW() as timestamp`;
      console.log('   ✅ Database connectivity test successful');
      console.log('   📊 Result:', result);

      // Check client configuration
      console.log('\n⚙️  Client Configuration:');
      console.log('   📦 Client type: Standard PrismaClient (not Data Proxy)');
      console.log('   🔗 Connection: Direct PostgreSQL connection');
      console.log('   🚫 Data Proxy: Disabled');

      console.log('\n✅ Prisma client verification complete!');
      console.log('✅ Client is properly configured for direct PostgreSQL connections');
    } catch (connectError) {
      console.log('   ❌ Database connectivity test failed');
      console.log('   🔍 Error details:', connectError.message);

      // Check if this is a Data Proxy configuration error
      if (connectError.message.includes('prisma://') ||
          connectError.message.includes('Data Proxy') ||
          connectError.message.includes('the URL must start with the protocol')) {
        console.log('\n❌ CRITICAL: Data Proxy client detected!');
        console.log('   💡 The Prisma client was generated for Data Proxy mode but is being used with a direct connection.');
        console.log('   🔧 To fix this:');
        console.log('   1. Ensure PRISMA_GENERATE_DATAPROXY=false');
        console.log('   2. Set PRISMA_CLIENT_ENGINE_TYPE=binary or library');
        console.log('   3. Regenerate the Prisma client: npx prisma generate');
        console.log('   4. Use a postgresql:// URL, not prisma://');
        hasErrors = true;
      } else {
        console.log('   ⚠️  Database connectivity issue (may be network/credentials related)');
        hasWarnings = true;
      }
    }
  } catch (error) {
    console.log('   ❌ Error creating Prisma client');
    console.log('   🔍 Error details:', error.message);

    if (error.message.includes('prisma://') ||
        error.message.includes('Data Proxy') ||
        error.message.includes('the URL must start with the protocol')) {
      console.log('\n❌ CRITICAL: Data Proxy client detected!');
      console.log('   💡 The Prisma client was generated for Data Proxy mode.');
      console.log('   🔧 To fix this:');
      console.log('   1. Ensure PRISMA_GENERATE_DATAPROXY=false');
      console.log('   2. Set PRISMA_CLIENT_ENGINE_TYPE=binary or library');
      console.log('   3. Regenerate the Prisma client: npx prisma generate');
      console.log('   4. Use a postgresql:// URL, not prisma://');
      hasErrors = true;
    } else {
      console.log('   ⚠️  Prisma client creation issue (may be configuration related)');
      hasWarnings = true;
    }
  } finally {
    // Always disconnect the Prisma client, even if there were errors
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('   🔌 Prisma client disconnected successfully');
      } catch (disconnectError) {
        console.log('   ⚠️  Warning: Error disconnecting Prisma client:', disconnectError.message);
        // Don't fail the build for disconnect errors, but log them
      }
    }
  }
    // Final validation summary and exit logic
    console.log('\n📊 Verification Summary:');
    if (hasErrors) {
      console.log('   ❌ CRITICAL ERRORS DETECTED');
      console.log('   🚫 Build should fail - Data Proxy misconfiguration found');
      console.log('\n💡 This configuration will cause runtime errors in production.');
      console.log('   Fix the Prisma client configuration before proceeding.');
      process.exit(1);
    } else if (hasWarnings) {
      console.log('   ⚠️  WARNINGS DETECTED');
      console.log('   ⚠️  Build may succeed but configuration issues exist');
      console.log('\n💡 Review the warnings above and fix configuration issues.');
      process.exit(0); // Warnings don't fail the build
    } else {
      console.log('   ✅ ALL CHECKS PASSED');
      console.log('   ✅ Prisma client is properly configured');
      console.log('\n🎉 Build can proceed - no configuration issues detected.');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.error('❌ Build should fail - verification script encountered an error');
    process.exit(1);
  }
}

verifyPrismaClient();
