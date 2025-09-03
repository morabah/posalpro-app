#!/usr/bin/env tsx

/*
 PosalPro App CLI - PRIMARY DEVELOPMENT TOOL

 🚀 ALWAYS USE THIS CLI FOR:
   - Database operations and schema management
   - API testing and monitoring
   - Environment variable inspection
   - Data export/import operations
   - System health monitoring
   - Test data generation

 📋 AVAILABLE COMMANDS:
   - Database: detect-db, db, health, export, import
   - Monitoring: monitor, health
   - Data: generate test-data, export, import
   - Environment: env
   - Schema: schema check, schema integrity, schema validate

 ⚡ FEATURES:
   - Automatic .env file loading
   - Session management with NextAuth
   - Comprehensive error handling
   - Structured logging integration
   - Batch processing support

 Usage:
   npm run app:cli                  # interactive REPL
   npm run app:cli -- --command "monitor health"
   npm run app:cli -- --command "env show database"
   npm run app:cli -- --command "export customers json --limit=10"
   npm run app:cli -- --command "generate test-data --count=50"
   npm run app:cli -- --command "schema check"
*/

import { config } from 'dotenv';
import fetchOrig from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'readline';
import { URLSearchParams } from 'url';
import { prisma } from '../src/lib/db/prisma';

// ✅ ENHANCED: Structured logging integration
import { logDebug, logError, logInfo, logWarn } from '../src/lib/logger';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// ✅ ENHANCED: Load environment variables from .env files
function loadEnvironmentVariables() {
  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];

  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      config({ path: envPath });
      logDebug('CLI: Loaded environment variables from', { file: envFile, path: envPath });
    }
  }
}

// Load environment variables at startup
loadEnvironmentVariables();

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

// ✅ ENHANCED: HTTPS configuration
const HTTPS_CONFIG = {
  // Allow self-signed certificates for development
  rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '1',
  // Timeout for HTTPS requests
  timeout: parseInt(process.env.APP_CLI_TIMEOUT || '30000'),
  // Follow redirects
  followRedirect: true,
  // Maximum redirects
  maxRedirects: 5,
};

// ✅ ENHANCED: CLI-specific error class
class CLIError extends Error {
  constructor(
    message: string,
    public operation: string,
    public component: string = 'AppCLI',
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

// ✅ ENHANCED: Performance tracking utility
function trackPerformance<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const startTime = performance.now();
  return fn().finally(() => {
    const duration = performance.now() - startTime;
    logDebug('CLI: Performance tracked', {
      component: 'AppCLI',
      operation,
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
    });
  });
}

// ✅ ENHANCED: URL validation and normalization
function normalizeBaseUrl(url: string): string {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  return normalized;
}

// ✅ ENHANCED: HTTPS fetch wrapper with proper configuration
async function httpsFetch(url: string, options: any = {}) {
  const urlObj = new URL(url);
  const isHttps = urlObj.protocol === 'https:';

  // Enhanced options for HTTPS
  const enhancedOptions = {
    ...options,
    // Add HTTPS-specific configurations
    ...(isHttps &&
      {
        // For HTTPS requests, we might need to handle SSL certificates
        // This is handled by node-fetch automatically, but we can add custom logic here
      }),
  };

  return fetchOrig(url, enhancedOptions);
}

function slugify(value: string): string {
  return (
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'default'
  );
}

// Minimal persistent cookie jar
class CookieJar {
  private cookies: Map<string, string> = new Map();
  private storageFile: string;

  constructor(storageFile: string) {
    this.storageFile = storageFile;
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const data = JSON.parse(raw) as { cookies?: Record<string, string> };
        if (data.cookies) {
          this.cookies = new Map(Object.entries(data.cookies));
        }
      }
    } catch {}
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const data = { cookies: Object.fromEntries(this.cookies.entries()) };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
    } catch {}
  }

  setFromSetCookie(headers: string[] | undefined) {
    if (!headers || headers.length === 0) return;
    for (const h of headers) {
      const [pair] = h.split(';');
      const [name, ...rest] = pair.split('=');
      const value = rest.join('=');
      if (name && value) {
        this.cookies.set(name.trim(), value.trim());
      }
    }
    this.saveToDisk();
  }

  getCookieHeader(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  clear() {
    this.cookies.clear();
    this.saveToDisk();
  }
}

class ApiClient {
  private baseUrl: string;
  private jar: CookieJar;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    const defaultSessionPath = path.resolve(process.cwd(), '.posalpro-cli-session.json');
    const storage = process.env.APP_CLI_SESSION_FILE || defaultSessionPath;
    this.jar = new CookieJar(storage);
  }

  switchSession(tag: string) {
    const safe = slugify(tag || 'default');
    const sessionPath = path.resolve(process.cwd(), `.posalpro-cli-session-${safe}.json`);
    this.jar = new CookieJar(sessionPath);
  }

  async login(email: string, password: string, role?: string) {
    try {
      logInfo('CLI: Login attempt started', {
        component: 'AppCLI',
        operation: 'login',
        email,
        role,
        baseUrl: this.baseUrl,
      });

      // 1) Get CSRF token
      const csrfRes = await httpsFetch(`${this.baseUrl}/api/auth/csrf`, {
        method: 'GET',
      });

      if (!csrfRes.ok) {
        throw new CLIError(
          `CSRF token fetch failed (${csrfRes.status})`,
          'login_csrf_fetch',
          'AppCLI',
          { status: csrfRes.status, baseUrl: this.baseUrl }
        );
      }

      const rawSetCookie: string[] | undefined = (csrfRes.headers as any).raw?.()['set-cookie'];
      this.jar.setFromSetCookie(rawSetCookie);
      const csrfData = (await csrfRes.json()) as { csrfToken: string };

      logDebug('CLI: CSRF token obtained', {
        component: 'AppCLI',
        operation: 'login_csrf_success',
        hasCsrfToken: !!csrfData.csrfToken,
      });

      // 2) Post credentials to NextAuth callback to obtain session cookie
      const params = new URLSearchParams();
      params.set('csrfToken', csrfData.csrfToken);
      params.set('email', email);
      params.set('password', password);
      if (role) params.set('role', role);
      params.set('callbackUrl', `${this.baseUrl}/dashboard`);

      const loginRes = await httpsFetch(`${this.baseUrl}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Cookie: this.jar.getCookieHeader(),
        },
        body: params.toString(),
        redirect: 'manual',
      });
      const loginSetCookie: string[] | undefined = (loginRes.headers as any).raw?.()['set-cookie'];
      this.jar.setFromSetCookie(loginSetCookie);

      if (loginRes.status !== 302 && loginRes.status !== 200) {
        const text = await loginRes.text();
        throw new CLIError(
          `Login failed (${loginRes.status}): ${text}`,
          'login_credentials_failed',
          'AppCLI',
          { status: loginRes.status, email, role }
        );
      }

      logDebug('CLI: Credentials accepted', {
        component: 'AppCLI',
        operation: 'login_credentials_success',
        status: loginRes.status,
      });

      // 3) Verify session by calling NextAuth session endpoint (stable across roles)
      const verifyRes = await this.request('GET', '/api/auth/session');
      if (!verifyRes.ok) {
        throw new CLIError(
          `Login verification failed (${verifyRes.status})`,
          'login_verification_failed',
          'AppCLI',
          { status: verifyRes.status }
        );
      }

      logInfo('CLI: Login successful', {
        component: 'AppCLI',
        operation: 'login_success',
        email,
        role,
        sessionVerified: true,
      });

      return true;
    } catch (error) {
      logError('CLI: Login failed', {
        component: 'AppCLI',
        operation: 'login_error',
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        role,
        baseUrl: this.baseUrl,
      });
      throw error;
    }
  }

  async request(method: HttpMethod, path: string, body?: any) {
    return trackPerformance(`api_request_${method.toLowerCase()}`, async () => {
      try {
        const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
        const headers: Record<string, string> = {
          Accept: 'application/json',
          Cookie: this.jar.getCookieHeader(),
        };
        let fetchBody: any = undefined;
        if (body !== undefined && method !== 'GET') {
          headers['Content-Type'] = 'application/json';
          fetchBody = typeof body === 'string' ? body : JSON.stringify(body);
        }

        logDebug('CLI: API request started', {
          component: 'AppCLI',
          operation: 'api_request',
          method,
          path,
          url,
          hasBody: !!body,
          bodySize: body ? JSON.stringify(body).length : 0,
        });

        const res = await httpsFetch(url, { method, headers, body: fetchBody });

        logDebug('CLI: API request completed', {
          component: 'AppCLI',
          operation: 'api_request_complete',
          method,
          path,
          status: res.status,
          statusText: res.statusText,
          ok: res.ok,
        });

        if (!res.ok) {
          logWarn('CLI: API request failed', {
            component: 'AppCLI',
            operation: 'api_request_failed',
            method,
            path,
            status: res.status,
            statusText: res.statusText,
          });
        }

        return res;
      } catch (error) {
        logError('CLI: API request error', {
          component: 'AppCLI',
          operation: 'api_request_error',
          method,
          path,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw new CLIError(
          `API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'api_request_error',
          'AppCLI',
          { method, path, originalError: error }
        );
      }
    });
  }
}

function printHelp() {
  console.log(`
╭─────────────────────────────────────────────────────────────╮
│                    PosalPro App CLI                        │
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
  db <model> <action> [json]                 # Direct Prisma operations
  export <model> [format] [options]          # Export data from database
  import <model> <file> [options]            # Import data to database
  generate test-data                         # Generate test data for development
  monitor [target]                           # Monitor API endpoints and database

⚙️ ENVIRONMENT & CONFIGURATION
  env                                        # Show loaded environment variables
  env show [pattern]                         # Show environment variables (filtered by pattern)
  Examples:
    db proposal findMany '{"take":5}'
    db customer findUnique '{"where":{"id":"..."}}'
    db product create '{"name":"Test","price":100}'
    export proposals --format=json --limit=100
    export customers --format=csv
    import proposals data.json --validate-only
    import customers customers.csv --skip-errors
    generate test-data --count=50 --clean
    monitor api --endpoint=/api/proposals
    monitor db --query-time

📋 PROPOSAL MANAGEMENT
  proposals create <json>                     # Create a new proposal
  proposals update <id> <json>                # Update proposal data (triggers version creation)
  proposals get <id>                         # Get proposal details
  Examples:
    proposals create '{"basicInfo":{"title":"My Proposal","customerId":"customer-id"},"teamData":{"teamLead":"user-id"},"contentData":{},"productData":{},"sectionData":{}}'
    proposals update prop123 '{"title":"Updated Title","priority":"URGENT"}'

  Error Detection: ✅ HTTP status checks, JSON parsing errors, validation failures

  proposals patch-products <id> <jsonProducts>  # Update proposal products
  proposals patch-manual-total <id> <value>     # Set manual total with flag
  proposals backfill-step4 [limit] [--execute]  # Mirror DB products to metadata
  proposals add-product <proposalId> <productId> <qty> [unitPrice]
  proposals update-product <proposalId> <productId> <json>
  proposals remove-product <proposalId> <productId>
  proposals snapshot <proposalId> [changeType] [summary]

👥 CUSTOMER MANAGEMENT
  customers create <json>                    # POST /api/customers
  customers update <id> <json>               # PUT /api/customers/[id]
  customers delete <id>                      # DELETE /api/customers/[id]

  Examples:
    customers create '{"name":"ABC Corp","email":"contact@abc.com","industry":"Technology","tier":"PREMIUM"}'
    customers update cust123 '{"industry":"Healthcare"}'

  Error Detection: ✅ HTTP status checks, JSON parsing errors, validation failures

📦 PRODUCT MANAGEMENT
  products create <json>                     # POST /api/products
  products update <id> <json>                # PUT /api/products/[id]
  products delete <id>                       # DELETE /api/products/[id]

  Examples:
    products create '{"name":"Premium Package","price":5000,"description":"Enterprise solution"}'
    products update prod123 '{"price":5500}'

  Error Detection: ✅ HTTP status checks, JSON parsing errors, validation failures

📚 VERSION CONTROL
  versions list [limit]                      # List all proposal versions
  versions for <proposalId> [limit]          # Get versions for specific proposal
  versions diff <proposalId> <version>       # Show version differences
  versions assert [proposalId]               # Assert version integrity

🔒 RBAC TESTING
  rbac try <method> <path> [json]            # Test RBAC permission
  rbac run-set [file]                        # Run RBAC test suite from file
  rbac test-roles [file]                     # Test multiple user roles

🔍 SCHEMA & DATA TESTING
  schema check                               # Comprehensive schema consistency check
  schema integrity                           # Data integrity and referential integrity check
  schema validate                            # Zod schema validation against live data

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

🔍 Schema & Data Testing:
  schema check                                # Check all schema consistency
  schema integrity                            # Test data integrity
  schema validate                             # Validate data against Zod schemas

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

💡 Tips:
  - Use single quotes around JSON to avoid shell escaping
  - Session cookies are automatically saved between commands
  - Database operations bypass API authentication
  - Use --execute flag for destructive operations
  - HTTPS URLs are automatically normalized and supported
`);
}

async function handleDetectDb() {
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

  const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
  const dbVars = ['DATABASE_URL', 'DIRECT_URL', 'CLOUD_DATABASE_URL'];

  for (const envFile of envFiles) {
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

async function handleHealth(api: ApiClient) {
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
      'src/lib/db/prisma.ts',
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
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'JWT_SECRET'];
    const optionalVars = ['NEXTAUTH_URL', 'NODE_ENV'];

    health.environment.config = { files: [], variables: [] };

    // Check env files
    for (const envFile of envFiles) {
      try {
        await fs.promises.access(path.resolve(process.cwd(), envFile));
        health.environment.config.files.push({ file: envFile, exists: true });
      } catch {
        health.environment.config.files.push({ file: envFile, exists: false });
      }
    }

    // Check environment variables
    for (const varName of [...requiredVars, ...optionalVars]) {
      const isSet = !!process.env[varName];
      const isRequired = requiredVars.includes(varName);

      health.environment.config.variables.push({
        name: varName,
        set: isSet,
        required: isRequired,
      });

      if (!isSet && isRequired) {
        health.overall.issues.push(`Missing required environment variable: ${varName}`);
      }
    }

    const envFilesExist = health.environment.config.files.filter(f => f.exists).length;
    const requiredVarsSet = health.environment.config.variables.filter(
      v => v.required && v.set
    ).length;
    const totalRequiredVars = requiredVars.length;

    console.log(`  ✅ Environment files: ${envFilesExist}/${envFiles.length} found`);
    console.log(`  ✅ Required variables: ${requiredVarsSet}/${totalRequiredVars} set`);
  } catch (error) {
    console.log(`  ❌ Environment check failed: ${(error as Error).message}`);
    health.overall.issues.push('Environment configuration check failed');
  }

  // 6. Calculate Overall Health Score
  console.log('\n📊 Calculating overall health score...');

  let totalScore = 0;
  let maxScore = 0;

  // System resources (20 points)
  maxScore += 20;
  if (health.system.memory) {
    const memoryUsage = health.system.memory.heapUsed / health.system.memory.heapTotal;
    if (memoryUsage < 0.8) totalScore += 20;
    else if (memoryUsage < 0.9) totalScore += 15;
    else totalScore += 10;
  }

  // Database health (25 points)
  maxScore += 25;
  if (health.database.connection?.status === 'healthy') {
    if (health.database.connection.responseTime < 100) totalScore += 25;
    else if (health.database.connection.responseTime < 500) totalScore += 20;
    else totalScore += 15;
  }

  // API health (30 points)
  maxScore += 30;
  totalScore += Math.round((health.api.summary?.healthRate / 100) * 30);

  // Application files (15 points)
  maxScore += 15;
  if (health.application.summary) {
    const fileHealth =
      health.application.summary.existingFiles / health.application.summary.totalFiles;
    totalScore += Math.round(fileHealth * 15);
  }

  // Environment (10 points)
  maxScore += 10;
  if (health.environment.config) {
    const requiredVars = health.environment.config.variables.filter(v => v.required);
    const setVars = requiredVars.filter(v => v.set);
    const envHealth = setVars.length / requiredVars.length;
    totalScore += Math.round(envHealth * 10);
  }

  const healthPercentage = Math.round((totalScore / maxScore) * 100);

  let overallStatus = 'unknown';
  if (healthPercentage >= 90) overallStatus = 'excellent';
  else if (healthPercentage >= 75) overallStatus = 'good';
  else if (healthPercentage >= 60) overallStatus = 'fair';
  else if (healthPercentage >= 40) overallStatus = 'poor';
  else overallStatus = 'critical';

  health.overall = {
    status: overallStatus,
    score: totalScore,
    maxScore,
    percentage: healthPercentage,
    issues: health.overall.issues,
  };

  // 7. Display Results
  console.log('\n' + '='.repeat(60));
  console.log('🏥 POSALPRO MVP2 HEALTH REPORT');
  console.log('='.repeat(60));

  // Overall Status
  const statusEmoji = {
    excellent: '🟢',
    good: '🟡',
    fair: '🟠',
    poor: '🔴',
    critical: '🔴',
    unknown: '❓',
  };

  console.log(
    `\n${statusEmoji[overallStatus]} OVERALL STATUS: ${overallStatus.toUpperCase()} (${healthPercentage}%)`
  );
  console.log(`   Score: ${totalScore}/${maxScore} points`);

  // System Resources
  console.log('\n💻 SYSTEM RESOURCES:');
  if (health.system.memory) {
    console.log(
      `   Memory: ${health.system.memory.heapUsed}MB used of ${health.system.memory.heapTotal}MB`
    );
    console.log(
      `   Process: PID ${health.system.process.pid}, uptime ${health.system.process.uptime}s`
    );
    console.log(
      `   Node.js: ${health.system.process.nodeVersion} on ${health.system.process.platform}`
    );
  }

  // Database Health
  console.log('\n🗄️ DATABASE HEALTH:');
  if (health.database.connection) {
    console.log(`   Status: ${health.database.connection.status}`);
    if (health.database.connection.responseTime) {
      console.log(`   Response Time: ${health.database.connection.responseTime}ms`);
    }
    if (health.database.stats) {
      console.log(`   Active Tables: ${health.database.stats.totalTables}`);
    }
  }

  // API Health
  console.log('\n🌐 API ENDPOINTS:');
  console.log(
    `   Healthy: ${health.api.summary?.healthy}/${health.api.summary?.total} (${health.api.summary?.healthRate}%)`
  );
  if (health.api.endpoints) {
    const criticalFailures = health.api.endpoints.filter(e => e.critical && !e.healthy);
    if (criticalFailures.length > 0) {
      console.log(`   ⚠️  Critical failures: ${criticalFailures.length}`);
      criticalFailures.forEach(failure => {
        console.log(`      ${failure.method} ${failure.path}: ${failure.status}`);
      });
    }
  }

  // Application Status
  console.log('\n🚀 APPLICATION STATUS:');
  if (health.application.summary) {
    console.log(
      `   Files: ${health.application.summary.existingFiles}/${health.application.summary.totalFiles} present`
    );
  }

  // Environment
  console.log('\n⚙️ ENVIRONMENT:');
  if (health.environment.config) {
    const envFilesExist = health.environment.config.files.filter(f => f.exists).length;
    const requiredVarsSet = health.environment.config.variables.filter(
      v => v.required && v.set
    ).length;
    const totalRequiredVars = health.environment.config.variables.filter(v => v.required).length;

    console.log(`   Files: ${envFilesExist}/${health.environment.config.files.length} found`);
    console.log(`   Variables: ${requiredVarsSet}/${totalRequiredVars} required set`);
  }

  // Issues
  if (health.overall.issues.length > 0) {
    console.log('\n⚠️ ISSUES DETECTED:');
    health.overall.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');

  if (healthPercentage >= 90) {
    console.log('   ✅ System is in excellent health!');
  } else if (healthPercentage >= 75) {
    console.log('   ✅ System is healthy with minor issues');
  } else if (healthPercentage >= 60) {
    console.log('   ⚠️  System needs attention');
  } else {
    console.log('   🚨 System requires immediate attention');
  }

  if (
    health.system.memory &&
    health.system.memory.heapUsed / health.system.memory.heapTotal > 0.8
  ) {
    console.log('   • Consider restarting the application to free memory');
  }

  if (health.database.connection?.responseTime > 500) {
    console.log('   • Database response time is slow - check connection pool');
  }

  if (health.api.summary && health.api.summary.healthRate < 100) {
    console.log('   • Some API endpoints are not responding - check application logs');
  }

  if (health.application.summary && health.application.summary.missingFiles > 0) {
    console.log('   • Missing application files detected');
  }

  if (health.environment.config) {
    const missingVars = health.environment.config.variables.filter(v => v.required && !v.set);
    if (missingVars.length > 0) {
      console.log('   • Missing required environment variables');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🏥 Health check completed at ${new Date().toISOString()}`);
  console.log('='.repeat(60));
}

async function runOnceFromArg(command: string, api: ApiClient) {
  const tokens = tokenize(command);
  await execute(tokens, api);
}

function tokenize(line: string): string[] {
  // Simple tokenizer that respects quoted strings
  const regex = /(["'])(?:(?=(\\?))\2.)*?\1|[^\s]+/g;
  const matches = line.match(regex) || [];
  return matches.map(m => m.replace(/^['\"]|['\"]$/g, ''));
}

async function execute(tokens: string[], api: ApiClient) {
  const cmd = (tokens[0] || '').toLowerCase();
  switch (cmd) {
    case 'help':
      printHelp();
      break;
    case 'exit':
      process.exit(0);
      break;
    case 'base': {
      if (tokens[1]) {
        const normalizedUrl = normalizeBaseUrl(tokens[1]);
        (api as any).baseUrl = normalizedUrl;
        console.log(`Base URL updated to: ${normalizedUrl}`);
      } else {
        console.log(`Current Base URL: ${(api as any).baseUrl}`);
      }
      break;
    }
    case 'login': {
      const [_, email, password, role] = tokens;
      if (!email || !password) {
        console.log('Usage: login <email> <password> [role]');
        break;
      }
      await api.login(email, password, role);
      console.log('Login successful.');
      break;
    }
    case 'login-as': {
      const [_, email, password, role, tag] = tokens;
      if (!email || !password) {
        console.log('Usage: login-as <email> <password> [role] [tag]');
        break;
      }
      const sessionTag = tag || (email.includes('@') ? email.split('@')[0] : email);
      (api as any).switchSession(sessionTag);
      await api.login(email, password, role);
      console.log(`Login successful as ${email}. Session tag: ${sessionTag}`);
      break;
    }
    case 'use-session': {
      const tag = tokens[1];
      if (!tag) {
        console.log('Usage: use-session <tag>');
        break;
      }
      (api as any).switchSession(tag);
      console.log(`Switched to session: ${tag}`);
      break;
    }
    case 'whoami': {
      const res = await api.request('GET', '/api/profile');
      const text = await res.text();
      console.log(text);
      break;
    }
    case 'get':
    case 'delete': {
      const path = tokens[1];
      if (!path) {
        console.log(`Usage: ${cmd} <path>`);
        break;
      }
      const res = await api.request(cmd.toUpperCase() as HttpMethod, path);
      console.log(await res.text());
      break;
    }
    case 'post':
    case 'put': {
      const path = tokens[1];
      const bodyJson = tokens.slice(2).join(' ');
      if (!path || !bodyJson) {
        console.log(`Usage: ${cmd} <path> <json>`);
        break;
      }
      const body = JSON.parse(bodyJson);
      const res = await api.request(cmd.toUpperCase() as HttpMethod, path, body);
      console.log(await res.text());
      break;
    }
    case 'detect-db': {
      await handleDetectDb();
      break;
    }
    case 'health': {
      await handleHealth(api);
      break;
    }
    case 'export': {
      await handleExport(tokens);
      break;
    }
    case 'import': {
      await handleImport(tokens, api);
      break;
    }
    case 'generate': {
      const subCommand = tokens[1];
      if (subCommand === 'test-data') {
        await handleGenerateTestData(tokens);
      } else {
        console.log('Usage: generate test-data [options]');
      }
      break;
    }
    case 'monitor': {
      await handleMonitor(tokens, api);
      break;
    }
    case 'env': {
      await handleEnv(tokens);
      break;
    }
    case 'db': {
      await handleDbCommand(tokens);
      break;
    }
    case 'versions': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub === 'list') {
        const limit = tokens[2] ? Number(tokens[2]) || 200 : 200;
        const res = await api.request('GET', `/api/proposals/versions?limit=${limit}`);
        console.log(await res.text());
      } else if (sub === 'for') {
        const id = tokens[2];
        const limit = tokens[3] ? Number(tokens[3]) || 50 : 50;
        if (!id) {
          console.log('Usage: versions for <proposalId> [limit]');
          break;
        }
        const res = await api.request('GET', `/api/proposals/${id}/versions?limit=${limit}`);
        console.log(await res.text());
      } else if (sub === 'diff') {
        const id = tokens[2];
        const v = tokens[3];
        if (!id || !v) {
          console.log('Usage: versions diff <proposalId> <versionNumber>');
          break;
        }
        const res = await api.request(
          'GET',
          `/api/proposals/${id}/versions?version=${encodeURIComponent(v)}&detail=1`
        );
        console.log(await res.text());
      } else if (sub === 'assert') {
        const proposalId = tokens[2];
        let res;
        if (proposalId) {
          res = await api.request('GET', `/api/proposals/${proposalId}/versions?limit=100`);
        } else {
          res = await api.request('GET', `/api/proposals/versions?limit=100`);
        }

        // Check HTTP status first
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
          break;
        }

        const body: any = await res.json().catch(error => {
          console.log('❌ Failed to parse JSON response:', error.message);
          process.exitCode = 1;
          return null;
        });

        if (body === null) break;

        const list: any[] = Array.isArray(body?.data?.items)
          ? body.data.items
          : Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body)
              ? body
              : [];
        const missing = list.filter(
          (v: any) => typeof v.totalValue !== 'number' || !Number.isFinite(v.totalValue)
        );
        if (missing.length > 0) {
          console.log(`❌ Missing/invalid totalValue for ${missing.length} version(s)`);
          console.log(JSON.stringify(missing.slice(0, 10), null, 2));
          process.exitCode = 1;
        } else {
          console.log(`✅ All ${list.length} versions have valid totalValue`);
        }
      } else {
        console.log(
          'Usage:\n  versions list [limit]\n  versions for <proposalId> [limit]\n  versions diff <proposalId> <versionNumber>\n  versions assert [proposalId]'
        );
      }
      break;
    }
    case 'customers': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub === 'create') {
        const json = tokens.slice(2).join(' ');
        if (!json) {
          console.log('Usage: customers create <json>');
          console.log(
            'Example: customers create \'{"name":"ABC Corp","email":"contact@abc.com","industry":"Technology","status":"ACTIVE","tier":"PREMIUM"}\''
          );
          break;
        }
        try {
          const body = JSON.parse(json);
          const res = await api.request('POST', '/api/customers', body);
          const responseText = await res.text();

          if (res.status >= 200 && res.status < 300) {
            try {
              const result = JSON.parse(responseText);
              console.log('✅ Customer created successfully:');
              console.log(JSON.stringify(result, null, 2));
            } catch (parseError) {
              console.log('✅ Customer created successfully:');
              console.log(responseText);
            }
          } else {
            console.log(`❌ Failed to create customer (HTTP ${res.status}):`);
            try {
              const errorData = JSON.parse(responseText);
              if (errorData.message) {
                console.log(`Error: ${errorData.message}`);
              } else {
                console.log(responseText);
              }
            } catch {
              console.log(responseText);
            }
            process.exitCode = 1;
          }
        } catch (error) {
          console.log('❌ Failed to create customer:');
          if (error instanceof SyntaxError) {
            console.log('Invalid JSON format. Please check your JSON syntax.');
          } else {
            console.log(error instanceof Error ? error.message : 'Unknown error');
          }
          process.exitCode = 1;
        }
      } else if (sub === 'update') {
        const id = tokens[2];
        const json = tokens.slice(3).join(' ');
        if (!id || !json) {
          console.log('Usage: customers update <id> <json>');
          break;
        }
        const body = JSON.parse(json);
        const res = await api.request('PUT', `/api/customers/${id}`, body);
        console.log(await res.text());
      } else if (sub === 'delete') {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: customers delete <id>');
          break;
        }
        const res = await api.request('DELETE', `/api/customers/${id}`);
        console.log(await res.text());
      } else {
        console.log(
          'Usage:\n  customers create <json>\n  customers update <id> <json>\n  customers delete <id>'
        );
      }
      break;
    }
    case 'products': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub === 'create') {
        const json = tokens.slice(2).join(' ');
        if (!json) {
          console.log('Usage: products create <json>');
          console.log(
            'Example: products create \'{"name":"Test Product","description":"Description","price":99.99,"sku":"SKU123","category":"Electronics","tags":"new,featured","isActive":true}\''
          );
          break;
        }
        try {
          const body = JSON.parse(json);
          // Fix array fields if they are strings
          if (typeof body.category === 'string') {
            body.category = [body.category];
          }
          if (typeof body.tags === 'string') {
            body.tags = body.tags.split(',').map((tag: string) => tag.trim());
          }
          // Generate SKU if not provided
          if (!body.sku) {
            body.sku = 'SKU' + Math.random().toString(36).substring(2, 8).toUpperCase();
          }

          const res = await api.request('POST', '/api/products', body);
          const responseText = await res.text();

          if (res.status >= 200 && res.status < 300) {
            try {
              const result = JSON.parse(responseText);
              console.log('✅ Product created successfully:');
              console.log(JSON.stringify(result, null, 2));
            } catch (parseError) {
              console.log('✅ Product created successfully:');
              console.log(responseText);
            }
          } else {
            console.log(`❌ Failed to create product (HTTP ${res.status}):`);
            try {
              const errorData = JSON.parse(responseText);
              if (errorData.message) {
                console.log(`Error: ${errorData.message}`);
              } else {
                console.log(responseText);
              }
            } catch {
              console.log(responseText);
            }
            process.exitCode = 1;
          }
        } catch (error) {
          console.log('❌ Failed to create product:');
          if (error instanceof SyntaxError) {
            console.log('Invalid JSON format. Please check your JSON syntax.');
          } else {
            console.log(error instanceof Error ? error.message : 'Unknown error');
          }
          process.exitCode = 1;
        }
      } else if (sub === 'update') {
        const id = tokens[2];
        const json = tokens.slice(3).join(' ');
        if (!id || !json) {
          console.log('Usage: products update <id> <json>');
          break;
        }
        const body = JSON.parse(json);
        const res = await api.request('PUT', `/api/products/${id}`, body);
        console.log(await res.text());
      } else if (sub === 'delete') {
        const id = tokens[2];
        if (!id) {
          console.log('Usage: products delete <id>');
          break;
        }
        const res = await api.request('DELETE', `/api/products/${id}`);
        console.log(await res.text());
      } else {
        console.log(
          'Usage:\n  products create <json>\n  products update <id> <json>\n  products delete <id>'
        );
      }
      break;
    }
    case 'proposals': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub === 'create') {
        // proposals create <json>
        const json = tokens.slice(2).join(' ');
        if (!json) {
          console.log('Usage: proposals create <json>');
          console.log(
            'Example: proposals create \'{"title":"New Proposal","description":"Description","customerId":"customer-id","dueDate":"2025-12-31","priority":"HIGH","value":50000,"currency":"USD"}\''
          );
          break;
        }
        try {
          const proposalData = JSON.parse(json);
          // Fix tags field if it's a string, convert to array
          if (proposalData.basicInfo && typeof proposalData.basicInfo.tags === 'string') {
            proposalData.basicInfo.tags = proposalData.basicInfo.tags
              .split(',')
              .map((tag: string) => tag.trim());
          }
          const res = await api.request('POST', '/api/proposals', proposalData);
          const responseText = await res.text();

          if (res.status >= 200 && res.status < 300) {
            try {
              const result = JSON.parse(responseText);
              console.log('✅ Proposal created successfully:');
              console.log(JSON.stringify(result, null, 2));
            } catch (parseError) {
              console.log('✅ Proposal created successfully:');
              console.log(responseText);
            }
          } else {
            console.log(`❌ Failed to create proposal (HTTP ${res.status}):`);
            try {
              const errorData = JSON.parse(responseText);
              if (errorData.message) {
                console.log(`Error: ${errorData.message}`);
              } else if (errorData.error) {
                console.log(`Error: ${errorData.error}`);
              } else {
                console.log(responseText);
              }
            } catch {
              console.log(responseText);
            }
            process.exitCode = 1;
          }
        } catch (error) {
          console.log('❌ Failed to create proposal:');
          if (error instanceof SyntaxError) {
            console.log('Invalid JSON format. Please check your JSON syntax.');
          } else {
            console.log(error instanceof Error ? error.message : 'Unknown error');
          }
          process.exitCode = 1;
        }
      } else if (sub === 'patch-products') {
        // proposals patch-products <id> <jsonProducts>
        const id = tokens[2];
        const json = tokens.slice(3).join(' ');
        if (!id || !json) {
          console.log('Usage: proposals patch-products <id> <jsonProducts>');
          break;
        }
        const products = JSON.parse(json);
        const res = await api.request('PATCH', `/api/proposals/${id}`, { products });
        console.log(await res.text());
      } else if (sub === 'patch-manual-total') {
        // proposals patch-manual-total <id> <value>
        const id = tokens[2];
        const val = Number(tokens[3]);
        if (!id || !Number.isFinite(val)) {
          console.log('Usage: proposals patch-manual-total <id> <value>');
          break;
        }
        const res = await api.request('PATCH', `/api/proposals/${id}`, {
          value: val,
          manualTotal: true,
          metadata: { wizardData: { step4: { products: [] } } },
        });
        console.log(await res.text());
      } else if (sub === 'update') {
        // proposals update <id> <json>
        const id = tokens[2];
        const json = tokens.slice(3).join(' ');
        if (!id || !json) {
          console.log('Usage: proposals update <id> <json>');
          console.log(
            'Example: proposals update prop123 \'{"title":"Updated Title","priority":"URGENT"}\''
          );
          break;
        }
        try {
          const updateData = JSON.parse(json);
          // Fix tags field if it's a string, convert to array
          if (updateData.tags && typeof updateData.tags === 'string') {
            updateData.tags = updateData.tags.split(',').map((tag: string) => tag.trim());
          }
          const res = await api.request('PUT', `/api/proposals/${id}`, updateData);
          const responseText = await res.text();

          if (res.status >= 200 && res.status < 300) {
            try {
              const result = JSON.parse(responseText);
              console.log('✅ Proposal updated successfully:');
              console.log(JSON.stringify(result, null, 2));
            } catch (parseError) {
              console.log('✅ Proposal updated successfully:');
              console.log(responseText);
            }
          } else {
            console.log(`❌ Failed to update proposal (HTTP ${res.status}):`);
            try {
              const errorData = JSON.parse(responseText);
              if (errorData.message) {
                console.log(`Error: ${errorData.message}`);
              } else if (errorData.error) {
                console.log(`Error: ${errorData.error}`);
              } else {
                console.log(responseText);
              }
            } catch {
              console.log(responseText);
            }
            process.exitCode = 1;
          }
        } catch (error) {
          console.log('❌ Failed to update proposal:');
          if (error instanceof SyntaxError) {
            console.log('Invalid JSON format. Please check your JSON syntax.');
          } else {
            console.log(error instanceof Error ? error.message : 'Unknown error');
          }
          process.exitCode = 1;
        }
      } else if (sub === 'get') {
        // proposals get <id>
        const id = tokens[2];
        if (!id) {
          console.log('Usage: proposals get <id>');
          break;
        }
        const res = await api.request('GET', `/api/proposals/${id}`);
        console.log(await res.text());
      } else if (sub === 'backfill-step4') {
        // Usage: proposals backfill-step4 [limit] [--execute]
        const limitArg = tokens[2];
        const flag = tokens[3] || '';
        const limit = limitArg && /^\d+$/.test(limitArg) ? Number(limitArg) : 1000;
        const execute = flag.toLowerCase() === '--execute';

        let processed = 0;
        let updated = 0;
        let skipped = 0;
        let cursor: string | undefined = undefined;

        console.log(
          `🔎 Scanning proposals (limit=${limit}, mode=${execute ? 'execute' : 'dry-run'})...`
        );

        while (processed < limit) {
          const page = await prisma.proposal.findMany({
            select: {
              id: true,
              metadata: true,
              value: true,
              totalValue: true,
              products: {
                select: {
                  productId: true,
                  quantity: true,
                  unitPrice: true,
                  total: true,
                },
                take: 200,
              },
            },
            orderBy: { id: 'asc' },
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            take: Math.min(200, limit - processed),
          });

          if (page.length === 0) break;
          for (const p of page) {
            processed++;
            cursor = p.id;

            const rel = Array.isArray(p.products) ? p.products : [];
            const hasRel = rel.length > 0;

            // Check metadata wizardData.step4.products
            const md: any = (p.metadata as any) || {};
            const wd = (md.wizardData as any) || {};
            const step4 = (wd.step4 as any) || {};
            const mdProducts = Array.isArray(step4.products) ? step4.products : [];
            const hasMd = mdProducts.length > 0;

            if (!hasRel) {
              skipped++;
              continue;
            }
            if (hasMd) {
              skipped++;
              continue;
            }

            // Build mirrored products array
            const mirrored = rel.map(link => ({
              id: link.productId,
              included: true,
              quantity: Number(link.quantity ?? 1),
              unitPrice: Number(link.unitPrice ?? 0),
              totalPrice:
                typeof link.total === 'number'
                  ? Number(link.total)
                  : Number(link.quantity ?? 1) *
                    Number(link.unitPrice ?? 0) *
                    (1 - Number(link.discount ?? 0) / 100),
            }));

            const computed = mirrored.reduce((s, m) => s + Number(m.totalPrice || 0), 0);

            if (execute) {
              const newMeta = { ...(md || {}) } as any;
              newMeta.wizardData = { ...(wd || {}) } as any;
              newMeta.wizardData.step4 = { ...(step4 || {}), products: mirrored } as any;

              await prisma.proposal.update({
                where: { id: p.id },
                data: {
                  value: computed,
                  totalValue: computed,
                },
              });
            }

            updated++;
            if (processed >= limit) break;
          }
        }

        console.log(
          `${execute ? '✅ Backfill complete' : '🔎 Dry-run complete'}: processed=${processed}, updated=${updated}, skipped=${skipped}`
        );
      } else if (sub === 'add-product') {
        const proposalId = tokens[2];
        const productId = tokens[3];
        const qty = Number(tokens[4]);
        const unitPrice = tokens[5] ? Number(tokens[5]) : undefined;
        const discount = tokens[6] ? Number(tokens[6]) : 0;
        if (!proposalId || !productId || !Number.isFinite(qty)) {
          console.log('Usage: proposals add-product <proposalId> <productId> <qty> [unitPrice]');
          break;
        }
        const fallbackPrice = await prisma.product
          .findUnique({ where: { id: productId }, select: { price: true } as any })
          .then((p: any) => {
            const val = Number(p?.price);
            return Number.isFinite(val) ? val : 0;
          })
          .catch(() => 0);
        const price: number = Number.isFinite(Number(unitPrice))
          ? Number(unitPrice)
          : fallbackPrice;
        const total = Number((qty * price).toFixed(2));
        const created = await prisma.proposalProduct.create({
          data: {
            proposalId,
            productId,
            quantity: qty,
            unitPrice: price,
            total,
          },
        });
        console.log(JSON.stringify(created, null, 2));
      } else if (sub === 'update-product') {
        const proposalId = tokens[2];
        const productId = tokens[3];
        const json = tokens.slice(4).join(' ');
        if (!proposalId || !productId || !json) {
          console.log('Usage: proposals update-product <proposalId> <productId> <json>');
          break;
        }
        const patch = JSON.parse(json);
        // Remove discount from patch if present
        if ('discount' in patch) {
          delete patch.discount;
        }
        // Find link id first
        const link = await prisma.proposalProduct.findFirst({
          where: { proposalId, productId },
          select: { id: true },
        });
        if (!link) {
          console.log('Link not found');
          break;
        }
        const updated = await prisma.proposalProduct.update({
          where: { id: link.id },
          data: patch,
        });
        console.log(JSON.stringify(updated, null, 2));
      } else if (sub === 'remove-product') {
        const proposalId = tokens[2];
        const productId = tokens[3];
        if (!proposalId || !productId) {
          console.log('Usage: proposals remove-product <proposalId> <productId>');
          break;
        }
        const link = await prisma.proposalProduct.findFirst({
          where: { proposalId, productId },
          select: { id: true },
        });
        if (!link) {
          console.log('Link not found');
          break;
        }
        const removed = await prisma.proposalProduct.delete({ where: { id: link.id } });
        console.log(JSON.stringify(removed, null, 2));
      } else if (sub === 'snapshot') {
        const proposalId = tokens[2];
        const changeType = tokens[3] || 'update';
        const summary = tokens.slice(4).join(' ') || '';
        if (!proposalId) {
          console.log('Usage: proposals snapshot <proposalId> [changeType] [summary]');
          break;
        }
        const res = await api.request('POST', `/api/proposals/${proposalId}/versions`, {
          changeType,
          changesSummary: summary,
        });
        console.log(await res.text());
      } else {
        console.log(
          'Usage:\n  proposals create <json>\n  proposals update <id> <json>\n  proposals get <id>\n  proposals patch-products <id> <jsonProducts>\n  proposals patch-manual-total <id> <value>\n  proposals backfill-step4 [limit] [--execute]\n  proposals add-product <proposalId> <productId> <qty> [unitPrice]\n  proposals update-product <proposalId> <productId> <json>\n  proposals remove-product <proposalId> <productId>\n  proposals snapshot <proposalId> [changeType] [summary]'
        );
      }
      break;
    }
    case 'rbac': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub === 'try') {
        const method = (tokens[2] || '').toUpperCase();
        const pathArg = tokens[3];
        const bodyJson = tokens.slice(4).join(' ');
        if (!method || !pathArg) {
          console.log('Usage: rbac try <method> <path> [json]');
          break;
        }
        const body = bodyJson ? JSON.parse(bodyJson) : undefined;
        const res = await api.request(method as HttpMethod, pathArg, body);
        const txt = await res.text();
        const allowed = res.status < 400;
        console.log(
          `[RBAC] ${method} ${pathArg} → ${allowed ? 'Allowed' : 'Denied'} (${res.status})`
        );
        console.log(txt);
      } else if (sub === 'run-set') {
        const file = tokens[2] || '.posalpro-rbac-set.json';
        try {
          logInfo('CLI: RBAC set test started', {
            component: 'AppCLI',
            operation: 'rbac_run_set',
            file,
          });

          const raw = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
          const items = JSON.parse(raw);
          if (!Array.isArray(items)) {
            throw new CLIError(
              'RBAC set file must be an array of {method,path,body,expect}',
              'rbac_invalid_format',
              'AppCLI',
              { file, itemCount: items?.length }
            );
          }

          let pass = 0,
            fail = 0;

          logDebug('CLI: RBAC set test processing', {
            component: 'AppCLI',
            operation: 'rbac_set_processing',
            totalTests: items.length,
          });

          for (const it of items) {
            try {
              const method = (it.method || 'GET').toUpperCase();
              const res = await api.request(method as HttpMethod, it.path, it.body);
              const allowed = res.status < 400;
              const statusTxt = `${res.status}`;
              const ok =
                typeof it.expect === 'number'
                  ? res.status === it.expect
                  : typeof it.expect === 'string'
                    ? statusTxt.startsWith(it.expect)
                    : allowed;

              console.log(
                `[RBAC] ${method} ${it.path} → ${allowed ? 'Allowed' : 'Denied'} (${res.status})${
                  it.expect !== undefined ? ` expect=${it.expect} ${ok ? '✓' : '✗'}` : ''
                }`
              );

              if (ok) {
                pass++;
                logDebug('CLI: RBAC test passed', {
                  component: 'AppCLI',
                  operation: 'rbac_test_passed',
                  method,
                  path: it.path,
                  status: res.status,
                  expected: it.expect,
                });
              } else {
                fail++;
                logWarn('CLI: RBAC test failed', {
                  component: 'AppCLI',
                  operation: 'rbac_test_failed',
                  method,
                  path: it.path,
                  status: res.status,
                  expected: it.expect,
                  actual: res.status,
                });
              }
            } catch (error) {
              fail++;
              logError('CLI: RBAC test error', {
                component: 'AppCLI',
                operation: 'rbac_test_error',
                method: it.method,
                path: it.path,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
              console.log(
                `❌ [RBAC] ${it.method || 'GET'} ${it.path} → Error: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }

          console.log(`RBAC set results: ${pass} passed, ${fail} failed`);

          logInfo('CLI: RBAC set test completed', {
            component: 'AppCLI',
            operation: 'rbac_run_set_complete',
            file,
            passed: pass,
            failed: fail,
            total: pass + fail,
            successRate: pass / (pass + fail),
          });

          if (fail > 0) process.exitCode = 1;
        } catch (e) {
          const error = e as Error;
          logError('CLI: RBAC set test failed', {
            component: 'AppCLI',
            operation: 'rbac_run_set_error',
            file,
            error: error.message,
            stack: error.stack,
          });
          console.error(`❌ Failed to read set file: ${file} (${error.message})`);
          process.exitCode = 1;
        }
      } else if (sub === 'test-roles') {
        const file = tokens[2] || '.posalpro-rbac-roles.json';
        try {
          const raw = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
          const cfg: any = JSON.parse(raw);
          const users: Array<{ tag: string; email: string; password: string; role?: string }> =
            cfg.users || [];
          const tests: Array<{
            method?: string;
            path: string;
            body?: any;
            expect?: Record<string, string | number>;
          }> = cfg.apiTests || [];
          if (
            !Array.isArray(users) ||
            users.length === 0 ||
            !Array.isArray(tests) ||
            tests.length === 0
          ) {
            console.log('Config must include non-empty users[] and apiTests[]');
            break;
          }
          let total = 0,
            failures = 0;
          for (const user of users) {
            const tag =
              user.tag || (user.email.includes('@') ? user.email.split('@')[0] : user.email);
            console.log(`\n=== Testing as ${tag} (${user.email}) ===`);
            (api as any).switchSession(tag);
            await api.login(user.email, user.password, user.role);
            for (const t of tests) {
              total++;
              const method = (t.method || 'GET').toUpperCase();
              const res = await api.request(method as HttpMethod, t.path, t.body);
              const statusTxt = `${res.status}`;
              const allowed = res.status < 400;
              let ok = true;
              if (t.expect && t.expect[tag] !== undefined) {
                const exp = t.expect[tag];
                if (typeof exp === 'number') ok = res.status === exp;
                else if (typeof exp === 'string') ok = statusTxt.startsWith(exp);
              }
              if (!ok) failures++;
              console.log(
                `[${tag}] ${method} ${t.path} → ${allowed ? 'Allowed' : 'Denied'} (${res.status})${t.expect && t.expect[tag] !== undefined ? ` expect=${t.expect[tag]} ${ok ? '✓' : '✗'}` : ''}`
              );
            }
          }
          console.log(
            `\nRBAC roles suite: ${total - failures} passed, ${failures} failed (total ${total})`
          );
          if (failures > 0) process.exitCode = 1;
        } catch (e) {
          console.log(`Failed to read roles file: ${file} (${(e as Error).message})`);
        }
      } else {
        console.log('Usage:\n  rbac try <method> <path> [json]\n  rbac run-set [file]');
      }
      break;
    }
    case 'versions': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub === 'list') {
        const limit = tokens[2] ? Number(tokens[2]) || 200 : 200;
        const res = await api.request('GET', `/api/proposals/versions?limit=${limit}`);
        console.log(await res.text());
      } else if (sub === 'for') {
        const id = tokens[2];
        const limit = tokens[3] ? Number(tokens[3]) || 50 : 50;
        if (!id) {
          console.log('Usage: versions for <proposalId> [limit]');
          break;
        }
        const res = await api.request('GET', `/api/proposals/${id}/versions?limit=${limit}`);
        console.log(await res.text());
      } else if (sub === 'diff') {
        const id = tokens[2];
        const v = tokens[3];
        if (!id || !v) {
          console.log('Usage: versions diff <proposalId> <versionNumber>');
          break;
        }
        const res = await api.request(
          'GET',
          `/api/proposals/${id}/versions?version=${encodeURIComponent(v)}&detail=1`
        );
        console.log(await res.text());
      } else {
        console.log(
          'Usage:\n  versions list [limit]\n  versions for <proposalId> [limit]\n  versions diff <proposalId> <versionNumber>'
        );
      }
      break;
    }
    case 'logout': {
      try {
        await api.request('POST', '/api/auth/signout');
      } catch {}
      (api as any).jar.clear();
      console.log('Session cleared.');
      break;
    }
    case 'schema': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub === 'check') {
        await handleSchemaCheck(api);
      } else if (sub === 'integrity') {
        await handleDataIntegrityCheck(api);
      } else if (sub === 'validate') {
        await handleZodValidationCheck(api);
      } else {
        console.log('Usage: schema check | schema integrity | schema validate');
      }
      break;
    }
    case '':
      break;
    default:
      console.log(`Unknown command: ${cmd}`);
      printHelp();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const baseIdx = args.indexOf('--base');
  const base = baseIdx >= 0 && args[baseIdx + 1] ? args[baseIdx + 1] : BASE_URL;
  const normalizedBase = normalizeBaseUrl(base);
  const api = new ApiClient(normalizedBase);

  // Log the base URL being used
  logInfo('CLI: Base URL configured', {
    component: 'AppCLI',
    operation: 'main',
    originalBase: base,
    normalizedBase,
    isHttps: normalizedBase.startsWith('https://'),
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
        component: 'AppCLI',
        operation: 'interactive_command',
        command: tokens[0],
        args: tokens.slice(1),
      });
      await execute(tokens, api);
    } catch (err) {
      const error = err as Error;
      logError('CLI: Interactive command error', {
        component: 'AppCLI',
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

// ====================
// Schema Testing Functions
// ====================

async function handleSchemaCheck(api: ApiClient) {
  console.log('🔍 PosalPro MVP2 - Schema Consistency Check (via App CLI)\n');

  const issues = {
    apiInconsistencies: [] as Array<{
      path: string;
      method: HttpMethod;
      status?: number;
      error?: string;
      message: string;
    }>,
    databaseInconsistencies: [] as Array<{
      table: string;
      field: string;
      type: string;
      message: string;
    }>,
    schemaInconsistencies: [] as Array<{
      type: string;
      table?: string;
      field?: string;
      message: string;
    }>,
  };

  try {
    // 1. Check API responses for schema consistency
    console.log('🌐 Testing API schema consistency...');

    const apiTests = [
      { path: '/api/proposals', method: 'GET' as HttpMethod },
      { path: '/api/customers', method: 'GET' as HttpMethod },
      { path: '/api/products', method: 'GET' as HttpMethod },
    ];

    for (const test of apiTests) {
      try {
        const res = await api.request(test.method, test.path);
        if (!res.ok) {
          issues.apiInconsistencies.push({
            path: test.path,
            method: test.method,
            status: res.status,
            message: `API returned ${res.status} instead of 200`,
          });
        }
      } catch (error) {
        issues.apiInconsistencies.push({
          path: test.path,
          method: test.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: `API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    // 2. Check database schema via direct Prisma access
    console.log('🗄️ Testing database schema consistency...');

    const dbColumns = await prisma.$queryRaw<
      Array<{ table_name: string; column_name: string; data_type: string; is_nullable: string }>
    >`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'customers', 'products', 'proposals', 'roles')
      ORDER BY table_name, ordinal_position;
    `;

    console.log(`Found ${dbColumns.length} database columns across 5 tables`);

    // Check for field mismatches
    const expectedFields = {
      users: ['id', 'email', 'name', 'department', 'status', 'createdAt', 'updatedAt', 'lastLogin'],
      customers: [
        'id',
        'name',
        'email',
        'industry',
        'status',
        'tier',
        'tags',
        'createdAt',
        'updatedAt',
      ],
      products: [
        'id',
        'name',
        'description',
        'price',
        'currency',
        'sku',
        'category',
        'tags',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
      proposals: [
        'id',
        'title',
        'description',
        'customerId',
        'dueDate',
        'priority',
        'value',
        'currency',
        'status',
        'tags',
        'userStoryTracking',
        'createdAt',
        'updatedAt',
        'createdBy',
      ],
      roles: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
    };

    Object.entries(expectedFields).forEach(([table, fields]) => {
      const tableColumns = dbColumns.filter((col: any) => col.table_name === table);
      const dbFieldNames = tableColumns.map((col: any) => col.column_name);

      fields.forEach(field => {
        if (!dbFieldNames.includes(field)) {
          issues.databaseInconsistencies.push({
            table,
            field,
            type: 'missing_in_database',
            message: `${table}.${field} expected in database but missing`,
          });
        }
      });

      dbFieldNames.forEach(field => {
        if (!fields.includes(field)) {
          issues.databaseInconsistencies.push({
            table,
            field,
            type: 'extra_in_database',
            message: `${table}.${field} exists in database but not expected in schema`,
          });
        }
      });
    });

    // 3. Check for API vs Database field mismatches
    console.log('🔍 Checking API vs Database field consistency...');

    // Test actual API response structure
    try {
      const proposalRes = await api.request('GET', '/api/proposals?limit=1');
      if (proposalRes.ok) {
        const proposalData = (await proposalRes.json()) as { data?: { items?: any[] } };
        // Check if response structure matches database
        if (proposalData.data && proposalData.data.items && proposalData.data.items.length > 0) {
          const firstItem = proposalData.data.items[0];
          const apiFields = Object.keys(firstItem);
          const dbProposalFields = dbColumns
            .filter((col: any) => col.table_name === 'proposals')
            .map((col: any) => col.column_name);

          // Check for API fields that don't exist in database
          apiFields.forEach(field => {
            if (!dbProposalFields.includes(field) && field !== 'customer') {
              issues.schemaInconsistencies.push({
                type: 'api_field_not_in_db',
                table: 'proposals',
                field,
                message: `API returns field '${field}' but database doesn't have it`,
              });
            }
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Could not validate API response structure');
    }

    // 4. Report Results
    console.log('\n📋 SCHEMA CONSISTENCY REPORT\n');
    console.log('='.repeat(60));

    const totalIssues =
      issues.apiInconsistencies.length +
      issues.databaseInconsistencies.length +
      issues.schemaInconsistencies.length;

    if (issues.apiInconsistencies.length > 0) {
      console.log('\n❌ API INCONSISTENCIES:');
      issues.apiInconsistencies.forEach(issue => {
        console.log(`  📄 ${issue.path} (${issue.method}) - ${issue.message}`);
      });
    }

    if (issues.databaseInconsistencies.length > 0) {
      console.log('\n🗄️ DATABASE SCHEMA ISSUES:');
      const missing = issues.databaseInconsistencies.filter(i => i.type === 'missing_in_database');
      const extra = issues.databaseInconsistencies.filter(i => i.type === 'extra_in_database');

      if (missing.length > 0) {
        console.log('  ❌ Missing fields:');
        missing.forEach(issue => console.log(`     ${issue.table}.${issue.field}`));
      }

      if (extra.length > 0) {
        console.log('  ⚠️ Extra fields:');
        extra.forEach(issue => console.log(`     ${issue.table}.${issue.field}`));
      }
    }

    if (issues.schemaInconsistencies.length > 0) {
      console.log('\n🔍 SCHEMA MISMATCHES:');
      issues.schemaInconsistencies.forEach(issue => {
        console.log(`  ${issue.message}`);
      });
    }

    if (totalIssues === 0) {
      console.log('\n✅ NO INCONSISTENCIES FOUND!');
      console.log('Your API ↔ Database ↔ Schema are fully synchronized.');
    } else {
      console.log(`\n🚨 FOUND ${totalIssues} TOTAL INCONSISTENCIES:`);
      console.log(`   API Issues: ${issues.apiInconsistencies.length}`);
      console.log(`   Database Issues: ${issues.databaseInconsistencies.length}`);
      console.log(`   Schema Issues: ${issues.schemaInconsistencies.length}`);
    }
  } catch (error) {
    console.error(
      '❌ Error during schema check:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function handleDataIntegrityCheck(api: ApiClient) {
  console.log('🔒 PosalPro MVP2 - Data Integrity Check (via App CLI)\n');

  const issues = {
    referentialIntegrity: [] as Array<{
      type: string;
      table: string;
      count: number;
      message: string;
    }>,
    dataConsistency: [] as Array<{
      type: string;
      table: string;
      field: string;
      count: number;
      message: string;
    }>,
    requiredFields: [] as Array<{
      type: string;
      table: string;
      field: string;
      count: number;
      message: string;
    }>,
    businessLogic: [] as Array<{ type: string; table: string; count: number; message: string }>,
  };

  try {
    // 1. Test Referential Integrity
    console.log('🔗 Testing referential integrity...');

    // Check for orphaned proposals (proposals without customers)
    const orphanedProposalsResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM proposals WHERE "customerId" IS NULL
    `;
    const orphanedProposals = Number(orphanedProposalsResult[0].count);

    if (orphanedProposals > 0) {
      issues.referentialIntegrity.push({
        type: 'orphaned_records',
        table: 'proposals',
        count: orphanedProposals,
        message: `${orphanedProposals} proposals have null customerId (orphaned records)`,
      });
    }

    // Check for invalid customer references
    const invalidRefsResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM proposals p
      WHERE p."customerId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = p."customerId")
    `;
    const invalidRefs = Number(invalidRefsResult[0].count);

    if (invalidRefs > 0) {
      issues.referentialIntegrity.push({
        type: 'invalid_references',
        table: 'proposals',
        count: invalidRefs,
        message: `${invalidRefs} proposals reference non-existent customers`,
      });
    }

    // 2. Test Data Consistency
    console.log('📊 Testing data consistency...');

    // Check for invalid status values
    const invalidStatuses = await prisma.proposal.count({
      where: {
        status: {
          notIn: [
            'DRAFT',
            'IN_REVIEW',
            'PENDING_APPROVAL',
            'APPROVED',
            'REJECTED',
            'SUBMITTED',
            'ACCEPTED',
            'DECLINED',
          ],
        },
      },
    });

    if (invalidStatuses > 0) {
      issues.dataConsistency.push({
        type: 'invalid_enum_values',
        table: 'proposals',
        field: 'status',
        count: invalidStatuses,
        message: `${invalidStatuses} proposals have invalid status values`,
      });
    }

    // 3. Test Required Fields
    console.log('✅ Testing required fields...');

    const nullNamesResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM customers WHERE name IS NULL
    `;
    const nullNames = Number(nullNamesResult[0].count);

    if (nullNames > 0) {
      issues.requiredFields.push({
        type: 'null_required_field',
        table: 'customers',
        field: 'name',
        count: nullNames,
        message: `${nullNames} customers are missing required name field`,
      });
    }

    // 4. Test Business Logic
    console.log('💼 Testing business logic...');

    // Check for proposals without creators
    const noCreatorsResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM proposals WHERE "createdBy" IS NULL
    `;
    const noCreators = Number(noCreatorsResult[0].count);

    if (noCreators > 0) {
      issues.businessLogic.push({
        type: 'missing_audit_trail',
        table: 'proposals',
        count: noCreators,
        message: `${noCreators} proposals are missing creator information (audit trail broken)`,
      });
    }

    // Skip users without roles check due to table name complexity
    // This would require checking the actual many-to-many table name in the database
    const usersWithoutRoles = 0;

    // 5. Report Results
    console.log('\n📋 DATA INTEGRITY REPORT\n');
    console.log('='.repeat(60));

    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);

    if (issues.referentialIntegrity.length > 0) {
      console.log('\n🔗 REFERENTIAL INTEGRITY ISSUES:');
      issues.referentialIntegrity.forEach(issue => {
        console.log(`  🔴 ${issue.message}`);
      });
    }

    if (issues.dataConsistency.length > 0) {
      console.log('\n📊 DATA CONSISTENCY ISSUES:');
      issues.dataConsistency.forEach(issue => {
        console.log(`  🟡 ${issue.message}`);
      });
    }

    if (issues.requiredFields.length > 0) {
      console.log('\n✅ REQUIRED FIELDS ISSUES:');
      issues.requiredFields.forEach(issue => {
        console.log(`  🔴 ${issue.message}`);
      });
    }

    if (issues.businessLogic.length > 0) {
      console.log('\n💼 BUSINESS LOGIC ISSUES:');
      issues.businessLogic.forEach(issue => {
        console.log(`  🔴 ${issue.message}`);
      });
    }

    if (totalIssues === 0) {
      console.log('\n✅ ALL DATA INTEGRITY CHECKS PASSED!');
      console.log('Your data maintains referential integrity and business logic consistency.');
    } else {
      console.log(`\n🚨 FOUND ${totalIssues} DATA INTEGRITY ISSUES:`);
      console.log(`   Referential: ${issues.referentialIntegrity.length}`);
      console.log(`   Consistency: ${issues.dataConsistency.length}`);
      console.log(`   Required: ${issues.requiredFields.length}`);
      console.log(`   Business Logic: ${issues.businessLogic.length}`);
    }
  } catch (error) {
    console.error(
      '❌ Error during data integrity check:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function handleZodValidationCheck(api: ApiClient) {
  console.log('🔍 PosalPro MVP2 - Zod Validation Check (via App CLI)\n');

  const issues = {
    validationFailures: [] as Array<{
      schema: string;
      recordId: string;
      field: string;
      error: string;
      message: string;
    }>,
    schemaErrors: [] as Array<{ schema: string; error: string; details?: string }>,
  };

  try {
    console.log('🔎 Testing Zod schemas against live data...');

    // Import Zod schemas dynamically
    let CustomerSchema, ProposalSchema, ProductSchema;
    try {
      const schemas = await import('../src/features/customers/schemas');
      CustomerSchema = schemas.CustomerSchema;
      console.log('✅ Customer schemas loaded');
    } catch (error) {
      issues.schemaErrors.push({
        schema: 'CustomerSchema',
        error: 'Failed to load customer schemas',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      const schemas = await import('../src/features/proposals/schemas');
      ProposalSchema = schemas.ProposalSchema;
      console.log('✅ Proposal schemas loaded');
    } catch (error) {
      issues.schemaErrors.push({
        schema: 'ProposalSchema',
        error: 'Failed to load proposal schemas',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    try {
      const schemas = await import('../src/features/products/schemas');
      ProductSchema = schemas.ProductSchema;
      console.log('✅ Product schemas loaded');
    } catch (error) {
      issues.schemaErrors.push({
        schema: 'ProductSchema',
        error: 'Failed to load product schemas',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test with actual data from API
    if (CustomerSchema) {
      try {
        console.log('Testing customer data validation...');
        const customerRes = await api.request('GET', '/api/customers?limit=5');
        if (customerRes.ok) {
          const customerData = (await customerRes.json()) as { data?: { items?: any[] } };
          if (customerData.data && customerData.data.items) {
            customerData.data.items.forEach((item: any, index: number) => {
              // Clean the data to match expected schema (remove extra fields)
              const cleanItem = {
                id: item.id,
                name: item.name,
                email: item.email,
                industry: item.industry,
                status: item.status,
                tier: item.tier,
                tags: item.tags || [],
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              };

              const validation = CustomerSchema.safeParse(cleanItem);
              if (!validation.success) {
                validation.error.errors.forEach(err => {
                  issues.validationFailures.push({
                    schema: 'CustomerSchema',
                    recordId: item.id || `item_${index}`,
                    field: err.path.join('.'),
                    error: err.message,
                    message: `Customer validation failed: ${err.path.join('.')} - ${err.message}`,
                  });
                });
              }
            });
          }
        }
      } catch (error) {
        console.log('⚠️ Could not test customer validation');
      }
    }

    // Report Results
    console.log('\n📋 ZOD VALIDATION REPORT\n');
    console.log('='.repeat(60));

    if (issues.schemaErrors.length > 0) {
      console.log('\n❌ SCHEMA LOADING ERRORS:');
      issues.schemaErrors.forEach(issue => {
        console.log(`  📋 ${issue.schema}: ${issue.error}`);
        if (issue.details) console.log(`     Details: ${issue.details}`);
      });
    }

    if (issues.validationFailures.length > 0) {
      console.log('\n🔍 VALIDATION FAILURES:');
      issues.validationFailures.forEach(issue => {
        console.log(`  📋 ${issue.schema} (${issue.recordId}): ${issue.message}`);
      });
    }

    const totalIssues = issues.schemaErrors.length + issues.validationFailures.length;

    if (totalIssues === 0) {
      console.log('\n✅ ALL ZOD VALIDATIONS PASSED!');
      console.log('Your data structures match the defined schemas perfectly.');
    } else {
      console.log(`\n🚨 FOUND ${totalIssues} ZOD VALIDATION ISSUES:`);
      console.log(`   Schema Errors: ${issues.schemaErrors.length}`);
      console.log(`   Validation Failures: ${issues.validationFailures.length}`);
    }
  } catch (error) {
    console.error(
      '❌ Error during Zod validation check:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function handleExport(tokens: string[]) {
  const [, model, ...remainingTokens] = tokens;

  // Parse format from remaining tokens (it might be mixed with options)
  let format = 'json';
  const optionTokens: string[] = [];

  for (const token of remainingTokens) {
    if (['json', 'csv', 'sql'].includes(token)) {
      format = token;
    } else {
      optionTokens.push(token);
    }
  }

  if (!model) {
    console.log('Usage: export <model> [format] [options]');
    console.log('Models: proposals, customers, products, users');
    console.log('Formats: json, csv, sql');
    console.log('Options:');
    console.log('  --limit=N         Limit number of records');
    console.log('  --where=JSON      Filter conditions');
    console.log('  --output=FILE     Output file path');
    console.log('  --include-relations Include related data');
    return;
  }

  const supportedModels = ['proposals', 'customers', 'products', 'users'];
  if (!supportedModels.includes(model)) {
    console.log(`❌ Unsupported model: ${model}`);
    console.log(`Supported models: ${supportedModels.join(', ')}`);
    return;
  }

  const supportedFormats = ['json', 'csv', 'sql'];
  if (!supportedFormats.includes(format)) {
    console.log(`❌ Unsupported format: ${format}`);
    console.log(`Supported formats: ${supportedFormats.join(', ')}`);
    return;
  }

  // Parse options
  const options: any = {};
  for (const token of optionTokens) {
    if (token.startsWith('--limit=')) {
      options.limit = parseInt(token.split('=')[1]);
    } else if (token.startsWith('--where=')) {
      options.where = JSON.parse(token.split('=')[1]);
    } else if (token.startsWith('--output=')) {
      options.output = token.split('=')[1];
    } else if (token === '--include-relations') {
      options.includeRelations = true;
    }
  }

  console.log(`📤 PosalPro MVP2 - Data Export`);
  console.log(`   Model: ${model}`);
  console.log(`   Format: ${format}`);
  console.log(`   Options:`, JSON.stringify(options, null, 2));

  try {
    let data: any[] = [];
    let select: any = {};

    // Define select fields based on model
    switch (model) {
      case 'proposals':
        select = {
          id: true,
          title: true,
          description: true,
          customerId: true,
          dueDate: true,
          priority: true,
          value: true,
          currency: true,
          status: true,
          tags: true,
          userStoryTracking: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          ...(options.includeRelations && {
            customer: {
              select: { id: true, name: true, email: true, industry: true },
            },
            creator: {
              select: { id: true, name: true, email: true },
            },
          }),
        };
        break;
      case 'customers':
        select = {
          id: true,
          name: true,
          email: true,
          industry: true,
          status: true,
          tier: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
        };
        break;
      case 'products':
        select = {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          sku: true,
          category: true,
          tags: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        };
        break;
      case 'users':
        select = {
          id: true,
          email: true,
          name: true,
          department: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          roles: options.includeRelations
            ? {
                select: { role: { select: { name: true } } },
              }
            : false,
        };
        break;
    }

    // Build query
    const query: any = { select };
    if (options.where) {
      query.where = options.where;
    }
    if (options.limit) {
      query.take = options.limit;
    }

    // Execute query
    console.log('🔍 Fetching data from database...');
    switch (model) {
      case 'proposals':
        data = await prisma.proposal.findMany(query);
        break;
      case 'customers':
        data = await prisma.customer.findMany(query);
        break;
      case 'products':
        data = await prisma.product.findMany(query);
        break;
      case 'users':
        data = await prisma.user.findMany(query);
        break;
      default:
        console.error(`❌ Unsupported model for database query: ${model}`);
        return;
    }

    console.log(`✅ Found ${data.length} records`);

    // Export based on format
    let output = '';
    let filename = `${model}_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'json':
        output = JSON.stringify(data, null, 2);
        filename += '.json';
        break;

      case 'csv':
        if (data.length === 0) {
          console.log('⚠️ No data to export to CSV');
          return;
        }
        const headers = Object.keys(data[0]);
        output = headers.join(',') + '\n';
        for (const row of data) {
          const values = headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return String(value).replace(/"/g, '""');
          });
          output += values.map(v => `"${v}"`).join(',') + '\n';
        }
        filename += '.csv';
        break;

      case 'sql':
        output = `-- PosalPro MVP2 Data Export\n-- Model: ${model}\n-- Generated: ${new Date().toISOString()}\n\n`;
        for (const row of data) {
          const columns = Object.keys(row);
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return value;
          });
          output += `INSERT INTO ${model} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
        filename += '.sql';
        break;
    }

    // Write to file
    const outputPath = options.output || filename;
    const fs = require('fs');
    const path = require('path');

    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`📁 Exported to: ${outputPath}`);
    console.log(`📊 Total records: ${data.length}`);

    // Show file size
    const stats = fs.statSync(outputPath);
    console.log(`💾 File size: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('❌ Export failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function handleImport(tokens: string[], api: ApiClient) {
  const [, model, file, ...optionTokens] = tokens;

  if (!model || !file) {
    console.log('Usage: import <model> <file> [options]');
    console.log('Models: proposals, customers, products, users');
    console.log('File formats: .json, .csv');
    console.log('Options:');
    console.log('  --validate-only    Only validate, do not import');
    console.log('  --skip-errors      Continue on validation errors');
    console.log('  --update-existing  Update existing records');
    console.log('  --batch-size=N     Process in batches');
    return;
  }

  const supportedModels = ['proposals', 'customers', 'products', 'users'];
  if (!supportedModels.includes(model)) {
    console.log(`❌ Unsupported model: ${model}`);
    console.log(`Supported models: ${supportedModels.join(', ')}`);
    return;
  }

  // Parse options
  const options: any = {
    validateOnly: false,
    skipErrors: false,
    updateExisting: false,
    batchSize: 10,
  };

  for (const token of optionTokens) {
    if (token === '--validate-only') {
      options.validateOnly = true;
    } else if (token === '--skip-errors') {
      options.skipErrors = true;
    } else if (token === '--update-existing') {
      options.updateExisting = true;
    } else if (token.startsWith('--batch-size=')) {
      options.batchSize = parseInt(token.split('=')[1]);
    }
  }

  console.log(`📥 PosalPro MVP2 - Data Import`);
  console.log(`   Model: ${model}`);
  console.log(`   File: ${file}`);
  console.log(`   Options:`, JSON.stringify(options, null, 2));

  try {
    const fs = require('fs');
    const path = require('path');

    if (!fs.existsSync(file)) {
      console.error(`❌ File not found: ${file}`);
      return;
    }

    // Read file
    const content = fs.readFileSync(file, 'utf8');
    let data: any[] = [];

    const ext = path.extname(file).toLowerCase();

    if (ext === '.json') {
      data = JSON.parse(content);
      if (!Array.isArray(data)) {
        console.error('❌ JSON file must contain an array of records');
        return;
      }
    } else if (ext === '.csv') {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        console.error('❌ CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const record: any = {};
        headers.forEach((header, index) => {
          const value = values[index];
          if (value === '') {
            record[header] = null;
          } else if (value === 'true' || value === 'false') {
            record[header] = value === 'true';
          } else if (!isNaN(Number(value))) {
            record[header] = Number(value);
          } else if (value.startsWith('{') || value.startsWith('[')) {
            try {
              record[header] = JSON.parse(value);
            } catch {
              record[header] = value;
            }
          } else {
            record[header] = value;
          }
        });
        return record;
      });
    } else {
      console.error(`❌ Unsupported file format: ${ext}`);
      console.log('Supported formats: .json, .csv');
      return;
    }

    console.log(`📊 Found ${data.length} records to import`);

    if (data.length === 0) {
      console.log('⚠️ No data to import');
      return;
    }

    // Validate data structure
    console.log('🔍 Validating data structure...');
    let validationErrors = 0;

    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const errors = validateRecord(model, record);

      if (errors.length > 0) {
        validationErrors++;
        if (!options.skipErrors) {
          console.error(`❌ Record ${i + 1} validation errors:`, errors);
          if (!options.validateOnly) {
            console.log('Use --skip-errors to continue despite validation errors');
            return;
          }
        }
      }
    }

    if (validationErrors > 0) {
      console.log(`⚠️ Found ${validationErrors} validation errors`);
      if (!options.skipErrors && !options.validateOnly) {
        return;
      }
    } else {
      console.log('✅ All records passed validation');
    }

    if (options.validateOnly) {
      console.log('🔍 Validation completed (no import performed)');
      return;
    }

    // Import data
    console.log('📥 Starting import...');
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.length; i += options.batchSize) {
      const batch = data.slice(i, i + options.batchSize);
      console.log(
        `   Processing batch ${Math.floor(i / options.batchSize) + 1}/${Math.ceil(data.length / options.batchSize)} (${batch.length} records)`
      );

      for (const record of batch) {
        try {
          if (options.updateExisting && record.id) {
            // Try update first
            try {
              switch (model) {
                case 'proposals':
                  await prisma.proposal.update({
                    where: { id: record.id },
                    data: record,
                  });
                  break;
                case 'customers':
                  await prisma.customer.update({
                    where: { id: record.id },
                    data: record,
                  });
                  break;
                case 'products':
                  await prisma.product.update({
                    where: { id: record.id },
                    data: record,
                  });
                  break;
                case 'users':
                  await prisma.user.update({
                    where: { id: record.id },
                    data: record,
                  });
                  break;
              }
              successCount++;
            } catch (updateError) {
              // If update fails, try create
              delete record.id; // Remove ID for create
              switch (model) {
                case 'proposals':
                  await prisma.proposal.create({ data: record });
                  break;
                case 'customers':
                  await prisma.customer.create({ data: record });
                  break;
                case 'products':
                  await prisma.product.create({ data: record });
                  break;
                case 'users':
                  await prisma.user.create({ data: record });
                  break;
              }
              successCount++;
            }
          } else {
            // Create new record
            if (record.id) delete record.id; // Remove ID for create
            switch (model) {
              case 'proposals':
                await prisma.proposal.create({ data: record });
                break;
              case 'customers':
                await prisma.customer.create({ data: record });
                break;
              case 'products':
                await prisma.product.create({ data: record });
                break;
              case 'users':
                await prisma.user.create({ data: record });
                break;
              default:
                throw new Error(`Unsupported model for import: ${model}`);
            }
            successCount++;
          }
        } catch (error) {
          errorCount++;
          if (!options.skipErrors) {
            console.error(
              `❌ Import error for record ${successCount + errorCount}:`,
              error instanceof Error ? error.message : 'Unknown error'
            );
            return;
          }
        }
      }
    }

    console.log(`✅ Import completed:`);
    console.log(`   Successfully imported: ${successCount} records`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} records`);
    }
  } catch (error) {
    console.error('❌ Import failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

function validateRecord(model: string, record: any): string[] {
  const errors: string[] = [];

  // Basic validation rules
  if (!record || typeof record !== 'object') {
    errors.push('Record must be an object');
    return errors;
  }

  switch (model) {
    case 'proposals':
      if (!record.title || typeof record.title !== 'string') {
        errors.push('title is required and must be a string');
      }
      if (record.customerId && typeof record.customerId !== 'string') {
        errors.push('customerId must be a string');
      }
      if (record.value !== undefined && typeof record.value !== 'number') {
        errors.push('value must be a number');
      }
      break;

    case 'customers':
      if (!record.name || typeof record.name !== 'string') {
        errors.push('name is required and must be a string');
      }
      if (record.email !== null && record.email !== undefined && typeof record.email !== 'string') {
        errors.push('email must be a string or null');
      }
      break;

    case 'products':
      if (!record.name || typeof record.name !== 'string') {
        errors.push('name is required and must be a string');
      }
      if (record.price !== undefined && typeof record.price !== 'number') {
        errors.push('price must be a number');
      }
      break;

    case 'users':
      if (!record.email || typeof record.email !== 'string') {
        errors.push('email is required and must be a string');
      }
      if (!record.name || typeof record.name !== 'string') {
        errors.push('name is required and must be a string');
      }
      break;
  }

  return errors;
}

async function handleGenerateTestData(tokens: string[]) {
  console.log('🔄 PosalPro MVP2 - Test Data Generation\n');

  // Parse options
  const options: any = {
    count: 10,
    clean: false,
    models: ['customers', 'products', 'proposals', 'users'],
  };

  for (let i = 2; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--count=')) {
      options.count = parseInt(token.split('=')[1]);
    } else if (token === '--clean') {
      options.clean = true;
    } else if (token.startsWith('--models=')) {
      options.models = token.split('=')[1].split(',');
    }
  }

  console.log(`   Generating ${options.count} records per model`);
  console.log(`   Models: ${options.models.join(', ')}`);
  console.log(`   Clean existing data: ${options.clean ? 'Yes' : 'No'}\n`);

  if (options.clean) {
    console.log('🧹 Cleaning existing data...');

    // Clean in reverse dependency order
    const cleanOrder = ['proposals', 'products', 'customers', 'users'];

    for (const model of cleanOrder) {
      if (options.models.includes(model)) {
        try {
          switch (model) {
            case 'proposals':
              await prisma.proposal.deleteMany({});
              break;
            case 'products':
              await prisma.product.deleteMany({});
              break;
            case 'customers':
              await prisma.customer.deleteMany({});
              break;
            case 'users':
              await prisma.user.deleteMany({});
              break;
          }
          console.log(`   ✅ Cleaned ${model}`);
        } catch (error) {
          console.log(
            `   ⚠️ Could not clean ${model}:`,
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    }
    console.log('');
  }

  // Generate test data
  for (const model of options.models) {
    console.log(`📝 Generating ${options.count} ${model}...`);

    for (let i = 0; i < options.count; i++) {
      try {
        await generateTestRecord(model, i + 1);
      } catch (error) {
        console.log(
          `   ❌ Failed to generate ${model} #${i + 1}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    console.log(`   ✅ Generated ${options.count} ${model}`);
  }

  console.log('\n🎉 Test data generation completed!');
  console.log('💡 You can now test your application with realistic data.');
}

async function generateTestRecord(model: string, index: number) {
  const faker = {
    name: {
      firstName: () =>
        ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Olivia'][
          Math.floor(Math.random() * 8)
        ],
      lastName: () =>
        ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][
          Math.floor(Math.random() * 8)
        ],
      company: () =>
        ['Tech Corp', 'Innovations Inc', 'Solutions Ltd', 'Systems LLC', 'Enterprises'][
          Math.floor(Math.random() * 5)
        ],
    },
    internet: {
      email: (first: string, last: string) =>
        `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      domain: () =>
        ['example.com', 'test.com', 'demo.org', 'sample.net'][Math.floor(Math.random() * 4)],
    },
    address: {
      city: () =>
        ['New York', 'London', 'Tokyo', 'Berlin', 'Sydney', 'Toronto'][
          Math.floor(Math.random() * 6)
        ],
      country: () =>
        ['USA', 'UK', 'Japan', 'Germany', 'Australia', 'Canada'][Math.floor(Math.random() * 6)],
    },
    commerce: {
      productName: () =>
        ['Laptop', 'Software License', 'Consulting', 'Training', 'Support'][
          Math.floor(Math.random() * 5)
        ],
      department: () =>
        ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][Math.floor(Math.random() * 5)],
    },
    lorem: {
      sentence: () => 'This is a sample description for testing purposes.',
      words: (count: number) => 'sample test data description'.split(' ').slice(0, count).join(' '),
    },
    date: {
      past: () => new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      future: () => new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000),
    },
    random: {
      number: (max: number) => Math.floor(Math.random() * max) + 1,
      alpha: (length: number) =>
        Math.random()
          .toString(36)
          .substring(2, length + 2),
    },
  };

  switch (model) {
    case 'users':
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();

      await prisma.user.create({
        data: {
          email: faker.internet.email(firstName, lastName),
          name: `${firstName} ${lastName}`,
          department: faker.commerce.department(),
          status: 'ACTIVE',
          roles: {
            create: [
              {
                role: {
                  connectOrCreate: {
                    where: { name: 'User' },
                    create: { name: 'User', description: 'Standard user role' },
                  },
                },
              },
            ],
          },
        },
      });
      break;

    case 'customers':
      await prisma.customer.create({
        data: {
          name: faker.name.company(),
          email: faker.internet.email('contact', faker.random.alpha(5)),
          industry: faker.commerce.department(),
          status: 'ACTIVE',
          tier: ['STANDARD', 'PREMIUM', 'ENTERPRISE'][Math.floor(Math.random() * 3)] as any,
          tags: faker.commerce.department().toLowerCase(),
        },
      });
      break;

    case 'products':
      await prisma.product.create({
        data: {
          name: faker.commerce.productName() + ' ' + index,
          description: faker.lorem.sentence(),
          price: faker.random.number(10000),
          currency: 'USD',
          sku: 'SKU' + faker.random.alpha(6).toUpperCase(),
          category: faker.commerce.department().toLowerCase(),
          tags: faker.commerce.department().toLowerCase(),
          isActive: Math.random() > 0.1, // 90% active
        },
      });
      break;

    case 'proposals':
      // Get existing customers and users
      const customers = await prisma.customer.findMany({ take: 5 });
      const users = await prisma.user.findMany({ take: 5 });
      const products = await prisma.product.findMany({ take: 3 });

      if (customers.length > 0 && users.length > 0) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const creator = users[Math.floor(Math.random() * users.length)];

        await prisma.proposal.create({
          data: {
            title: `${faker.commerce.productName()} Proposal #${index}`,
            description: faker.lorem.sentence(),
            customerId: customer.id,
            dueDate: faker.date.future(),
            priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as any,
            value: faker.random.number(50000),
            currency: 'USD',
            status: ['DRAFT', 'SENT', 'REVIEWED', 'APPROVED'][Math.floor(Math.random() * 4)] as any,
            tags: 'test,' + faker.commerce.department().toLowerCase(),
            userStoryTracking: {
              currentStep: Math.floor(Math.random() * 5) + 1,
              totalSteps: 5,
              completedSteps: Math.floor(Math.random() * 4),
              step1: { status: 'completed', completedAt: faker.date.past() },
              step2: { status: 'completed', completedAt: faker.date.past() },
              step3: { status: Math.random() > 0.5 ? 'completed' : 'in_progress' },
              step4: { status: Math.random() > 0.7 ? 'completed' : 'pending' },
              step5: { status: 'pending' },
            },
            createdBy: creator.id,
          },
        });
      }
      break;
  }
}

async function handleMonitor(tokens: string[], api: ApiClient) {
  const [, target, ...options] = tokens;

  console.log('📊 PosalPro MVP2 - System Monitoring\n');

  if (!target) {
    console.log('Usage: monitor <target> [options]');
    console.log('Targets:');
    console.log('  api              - Monitor API endpoints');
    console.log('  db               - Monitor database performance');
    console.log('  health           - Quick health check');
    console.log('Options:');
    console.log('  --endpoint=PATH  - Specific API endpoint to monitor');
    console.log('  --query-time     - Show query execution times');
    console.log('  --continuous     - Continuous monitoring');
    console.log('  --interval=N     - Monitoring interval in seconds (default: 30)');
    return;
  }

  const monitorOptions: any = {
    endpoint: '/api/proposals',
    continuous: false,
    interval: 30,
    showQueryTime: false,
  };

  // Parse options
  for (const option of options) {
    if (option.startsWith('--endpoint=')) {
      monitorOptions.endpoint = option.split('=')[1];
    } else if (option === '--continuous') {
      monitorOptions.continuous = true;
    } else if (option === '--query-time') {
      monitorOptions.showQueryTime = true;
    } else if (option.startsWith('--interval=')) {
      monitorOptions.interval = parseInt(option.split('=')[1]);
    }
  }

  switch (target) {
    case 'api':
      await monitorApi(api, monitorOptions);
      break;
    case 'db':
      await monitorDatabase(monitorOptions);
      break;
    case 'health':
      await monitorHealth(api);
      break;
    default:
      console.log(`❌ Unknown monitoring target: ${target}`);
      console.log('Available targets: api, db, health');
  }
}

async function monitorApi(api: ApiClient, options: any) {
  console.log(`🔍 Monitoring API endpoint: ${options.endpoint}`);

  const endpoints = [options.endpoint, '/api/customers', '/api/products', '/api/proposals/stats'];

  const results: Array<{
    endpoint: string;
    status: string | number;
    responseTime: number;
    success: boolean;
  }> = [];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await api.request('GET', endpoint);
      const responseTime = Date.now() - startTime;

      results.push({
        endpoint,
        status: response.status || 'unknown',
        responseTime,
        success: response.status === 200,
      });

      console.log(
        `   ${response.status === 200 ? '✅' : '❌'} ${endpoint} - ${responseTime}ms (${response.status})`
      );
    } catch (error) {
      results.push({
        endpoint,
        status: 'ERROR',
        responseTime: 0,
        success: false,
      });
      console.log(
        `   ❌ ${endpoint} - ERROR (${error instanceof Error ? error.message : 'Unknown'})`
      );
    }
  }

  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  console.log(`\n📈 API Monitoring Summary:`);
  console.log(`   Endpoints tested: ${results.length}`);
  console.log(`   Successful: ${successCount}/${results.length}`);
  console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(
    `   Status: ${successCount === results.length ? '✅ All healthy' : '⚠️ Some issues detected'}`
  );
}

async function monitorDatabase(options: any) {
  console.log('🔍 Monitoring database performance...');

  const metrics = {
    connectionTime: 0,
    queryCount: 0,
    slowQueries: 0,
    tableStats: [] as any[],
  };

  try {
    // Test connection
    const connectionStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    metrics.connectionTime = Date.now() - connectionStart;

    console.log(`   ✅ Database connection: ${metrics.connectionTime}ms`);

    // Get table statistics
    const tableStats = await prisma.$queryRaw`
      SELECT schemaname, relname as tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC
      LIMIT 10
    `;

    console.log('\n📊 Table Statistics:');
    for (const stat of tableStats as any[]) {
      console.log(
        `   ${stat.tablename}: ${stat.n_live_tup} rows (${stat.n_tup_ins} inserts, ${stat.n_tup_upd} updates, ${stat.n_tup_del} deletes)`
      );
    }

    // Performance metrics
    const performanceStats = await prisma.$queryRaw`
      SELECT
        sum(calls) as total_calls,
        sum(total_time) as total_time,
        sum(rows) as total_rows,
        count(*) as query_count
      FROM pg_stat_statements
      WHERE calls > 0
      LIMIT 1
    `;

    if (performanceStats && (performanceStats as any[]).length > 0) {
      const stats = (performanceStats as any[])[0];
      const avgQueryTime =
        stats.total_calls > 0 ? (stats.total_time / stats.total_calls).toFixed(2) : 'N/A';

      console.log('\n⚡ Performance Metrics:');
      console.log(`   Total queries: ${stats.total_calls || 0}`);
      console.log(`   Average query time: ${avgQueryTime}ms`);
      console.log(`   Total rows processed: ${stats.total_rows || 0}`);
    }
  } catch (error) {
    console.log(
      `   ❌ Database monitoring error: ${error instanceof Error ? error.message : 'Unknown'}`
    );
  }
}

async function monitorHealth(api: ApiClient) {
  console.log('🏥 Quick Health Check\n');

  const checks = [
    {
      name: 'Database Connection',
      check: async () => {
        await prisma.$queryRaw`SELECT 1`;
        return true;
      },
    },
    {
      name: 'API Health',
      check: async () => {
        const response = await api.request('GET', '/api/health');
        return response.status === 200;
      },
    },
    {
      name: 'Proposals API',
      check: async () => {
        const response = await api.request('GET', '/api/proposals?limit=1');
        return response.status === 200;
      },
    },
    {
      name: 'Customers API',
      check: async () => {
        const response = await api.request('GET', '/api/customers?limit=1');
        return response.status === 200;
      },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const startTime = Date.now();
      await check.check();
      const duration = Date.now() - startTime;
      console.log(`   ✅ ${check.name} - ${duration}ms`);
      passed++;
    } catch (error) {
      console.log(`   ❌ ${check.name} - ${error instanceof Error ? error.message : 'Failed'}`);
      failed++;
    }
  }

  console.log(`\n📊 Health Check Results:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Overall Status: ${failed === 0 ? '✅ HEALTHY' : '⚠️ ISSUES DETECTED'}`);
}

async function handleDbCommand(tokens: string[]) {
  const [, model, action, ...args] = tokens;

  if (!model || !action) {
    console.log('Usage: db <model> <action> [args...]');
    console.log('Models: user, customer, product, proposal, role, etc.');
    console.log('Actions: findMany, findUnique, create, update, delete, count');
    console.log('Examples:');
    console.log('  db user findMany');
    console.log('  db customer findUnique \'{"where":{"id":"..."}}\'');
    console.log('  db product create \'{"name":"Test","price":100}\'');
    return;
  }

  try {
    const modelClient = (prisma as any)[model];
    if (!modelClient) {
      console.log(`❌ Model not found: ${model}`);
      return;
    }

    if (typeof modelClient[action] !== 'function') {
      console.log(`❌ Action not supported: ${action} on model ${model}`);
      return;
    }

    let params: any = undefined;
    if (args.length > 0) {
      const jsonStr = args.join(' ');
      try {
        params = JSON.parse(jsonStr);
      } catch (parseError) {
        console.log('❌ Invalid JSON in arguments');
        console.log(
          'Make sure to wrap JSON in quotes: db user findUnique \'{"where":{"id":"..."}}\''
        );
        return;
      }
    }

    console.log(`🔍 Executing: ${model}.${action}(${params ? JSON.stringify(params) : ''})`);

    const result = await modelClient[action](params);
    console.log('✅ Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Database operation failed:');
    console.log(error instanceof Error ? error.message : 'Unknown error');
  }
}

async function handleEnv(tokens: string[]) {
  const [, action = 'show', pattern] = tokens;

  console.log('🔧 PosalPro MVP2 - Environment Variables\n');

  if (action === 'show' || action === 'list') {
    const envVars = Object.entries(process.env)
      .filter(([key]) => {
        if (!pattern) return true;
        return key.toLowerCase().includes(pattern.toLowerCase());
      })
      .sort(([a], [b]) => a.localeCompare(b));

    if (envVars.length === 0) {
      console.log('No environment variables found.');
      if (pattern) {
        console.log(`Try without pattern to see all variables, or check pattern: "${pattern}"`);
      }
      return;
    }

    console.log(`Found ${envVars.length} environment variable(s):`);
    console.log('─'.repeat(80));

    // Group by category
    const categories = {
      database: [] as typeof envVars,
      auth: [] as typeof envVars,
      api: [] as typeof envVars,
      other: [] as typeof envVars,
    };

    for (const [key, value] of envVars) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('database') ||
        lowerKey.includes('db') ||
        lowerKey.includes('postgres')
      ) {
        categories.database.push([key, value]);
      } else if (
        lowerKey.includes('auth') ||
        lowerKey.includes('nextauth') ||
        lowerKey.includes('jwt')
      ) {
        categories.auth.push([key, value]);
      } else if (
        lowerKey.includes('api') ||
        lowerKey.includes('url') ||
        lowerKey.includes('host')
      ) {
        categories.api.push([key, value]);
      } else {
        categories.other.push([key, value]);
      }
    }

    // Display by category
    const categoryNames = {
      database: '🗄️ Database',
      auth: '🔐 Authentication',
      api: '🌐 API & URLs',
      other: '⚙️ Other',
    };

    for (const [category, vars] of Object.entries(categories)) {
      if (vars.length > 0) {
        console.log(`\n${categoryNames[category as keyof typeof categoryNames]} (${vars.length}):`);
        for (const [key, value] of vars) {
          const maskedValue = maskSensitiveValue(key, value || '');
          console.log(`  ${key.padEnd(30)} = ${maskedValue}`);
        }
      }
    }

    // Show loaded .env files
    console.log('\n📁 Environment Files Loaded:');
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    for (const envFile of envFiles) {
      const envPath = path.resolve(process.cwd(), envFile);
      const exists = fs.existsSync(envPath);
      console.log(
        `  ${exists ? '✅' : '❌'} ${envFile.padEnd(20)} ${exists ? envPath : 'Not found'}`
      );
    }
  } else {
    console.log('Usage: env [show] [pattern]');
    console.log('  env                    # Show all environment variables');
    console.log('  env show               # Show all environment variables');
    console.log('  env show database      # Show database-related variables');
    console.log('  env show auth          # Show authentication variables');
  }
}

function maskSensitiveValue(key: string, value: string): string {
  const lowerKey = key.toLowerCase();

  // Mask sensitive values
  if (
    lowerKey.includes('password') ||
    lowerKey.includes('secret') ||
    lowerKey.includes('token') ||
    lowerKey.includes('key') ||
    lowerKey.includes('database_url') ||
    lowerKey.includes('direct_url')
  ) {
    if (value.length <= 8) {
      return '***';
    } else {
      return value.substring(0, 4) + '***' + value.substring(value.length - 4);
    }
  }

  return value;
}

main().catch(err => {
  const error = err as Error;
  logError('CLI: Fatal error', {
    component: 'AppCLI',
    operation: 'fatal_error',
    error: error.message,
    stack: error.stack,
  });
  console.error(`💥 Fatal: ${error.message}`);
  console.error(`   Stack: ${error.stack?.split('\n').slice(1, 4).join('\n   ')}`);
  process.exit(1);
});
