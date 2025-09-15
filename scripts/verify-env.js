#!/usr/bin/env node
/*
 * Env Verification Script
 * Validates presence and basic shape of critical environment variables
 *
 * NEW: Issue 2 Resolution - DATABASE_URL Protocol Validation
 * - Detects Data Proxy URLs (prisma://) when direct connections are expected
 * - Validates protocol consistency with Prisma configuration
 * - Exits with error code 1 for critical configuration mismatches
 *
 * Usage: node scripts/verify-env.js
 */

const REQUIRED = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'JWT_SECRET',
  'CORS_ORIGINS',
  'NEXT_PUBLIC_APP_URL',
  'API_BASE_URL',
  'RATE_LIMIT',
  'SESSION_ENCRYPTION_KEY',
];

const OPTIONAL = [
  'DIRECT_URL',
  'USE_REDIS',
  'REDIS_URL',
  'NODE_ENV',
  'DATABASE_CONNECTION_LIMIT',
  'DATABASE_POOL_TIMEOUT',
  'PRISMA_CLIENT_ENGINE_TYPE',
  'PRISMA_GENERATE_DATAPROXY',
  'PRISMA_CLI_QUERY_ENGINE_TYPE',
  'PRISMA_ENGINE_TYPE',
];

function isHex64(str) {
  return typeof str === 'string' && /^[0-9a-fA-F]{64}$/.test(str);
}

function isLikelyBase64(str) {
  return typeof str === 'string' && /^[A-Za-z0-9+/=]+$/.test(str) && str.length >= 44;
}

function checkSessionKey(key) {
  if (!key) return 'missing';
  if (isHex64(key) || isLikelyBase64(key)) return 'ok';
  return 'weak-format';
}

/**
 * Validates DATABASE_URL protocol consistency with Prisma configuration
 * Detects Data Proxy URLs (prisma://) when direct connections are expected
 */
function validateDatabaseUrlProtocol() {
  const databaseUrl = process.env.DATABASE_URL;
  const generateDataProxy = process.env.PRISMA_GENERATE_DATAPROXY;
  const clientEngineType = process.env.PRISMA_CLIENT_ENGINE_TYPE;
  const cliQueryEngineType = process.env.PRISMA_CLI_QUERY_ENGINE_TYPE;
  const engineType = process.env.PRISMA_ENGINE_TYPE;

  if (!databaseUrl) {
    return { status: 'missing', message: 'DATABASE_URL is not set' };
  }

  // Check for Data Proxy URL (prisma://) with direct connection settings
  if (databaseUrl.startsWith('prisma://')) {
    const issues = [];

    if (generateDataProxy === 'false') {
      issues.push('PRISMA_GENERATE_DATAPROXY=false');
    }

    if (clientEngineType && clientEngineType !== 'dataproxy') {
      issues.push(`PRISMA_CLIENT_ENGINE_TYPE=${clientEngineType} (expected 'dataproxy')`);
    }

    if (cliQueryEngineType && cliQueryEngineType !== 'dataproxy') {
      issues.push(`PRISMA_CLI_QUERY_ENGINE_TYPE=${cliQueryEngineType} (expected 'dataproxy')`);
    }

    if (engineType && engineType !== 'dataproxy') {
      issues.push(`PRISMA_ENGINE_TYPE=${engineType} (expected 'dataproxy')`);
    }

    if (issues.length > 0) {
      return {
        status: 'mismatch',
        message: `Data Proxy URL (prisma://) detected but direct connection settings found: ${issues.join(', ')}. ` +
                'Either set PRISMA_GENERATE_DATAPROXY=true and PRISMA_CLIENT_ENGINE_TYPE=dataproxy, or use postgresql:// for direct connections.'
      };
    }

    return { status: 'ok', message: 'Data Proxy URL (prisma://) with correct configuration' };
  }

  // Check for direct connection URL (postgresql:// or postgres://) with Data Proxy settings
  if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
    const warnings = [];

    if (generateDataProxy === 'true') {
      warnings.push('PRISMA_GENERATE_DATAPROXY=true (expected false for direct connections)');
    }

    if (clientEngineType === 'dataproxy') {
      warnings.push('PRISMA_CLIENT_ENGINE_TYPE=dataproxy (expected binary or library for direct connections)');
    }

    if (cliQueryEngineType === 'dataproxy') {
      warnings.push('PRISMA_CLI_QUERY_ENGINE_TYPE=dataproxy (expected binary or library for direct connections)');
    }

    if (engineType === 'dataproxy') {
      warnings.push('PRISMA_ENGINE_TYPE=dataproxy (expected binary or library for direct connections)');
    }

    if (warnings.length > 0) {
      return {
        status: 'warning',
        message: `Direct connection URL (postgresql://) with Data Proxy settings: ${warnings.join(', ')}. ` +
                'Consider using prisma:// for Data Proxy connections or set direct connection settings.'
      };
    }

    return { status: 'ok', message: 'Direct connection URL (postgresql://) with correct configuration' };
  }

  // Invalid protocol
  return {
    status: 'invalid',
    message: `Invalid DATABASE_URL protocol: '${databaseUrl.split('://')[0]}://'. ` +
            'Expected postgresql:// for direct connections or prisma:// for Data Proxy connections.'
  };
}

function parseOrigins(val) {
  if (!val) return [];
  return String(val)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function print(line) {
  // eslint-disable-next-line no-console
  console.log(line);
}

function main() {
  print('\nEnv Verification');
  print('=================');

  const missing = [];
  const warnings = [];

  for (const k of REQUIRED) {
    if (!process.env[k] || String(process.env[k]).length === 0) {
      missing.push(k);
    }
  }

  if (missing.length) {
    print(`\n❌ Missing required keys: ${missing.join(', ')}`);
  } else {
    print('\n✅ All required keys present');
  }

  // SESSION_ENCRYPTION_KEY shape
  const sek = process.env.SESSION_ENCRYPTION_KEY;
  const sekStatus = checkSessionKey(sek);
  if (sekStatus === 'weak-format') {
    warnings.push('SESSION_ENCRYPTION_KEY should be 32 bytes hex (64 chars) or strong base64');
  }

  // CORS origins relation to NEXT_PUBLIC_APP_URL
  const origins = parseOrigins(process.env.CORS_ORIGINS);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (origins.length === 0) {
    warnings.push('CORS_ORIGINS is empty; API will reject cross-origin callers');
  }
  if (appUrl && !origins.includes(appUrl)) {
    warnings.push(`CORS_ORIGINS does not include NEXT_PUBLIC_APP_URL (${appUrl})`);
  }

  // API_BASE_URL vs NEXTAUTH_URL host (simple heuristic)
  try {
    const api = new URL(process.env.API_BASE_URL || '');
    const nextauth = new URL(process.env.NEXTAUTH_URL || '');
    if (api.origin !== nextauth.origin && process.env.NODE_ENV !== 'development') {
      warnings.push(`API_BASE_URL origin (${api.origin}) differs from NEXTAUTH_URL (${nextauth.origin})`);
    }
  } catch {
    warnings.push('API_BASE_URL or NEXTAUTH_URL is not a valid URL');
  }

  // DATABASE_URL protocol validation (NEW: Issue 2 Resolution)
  const dbUrlValidation = validateDatabaseUrlProtocol();
  if (dbUrlValidation.status === 'mismatch') {
    // This is a critical error that should cause the script to exit
    print('\n❌ DATABASE_URL Protocol Mismatch:');
    print(`   ${dbUrlValidation.message}`);
    print('\n💡 This configuration will cause Prisma Data Proxy connection errors.');
    print('   Fix the configuration before proceeding with deployment.');
    process.exit(1);
  } else if (dbUrlValidation.status === 'invalid') {
    // Invalid protocol is also a critical error
    print('\n❌ Invalid DATABASE_URL Protocol:');
    print(`   ${dbUrlValidation.message}`);
    process.exit(1);
  } else if (dbUrlValidation.status === 'warning') {
    warnings.push(`DATABASE_URL: ${dbUrlValidation.message}`);
  } else if (dbUrlValidation.status === 'ok') {
    print(`\n✅ DATABASE_URL: ${dbUrlValidation.message}`);
  }

  // Print optional keys
  const optSet = OPTIONAL.filter(k => process.env[k] !== undefined);
  if (optSet.length) {
    print(`\nℹ️ Optional keys set: ${optSet.join(', ')}`);
  }

  if (warnings.length) {
    print('\n⚠️  Warnings:');
    for (const w of warnings) print(` - ${w}`);
  } else {
    print('\n✅ No warnings detected');
  }

  // Summaries
  print('\nSummary');
  print('-------');
  print(`Required: ${REQUIRED.length}, Missing: ${missing.length}, Optional set: ${optSet.length}`);

  // Exit code based on missing
  process.exit(missing.length ? 1 : 0);
}

// Export the validation function for testing
if (require.main === module) {
  main();
} else {
  module.exports = { validateDatabaseUrlProtocol };
}
