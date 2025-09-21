#!/usr/bin/env tsx

/*
 * PosalPro CLI - Main Entry Point
 *
 * Orchestrates all CLI modules and handles command routing
 */

import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'readline';
import { logDebug, logError, logInfo } from '../../src/lib/logger';
import { ApiClient } from './core/api-client';
import { CLIError } from './core/types';

// Import command modules
import { advancedCommands } from './commands/advanced-commands';
import { apiCommands } from './commands/api-commands';
import { authCommands } from './commands/auth-commands';
import { dbCommands } from './commands/db-commands';
import { entityCommands } from './commands/entity-commands';
import { systemCommands } from './commands/system-commands';
import { validationCommands } from './commands/validation-commands';

const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.production'] as const;
const BASE_URL = 'http://localhost:3000';

// Load environment variables
for (const envFile of ENV_FILES) {
  const envPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
  }
}

// Helper function to normalize base URL
function normalizeBaseUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

// Tokenize command line input
function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if ((char === '"' || char === "'") && !inQuotes) {
      inQuotes = true;
      quoteChar = char;
    } else if (char === quoteChar && inQuotes) {
      inQuotes = false;
      quoteChar = '';
    } else if (char === ' ' && !inQuotes) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens;
}

// Print help information
function printHelp() {
  console.log(`
╭─────────────────────────────────────────────────────────────╮
│              PosalPro App CLI - PRIMARY DEVELOPMENT TOOL   │
╰─────────────────────────────────────────────────────────────╯

🔐 AUTHENTICATION & SESSION MANAGEMENT
  login <email> <password> [role]           # Login with credentials
  login-as <email> <password> [role] [tag]  # Login and save as named session
  whoami                                     # GET /api/profile - show current user
  logout                                     # Clear session cookies
  use-session <tag>                          # Switch to named session jar

🌐 API REQUESTS
  get <path>                                 # GET request (e.g., /api/products)
  post <path> <json>                         # POST request with JSON body
  put <path> <json>                          # PUT request with JSON body
  delete <path>                              # DELETE request
  base [url]                                 # Show or set base URL

🗄️ DATABASE OPERATIONS
  detect-db                                  # Auto-detect database connection details
  health                                     # System health monitoring dashboard
  health:db                                  # Quick database connectivity test
  health:api                                 # Quick API health check
  health:redis                               # Redis health check
  jobs:drain                                 # Process background jobs from outbox
  jobs:test                                  # Create sample jobs for testing
  db <model> <action> [json]                 # Direct Prisma operations
  export <model> [format] [options]          # Export data from database
  import <model> <file> [options]            # Import data to database
  generate test-data                         # Generate test data for development
  monitor [target]                           # Monitor API endpoints and database

🛠️ TROUBLESHOOTING
  troubleshoot auth                          # Diagnose auth/session/roles issues
  troubleshoot dashboard                     # Diagnose dashboard RBAC/entitlements & fallbacks
  cookies show                               # Show CLI Cookie header and server debug cookie presence

🔒 ENTITLEMENTS TESTING
  entitlements test                          # Run comprehensive entitlement test suite
  entitlements check                         # Check current user entitlements and access

🧰 REDIS (CACHE) DIAGNOSTICS
  redis status                               # Show Redis enablement and connection status
  redis health                               # Run Redis health check (HTTP route + local fallback)
  redis benchmark|perf-test                   # Compare Redis vs Memory cache performance
  redis connect [url]                        # Force-connect Redis using REDIS_URL (sets USE_REDIS=true)
  redis ping                                 # Send PING to Redis
  redis get <key>                            # Get cached value by key (JSON parsed)
  redis set <key> <json|string> [ttl]        # Set cached value with optional TTL seconds
  redis del <key>                            # Delete a cache key
  redis keys <pattern>                       # List keys (requires Redis connection)
  redis clear <pattern>                      # Delete keys by pattern (server-side)
  redis flush [--force]                      # Flush current database (DANGEROUS; requires --force)

⚙️ ENVIRONMENT & CONFIGURATION
  env                                        # Show loaded environment variables
  env show [pattern]                         # Show environment variables (filtered by pattern)

📋 PROPOSAL MANAGEMENT
  proposals create <json>                     # Create a new proposal
  proposals update <id> <json>                # Update proposal data (triggers version creation)
  proposals get <id>                         # Get proposal details
  proposals cache                            # List all cached proposals
  proposals cache <id>                       # Inspect specific proposal cache
  proposals patch-products <id> <json>        # Update proposal products
  proposals patch-manual-total <id> <value>   # Set manual total with flag
  proposals backfill-step4 [limit] [--execute]  # Mirror DB products to metadata
  proposals add-product <proposalId> <productId> <qty> [unitPrice]
  proposals update-product <proposalId> <productId> <json>
  proposals remove-product <proposalId> <productId>
  proposals snapshot <proposalId> [changeType] [summary]

👥 CUSTOMER MANAGEMENT
  customers create <json>                    # POST /api/customers
  customers update <id> <json>               # PUT /api/customers/[id]
  customers delete <id>                      # DELETE /api/customers/[id]

📦 PRODUCT MANAGEMENT
  products create <json>                     # POST /api/products
  products update <id> <json>                # PUT /api/products/[id]
  products delete <id>                       # DELETE /api/products/[id]

📚 VERSION CONTROL
  versions list [limit]                      # List all proposal versions
  versions for <proposalId> [limit]          # Get versions for specific proposal
  versions diff <proposalId> <version>       # Show version differences
  versions assert [proposalId]               # Assert version integrity

🧪 TESTS
  tests tenant                               # Run all tenant-related Jest tests (middleware, seats)

🔒 RBAC TESTING
  rbac try <method> <path> [json]            # Test single API call with RBAC
  rbac run-set [file]                        # Run RBAC test suite from JSON file
  rbac test-roles [file]                     # Test multiple user roles
  rbac endpoints                             # Test all RBAC-protected endpoints
  rbac matrix                                # Test permission matrix across roles
  rbac policies                              # Validate RBAC policy enforcement
  rbac multi-tenant                          # Test multi-tenant RBAC isolation
  rbac performance                           # RBAC performance testing

🔍 SCHEMA & DATA TESTING
  schema check                               # Comprehensive schema consistency check
  schema integrity                           # Data integrity and referential integrity check
  schema validate                            # Zod schema validation against live data
  schema detect-mismatch [componentName]     # Dynamic frontend-backend field mismatch detection
  consistency <action> [entity] [id]         # Data consistency checks
  interactive                                # Interactive schema testing
  transform                                  # Schema transformation testing
  compatibility                              # Schema compatibility testing
  comprehensive                              # Comprehensive schema test suite

⚙️ SYSTEM
  help                                       # Show this help
  exit                                       # Exit CLI

╭─────────────────────────────────────────────────────────────╮
│                        EXAMPLES                            │
╰─────────────────────────────────────────────────────────────╯

🔐 Authentication:
  login admin@posalpro.com 'ProposalPro2024!' 'System Administrator'
  login-as user@company.com 'password123' 'Proposal Specialist' user1

🌐 API Requests:
  get /api/products
  post /api/customers '{"name":"ACME Corp","email":"sales@acme.com"}'
  put /api/proposals/cme41x23600ajjjpts9yb1f1b '{"title":"Updated Title"}'

🗄️ Database Operations:
  db proposal findMany '{"take":3,"select":{"id":true,"title":true}}'
  db customer findUnique '{"where":{"email":"admin@posalpro.com"}}'
  db product count '{"where":{"active":true}}'

📋 Proposal Operations:
  proposals get cme41x23600ajjjpts9yb1f1b
  proposals patch-products cme41x23600ajjjpts9yb1f1b '[{"productId":"prod123","quantity":2,"unitPrice":15000}]'
  proposals patch-manual-total cme41x23600ajjjpts9yb1f1b 31500
  proposals backfill-step4 100 --execute
  proposals add-product cme41x23600ajjjpts9yb1f1b prod123 2 15000 10

📦 Product Operations:
  products create '{"name":"Premium Package","price":5000,"description":"Enterprise solution"}'
  products update prod123 '{"price":5500}'
  products delete prod123

📚 Version Operations:
  versions list 50
  versions for cme41x23600ajjjpts9yb1f1b 10
  versions diff cme41x23600ajjjpts9yb1f1b v2

🔄 Version Creation Testing Workflow:
  # 1. Get a proposal ID (use db proposal findMany)
  # 2. Check initial versions: versions for <proposalId>
  # 3. Update proposal: proposals update <proposalId> '{"title":"Updated Title"}'
  # 4. Check new versions: versions for <proposalId>
  # 5. Compare versions: versions diff <proposalId> v1

🔒 RBAC Testing:
  rbac try GET /api/admin/metrics
  rbac try POST /api/proposals '{"title":"Test"}'
  rbac run-set rbac-tests.json
  rbac endpoints                             # Test all RBAC-protected endpoints
  rbac matrix                                # Comprehensive permission matrix test
  rbac policies                              # Validate RBAC policy enforcement
  rbac multi-tenant                          # Test tenant isolation
  rbac performance                           # Performance testing with metrics

🔍 Schema & Data Testing:
  schema check                                # Check all schema consistency
  schema integrity                            # Test data integrity
  schema validate                             # Validate data against Zod schemas
  schema detect-mismatch ProductForm          # Detect field mismatches in ProductForm component

╭─────────────────────────────────────────────────────────────╮
│                    USAGE PATTERNS                          │
╰─────────────────────────────────────────────────────────────╯

🚀 One-liner execution:
  npx tsx scripts/app-cli.ts --base https://posalpro.com --command "login admin@posalpro.com 'ProposalPro2024!'"
  npx tsx scripts/app-cli.ts --base https://localhost:3000 --command "get /api/products"
  npx tsx scripts/app-cli.ts --command "db proposal findMany '{\"take\":5}'"

🔧 Interactive mode:
  npx tsx scripts/app-cli.ts --base https://posalpro.com
  posalpro> login admin@posalpro.com 'ProposalPro2024!'
  posalpro> get /api/admin/metrics

📊 Batch operations:
  npx tsx scripts/app-cli.ts --base https://posalpro.com --command "proposals backfill-step4 500 --execute"
  npx tsx scripts/app-cli.ts --base https://posalpro.com --command "rbac test-roles roles-test.json"

🔒 HTTPS Support:
  --base https://posalpro.com              # Production HTTPS
  --base https://localhost:3000            # Local HTTPS
  --base https://staging.posalpro.com      # Staging HTTPS
  --base posalpro.com                      # Auto-detects HTTPS

🏢 Multi-Tenant Support:
  --tenant tenant_default                  # Default tenant
  --tenant tenant_company_a                # Company A tenant
  --tenant tenant_enterprise_xyz           # Enterprise tenant

💡 Tips:
  - Use single quotes around JSON to avoid shell escaping
  - Session cookies are automatically saved between commands
  - Database operations bypass API authentication
  - Use --execute flag for destructive operations
  - HTTPS URLs are automatically normalized and supported
`);
}

// Execute command based on tokens
async function execute(tokens: string[], api: ApiClient) {
  const cmd = (tokens[0] || '').toLowerCase();
  const context = { api, tokens, args: tokens.slice(1), options: {} };

  // Handle special commands
  if (cmd === 'help') {
    printHelp();
    return;
  }

  if (cmd === 'exit') {
    process.exit(0);
  }

  // Route to appropriate command module
  try {
    // Authentication commands
    if (authCommands[cmd as keyof typeof authCommands]) {
      await authCommands[cmd as keyof typeof authCommands](context);
      return;
    }

    // Handle multi-word auth commands (troubleshoot)
    if (cmd === 'troubleshoot' && tokens[1]) {
      const troubleshootCmd = `troubleshoot ${tokens[1]}` as keyof typeof authCommands;
      if (authCommands[troubleshootCmd]) {
        await authCommands[troubleshootCmd](context);
        return;
      }
    }

    // API commands
    if (apiCommands[cmd as keyof typeof apiCommands]) {
      await apiCommands[cmd as keyof typeof apiCommands](context);
      return;
    }

    // Database commands
    if (dbCommands[cmd as keyof typeof dbCommands]) {
      await dbCommands[cmd as keyof typeof dbCommands](context);
      return;
    }

    // Entity commands
    if (entityCommands[cmd as keyof typeof entityCommands]) {
      await entityCommands[cmd as keyof typeof entityCommands](context);
      return;
    }

    // System commands
    if (systemCommands[cmd as keyof typeof systemCommands]) {
      await systemCommands[cmd as keyof typeof systemCommands](context);
      return;
    }

    // Advanced commands
    if (advancedCommands[cmd as keyof typeof advancedCommands]) {
      await advancedCommands[cmd as keyof typeof advancedCommands](context);
      return;
    }

    // Validation commands
    if (validationCommands[cmd as keyof typeof validationCommands]) {
      await validationCommands[cmd as keyof typeof validationCommands](context);
      return;
    }

    // Handle multi-word commands
    if (cmd === 'troubleshoot' && tokens[1] === 'auth') {
      await authCommands['troubleshoot auth'](context);
      return;
    }

    // Unknown command
    console.log(`❌ Unknown command: ${cmd}`);
    console.log('Type "help" for available commands.');
  } catch (error) {
    const err = error as Error;
    logError('CLI: Command execution error', {
      component: 'CLIMain',
      operation: 'execute_command',
      command: cmd,
      args: tokens.slice(1),
      error: err.message,
      stack: err.stack,
    });
    console.error(`❌ Error: ${err.message}`);
    if (err instanceof CLIError) {
      console.error(`   Operation: ${err.operation}`);
      console.error(`   Component: ${err.component}`);
    }
  }
}

// Run command from argument
async function runOnceFromArg(command: string, api: ApiClient) {
  const tokens = tokenize(command);
  logDebug('CLI: Running command from argument', {
    component: 'CLIMain',
    operation: 'run_once_from_arg',
    command,
    tokens,
  });
  await execute(tokens, api);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const baseIdx = args.indexOf('--base');
  const base = baseIdx >= 0 && args[baseIdx + 1] ? args[baseIdx + 1] : BASE_URL;
  const tenantIdx = args.indexOf('--tenant');
  const tenantId = tenantIdx >= 0 && args[tenantIdx + 1] ? args[tenantIdx + 1] : null;
  const normalizedBase = normalizeBaseUrl(base);
  const api = new ApiClient(normalizedBase, tenantId);

  // Load active session if one exists
  const activeSessionPath = path.resolve(process.cwd(), '.posalpro-cli-active-session.json');
  logDebug('CLI: Checking for active session file', {
    component: 'CLIMain',
    operation: 'check_active_session',
    path: activeSessionPath,
    exists: fs.existsSync(activeSessionPath),
  });

  if (fs.existsSync(activeSessionPath)) {
    try {
      const activeSession = JSON.parse(fs.readFileSync(activeSessionPath, 'utf8'));
      logDebug('CLI: Active session file contents', {
        component: 'CLIMain',
        operation: 'active_session_contents',
        activeSession,
      });

      if (activeSession.tag && activeSession.tag !== 'default') {
        logInfo('CLI: Loading active session', {
          component: 'CLIMain',
          operation: 'load_active_session',
          tag: activeSession.tag,
        });
        api.switchSession(activeSession.tag);
      } else {
        logDebug('CLI: Active session tag is default or missing', {
          component: 'CLIMain',
          operation: 'skip_active_session',
          tag: activeSession.tag,
        });
      }
    } catch (err) {
      logError('CLI: Failed to load active session', {
        component: 'CLIMain',
        operation: 'load_active_session_error',
        error: (err as Error)?.message,
        path: activeSessionPath,
      });
    }
  } else {
    logDebug('CLI: No active session file found', {
      component: 'CLIMain',
      operation: 'no_active_session',
      path: activeSessionPath,
    });
  }

  // Log the base URL and tenant being used
  logInfo('CLI: Base URL and tenant configured', {
    component: 'CLIMain',
    operation: 'main',
    originalBase: base,
    normalizedBase,
    isHttps: normalizedBase.startsWith('https://'),
    tenantId,
  });

  const cmdIdx = args.indexOf('--command');
  if (cmdIdx >= 0 && args[cmdIdx + 1]) {
    await runOnceFromArg(args[cmdIdx + 1], api);
    process.exit(0);
  }

  printHelp();
  const rl = readline.createInterface({ input, output, terminal: true });
  const prompt = () => rl.setPrompt('posalpro> ');
  prompt();
  rl.prompt();

  rl.on('line', async line => {
    const tokens = tokenize(line.trim());
    try {
      logDebug('CLI: Interactive command received', {
        component: 'CLIMain',
        operation: 'interactive_command',
        command: tokens[0],
        args: tokens.slice(1),
      });
      await execute(tokens, api);
    } catch (err) {
      const error = err as Error;
      logError('CLI: Interactive command error', {
        component: 'CLIMain',
        operation: 'interactive_command_error',
        command: tokens[0],
        args: tokens.slice(1),
        error: error.message,
        stack: error.stack,
      });
      console.error(`❌ Error: ${error.message}`);
      if (error instanceof CLIError) {
        console.error(`   Operation: ${error.operation}`);
        console.error(`   Component: ${error.component}`);
      }
    }
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('Bye.');
    process.exit(0);
  });
}

// Run main function
main().catch(err => {
  const error = err as Error;
  logError('CLI: Fatal error', {
    component: 'CLIMain',
    operation: 'fatal_error',
    error: error.message,
    stack: error.stack,
  });
  console.error(`💥 Fatal: ${error.message}`);
  console.error(`   Stack: ${error.stack?.split('\n').slice(1, 4).join('\n   ')}`);
  process.exit(1);
});
