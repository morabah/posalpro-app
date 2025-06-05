#!/usr/bin/env node
/**
 * PosalPro MVP2 - Environment Debug Script
 * Sets essential environment variables for development if missing
 */

// Set default environment variables for development
if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET =
    'posalpro-mvp2-development-secret-key-minimum-32-characters-required';
  console.log('✅ Set default NEXTAUTH_SECRET');
}

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
  console.log('✅ Set default NEXTAUTH_URL');
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('✅ Set default NODE_ENV');
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://username:password@localhost:5432/posalpro_mvp2';
  console.log('⚠️  Set default DATABASE_URL - update for your database');
}

console.log('\n🔧 Current Environment:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '[SET]' : '[MISSING]');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '[SET]' : '[MISSING]');

console.log('\n✅ Environment setup complete for development\n');
