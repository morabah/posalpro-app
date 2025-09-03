#!/usr/bin/env node

/**
 * PosalPro MVP2 - API Key Management Script
 * Create, list, revoke API keys for testing and administration
 */

const { PrismaClient } = require('@prisma/client');
const { createApiKeyHash } = require('../src/server/api/apiKeyGuard');
const crypto = require('crypto');

const prisma = new PrismaClient();

const USAGE = `
API Key Management Tool

Usage: node scripts/manage-api-keys.js <command> [options]

Commands:
  create <label> <scopes>     Create a new API key
  list                        List all API keys
  revoke <id>                 Revoke an API key
  test <key> <scope>          Test an API key against a scope

Examples:
  node scripts/manage-api-keys.js create "Test Key" "read:protected,write:protected"
  node scripts/manage-api-keys.js list
  node scripts/manage-api-keys.js revoke abc123
  node scripts/manage-api-keys.js test "sk-abcd..." "read:protected"

Scopes format: comma-separated list (e.g., "read:users,write:products")
`;

async function createApiKey(label, scopesString) {
  try {
    console.log(`🔑 Creating API key: "${label}"`);

    // Parse scopes
    const scopes = scopesString.split(',').map(s => s.trim());

    // Generate a secure random API key
    const rawKey = crypto.randomBytes(32).toString('hex');

    // Hash the key for storage
    const keyHash = createApiKeyHash(rawKey);

    // Store in database
    const apiKey = await prisma.apiKey.create({
      data: {
        label,
        keyHash,
        scopes
      }
    });

    console.log('✅ API key created successfully!');
    console.log(`📋 Label: ${apiKey.label}`);
    console.log(`🔐 Key: ${rawKey}`);
    console.log(`🔗 ID: ${apiKey.id}`);
    console.log(`🎯 Scopes: ${apiKey.scopes.join(', ')}`);
    console.log(`📅 Created: ${apiKey.createdAt.toISOString()}`);

    console.log('\n⚠️  IMPORTANT: Save this key securely! It will not be shown again.');
    console.log('💡 Use the key in API requests with header: x-api-key');

  } catch (error) {
    console.error('❌ Error creating API key:', error.message);
    process.exit(1);
  }
}

async function listApiKeys() {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        scopes: true,
        createdAt: true,
        revoked: true
      }
    });

    if (apiKeys.length === 0) {
      console.log('📭 No API keys found');
      return;
    }

    console.log('🔑 API Keys:');
    console.log('='.repeat(80));

    apiKeys.forEach((key, index) => {
      const status = key.revoked ? '❌ REVOKED' : '✅ ACTIVE';
      console.log(`${index + 1}. ${key.label}`);
      console.log(`   ID: ${key.id}`);
      console.log(`   Status: ${status}`);
      console.log(`   Scopes: ${key.scopes.join(', ')}`);
      console.log(`   Created: ${key.createdAt.toISOString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing API keys:', error.message);
    process.exit(1);
  }
}

async function revokeApiKey(id) {
  try {
    const apiKey = await prisma.apiKey.update({
      where: { id },
      data: { revoked: true },
      select: { id: true, label: true, revoked: true }
    });

    console.log(`✅ API key revoked: ${apiKey.label} (${apiKey.id})`);

  } catch (error) {
    console.error('❌ Error revoking API key:', error.message);
    if (error.code === 'P2025') {
      console.error('💡 API key not found. Use "list" command to see available keys.');
    }
    process.exit(1);
  }
}

async function testApiKey(rawKey, requiredScope) {
  try {
    console.log(`🧪 Testing API key against scope: "${requiredScope}"`);

    // Hash the provided key
    const keyHash = createApiKeyHash(rawKey);

    // Find the key in database
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        revoked: false
      },
      select: {
        id: true,
        label: true,
        scopes: true,
        revoked: true
      }
    });

    if (!apiKey) {
      console.log('❌ Invalid or revoked API key');
      return;
    }

    console.log(`✅ Valid API key: ${apiKey.label}`);
    console.log(`🎯 Key scopes: ${apiKey.scopes.join(', ')}`);
    console.log(`📋 Required scope: ${requiredScope}`);

    const hasScope = apiKey.scopes.includes(requiredScope);
    console.log(`🔍 Has required scope: ${hasScope ? '✅ YES' : '❌ NO'}`);

    if (hasScope) {
      console.log('\n🎉 API key test PASSED!');
    } else {
      console.log('\n❌ API key test FAILED - missing required scope');
      console.log(`💡 Add "${requiredScope}" to the key's scopes`);
    }

  } catch (error) {
    console.error('❌ Error testing API key:', error.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(USAGE);
    process.exit(1);
  }

  const command = args[0];

  try {
    switch (command) {
      case 'create':
        if (args.length < 3) {
          console.error('❌ Missing arguments for create command');
          console.log('Usage: create <label> <scopes>');
          process.exit(1);
        }
        await createApiKey(args[1], args[2]);
        break;

      case 'list':
        await listApiKeys();
        break;

      case 'revoke':
        if (args.length < 2) {
          console.error('❌ Missing ID for revoke command');
          console.log('Usage: revoke <id>');
          process.exit(1);
        }
        await revokeApiKey(args[1]);
        break;

      case 'test':
        if (args.length < 3) {
          console.error('❌ Missing arguments for test command');
          console.log('Usage: test <key> <scope>');
          process.exit(1);
        }
        await testApiKey(args[1], args[2]);
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log(USAGE);
        process.exit(1);
    }

  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
