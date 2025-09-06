#!/usr/bin/env node
/*
 * Env Verification Script
 * Validates presence and basic shape of critical environment variables
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

main();

