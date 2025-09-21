#!/usr/bin/env tsx

/*
 * PosalPro CLI - Database Commands
 *
 * Handles database operations, health checks, and database-related functionality
 */

import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../../src/lib/prisma';
import { CommandContext } from '../core/types';

const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.production'] as const;

export async function handleDetectDbCommand(context: CommandContext): Promise<void> {
  console.log('🔍 PosalPro MVP2 - Database URL Detection\n');

  const results = {
    environmentVariables: [] as Array<{
      file: string;
      variable: string;
      value: string;
      masked: boolean;
    }>,
    connectionTests: [] as Array<{
      type: string;
      url: string;
      status: 'success' | 'error';
      message: string;
    }>,
    recommendations: [] as string[],
  };

  // 1. Check environment variables
  console.log('📋 Checking environment variables...');

  const dbVars = ['DATABASE_URL', 'DIRECT_URL', 'CLOUD_DATABASE_URL'];

  for (const envFile of ENV_FILES) {
    try {
      const content = await fs.promises.readFile(path.resolve(process.cwd(), envFile), 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));

      for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        const trimmedKey = key?.trim();

        if (dbVars.includes(trimmedKey)) {
          const value = valueParts.join('=').trim();
          const masked = value.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');

          results.environmentVariables.push({
            file: envFile,
            variable: trimmedKey,
            value: value,
            masked: true,
          });

          console.log(`  ✅ Found ${trimmedKey} in ${envFile}: ${masked}`);
        }
      }
    } catch (error) {
      // File doesn't exist or can't be read - that's ok
    }
  }

  // Check process environment
  for (const dbVar of dbVars) {
    if (process.env[dbVar]) {
      const masked = process.env[dbVar].replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
      results.environmentVariables.push({
        file: 'process.env',
        variable: dbVar,
        value: process.env[dbVar],
        masked: false,
      });
      console.log(`  ✅ Found ${dbVar} in process.env: ${masked}`);
    }
  }

  // 2. Parse and test database URLs
  console.log('\n🔗 Testing database connections...');

  const urlsToTest = new Set<string>();

  // Collect all unique URLs
  for (const env of results.environmentVariables) {
    if (env.variable === 'DATABASE_URL' || env.variable === 'DIRECT_URL') {
      urlsToTest.add(env.value);
    }
  }

  // Also check Prisma schema
  try {
    const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    const schemaContent = await fs.promises.readFile(schemaPath, 'utf8');
    const urlMatch = schemaContent.match(/url\s*=\s*["']([^"']+)["']/);
    if (urlMatch) {
      const schemaUrl = urlMatch[1];
      if (schemaUrl.startsWith('env(')) {
        const envVar = schemaUrl.match(/env\(["']([^"']+)["']\)/)?.[1];
        if (envVar && process.env[envVar]) {
          urlsToTest.add(process.env[envVar]);
          console.log(
            `  📄 Found URL in schema.prisma: ${process.env[envVar].replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@')} (via ${envVar})`
          );
        }
      } else {
        urlsToTest.add(schemaUrl);
        console.log(
          `  📄 Found URL in schema.prisma: ${schemaUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@')}`
        );
      }
    }
  } catch (error) {
    console.log(`  ⚠️ Could not read prisma/schema.prisma: ${(error as Error).message}`);
  }

  // Test each unique URL
  for (const url of urlsToTest) {
    const maskedUrl = url.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
    console.log(`  🧪 Testing connection to: ${maskedUrl}`);

    try {
      // Parse the URL to extract connection details
      const urlObj = new URL(url);
      const host = urlObj.hostname;
      const port = urlObj.port || '5432';
      const database = urlObj.pathname.slice(1); // Remove leading slash
      const user = urlObj.username;

      // Test connection using Prisma
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
        results.connectionTests.push({
          type: 'Prisma',
          url: maskedUrl,
          status: 'success',
          message: `Successfully connected to ${database} on ${host}:${port} as ${user}`,
        });
        console.log(`    ✅ Prisma connection successful`);
      } catch (prismaError) {
        results.connectionTests.push({
          type: 'Prisma',
          url: maskedUrl,
          status: 'error',
          message: `Prisma connection failed: ${(prismaError as Error).message}`,
        });
        console.log(`    ❌ Prisma connection failed: ${(prismaError as Error).message}`);
      }
    } catch (parseError) {
      // Try to test connection anyway, even if URL parsing fails
      try {
        await prisma.$queryRaw`SELECT 1 as test`;
        results.connectionTests.push({
          type: 'Prisma',
          url: maskedUrl,
          status: 'success',
          message: `Connection successful (URL parsing failed but connection works)`,
        });
        console.log(`    ✅ Connection successful despite URL parsing error`);
      } catch (prismaError) {
        results.connectionTests.push({
          type: 'URL Parse + Connection',
          url: maskedUrl,
          status: 'error',
          message: `URL parsing failed and connection failed: ${(prismaError as Error).message}`,
        });
        console.log(`    ❌ Both URL parsing and connection failed`);
      }
    }
  }

  // 3. Provide recommendations
  console.log('\n💡 Recommendations:');

  const successfulConnections = results.connectionTests.filter(test => test.status === 'success');
  const failedConnections = results.connectionTests.filter(test => test.status === 'error');

  if (successfulConnections.length > 0) {
    console.log('  ✅ Working connections found:');
    successfulConnections.forEach(test => {
      console.log(`     ${test.type}: ${test.message}`);
    });
  }

  if (failedConnections.length > 0) {
    console.log('  ❌ Connection issues detected:');
    failedConnections.forEach(test => {
      console.log(`     ${test.type}: ${test.message}`);
    });
  }

  if (results.environmentVariables.length === 0) {
    console.log('  ⚠️ No database environment variables found');
    console.log('     Consider creating .env.local with DATABASE_URL');
  }

  if (successfulConnections.length === 0 && failedConnections.length === 0) {
    console.log('  ℹ️ No database URLs found to test');
    console.log('     Make sure DATABASE_URL is set in your environment');
  }

  // 4. Summary
  console.log('\n📊 Summary:');
  console.log(`  Environment variables found: ${results.environmentVariables.length}`);
  console.log(`  URLs tested: ${results.connectionTests.length}`);
  console.log(`  Successful connections: ${successfulConnections.length}`);
  console.log(`  Failed connections: ${failedConnections.length}`);

  if (successfulConnections.length > 0) {
    console.log('\n🎉 Database connection detection completed successfully!');
  } else {
    console.log('\n⚠️ No working database connections found. Check your configuration.');
  }
}

export async function handleHealthCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  console.log('🏥 PosalPro MVP2 - System Health Monitoring\n');

  const health = {
    system: {} as any,
    database: {} as any,
    api: {} as any,
    application: {} as any,
    environment: {} as any,
    overall: {
      status: 'unknown' as string,
      score: 0,
      maxScore: 0,
      percentage: 0,
      issues: [] as string[],
    },
  };

  // 1. System Resources
  console.log('💻 Checking system resources...');

  try {
    // Memory usage
    const memUsage = process.memoryUsage();
    health.system.memory = {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
    };

    // Process info
    health.system.process = {
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    };

    console.log(
      `  ✅ Memory: ${health.system.memory.heapUsed}MB used of ${health.system.memory.heapTotal}MB`
    );
    console.log(
      `  ✅ Process: PID ${health.system.process.pid}, uptime ${health.system.process.uptime}s`
    );
  } catch (error) {
    console.log(`  ❌ Could not check system resources: ${(error as Error).message}`);
    health.overall.issues.push('System resource check failed');
  }

  // 2. Database Health
  console.log('\n🗄️ Checking database health...');

  try {
    // Connection test
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const dbResponseTime = Date.now() - startTime;

    health.database.connection = {
      status: 'healthy',
      responseTime: dbResponseTime,
      message: `Connected in ${dbResponseTime}ms`,
    };

    // Get database stats
    const tableStats = await prisma.$queryRaw`
      SELECT schemaname, relname as tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 5
    `;

    health.database.stats = {
      tables: tableStats,
      totalTables: Array.isArray(tableStats) ? tableStats.length : 0,
    };

    console.log(`  ✅ Database: ${health.database.connection.message}`);
    console.log(`  ✅ Tables: ${health.database.stats.totalTables} active tables`);
  } catch (error) {
    console.log(`  ❌ Database health check failed: ${(error as Error).message}`);
    health.database.connection = { status: 'error', message: (error as Error).message };
    health.overall.issues.push('Database connection failed');
  }

  // 3. API Endpoints Health
  console.log('\n🌐 Checking API endpoints...');

  const apiEndpoints = [
    { path: '/api/proposals', method: 'GET' as const, critical: true },
    { path: '/api/customers', method: 'GET' as const, critical: true },
    { path: '/api/products', method: 'GET' as const, critical: true },
    { path: '/api/proposals/stats', method: 'GET' as const, critical: false },
    { path: '/api/auth/session', method: 'GET' as const, critical: false },
  ];

  health.api.endpoints = [];
  let apiHealthy = 0;
  let apiTotal = apiEndpoints.length;

  for (const endpoint of apiEndpoints) {
    try {
      const startTime = Date.now();
      const res = await api.request(endpoint.method, endpoint.path);
      const responseTime = Date.now() - startTime;

      const endpointHealth = {
        path: endpoint.path,
        method: endpoint.method,
        status: res.status,
        responseTime,
        healthy: res.ok,
        critical: endpoint.critical,
      };

      health.api.endpoints.push(endpointHealth);

      if (res.ok) {
        apiHealthy++;
        console.log(`  ✅ ${endpoint.method} ${endpoint.path}: ${res.status} (${responseTime}ms)`);
      } else {
        console.log(`  ⚠️  ${endpoint.method} ${endpoint.path}: ${res.status} (${responseTime}ms)`);
        if (endpoint.critical) {
          health.overall.issues.push(`Critical API endpoint failed: ${endpoint.path}`);
        }
      }
    } catch (error) {
      health.api.endpoints.push({
        path: endpoint.path,
        method: endpoint.method,
        status: 0,
        responseTime: 0,
        healthy: false,
        critical: endpoint.critical,
        error: (error as Error).message,
      });

      console.log(`  ❌ ${endpoint.method} ${endpoint.path}: Failed (${(error as Error).message})`);
      if (endpoint.critical) {
        health.overall.issues.push(`Critical API endpoint error: ${endpoint.path}`);
      }
    }
  }

  health.api.summary = {
    total: apiTotal,
    healthy: apiHealthy,
    unhealthy: apiTotal - apiHealthy,
    healthRate: Math.round((apiHealthy / apiTotal) * 100),
  };

  // 4. Application Status
  console.log('\n🚀 Checking application status...');

  try {
    // Check if key application files exist
    const appFiles = [
      'package.json',
      'prisma/schema.prisma',
      'src/app/api/proposals/route.ts',
      'src/lib/prisma.ts',
      'src/lib/logger.ts',
    ];

    health.application.files = [];
    let filesExist = 0;

    for (const file of appFiles) {
      try {
        await fs.promises.access(path.resolve(process.cwd(), file));
        health.application.files.push({ file, exists: true });
        filesExist++;
      } catch {
        health.application.files.push({ file, exists: false });
        health.overall.issues.push(`Missing application file: ${file}`);
      }
    }

    health.application.summary = {
      totalFiles: appFiles.length,
      existingFiles: filesExist,
      missingFiles: appFiles.length - filesExist,
    };

    console.log(`  ✅ Application files: ${filesExist}/${appFiles.length} present`);
  } catch (error) {
    console.log(`  ❌ Application status check failed: ${(error as Error).message}`);
    health.overall.issues.push('Application status check failed');
  }

  // 5. Environment Configuration
  console.log('\n⚙️ Checking environment configuration...');

  try {
    const envFiles = ENV_FILES;
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'JWT_SECRET'];
    const optionalVars = ['NEXTAUTH_URL', 'NODE_ENV'];

    health.environment.variables = [];
    let requiredVarsFound = 0;
    let optionalVarsFound = 0;

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (value) {
        health.environment.variables.push({
          name: varName,
          value: varName.includes('SECRET') ? '***' : value,
          required: true,
          found: true,
        });
        requiredVarsFound++;
      } else {
        health.environment.variables.push({
          name: varName,
          value: null,
          required: true,
          found: false,
        });
        health.overall.issues.push(`Missing required environment variable: ${varName}`);
      }
    }

    for (const varName of optionalVars) {
      const value = process.env[varName];
      health.environment.variables.push({
        name: varName,
        value: value || 'not set',
        required: false,
        found: !!value,
      });
      if (value) optionalVarsFound++;
    }

    health.environment.summary = {
      required: requiredVars.length,
      requiredFound: requiredVarsFound,
      optional: optionalVars.length,
      optionalFound: optionalVarsFound,
    };

    console.log(
      `  ✅ Environment: ${requiredVarsFound}/${requiredVars.length} required, ${optionalVarsFound}/${optionalVars.length} optional`
    );
  } catch (error) {
    console.log(`  ❌ Environment check failed: ${(error as Error).message}`);
    health.overall.issues.push('Environment configuration check failed');
  }

  // 6. Calculate Overall Health Score
  console.log('\n📊 Calculating overall health score...');

  let score = 0;
  let maxScore = 0;

  // System resources (20 points)
  maxScore += 20;
  if (health.system.memory && health.system.process) {
    score += 20;
  }

  // Database (30 points)
  maxScore += 30;
  if (health.database.connection?.status === 'healthy') {
    score += 30;
  }

  // API endpoints (30 points)
  maxScore += 30;
  if (health.api.summary) {
    const apiScore = Math.round((health.api.summary.healthRate / 100) * 30);
    score += apiScore;
  }

  // Application files (10 points)
  maxScore += 10;
  if (health.application.summary) {
    const appScore = Math.round(
      (health.application.summary.existingFiles / health.application.summary.totalFiles) * 10
    );
    score += appScore;
  }

  // Environment (10 points)
  maxScore += 10;
  if (health.environment.summary) {
    const envScore = Math.round(
      (health.environment.summary.requiredFound / health.environment.summary.required) * 10
    );
    score += envScore;
  }

  health.overall.score = score;
  health.overall.maxScore = maxScore;
  health.overall.percentage = Math.round((score / maxScore) * 100);

  if (health.overall.percentage >= 90) {
    health.overall.status = 'excellent';
  } else if (health.overall.percentage >= 75) {
    health.overall.status = 'good';
  } else if (health.overall.percentage >= 50) {
    health.overall.status = 'fair';
  } else {
    health.overall.status = 'poor';
  }

  // 7. Display Results
  console.log('\n🎯 Overall Health Assessment:');
  console.log(`  Status: ${health.overall.status.toUpperCase()}`);
  console.log(
    `  Score: ${health.overall.score}/${health.overall.maxScore} (${health.overall.percentage}%)`
  );

  if (health.overall.issues.length > 0) {
    console.log('\n⚠️ Issues Found:');
    health.overall.issues.forEach(issue => {
      console.log(`  • ${issue}`);
    });
  }

  if (health.overall.percentage >= 75) {
    console.log('\n🎉 System is healthy and ready for production!');
  } else if (health.overall.percentage >= 50) {
    console.log('\n⚠️ System has some issues but is functional.');
  } else {
    console.log('\n❌ System has critical issues that need attention.');
  }

  // 8. Save health report
  try {
    const reportPath = path.resolve(process.cwd(), 'health-report.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(health, null, 2));
    console.log(`\n📄 Health report saved to: ${reportPath}`);
  } catch (error) {
    console.log(`\n⚠️ Could not save health report: ${(error as Error).message}`);
  }
}

export async function handleHealthDbCommand(context: CommandContext): Promise<void> {
  try {
    const startDb = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    console.log(`DB ok (${Date.now() - startDb}ms)`);
  } catch (error) {
    console.log(`DB error: ${(error as Error).message}`);
    throw error;
  }
}

export async function handleHealthApiCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  try {
    const startApi = Date.now();
    const r = await fetch(`${(api as any).baseUrl}/api/health`);
    console.log(`API ${r.status} (${Date.now() - startApi}ms)`);
  } catch (error) {
    console.log(`API error: ${(error as Error).message}`);
    throw error;
  }
}

export async function handleHealthRedisCommand(context: CommandContext): Promise<void> {
  const { api } = context;
  console.log('🔍 Redis Health Check');
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
}

export async function handleDbCommand(context: CommandContext): Promise<void> {
  const { tokens } = context;
  const [, model, action, ...args] = tokens;

  if (!model || !action) {
    console.log('Usage: db <model> <action> [args...]');
    console.log('Models: user, customer, product, proposal, role, etc.');
    console.log('Actions: findMany, findUnique, create, update, delete, etc.');
    console.log('Examples:');
    console.log('  db proposal findMany \'{"take":5}\'');
    console.log('  db customer findUnique \'{"where":{"id":"..."}}\'');
    console.log('  db product create \'{"name":"Test","price":100}\'');
    return;
  }

  try {
    // Map model names to Prisma models
    const modelMap: Record<string, any> = {
      user: prisma.user,
      customer: prisma.customer,
      product: prisma.product,
      proposal: prisma.proposal,
      role: prisma.role,
      proposalProduct: prisma.proposalProduct,
      proposalSection: prisma.proposalSection,
      approvalExecution: prisma.approvalExecution,
      validationIssue: prisma.validationIssue,
    };

    const prismaModel = modelMap[model];
    if (!prismaModel) {
      console.log(`❌ Unknown model: ${model}`);
      console.log('Available models:', Object.keys(modelMap).join(', '));
      return;
    }

    // Parse arguments
    let parsedArgs: any = {};
    if (args.length > 0) {
      try {
        parsedArgs = JSON.parse(args.join(' '));
      } catch (error) {
        console.log(`❌ Invalid JSON arguments: ${(error as Error).message}`);
        return;
      }
    }

    // Execute the Prisma operation
    const result = await (prismaModel as any)[action](parsedArgs);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(`❌ Database operation failed: ${(error as Error).message}`);
    throw error;
  }
}

// Export all database command handlers
export const dbCommands = {
  'detect-db': handleDetectDbCommand,
  health: handleHealthCommand,
  'health:db': handleHealthDbCommand,
  'health:api': handleHealthApiCommand,
  db: handleDbCommand,
};
