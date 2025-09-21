#!/usr/bin/env tsx

/*
 * PosalPro CLI - System Commands
 *
 * Handles system operations, monitoring, jobs, environment, and other system-level functionality
 */

import fs from 'node:fs';
import path from 'node:path';
import { logDebug, logError, logInfo } from '../../../src/lib/logger';
import { ApiClient } from '../core/api-client';
import { CommandContext } from '../core/types';

// Environment commands
export async function handleEnvCommand(context: CommandContext): Promise<void> {
  const { tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (subCommand === 'show') {
    const pattern = tokens[2];
    console.log('📋 Environment Variables:');
    console.log('========================\n');

    const envVars = Object.keys(process.env)
      .filter(key => !pattern || key.toLowerCase().includes(pattern.toLowerCase()))
      .sort();

    envVars.forEach(key => {
      const value = process.env[key];
      const masked = key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')
        ? '***'
        : value;
      console.log(`${key}=${masked}`);
    });

    console.log(`\nTotal: ${envVars.length} variables`);
  } else if (subCommand === 'list') {
    console.log('📋 Available Environment Variables:');
    console.log('===================================\n');

    const categories = {
      'Database': ['DATABASE_URL', 'DIRECT_URL', 'CLOUD_DATABASE_URL'],
      'Authentication': ['NEXTAUTH_SECRET', 'NEXTAUTH_URL', 'JWT_SECRET'],
      'Application': ['NODE_ENV', 'PORT', 'HOST'],
      'Redis': ['REDIS_URL', 'USE_REDIS'],
      'Other': []
    };

    Object.entries(categories).forEach(([category, vars]) => {
      console.log(`🔹 ${category}:`);
      vars.forEach(varName => {
        const exists = process.env[varName] ? '✅' : '❌';
        console.log(`  ${exists} ${varName}`);
      });
      console.log();
    });
  } else {
    console.log('Usage: env [show|list] [pattern]');
    console.log('  env show          # Show all environment variables');
    console.log('  env show DATABASE # Show variables containing "DATABASE"');
    console.log('  env list          # List available environment variables by category');
  }
}

// Jobs commands
export async function handleJobsDrainCommand(context: CommandContext): Promise<void> {
  console.log('🚀 Starting outbox drain process...');
  const startTime = Date.now();

  try {
    const { execSync } = require('child_process');
    execSync('tsx scripts/outbox-drain.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    const duration = Date.now() - startTime;
    console.log(`✅ Outbox drain completed in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Outbox drain failed after ${duration}ms`);
    console.error('Error:', (error as Error).message);
    throw error;
  }
}

export async function handleJobsTestCommand(context: CommandContext): Promise<void> {
  console.log('🧪 Creating sample outbox jobs...');

  try {
    const { execSync } = require('child_process');
    execSync('tsx scripts/test-outbox.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('❌ Failed to create test jobs:', (error as Error).message);
    throw error;
  }
}

// Monitor commands
export async function handleMonitorCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const target = tokens[1]?.toLowerCase() || 'all';

  console.log(`🔍 Monitoring system target: ${target}\n`);

  try {
    switch (target) {
      case 'api':
        await monitorApiEndpoints(api);
        break;
      case 'db':
        await monitorDatabase();
        break;
      case 'health':
        await monitorHealth(api);
        break;
      case 'all':
        await monitorApiEndpoints(api);
        await monitorDatabase();
        await monitorHealth(api);
        break;
      default:
        console.log('Usage: monitor [api|db|health|all]');
        console.log('  monitor api    # Monitor API endpoints');
        console.log('  monitor db     # Monitor database');
        console.log('  monitor health # Monitor system health');
        console.log('  monitor all    # Monitor everything');
    }
  } catch (error) {
    logError('CLI: Monitor command failed', {
      component: 'SystemCommands',
      operation: 'monitor_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      target,
    });
    throw error;
  }
}

async function monitorApiEndpoints(api: ApiClient) {
  console.log('🌐 Monitoring API endpoints...');

  const endpoints = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/proposals', method: 'GET' },
    { path: '/api/customers', method: 'GET' },
    { path: '/api/products', method: 'GET' },
  ];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const res = await api.request(endpoint.method as any, endpoint.path);
      const duration = Date.now() - startTime;

      const status = res.ok ? '✅' : '❌';
      console.log(`  ${status} ${endpoint.method} ${endpoint.path}: ${res.status} (${duration}ms)`);
    } catch (error) {
      console.log(`  ❌ ${endpoint.method} ${endpoint.path}: Failed (${(error as Error).message})`);
    }
  }
}

async function monitorDatabase() {
  console.log('🗄️ Monitoring database...');

  try {
    const { prisma } = await import('../../../src/lib/prisma');
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const duration = Date.now() - startTime;
    console.log(`  ✅ Database: Connected (${duration}ms)`);
  } catch (error) {
    console.log(`  ❌ Database: Failed (${(error as Error).message})`);
  }
}

async function monitorHealth(api: ApiClient) {
  console.log('🏥 Monitoring system health...');

  try {
    const res = await api.request('GET', '/api/health');
    if (res.ok) {
      const healthData = await res.json();
      console.log(`  ✅ Health endpoint: ${JSON.stringify(healthData, null, 2)}`);
    } else {
      console.log(`  ❌ Health endpoint: ${res.status}`);
    }
  } catch (error) {
    console.log(`  ❌ Health endpoint: Failed (${(error as Error).message})`);
  }
}

// Tests commands
export async function handleTestsCommand(context: CommandContext): Promise<void> {
  const { tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (subCommand === 'tenant') {
    try {
      const { execSync } = require('child_process');
      execSync(
        'npx jest src/test/integration/tenant-middleware.test.ts src/test/services/subscriptionService.test.ts --coverage --verbose',
        { stdio: 'inherit', cwd: process.cwd() }
      );
    } catch (error) {
      console.error('❌ Test execution failed:', (error as Error).message);
      process.exitCode = 1;
    }
  } else {
    console.log('Usage: tests <type>');
    console.log('  tests tenant  # Run tenant-related tests');
  }
}

// Versions commands
export async function handleVersionsCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  try {
    switch (subCommand) {
      case 'list': {
        const limit = tokens[2] ? Number(tokens[2]) || 200 : 200;
        const res = await api.request('GET', `/api/proposals/versions?limit=${limit}`);
        console.log(await res.text());
        break;
      }
      case 'for': {
        const id = tokens[2];
        const limit = tokens[3] ? Number(tokens[3]) || 50 : 50;
        if (!id) {
          console.log('Usage: versions for <proposalId> [limit]');
          return;
        }
        const res = await api.request('GET', `/api/proposals/${id}/versions?limit=${limit}`);
        console.log(await res.text());
        break;
      }
      case 'diff': {
        const id = tokens[2];
        const v = tokens[3];
        if (!id || !v) {
          console.log('Usage: versions diff <proposalId> <versionNumber>');
          return;
        }
        const res = await api.request(
          'GET',
          `/api/proposals/${id}/versions?version=${encodeURIComponent(v)}&detail=1`
        );
        console.log(await res.text());
        break;
      }
      case 'assert': {
        const proposalId = tokens[2];
        let res;
        if (proposalId) {
          res = await api.request('GET', `/api/proposals/${proposalId}/versions?limit=100`);
        } else {
          res = await api.request('GET', `/api/proposals/versions?limit=100`);
        }

        if (!res.ok) {
          console.log(`❌ Failed to fetch versions (HTTP ${res.status}): ${res.statusText}`);
          try {
            const responseText = await res.text();
            if (responseText) {
              console.log('Response:', responseText);
            }
          } catch (textError) {
            console.log('Could not read response body');
          }
          process.exitCode = 1;
          return;
        }

        const versions = await res.json();
        console.log(`✅ Versions endpoint working: ${Array.isArray(versions) ? versions.length : 'unknown'} versions`);
        break;
      }
      default:
        console.log('Usage: versions <action> [options]');
        console.log('  versions list [limit]                    # List all versions');
        console.log('  versions for <proposalId> [limit]        # List versions for specific proposal');
        console.log('  versions diff <proposalId> <version>     # Show version diff');
        console.log('  versions assert [proposalId]             # Assert versions endpoint works');
        break;
    }
  } catch (error) {
    logError('CLI: Versions command failed', {
      component: 'SystemCommands',
      operation: 'versions_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// Export all system command handlers
export const systemCommands = {
  env: handleEnvCommand,
  'jobs:drain': handleJobsDrainCommand,
  'jobs:test': handleJobsTestCommand,
  monitor: handleMonitorCommand,
  tests: handleTestsCommand,
  versions: handleVersionsCommand,
};
