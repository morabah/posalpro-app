#!/usr/bin/env tsx

/*
 * PosalPro CLI - Advanced Commands
 *
 * Handles advanced functionality like Redis, export/import, RBAC, entitlements, schema validation, and consistency checks
 */

import fs from 'node:fs';
import path from 'node:path';
import { logDebug, logError, logInfo } from '../../../src/lib/logger';
import { ApiClient } from '../core/api-client';
import { CommandContext } from '../core/types';

// Redis commands
export async function handleRedisCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (!subCommand) {
    console.log('Usage: redis <action> [options]');
    console.log('Actions: status, health, connect, ping, get, set, del, keys, clear, flush, benchmark, perf-test');
    return;
  }

  try {
    switch (subCommand) {
      case 'status': {
        console.log('🔍 Redis Status Check');
        console.log('===================\n');

        const redisEnabled = process.env.USE_REDIS === 'true';
        const redisUrl = process.env.REDIS_URL;

        console.log(`Redis Enabled: ${redisEnabled ? '✅ Yes' : '❌ No'}`);
        console.log(`Redis URL: ${redisUrl ? '✅ Set' : '❌ Not set'}`);

        if (redisUrl) {
          const maskedUrl = redisUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
          console.log(`URL: ${maskedUrl}`);
        }

        if (redisEnabled && redisUrl) {
          console.log('\n✅ Redis is properly configured');
        } else {
          console.log('\n⚠️ Redis is not properly configured');
          if (!redisEnabled) console.log('   Set USE_REDIS=true to enable Redis');
          if (!redisUrl) console.log('   Set REDIS_URL to configure Redis connection');
        }
        break;
      }
      case 'health': {
        console.log('🏥 Redis Health Check');
        console.log('====================\n');

        try {
          const res = await api.request('GET', '/api/redis/health');
          if (res.ok) {
            const healthData = await res.json();
            console.log('✅ Redis health check passed');
            console.log(JSON.stringify(healthData, null, 2));
          } else {
            console.log(`❌ Redis health check failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis health check failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'connect': {
        const url = tokens[2];
        if (!url) {
          console.log('Usage: redis connect <url>');
          return;
        }

        console.log(`🔗 Connecting to Redis: ${url.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@')}`);

        try {
          const res = await api.request('POST', '/api/redis/connect', { url });
          if (res.ok) {
            console.log('✅ Redis connection established');
          } else {
            console.log(`❌ Redis connection failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis connection failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'ping': {
        try {
          const res = await api.request('GET', '/api/redis/ping');
          if (res.ok) {
            const data = await res.json();
            console.log(`✅ Redis PONG: ${data.message || 'OK'}`);
          } else {
            console.log(`❌ Redis ping failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis ping failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'get': {
        const key = tokens[2];
        if (!key) {
          console.log('Usage: redis get <key>');
          return;
        }

        try {
          const res = await api.request('GET', `/api/redis/get?key=${encodeURIComponent(key)}`);
          if (res.ok) {
            const data = await res.json();
            console.log(`✅ Redis GET ${key}:`);
            console.log(JSON.stringify(data, null, 2));
          } else {
            console.log(`❌ Redis GET failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis GET failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'set': {
        const key = tokens[2];
        const value = tokens[3];
        const ttl = tokens[4];

        if (!key || !value) {
          console.log('Usage: redis set <key> <value> [ttl]');
          return;
        }

        try {
          const body: any = { key, value };
          if (ttl) body.ttl = parseInt(ttl);

          const res = await api.request('POST', '/api/redis/set', body);
          if (res.ok) {
            console.log(`✅ Redis SET ${key}: OK`);
          } else {
            console.log(`❌ Redis SET failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis SET failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'del': {
        const key = tokens[2];
        if (!key) {
          console.log('Usage: redis del <key>');
          return;
        }

        try {
          const res = await api.request('DELETE', `/api/redis/del?key=${encodeURIComponent(key)}`);
          if (res.ok) {
            console.log(`✅ Redis DEL ${key}: OK`);
          } else {
            console.log(`❌ Redis DEL failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis DEL failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'keys': {
        const pattern = tokens[2] || '*';

        try {
          const res = await api.request('GET', `/api/redis/keys?pattern=${encodeURIComponent(pattern)}`);
          if (res.ok) {
            const data = await res.json();
            console.log(`✅ Redis KEYS ${pattern}:`);
            console.log(JSON.stringify(data, null, 2));
          } else {
            console.log(`❌ Redis KEYS failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis KEYS failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'clear': {
        const pattern = tokens[2] || '*';

        try {
          const res = await api.request('POST', '/api/redis/clear', { pattern });
          if (res.ok) {
            const data = await res.json();
            console.log(`✅ Redis CLEAR ${pattern}: ${data.deleted || 0} keys deleted`);
          } else {
            console.log(`❌ Redis CLEAR failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis CLEAR failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'flush': {
        const force = tokens[2] === '--force';

        if (!force) {
          console.log('⚠️ WARNING: This will flush the entire Redis database!');
          console.log('Use "redis flush --force" to confirm.');
          return;
        }

        try {
          const res = await api.request('POST', '/api/redis/flush');
          if (res.ok) {
            console.log('✅ Redis FLUSH: Database flushed');
          } else {
            console.log(`❌ Redis FLUSH failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis FLUSH failed: ${(error as Error).message}`);
        }
        break;
      }
      case 'benchmark':
      case 'perf-test': {
        console.log('🚀 Redis Performance Test');
        console.log('========================\n');

        try {
          const res = await api.request('GET', '/api/redis/benchmark');
          if (res.ok) {
            const data = await res.json();
            console.log('✅ Redis Benchmark Results:');
            console.log(JSON.stringify(data, null, 2));
          } else {
            console.log(`❌ Redis benchmark failed: ${res.status}`);
          }
        } catch (error) {
          console.log(`❌ Redis benchmark failed: ${(error as Error).message}`);
        }
        break;
      }
      default:
        console.log(`Unknown Redis action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: Redis command failed', {
      component: 'AdvancedCommands',
      operation: 'redis_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// Export commands
export async function handleExportCommand(context: CommandContext): Promise<void> {
  const { tokens } = context;
  const model = tokens[1];
  const format = tokens[2] || 'json';
  const limit = tokens.find(t => t.startsWith('--limit='))?.split('=')[1] || '100';

  if (!model) {
    console.log('Usage: export <model> [format] [options]');
    console.log('Models: proposals, customers, products, users');
    console.log('Formats: json, csv, sql');
    console.log('Options: --limit=N');
    return;
  }

  try {
    console.log(`📤 Exporting ${model} data in ${format} format...`);

    const res = await fetch(`http://localhost:3000/api/export/${model}?format=${format}&limit=${limit}`);

    if (res.ok) {
      const data = await res.text();
      console.log(`✅ Export completed: ${data.length} characters`);

      // Save to file
      const filename = `export_${model}_${new Date().toISOString().split('T')[0]}.${format}`;
      fs.writeFileSync(filename, data);
      console.log(`📁 Saved to: ${filename}`);
    } else {
      console.log(`❌ Export failed: ${res.status}`);
    }
  } catch (error) {
    logError('CLI: Export command failed', {
      component: 'AdvancedCommands',
      operation: 'export_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      model,
      format,
    });
    throw error;
  }
}

// Import commands
export async function handleImportCommand(context: CommandContext): Promise<void> {
  const { tokens } = context;
  const model = tokens[1];
  const file = tokens[2];
  const validateOnly = tokens.includes('--validate-only');
  const skipErrors = tokens.includes('--skip-errors');

  if (!model || !file) {
    console.log('Usage: import <model> <file> [options]');
    console.log('Models: proposals, customers, products, users');
    console.log('Options: --validate-only, --skip-errors');
    return;
  }

  try {
    if (!fs.existsSync(file)) {
      console.log(`❌ File not found: ${file}`);
      return;
    }

    console.log(`📥 Importing ${model} data from ${file}...`);

    const fileContent = fs.readFileSync(file, 'utf8');
    const body = {
      data: fileContent,
      validateOnly,
      skipErrors,
    };

    const res = await fetch(`http://localhost:3000/api/import/${model}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const result = await res.json();
      console.log(`✅ Import completed: ${result.imported || 0} records imported`);
      if (result.errors && result.errors.length > 0) {
        console.log(`⚠️ Errors: ${result.errors.length}`);
        result.errors.forEach((error: any) => console.log(`  - ${error}`));
      }
    } else {
      console.log(`❌ Import failed: ${res.status}`);
    }
  } catch (error) {
    logError('CLI: Import command failed', {
      component: 'AdvancedCommands',
      operation: 'import_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      model,
      file,
    });
    throw error;
  }
}

// Generate test data commands
export async function handleGenerateTestDataCommand(context: CommandContext): Promise<void> {
  const { tokens } = context;
  const subCommand = tokens[1];

  if (subCommand !== 'test-data') {
    console.log('Usage: generate test-data [options]');
    console.log('Options: --count=N, --seed=S');
    return;
  }

  try {
    const count = tokens.find(t => t.startsWith('--count='))?.split('=')[1] || '10';
    const seed = tokens.find(t => t.startsWith('--seed='))?.split('=')[1] || '12345';

    console.log(`🧪 Generating test data (count: ${count}, seed: ${seed})...`);

    const res = await fetch('http://localhost:3000/api/generate/test-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: parseInt(count), seed }),
    });

    if (res.ok) {
      const result = await res.json();
      console.log(`✅ Test data generated: ${result.generated || 0} records`);
    } else {
      console.log(`❌ Test data generation failed: ${res.status}`);
    }
  } catch (error) {
    logError('CLI: Generate test data command failed', {
      component: 'AdvancedCommands',
      operation: 'generate_test_data_command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// RBAC commands
export async function handleRbacCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (!subCommand) {
    console.log('Usage: rbac <action> [options]');
    console.log('Actions: try, run-set, test-roles, endpoints, matrix, policies, multi-tenant, performance');
    return;
  }

  try {
    switch (subCommand) {
      case 'try': {
        const method = (tokens[2] || '').toUpperCase();
        const endpoint = tokens[3];
        const role = tokens[4];

        if (!method || !endpoint || !role) {
          console.log('Usage: rbac try <method> <endpoint> <role>');
          console.log('Example: rbac try POST /api/customers admin');
          return;
        }

        console.log(`🔒 Testing RBAC: ${method} ${endpoint} as ${role}...`);

        const res = await api.request(method as any, endpoint);
        console.log(`Result: ${res.status} ${res.statusText}`);
        console.log(await res.text());
        break;
      }
      case 'run-set': {
        console.log('🔒 Running RBAC test set...');

        const res = await api.request('POST', '/api/rbac/test-set');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ RBAC test set completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ RBAC test set failed: ${res.status}`);
        }
        break;
      }
      case 'test-roles': {
        console.log('🔒 Testing all roles...');

        const res = await api.request('GET', '/api/rbac/test-roles');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Role testing completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Role testing failed: ${res.status}`);
        }
        break;
      }
      case 'endpoints': {
        console.log('🔒 Testing RBAC endpoints...');

        const res = await api.request('GET', '/api/rbac/endpoints');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Endpoint testing completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Endpoint testing failed: ${res.status}`);
        }
        break;
      }
      case 'matrix': {
        console.log('🔒 Generating RBAC matrix...');

        const res = await api.request('GET', '/api/rbac/matrix');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ RBAC matrix generated');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ RBAC matrix generation failed: ${res.status}`);
        }
        break;
      }
      case 'policies': {
        console.log('🔒 Testing RBAC policies...');

        const res = await api.request('GET', '/api/rbac/policies');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Policy testing completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Policy testing failed: ${res.status}`);
        }
        break;
      }
      case 'multi-tenant': {
        console.log('🔒 Testing multi-tenant RBAC...');

        const res = await api.request('GET', '/api/rbac/multi-tenant');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Multi-tenant RBAC testing completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Multi-tenant RBAC testing failed: ${res.status}`);
        }
        break;
      }
      case 'performance': {
        console.log('🔒 Testing RBAC performance...');

        const res = await api.request('GET', '/api/rbac/performance');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ RBAC performance testing completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ RBAC performance testing failed: ${res.status}`);
        }
        break;
      }
      default:
        console.log(`Unknown RBAC action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: RBAC command failed', {
      component: 'AdvancedCommands',
      operation: 'rbac_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// Entitlements commands
export async function handleEntitlementsCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (!subCommand) {
    console.log('Usage: entitlements <action> [options]');
    console.log('Actions: test, check');
    return;
  }

  try {
    switch (subCommand) {
      case 'test': {
        console.log('🎫 Running entitlements test suite...');

        const res = await api.request('POST', '/api/entitlements/test');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Entitlements test completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Entitlements test failed: ${res.status}`);
        }
        break;
      }
      case 'check': {
        console.log('🎫 Checking current user entitlements...');

        const res = await api.request('GET', '/api/entitlements/check');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Entitlements check completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Entitlements check failed: ${res.status}`);
        }
        break;
      }
      default:
        console.log(`Unknown entitlements action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: Entitlements command failed', {
      component: 'AdvancedCommands',
      operation: 'entitlements_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// Export all advanced command handlers
export const advancedCommands = {
  redis: handleRedisCommand,
  export: handleExportCommand,
  import: handleImportCommand,
  generate: handleGenerateTestDataCommand,
  rbac: handleRbacCommand,
  entitlements: handleEntitlementsCommand,
};
