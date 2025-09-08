#!/usr/bin/env node

/**
 * PosalPro MVP2 - Idempotency Key Management Script
 * View and manage idempotency keys for debugging and maintenance
 */

const { PrismaClient } = require('@prisma/client');
const { cleanupExpiredIdempotencyKeys, getIdempotencyStats } = require('../src/server/api/idempotency');

const prisma = new PrismaClient();

const USAGE = `
Idempotency Key Management Tool

Usage: node scripts/manage-idempotency.js <command> [options]

Commands:
  stats                    Show idempotency statistics
  list                     List recent idempotency keys
  cleanup                  Remove expired idempotency keys
  search <key>             Search for specific idempotency key
  delete <key>             Delete specific idempotency key
  user <userId>            List keys for specific user

Examples:
  node scripts/manage-idempotency.js stats
  node scripts/manage-idempotency.js list
  node scripts/manage-idempotency.js cleanup
  node scripts/manage-idempotency.js search "idemp_abc123"
  node scripts/manage-idempotency.js delete "idemp_abc123"
  node scripts/manage-idempotency.js user "user_123"
`;

async function showStats() {
  console.log('📊 Idempotency Statistics\n');

  const stats = await getIdempotencyStats();

  console.log(`Total Keys: ${stats.total}`);
  console.log(`Active Keys: ${stats.active}`);
  console.log(`Expired Keys: ${stats.expired}`);

  console.log('\n📈 Keys by Route:');
  stats.byRoute.forEach((route, index) => {
    console.log(`${index + 1}. ${route.route}: ${route.count} keys`);
  });
}

async function listKeys() {
  console.log('🔑 Recent Idempotency Keys\n');

  const keys = await prisma.idempotency.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (keys.length === 0) {
    console.log('No idempotency keys found');
    return;
  }

  console.log('ID'.padEnd(10), 'Key'.padEnd(25), 'Route'.padEnd(30), 'User'.padEnd(25), 'Created');
  console.log('─'.repeat(100));

  keys.forEach(key => {
    const id = key.id.substring(0, 8) + '...';
    const keyShort = key.key.length > 22 ? key.key.substring(0, 22) + '...' : key.key;
    const route = key.route.length > 27 ? key.route.substring(0, 27) + '...' : key.route;
    const user = key.user ? (key.user.name || key.user.email) : 'N/A';
    const userShort = user.length > 22 ? user.substring(0, 22) + '...' : user;
    const created = key.createdAt.toISOString().split('T')[0];

    console.log(id.padEnd(10), keyShort.padEnd(25), route.padEnd(30), userShort.padEnd(25), created);
  });
}

async function cleanupKeys() {
  console.log('🧹 Cleaning up expired idempotency keys...\n');

  const beforeCount = await prisma.idempotency.count();
  const cleanedCount = await cleanupExpiredIdempotencyKeys();
  const afterCount = await prisma.idempotency.count();

  console.log(`Before: ${beforeCount} keys`);
  console.log(`Cleaned: ${cleanedCount} keys`);
  console.log(`After: ${afterCount} keys`);

  if (cleanedCount > 0) {
    console.log('\n✅ Cleanup completed successfully');
  } else {
    console.log('\nℹ️  No expired keys to clean up');
  }
}

async function searchKey(searchKey) {
  console.log(`🔍 Searching for idempotency key: ${searchKey}\n`);

  const keys = await prisma.idempotency.findMany({
    where: {
      key: {
        contains: searchKey
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (keys.length === 0) {
    console.log('No matching keys found');
    return;
  }

  keys.forEach((key, index) => {
    console.log(`${index + 1}. Key: ${key.key}`);
    console.log(`   Route: ${key.route}`);
    console.log(`   User: ${key.user ? (key.user.name || key.user.email) : 'N/A'}`);
    console.log(`   Created: ${key.createdAt.toISOString()}`);
    console.log(`   Expires: ${key.expiresAt?.toISOString() || 'Never'}`);
    console.log('');
  });
}

async function deleteKey(key) {
  console.log(`🗑️  Deleting idempotency key: ${key}\n`);

  try {
    const deleted = await prisma.idempotency.delete({
      where: { key }
    });

    console.log('✅ Key deleted successfully');
    console.log(`   Route: ${deleted.route}`);
    console.log(`   Created: ${deleted.createdAt.toISOString()}`);

  } catch (error) {
    if (error.code === 'P2025') {
      console.log('❌ Key not found');
    } else {
      console.error('❌ Error deleting key:', error.message);
    }
  }
}

async function listUserKeys(userId) {
  console.log(`👤 Idempotency keys for user: ${userId}\n`);

  const keys = await prisma.idempotency.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (keys.length === 0) {
    console.log('No keys found for this user');
    return;
  }

  keys.forEach((key, index) => {
    console.log(`${index + 1}. ${key.key}`);
    console.log(`   Route: ${key.route}`);
    console.log(`   Created: ${key.createdAt.toISOString()}`);
    console.log(`   Expires: ${key.expiresAt?.toISOString() || 'Never'}`);
    console.log('');
  });
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
      case 'stats':
        await showStats();
        break;

      case 'list':
        await listKeys();
        break;

      case 'cleanup':
        await cleanupKeys();
        break;

      case 'search':
        if (args.length < 2) {
          console.error('❌ Missing search key');
          console.log('Usage: search <key>');
          process.exit(1);
        }
        await searchKey(args[1]);
        break;

      case 'delete':
        if (args.length < 2) {
          console.error('❌ Missing key to delete');
          console.log('Usage: delete <key>');
          process.exit(1);
        }
        await deleteKey(args[1]);
        break;

      case 'user':
        if (args.length < 2) {
          console.error('❌ Missing user ID');
          console.log('Usage: user <userId>');
          process.exit(1);
        }
        await listUserKeys(args[1]);
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
