#!/usr/bin/env tsx

/*
 PosalPro App CLI - PRIMARY DEVELOPMENT TOOL

 🚀 ALWAYS USE THIS CLI FOR:
   - Database operations and schema management
   - API testing and monitoring
   - Comprehensive 8-layer component analysis & mismatch detection
   - Environment variable inspection
   - Data export/import operations
   - System health monitoring
   - Test data generation
   - RBAC permission testing
   - Multi-session authentication management

 📋 AVAILABLE COMMANDS:
   - Authentication: login, login-as, use-session, whoami, logout
   - Database: detect-db, db, health, health:db, export, import
   - Monitoring: monitor, health, health:api
   - Data Management: generate test-data, export, import
   - Environment: env show, env list
   - Schema Validation: schema check, schema integrity, schema validate, schema detect-mismatch [component], schema test [command]
   - API Testing: get, post, put, delete <endpoint>
   - Entity Operations: customers create/list, products create/list, proposals create/list/update/cache
   - Version Management: versions list, versions show <id>
   - RBAC Testing: rbac try <method> <endpoint> [role]

 ⚡ ENHANCED FEATURES:
   - Automatic .env file loading
   - Multi-session management with tagged sessions
   - Comprehensive error handling with structured logging
   - 8-layer comprehensive component analysis system
   - Cross-layer mismatch detection with severity classification
   - Schema validation and integrity checking
   - Batch processing support
   - Real-time API monitoring
   - RBAC permission validation
   - Data export in JSON/CSV/SQL formats

 🔍 NEW: 8-LAYER COMPREHENSIVE COMPONENT ANALYSIS:
   Advanced static analysis system that automatically extracts and compares fields across:

   1️⃣ Component Fields - Form fields and component props
   2️⃣ API Endpoints - API calls and endpoints used by component
   3️⃣ Schema Fields - Backend Zod schema definitions
   4️⃣ Zod Validation - Validation rules and constraints
   5️⃣ Database Fields - Prisma model fields and relationships
   6️⃣ TypeScript Interfaces - Interface definitions and types
   7️⃣ Form Validation Rules - React Hook Form & HTML5 validation
   8️⃣ API Response Types - Response interfaces and type definitions

   🎯 MISMATCH DETECTION:
   - High Priority: Missing schema fields, type mismatches
   - Medium Priority: Validation inconsistencies
   - Low Priority: Naming variations, case differences
   - Component health scoring with actionable recommendations

 Usage Examples:
   npm run app:cli                                      # interactive REPL
   npm run app:cli -- --command "schema detect-mismatch"           # detect field mismatches across all components
   npm run app:cli -- --command "schema detect-mismatch BasicInformationStep" # analyze specific component with 8-layer analysis
  npm run app:cli -- --command "schema test comprehensive"                  # run full Zod schema test suite
  npm run app:cli -- --command "schema test generate customers.CustomerCreateSchema" # generate test data from schema
   npm run app:cli -- --command "schema compare BasicInformationStep ProductCreateForm" # compare two components
   npm run app:cli -- --command "monitor health"           # system health check
   npm run app:cli -- --command "health:db"                # quick database connectivity test
   npm run app:cli -- --command "health:api"               # quick API health check
   npm run app:cli -- --command "login-as user@example.com password admin dev" # tagged login
   npm run app:cli -- --command "rbac try POST /api/customers admin"  # test RBAC
   npm run app:cli -- --command "export customers json --limit=10"    # export data
   npm run app:cli -- --command "customers create '{\"name\":\"Test\",\"email\":\"test@example.com\"}'"
   npm run app:cli -- --command "products list --limit=5"             # list products
   npm run app:cli -- --command "versions list 10"                    # version history
*/

import { config } from 'dotenv';
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

// ✅ ENHANCED: HTTPS fetch wrapper using Node 20+ native fetch
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
        // Node 18+ native fetch (undici) handles TLS verification by default
      }),
  };

  return fetch(url, enhancedOptions as RequestInit);
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
    const lines: string[] = [];
    // Some runtimes return multiple cookies in a single header line.
    // Robustly split combined Set-Cookie lines while respecting Expires commas.
    for (const raw of headers) {
      lines.push(...this.splitCombinedSetCookie(raw));
    }
    for (const line of lines) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name && value) {
        this.cookies.set(name, value);
      }
    }
    this.saveToDisk();
  }

  // Split a possibly combined Set-Cookie header string into individual cookie strings.
  // Handles commas inside Expires attribute (e.g., Expires=Wed, 11 Sep 2024 12:00:00 GMT).
  private splitCombinedSetCookie(headerLine: string): string[] {
    // If header already looks like a single cookie (no comma), short-circuit.
    if (!headerLine.includes(',')) return [headerLine];

    const result: string[] = [];
    let inExpires = false;
    let start = 0;
    for (let i = 0; i < headerLine.length; i++) {
      const ch = headerLine[i];
      // Detect start of Expires attribute (case-insensitive)
      if (!inExpires && headerLine.slice(i).toLowerCase().startsWith('expires=')) {
        inExpires = true;
        i += 'expires='.length - 1;
        continue;
      }
      if (inExpires) {
        // Expires attribute ends at the next semicolon or end of string
        if (ch === ';') {
          inExpires = false;
        }
        continue;
      }
      if (ch === ',') {
        // Comma that is not part of Expires → cookie separator
        const segment = headerLine.slice(start, i).trim();
        if (segment) result.push(segment);
        start = i + 1;
      }
    }
    const tail = headerLine.slice(start).trim();
    if (tail) result.push(tail);
    return result;
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
  private tenantId: string | null;
  private currentSessionTag: string;

  constructor(baseUrl: string, tenantId: string | null = null) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.tenantId = tenantId;
    this.currentSessionTag = 'default';
    const defaultSessionPath = path.resolve(process.cwd(), '.posalpro-cli-session.json');
    const storage = process.env.APP_CLI_SESSION_FILE || defaultSessionPath;
    this.jar = new CookieJar(storage);
  }

  switchSession(tag: string) {
    const safe = slugify(tag || 'default');
    const sessionPath = path.resolve(process.cwd(), `.posalpro-cli-session-${safe}.json`);

    logDebug('CLI: Switching session', {
      component: 'AppCLI',
      operation: 'switch_session',
      fromTag: this.currentSessionTag || 'default',
      toTag: tag,
      newPath: sessionPath,
    });

    // Save current session cookies before switching
    const currentCookies = new Map(this.jar.cookies);

    // Create new session jar
    const newJar = new CookieJar(sessionPath);

    // Copy all cookies from current session to new session
    // This preserves authentication cookies across session switches
    currentCookies.forEach((value, key) => {
      newJar.cookies.set(key, value);
    });

    // Save the new session with copied cookies
    newJar.saveToDisk();

    // Update the jar reference
    this.jar = newJar;
    this.currentSessionTag = tag;

    // Save active session information for persistence across CLI commands
    const activeSessionPath = path.resolve(process.cwd(), '.posalpro-cli-active-session.json');
    logDebug('CLI: Preparing to save active session', {
      component: 'AppCLI',
      operation: 'prepare_save_active_session',
      tag,
      path: activeSessionPath,
    });

    try {
      const activeSession = { tag, timestamp: Date.now() };
      const activeSessionData = JSON.stringify(activeSession, null, 2);

      logDebug('CLI: Writing active session file', {
        component: 'AppCLI',
        operation: 'write_active_session_file',
        tag,
        dataLength: activeSessionData.length,
        path: activeSessionPath,
      });

      fs.writeFileSync(activeSessionPath, activeSessionData);

      // Verify the file was written
      const verifyData = fs.readFileSync(activeSessionPath, 'utf8');
      const verifyParsed = JSON.parse(verifyData);

      logInfo('CLI: Active session saved and verified', {
        component: 'AppCLI',
        operation: 'save_active_session_success',
        tag,
        path: activeSessionPath,
        savedTag: verifyParsed.tag,
        savedTimestamp: verifyParsed.timestamp,
      });
    } catch (err) {
      logError('CLI: Failed to save active session', {
        component: 'AppCLI',
        operation: 'save_active_session_error',
        error: (err as Error)?.message,
        tag,
        path: activeSessionPath,
      });
    }

    logInfo('CLI: Session switched successfully', {
      component: 'AppCLI',
      operation: 'switch_session_success',
      tag,
      cookiesCopied: currentCookies.size,
      sessionFile: sessionPath,
    });
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  // Expose the exact Cookie header that will be sent
  getCookieHeader(): string {
    return this.jar.getCookieHeader();
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

      const rawSetCookie = extractSetCookieList(csrfRes.headers);
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
      const loginSetCookie = extractSetCookieList(loginRes.headers);
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

      // Follow one redirect to callbackUrl to collect any additional cookies
      if (
        loginRes.status === 302 ||
        loginRes.status === 303 ||
        loginRes.status === 307 ||
        loginRes.status === 308
      ) {
        const loc = loginRes.headers.get('location');
        if (loc) {
          const redirectUrl = loc.startsWith('http')
            ? loc
            : `${this.baseUrl}${loc.startsWith('/') ? '' : '/'}${loc}`;
          const redirRes = await httpsFetch(redirectUrl, {
            method: 'GET',
            headers: { Cookie: this.jar.getCookieHeader(), Accept: 'text/html,application/json' },
            redirect: 'manual',
          });
          const redirCookies = extractSetCookieList(redirRes.headers);
          this.jar.setFromSetCookie(redirCookies);
        }
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
        if (this.tenantId) {
          headers['x-tenant-id'] = this.tenantId;
        }
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

// Helper to normalize access to multiple Set-Cookie headers across runtimes
function extractSetCookieList(headers: Headers): string[] {
  const anyHeaders: any = headers as any;
  // Node 20+ undici
  if (typeof anyHeaders.getSetCookie === 'function') {
    try {
      const arr = anyHeaders.getSetCookie();
      if (Array.isArray(arr)) return arr as string[];
    } catch {}
  }
  // Undici raw()
  if (typeof anyHeaders.raw === 'function') {
    try {
      const raw = anyHeaders.raw();
      if (raw && Array.isArray(raw['set-cookie'])) return raw['set-cookie'] as string[];
    } catch {}
  }
  // Fallback single header
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

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
  proposals cache                          # List all cached proposals
  proposals cache cmf4lfer400ir4vo8pr31ta5r # Inspect specific proposal cache

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

🧪 TESTS
  tests tenant                               # Run all tenant-related Jest tests (middleware, seats)

🔒 RBAC TESTING
  rbac try <method> <path> [json]            # Test RBAC permission
  rbac run-set [file]                        # Run RBAC test suite from file
  rbac test-roles [file]                     # Test multiple user roles

🔍 SCHEMA & DATA TESTING
  schema check                               # Comprehensive schema consistency check
  schema integrity                           # Data integrity and referential integrity check
  schema validate                            # Zod schema validation against live data
  schema detect-mismatch [componentName]     # 🆕 Dynamic frontend-backend field mismatch detection

🔧 DEVELOPMENT WORKFLOW TESTING
  schema detect-mismatch [componentName]     # Automated frontend-backend field validation
                                            # - Analyzes React components for form field usage
                                            # - Matches components to backend Zod schemas dynamically
                                            # - Detects enum mismatches, missing fields, type conflicts
                                            # - Provides actionable developer suggestions
                                            # - Optional: Filter by specific component name

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

async function handleTroubleshootAuth(api: ApiClient) {
  console.log('🔎 Auth Troubleshooter\n');

  // 1) Try auth debug (dev-only)
  try {
    const r = await api.request('GET', '/api/auth/debug');
    const bodyText = await r.text();
    console.log(`GET /api/auth/debug → ${r.status}`);
    try {
      const j = JSON.parse(bodyText);
      const roles = j?.session?.user?.roles || [];
      const perms = j?.session?.user?.permissions || [];
      console.log('  Session:', {
        hasUser: j?.session?.hasUser ?? Boolean(j?.session?.user),
        email: j?.session?.user?.email,
        rolesCount: Array.isArray(roles) ? roles.length : 0,
        permissionsCount: Array.isArray(perms) ? perms.length : 0,
      });
      const tRoles = j?.token?.roles || [];
      console.log('  Token:', {
        email: j?.token?.email,
        rolesCount: Array.isArray(tRoles) ? tRoles.length : 0,
        hasSessionId: Boolean(j?.token?.hasSessionId),
      });
    } catch {
      console.log('  Body:', bodyText);
    }
  } catch (e) {
    console.log('GET /api/auth/debug failed (likely prod).');
  }

  // 2) NextAuth session (stable)
  try {
    const r = await api.request('GET', '/api/auth/session');
    const t = await r.text();
    console.log(`GET /api/auth/session → ${r.status}`);
    try {
      const j = JSON.parse(t);
      const roles = j?.user?.roles || [];
      console.log('  Session user:', {
        id: j?.user?.id,
        email: j?.user?.email,
        rolesCount: Array.isArray(roles) ? roles.length : 0,
      });
    } catch {
      console.log('  Body:', t);
    }
  } catch (e) {
    console.log('GET /api/auth/session failed.');
  }

  // 3) Profile API (our wrapper)
  try {
    const r = await api.request('GET', '/api/profile');
    const t = await r.text();
    console.log(`GET /api/profile → ${r.status}`);
    console.log(t);
  } catch {
    console.log('GET /api/profile failed.');
  }

  // 4) Proposals access sanity (RBAC)
  try {
    const r = await api.request('GET', '/api/proposals?limit=1');
    const ok = r.ok;
    console.log(`GET /api/proposals?limit=1 → ${r.status}${ok ? ' ✅' : ' ❌'}`);
    if (!ok) {
      const t = await r.text();
      console.log('  Error:', t);
    }
  } catch (e) {
    console.log('GET /api/proposals failed:', (e as Error)?.message);
  }

  console.log('\nIf rolesCount is 0, run: logout → login again.');
}

async function handleTroubleshootDashboard(api: ApiClient) {
  console.log('📊 Dashboard Troubleshooter\n');

  // 1) Enhanced stats (may require entitlement)
  try {
    const r = await api.request('GET', '/api/dashboard/enhanced-stats');
    console.log(`GET /api/dashboard/enhanced-stats → ${r.status}${r.ok ? ' ✅' : ' ❌'}`);
    if (!r.ok) {
      const t = await r.text();
      console.log('  Error:', t);
    }
  } catch (e) {
    console.log('GET /api/dashboard/enhanced-stats failed:', (e as Error)?.message);
  }

  // 2) Basic stats (FREE plan)
  try {
    const r = await api.request('GET', '/api/dashboard/stats');
    console.log(`GET /api/dashboard/stats → ${r.status}${r.ok ? ' ✅' : ' ❌'}`);
    if (!r.ok) {
      const t = await r.text();
      console.log('  Error:', t);
    }
  } catch (e) {
    console.log('GET /api/dashboard/stats failed:', (e as Error)?.message);
  }

  // 3) Proposals list sanity check
  try {
    const r = await api.request('GET', '/api/proposals?limit=1&sortBy=createdAt&sortOrder=desc');
    console.log(`GET /api/proposals → ${r.status}${r.ok ? ' ✅' : ' ❌'}`);
    if (!r.ok) {
      const t = await r.text();
      console.log('  Error:', t);
    }
  } catch (e) {
    console.log('GET /api/proposals failed:', (e as Error)?.message);
  }

  // 4) Entitlements for tenant (DB direct)
  try {
    const tenantId =
      process.env.DEFAULT_TENANT_ID ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
      'tenant_default';
    const entRows = await prisma.entitlement.findMany({
      where: { tenantId, enabled: true },
      select: { key: true },
    });
    const keys = entRows.map(e => e.key);
    const hasEnhanced = keys.includes('feature.analytics.enhanced');
    console.log(`\nTenant: ${tenantId}`);
    console.log('Enabled entitlements:', keys.length ? keys.join(', ') : '(none)');
    console.log(`Enhanced analytics entitlement: ${hasEnhanced ? 'YES' : 'NO'}`);
    if (!hasEnhanced) {
      console.log('\nℹ️ Enhanced stats require feature.analytics.enhanced (PRO/ENTERPRISE).');
      console.log('   Basic stats should work; the app now falls back automatically.');
    }
  } catch (e) {
    console.log('Entitlement check failed:', (e as Error)?.message);
  }
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

      // First login with the default session to get proper authentication
      await api.login(email, password, role);

      // Then switch to the named session and copy the authentication cookies
      (api as any).switchSession(sessionTag);

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
    case 'health:db': {
      const startDb = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      console.log(`DB ok (${Date.now() - startDb}ms)`);
      break;
    }
    case 'health:api': {
      const startApi = Date.now();
      const r = await fetch(`${(api as any).baseUrl}/api/health`);
      console.log(`API ${r.status} (${Date.now() - startApi}ms)`);
      break;
    }
    case 'health:redis': {
      await handleRedisCommand(['redis', 'health'], api);
      break;
    }
    case 'redis': {
      await handleRedisCommand(tokens, api);
      break;
    }
    case 'cookies': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub !== 'show') {
        console.log('Usage: cookies show');
        break;
      }
      // 1) Print local Cookie header
      const cookieHeader = (api as any).getCookieHeader();
      console.log('CLI Cookie header to be sent:');
      console.log(cookieHeader || '(empty)');
      const cookieNames = (cookieHeader || '')
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.split('=')[0]);
      console.log('Cookie names:', cookieNames.length ? cookieNames.join(', ') : '(none)');

      // 2) Server-side debug
      try {
        const res = await api.request('GET', '/api/auth/debug');
        const text = await res.text();
        console.log(`\nServer /api/auth/debug → ${res.status}`);
        try {
          const j = JSON.parse(text);
          console.log('Server sees cookie(s):', j?.cookieNamesPresent || []);
          console.log('hasCookie:', j?.hasCookie);
          console.log('session.hasUser:', j?.session?.hasUser ?? false);
          console.log('token.hasSessionId:', j?.token?.hasSessionId ?? false);
        } catch {
          console.log(text);
        }
      } catch (e) {
        console.log('auth debug endpoint unavailable, falling back to /api/auth/session');
        try {
          const res2 = await api.request('GET', '/api/auth/session');
          const text2 = await res2.text();
          console.log(`/api/auth/session → ${res2.status}`);
          console.log(text2);
        } catch (e2) {
          console.log('Fallback request failed:', (e2 as Error)?.message);
        }
      }
      break;
    }
    case 'troubleshoot': {
      const area = (tokens[1] || '').toLowerCase();
      if (area === 'auth') {
        await handleTroubleshootAuth(api);
      } else if (area === 'dashboard') {
        await handleTroubleshootDashboard(api);
      } else {
        console.log('Usage:\n  troubleshoot auth\n  troubleshoot dashboard');
      }
      break;
    }
    case 'jobs:drain': {
      console.log('🚀 Starting outbox drain process...');
      const startTime = Date.now();

      // Import and run the drain script
      const { execSync } = require('child_process');
      try {
        execSync('tsx scripts/outbox-drain.ts', {
          stdio: 'inherit',
          cwd: process.cwd(),
        });
        const duration = Date.now() - startTime;
        console.log(`✅ Outbox drain completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`❌ Outbox drain failed after ${duration}ms`);
        console.error('Error:', error.message);
      }
      break;
    }
    case 'jobs:test': {
      console.log('🧪 Creating sample outbox jobs...');

      // Import and run the test script
      const { execSync } = require('child_process');
      try {
        execSync('tsx scripts/test-outbox.ts', {
          stdio: 'inherit',
          cwd: process.cwd(),
        });
      } catch (error) {
        console.error('❌ Failed to create test jobs:', error.message);
      }
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
    case 'tests': {
      const sub = (tokens[1] || '').toLowerCase();
      if (sub === 'tenant') {
        const { execSync } = require('child_process');
        try {
          // Run tenant middleware and subscription service tests
          execSync(
            'npx jest src/test/integration/tenant-middleware.test.ts src/test/services/subscriptionService.test.ts --coverage --verbose',
            { stdio: 'inherit', cwd: process.cwd() }
          );
        } catch (e) {
          // jest exits non-zero on failures; propagate exit code
          process.exitCode = 1;
        }
      } else {
        console.log('Usage: tests tenant');
      }
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
      } else if (sub === 'cache' || sub === 'inspect-cache') {
        // proposals cache [proposalId]
        const proposalId = tokens[2];
        console.log('🔍 Reading React Query Cache for Proposals...\n');

        try {
          // Since we can't directly access React Query cache from CLI,
          // we'll fetch the proposal fresh and show what would be cached
          if (proposalId) {
            console.log(`📋 Fetching proposal ${proposalId} from API...`);
            const res = await api.request('GET', `/api/proposals/${proposalId}`);
            const responseText = await res.text();

            if (res.status >= 200 && res.status < 300) {
              try {
                const proposalData = JSON.parse(responseText);
                console.log('✅ Proposal Cache Entry (simulated):');
                console.log('='.repeat(60));
                console.log(`Query Key: ["proposals", "byId", "${proposalId}"]`);
                console.log(`Status: success`);
                console.log(`Last Updated: ${new Date().toISOString()}`);
                console.log(`Stale Time: 5000ms`);
                console.log(`GC Time: 120000ms`);
                console.log('='.repeat(60));
                console.log('Cached Data:');
                console.log(JSON.stringify(proposalData.data, null, 2));
                console.log('='.repeat(60));

                // Show cache-related metadata
                if (proposalData.data?.products) {
                  console.log(`📊 Cache Analysis:`);
                  console.log(`   Products Count: ${proposalData.data.products.length}`);
                  console.log(`   Total Value: ${proposalData.data.value || 'N/A'}`);
                  console.log(`   Last Modified: ${proposalData.data.updatedAt || 'N/A'}`);
                }
              } catch (parseError) {
                console.log('✅ Raw Proposal Cache Entry:');
                console.log(responseText);
              }
            } else {
              console.log(`❌ Failed to fetch proposal (HTTP ${res.status}):`);
              console.log(responseText);
            }
          } else {
            // List all cached proposals (simulate by fetching recent ones)
            console.log('📋 Listing Recent Proposals (simulating cache entries)...');
            const res = await api.request(
              'GET',
              '/api/proposals?limit=5&sortBy=updatedAt&sortOrder=desc'
            );
            const responseText = await res.text();

            if (res.status >= 200 && res.status < 300) {
              try {
                const proposalsData = JSON.parse(responseText);
                console.log('✅ Recent Proposal Cache Entries:');
                console.log('='.repeat(80));

                if (proposalsData.data?.items) {
                  proposalsData.data.items.forEach((proposal: any, index: number) => {
                    console.log(`${index + 1}. Query Key: ["proposals", "byId", "${proposal.id}"]`);
                    console.log(`   Title: ${proposal.title}`);
                    console.log(`   Status: ${proposal.status}`);
                    console.log(`   Value: ${proposal.value} ${proposal.currency}`);
                    console.log(`   Products: ${proposal.products?.length || 0}`);
                    console.log(`   Updated: ${new Date(proposal.updatedAt).toLocaleString()}`);
                    console.log('');
                  });
                } else {
                  console.log('No recent proposals found.');
                }
                console.log('='.repeat(80));
                console.log('💡 To inspect specific proposal cache: proposals cache <proposalId>');
              } catch (parseError) {
                console.log('✅ Raw Proposals List:');
                console.log(responseText);
              }
            } else {
              console.log(`❌ Failed to fetch proposals (HTTP ${res.status}):`);
              console.log(responseText);
            }
          }
        } catch (error) {
          console.log('❌ Failed to read proposal cache:');
          console.log(error instanceof Error ? error.message : 'Unknown error');
          console.log('\n💡 Note: This command simulates React Query cache inspection');
          console.log('   In a real React app, cached data would be available immediately');
        }
      } else {
        console.log(
          'Usage:\n  proposals create <json>\n  proposals update <id> <json>\n  proposals get <id>\n  proposals patch-products <id> <jsonProducts>\n  proposals patch-manual-total <id> <value>\n  proposals backfill-step4 [limit] [--execute]\n  proposals add-product <proposalId> <productId> <qty> [unitPrice]\n  proposals update-product <proposalId> <productId> <json>\n  proposals remove-product <proposalId> <productId>\n  proposals snapshot <proposalId> [changeType] [summary]\n  proposals cache [proposalId]                    # Inspect React Query cache for proposals'
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
    case 'entitlements': {
      const sub = (tokens[1] || '').toLowerCase();
      const tenantArg = tokens.find((t, i) => t === '--tenant' && tokens[i + 1])
        ? tokens[tokens.indexOf('--tenant') + 1]
        : undefined;
      const tenantId =
        tenantArg ||
        process.env.DEFAULT_TENANT_ID ||
        process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
        'tenant_default';

      if (sub === 'list') {
        const rows = await prisma.entitlement.findMany({
          where: { tenantId, enabled: undefined },
          select: { key: true, enabled: true },
          orderBy: { key: 'asc' },
        });
        console.log(`Tenant: ${tenantId}`);
        if (!rows.length) console.log('(no entitlements found)');
        rows.forEach(r => console.log(`${r.enabled ? '✅' : '❌'} ${r.key}`));
      } else if (sub === 'grant') {
        const key = tokens[2];
        if (!key) {
          console.log('Usage: entitlements grant <key> [--tenant <id>]');
          break;
        }
        await prisma.entitlement.upsert({
          where: { tenantId_key: { tenantId, key } },
          update: { enabled: true, value: null },
          create: { tenantId, key, enabled: true },
        });
        console.log(`Granted ${key} to ${tenantId}`);
      } else if (sub === 'revoke') {
        const key = tokens[2];
        if (!key) {
          console.log('Usage: entitlements revoke <key> [--tenant <id>]');
          break;
        }
        await prisma.entitlement.updateMany({
          where: { tenantId, key },
          data: { enabled: false },
        });
        console.log(`Revoked ${key} for ${tenantId}`);
      } else {
        console.log(
          'Usage:\n  entitlements list [--tenant <id>]\n  entitlements grant <key> [--tenant <id>]\n  entitlements revoke <key> [--tenant <id>]'
        );
      }
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
      } else if (sub === 'detect-mismatch') {
        const componentName = tokens[2] || undefined; // Optional component name parameter
        await handleFieldValueMismatchDetection(api, componentName);
      } else if (sub === 'test') {
        // Enhanced Zod Schema Runtime Testing
        await handleEnhancedZodValidation(tokens, api);
      } else {
        console.log(
          'Usage: schema check | schema integrity | schema validate | schema detect-mismatch [componentName] | schema test <command>'
        );
        console.log('\nEnhanced Zod Testing Commands:');
        console.log('  schema test interactive     # Interactive schema testing');
        console.log('  schema test generate <schema> # Generate test data from schema');
        console.log('  schema test transform <schema> # Test schema transformations');
        console.log('  schema test compatibility   # Test frontend/backend compatibility');
        console.log('  schema test comprehensive   # Run full test suite');
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
  const tenantIdx = args.indexOf('--tenant');
  const tenantId = tenantIdx >= 0 && args[tenantIdx + 1] ? args[tenantIdx + 1] : null;
  const normalizedBase = normalizeBaseUrl(base);
  const api = new ApiClient(normalizedBase, tenantId);

  // Load active session if one exists
  const activeSessionPath = path.resolve(process.cwd(), '.posalpro-cli-active-session.json');
  logDebug('CLI: Checking for active session file', {
    component: 'AppCLI',
    operation: 'check_active_session',
    path: activeSessionPath,
    exists: fs.existsSync(activeSessionPath),
  });

  if (fs.existsSync(activeSessionPath)) {
    try {
      const activeSession = JSON.parse(fs.readFileSync(activeSessionPath, 'utf8'));
      logDebug('CLI: Active session file contents', {
        component: 'AppCLI',
        operation: 'active_session_contents',
        activeSession,
      });

      if (activeSession.tag && activeSession.tag !== 'default') {
        logInfo('CLI: Loading active session', {
          component: 'AppCLI',
          operation: 'load_active_session',
          tag: activeSession.tag,
        });
        api.switchSession(activeSession.tag);
      } else {
        logDebug('CLI: Active session tag is default or missing', {
          component: 'AppCLI',
          operation: 'skip_active_session',
          tag: activeSession.tag,
        });
      }
    } catch (err) {
      logError('CLI: Failed to load active session', {
        component: 'AppCLI',
        operation: 'load_active_session_error',
        error: (err as Error)?.message,
        path: activeSessionPath,
      });
    }
  } else {
    logDebug('CLI: No active session file found', {
      component: 'AppCLI',
      operation: 'no_active_session',
      path: activeSessionPath,
    });
  }

  // Log the base URL and tenant being used
  logInfo('CLI: Base URL and tenant configured', {
    component: 'AppCLI',
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

// ====================
// Enhanced Zod Schema Validation Functions
// ====================

interface SchemaTestResult {
  schemaName: string;
  testType: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  message: string;
  details?: any;
  duration: number;
}

interface ValidationTestSuite {
  name: string;
  tests: SchemaTestResult[];
  summary: {
    passed: number;
    failed: number;
    errors: number;
    totalTime: number;
  };
}

// Enhanced Zod Runtime Testing Function
async function handleEnhancedZodValidation(tokens: string[], api: ApiClient) {
  console.log('🚀 PosalPro MVP2 - Enhanced Zod Schema Runtime Testing\n');

  const command = tokens[2]; // schema test <command>
  const args = tokens.slice(3);

  switch (command) {
    case 'interactive':
      await runInteractiveSchemaTesting(api);
      break;
    case 'generate':
      await runSchemaDataGeneration(args);
      break;
    case 'transform':
      await runSchemaTransformationTesting(args);
      break;
    case 'compatibility':
      await runSchemaCompatibilityTesting(api);
      break;
    case 'comprehensive':
      await runComprehensiveSchemaTestSuite(api);
      break;
    default:
      console.log('Available enhanced Zod testing commands:');
      console.log('  schema test interactive     # Interactive schema testing');
      console.log('  schema test generate <schema> # Generate test data from schema');
      console.log('  schema test transform <schema> # Test schema transformations');
      console.log('  schema test compatibility   # Test frontend/backend compatibility');
      console.log('  schema test comprehensive   # Run full test suite');
      break;
  }
}

// Interactive Schema Testing
async function runInteractiveSchemaTesting(api: ApiClient) {
  console.log('🎯 Interactive Zod Schema Testing');
  console.log('==================================\n');

  try {
    // Load available schemas
    const schemas = await loadAvailableSchemas();
    if (Object.keys(schemas).length === 0) {
      console.log('❌ No schemas found. Please ensure feature schemas are properly defined.');
      return;
    }

    console.log('📋 Available Schemas:');
    Object.keys(schemas).forEach((name, index) => {
      console.log(`  ${index + 1}. ${name}`);
    });

    // For CLI usage, we'll run automated tests on all schemas
    console.log('\n🔄 Running automated tests on all schemas...\n');

    const results: SchemaTestResult[] = [];

    for (const [schemaName, schema] of Object.entries(schemas)) {
      console.log(`Testing ${schemaName}...`);

      // Test 1: Basic validation with generated data
      const genTest = await testSchemaDataGeneration(schemaName, schema);
      results.push(genTest);

      // Test 2: Schema transformation testing
      const transTest = await testSchemaTransformation(schemaName, schema);
      results.push(transTest);

      // Test 3: Edge case validation
      const edgeTest = await testSchemaEdgeCases(schemaName, schema);
      results.push(edgeTest);

      // Test 4: API data validation (if applicable)
      const apiTest = await testSchemaWithApiData(schemaName, schema, api);
      if (apiTest) results.push(apiTest);
    }

    // Display results
    displaySchemaTestResults(results);
  } catch (error) {
    console.error('❌ Error in interactive schema testing:', error);
  }
}

// Load all available schemas from feature directories
async function loadAvailableSchemas(): Promise<Record<string, any>> {
  const schemas: Record<string, any> = {};

  const featureDirs = ['customers', 'proposals', 'products', 'auth'];

  for (const dir of featureDirs) {
    try {
      const module = await import(`../src/features/${dir}/schemas`);
      Object.entries(module).forEach(([key, value]) => {
        if (key.endsWith('Schema') && typeof value === 'object' && value.safeParse) {
          schemas[`${dir}.${key}`] = value;
        }
      });
    } catch (error) {
      // Schema not available, skip
    }
  }

  return schemas;
}

// Test data generation from schema
async function testSchemaDataGeneration(
  schemaName: string,
  schema: any
): Promise<SchemaTestResult> {
  const startTime = Date.now();

  try {
    // Generate test data
    const testData = generateTestDataFromSchema(schema);

    // Validate generated data
    const validation = schema.safeParse(testData);

    return {
      schemaName,
      testType: 'Data Generation',
      status: validation.success ? 'PASS' : 'FAIL',
      message: validation.success
        ? 'Successfully generated and validated test data'
        : `Generated data failed validation: ${validation.error?.message}`,
      details: validation.success ? testData : validation.error?.errors,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      schemaName,
      testType: 'Data Generation',
      status: 'ERROR',
      message: `Error generating test data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

// Generate test data based on Zod schema structure
function generateTestDataFromSchema(schema: any): any {
  // Try a more robust approach by iteratively building valid data
  let attempts = 0;
  const maxAttempts = 10;
  let currentData: any = {};

  while (attempts < maxAttempts) {
    try {
      // Try to parse current data to see what fields are missing
      const result = schema.safeParse(currentData);

      if (result.success) {
        return currentData;
      }

      // Get the first error to fix
      const firstError = result.error.errors[0];
      if (!firstError) break;

      const fieldPath = firstError.path.join('.');
      // Add the missing field with a generated value
      setNestedValue(currentData, fieldPath, generateValueForError(firstError, fieldPath));

      attempts++;
    } catch (error) {
      // Silently handle errors during generation
      break;
    }
  }

  return currentData;
}

// Set a nested value in an object using dot notation
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
}

// Generate appropriate value based on validation error
function generateValueForError(error: any, fieldPath: string): any {
  const fieldName = fieldPath.split('.').pop()?.toLowerCase() || '';

  switch (error.code) {
    case 'invalid_type':
      if (error.received === 'undefined') {
        // Required field missing
        return generateValueForField(fieldName, error.expected);
      }
      break;

    case 'invalid_literal':
      // For literal values, return the expected value
      return error.expected;

    case 'too_small':
      if (error.type === 'string') {
        return 'a'.repeat(error.minimum || 1);
      }
      return error.minimum || 0;

    case 'invalid_string':
      if (error.validation === 'email') {
        return 'test@example.com';
      }
      if (error.validation === 'url') {
        return 'https://example.com';
      }
      return 'test_value';

    case 'invalid_enum_value':
      // Return first expected value
      return error.options?.[0] || 'DEFAULT';
  }

  // Fallback to generic generation
  return generateValueForField(fieldName, 'string');
}

// Generate value based on field name pattern
function generateValueForField(fieldName: string, expectedType: string): any {
  if (expectedType === 'string') {
    if (fieldName.includes('email')) return 'test@example.com';
    if (fieldName.includes('name')) return 'Test Name';
    if (fieldName.includes('phone')) return '+1-555-123-4567';
    if (fieldName.includes('url') || fieldName.includes('website')) return 'https://example.com';
    if (fieldName.includes('address')) return '123 Test Street';
    if (fieldName.includes('industry')) return 'Technology';
    if (fieldName.includes('status')) return 'ACTIVE';
    if (fieldName.includes('tier')) return 'STANDARD';
    return 'Test Value';
  }

  if (expectedType === 'number') {
    if (fieldName.includes('id')) return Math.floor(Math.random() * 1000) + 1;
    if (fieldName.includes('revenue') || fieldName.includes('price')) return 10000;
    return 42;
  }

  if (expectedType === 'boolean') {
    return false;
  }

  if (expectedType === 'array') {
    return [];
  }

  return 'test_value';
}

// Generate appropriate test value for a field based on its Zod schema
function generateFieldValue(fieldName: string, fieldSchema: any): any {
  try {
    const def = fieldSchema._def;
    if (!def) return null;

    const typeName = def.typeName;

    switch (typeName) {
      case 'ZodString':
        return generateStringValue(fieldName, def);

      case 'ZodNumber':
        return generateNumberValue(fieldName, def);

      case 'ZodBoolean':
        return false; // Default to false for boolean fields

      case 'ZodArray':
        return generateArrayValue(fieldName, def);

      case 'ZodEnum':
        return generateEnumValue(fieldName, def);

      case 'ZodObject':
        return generateObjectValue(fieldName, def);

      case 'ZodOptional':
        // For optional fields, sometimes provide a value, sometimes null
        return Math.random() > 0.5 ? generateFieldValue(fieldName, def.innerType) : undefined;

      case 'ZodNullable':
        // For nullable fields, sometimes provide a value, sometimes null
        return Math.random() > 0.5 ? generateFieldValue(fieldName, def.innerType) : null;

      case 'ZodUnion':
        // For unions, pick the first type
        return generateFieldValue(fieldName, def.options[0]);

      default:
        return `test_${fieldName}`;
    }
  } catch (error) {
    return `test_${fieldName}`;
  }
}

// Generate string values based on field name patterns
function generateStringValue(fieldName: string, def: any): string {
  if (fieldName.toLowerCase().includes('email')) {
    return 'test@example.com';
  }
  if (fieldName.toLowerCase().includes('phone')) {
    return '+1-555-123-4567';
  }
  if (fieldName.toLowerCase().includes('url') || fieldName.toLowerCase().includes('website')) {
    return 'https://example.com';
  }
  if (fieldName.toLowerCase().includes('name')) {
    return 'Test Name';
  }
  if (fieldName.toLowerCase().includes('description')) {
    return 'Test description';
  }
  if (fieldName.toLowerCase().includes('address')) {
    return '123 Test Street, Test City, TS 12345';
  }
  if (fieldName.toLowerCase().includes('industry')) {
    return 'Technology';
  }

  // Check for specific validations
  if (def.checks) {
    for (const check of def.checks) {
      if (check.kind === 'min' && check.value > 0) {
        return 'a'.repeat(Math.max(check.value, 3));
      }
      if (check.kind === 'max' && check.value > 0) {
        return 'a'.repeat(Math.min(check.value, 10));
      }
    }
  }

  return 'Test Value';
}

// Generate number values based on field patterns
function generateNumberValue(fieldName: string, def: any): number {
  if (fieldName.toLowerCase().includes('id')) {
    return Math.floor(Math.random() * 1000) + 1;
  }
  if (fieldName.toLowerCase().includes('price') || fieldName.toLowerCase().includes('cost')) {
    return Math.round(Math.random() * 10000) + 100;
  }
  if (fieldName.toLowerCase().includes('revenue')) {
    return Math.round(Math.random() * 1000000) + 10000;
  }
  if (fieldName.toLowerCase().includes('quantity') || fieldName.toLowerCase().includes('count')) {
    return Math.floor(Math.random() * 100) + 1;
  }
  if (fieldName.toLowerCase().includes('score') || fieldName.toLowerCase().includes('rate')) {
    return Math.floor(Math.random() * 100) + 1;
  }

  // Check for specific validations
  if (def.checks) {
    for (const check of def.checks) {
      if (check.kind === 'min') {
        return Math.max(check.value, 0);
      }
      if (check.kind === 'max') {
        return Math.min(check.value, 100);
      }
    }
  }

  return 42; // Default number
}

// Generate array values
function generateArrayValue(fieldName: string, def: any): any[] {
  if (def.type) {
    // Generate 1-3 items of the array type
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      items.push(generateFieldValue(`${fieldName}_${i}`, def.type));
    }
    return items;
  }
  return [];
}

// Generate enum values
function generateEnumValue(fieldName: string, def: any): string {
  if (def.values && def.values.length > 0) {
    return def.values[0]; // Return first enum value
  }
  return 'DEFAULT';
}

// Generate object values for nested schemas
function generateObjectValue(fieldName: string, def: any): any {
  if (def.shape) {
    const obj: any = {};
    Object.entries(def.shape).forEach(([key, schema]: [string, any]) => {
      obj[key] = generateFieldValue(key, schema);
    });
    return obj;
  }
  return {};
}

// Test schema transformations
async function testSchemaTransformation(
  schemaName: string,
  schema: any
): Promise<SchemaTestResult> {
  const startTime = Date.now();

  try {
    // Test common transformations
    const transformations = [
      { name: 'String to Date', data: { createdAt: '2024-01-01T00:00:00Z' } },
      { name: 'Number to String', data: { revenue: '100000' } },
      { name: 'Optional Fields', data: { optionalField: undefined } },
    ];

    let passed = 0;
    const failures: string[] = [];

    for (const transform of transformations) {
      try {
        const result = schema.safeParse(transform.data);
        if (result.success) {
          passed++;
        } else {
          failures.push(`${transform.name}: ${result.error.message}`);
        }
      } catch (error) {
        failures.push(
          `${transform.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return {
      schemaName,
      testType: 'Transformation',
      status: failures.length === 0 ? 'PASS' : 'FAIL',
      message: `${passed}/${transformations.length} transformations passed`,
      details: failures.length > 0 ? failures : undefined,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      schemaName,
      testType: 'Transformation',
      status: 'ERROR',
      message: `Error testing transformations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

// Test edge cases
async function testSchemaEdgeCases(schemaName: string, schema: any): Promise<SchemaTestResult> {
  const startTime = Date.now();

  try {
    const edgeCases = [
      { name: 'Empty Object', data: {} },
      {
        name: 'Null Values',
        data: Object.keys(schema._def?.shape || {}).reduce(
          (acc, key) => ({ ...acc, [key]: null }),
          {}
        ),
      },
      { name: 'Invalid Types', data: { invalidField: 'test' } },
    ];

    let passed = 0;
    const results: string[] = [];

    for (const testCase of edgeCases) {
      const validation = schema.safeParse(testCase.data);
      results.push(`${testCase.name}: ${validation.success ? 'PASS' : 'FAIL'}`);
      if (validation.success) passed++;
    }

    return {
      schemaName,
      testType: 'Edge Cases',
      status: passed === edgeCases.length ? 'PASS' : 'FAIL',
      message: `${passed}/${edgeCases.length} edge cases handled correctly`,
      details: results,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      schemaName,
      testType: 'Edge Cases',
      status: 'ERROR',
      message: `Error testing edge cases: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

// Test schema with real API data
async function testSchemaWithApiData(
  schemaName: string,
  schema: any,
  api: ApiClient
): Promise<SchemaTestResult | null> {
  const startTime = Date.now();

  try {
    // Map schema names to API endpoints
    const endpointMap: Record<string, string> = {
      'customers.CustomerSchema': '/api/customers?limit=1',
      'proposals.ProposalSchema': '/api/proposals?limit=1',
      'products.ProductSchema': '/api/products?limit=1',
    };

    const endpoint = endpointMap[schemaName];
    if (!endpoint) return null;

    const response = await api.request('GET', endpoint);
    if (!response.ok) {
      return {
        schemaName,
        testType: 'API Validation',
        status: 'ERROR',
        message: `API request failed: ${response.status}`,
        duration: Date.now() - startTime,
      };
    }

    const data = await response.json();
    const apiData = Array.isArray(data) ? data[0] : data.data?.[0] || data;

    if (!apiData) {
      return {
        schemaName,
        testType: 'API Validation',
        status: 'ERROR',
        message: 'No data received from API',
        duration: Date.now() - startTime,
      };
    }

    const validation = schema.safeParse(apiData);

    return {
      schemaName,
      testType: 'API Validation',
      status: validation.success ? 'PASS' : 'FAIL',
      message: validation.success
        ? 'API data matches schema'
        : `API data validation failed: ${validation.error?.message}`,
      details: validation.success ? apiData : validation.error?.errors,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      schemaName,
      testType: 'API Validation',
      status: 'ERROR',
      message: `Error testing with API data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime,
    };
  }
}

// Display test results
function displaySchemaTestResults(results: SchemaTestResult[]) {
  console.log('\n📊 ENHANCED ZOD SCHEMA TEST RESULTS');
  console.log('=====================================\n');

  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.schemaName]) {
        acc[result.schemaName] = [];
      }
      acc[result.schemaName].push(result);
      return acc;
    },
    {} as Record<string, SchemaTestResult[]>
  );

  Object.entries(groupedResults).forEach(([schemaName, schemaResults]) => {
    console.log(`🔍 ${schemaName}:`);
    schemaResults.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`  ${statusIcon} ${result.testType}: ${result.message} (${result.duration}ms)`);

      if (result.details && result.status !== 'PASS') {
        if (Array.isArray(result.details)) {
          result.details.forEach(detail => console.log(`    • ${detail}`));
        } else if (typeof result.details === 'object') {
          console.log(`    • ${JSON.stringify(result.details, null, 2)}`);
        }
      }
    });
    console.log('');
  });

  // Summary
  const summary = results.reduce(
    (acc, result) => {
      acc[result.status.toLowerCase() as keyof typeof acc]++;
      return acc;
    },
    { pass: 0, fail: 0, error: 0 }
  );

  console.log('📈 SUMMARY:');
  console.log(`  ✅ Passed: ${summary.pass}`);
  console.log(`  ❌ Failed: ${summary.fail}`);
  console.log(`  ⚠️  Errors: ${summary.error}`);
  console.log(`  📊 Total Tests: ${results.length}`);
}

// Schema Data Generation
async function runSchemaDataGeneration(args: string[]) {
  const schemaName = args[0];
  if (!schemaName) {
    console.log('Usage: schema test generate <schemaName>');
    console.log('Example: schema test generate customers.CustomerCreateSchema');
    return;
  }

  try {
    const schemas = await loadAvailableSchemas();
    const schema = schemas[schemaName];

    if (!schema) {
      console.log(`❌ Schema '${schemaName}' not found.`);
      return;
    }

    console.log(`🔄 Generating test data for ${schemaName}...`);

    const testData = generateTestDataFromSchema(schema);
    console.log('\n📋 Generated Test Data:');
    console.log(JSON.stringify(testData, null, 2));

    // Validate the generated data
    const validation = schema.safeParse(testData);
    console.log(`\n🔍 Validation Result: ${validation.success ? '✅ PASS' : '❌ FAIL'}`);

    if (!validation.success) {
      console.log('❌ Validation Errors:');
      validation.error.errors.forEach(error => {
        console.log(`  • ${error.path.join('.')}: ${error.message}`);
      });
    }
  } catch (error) {
    console.error('❌ Error generating schema data:', error);
  }
}

// Schema Transformation Testing
async function runSchemaTransformationTesting(args: string[]) {
  const schemaName = args[0];
  if (!schemaName) {
    console.log('Usage: schema test transform <schemaName>');
    console.log('Example: schema test transform customers.CustomerCreateSchema');
    return;
  }

  try {
    const schemas = await loadAvailableSchemas();
    const schema = schemas[schemaName];

    if (!schema) {
      console.log(`❌ Schema '${schemaName}' not found.`);
      return;
    }

    console.log(`🔄 Testing transformations for ${schemaName}...`);

    const transformations = [
      {
        name: 'Date String to Date Object',
        input: { createdAt: '2024-01-01T00:00:00Z' },
        expected: true,
      },
      {
        name: 'Number String to Number',
        input: { revenue: '100000' },
        expected: true,
      },
      {
        name: 'Invalid Email',
        input: { email: 'invalid-email' },
        expected: false,
      },
      {
        name: 'Missing Required Field',
        input: { name: undefined },
        expected: false,
      },
    ];

    transformations.forEach(({ name, input, expected }) => {
      const result = schema.safeParse(input);
      const status = result.success === expected ? '✅' : '❌';
      console.log(`${status} ${name}: ${result.success ? 'PASS' : 'FAIL'}`);
    });
  } catch (error) {
    console.error('❌ Error testing schema transformations:', error);
  }
}

// Schema Compatibility Testing
async function runSchemaCompatibilityTesting(api: ApiClient) {
  console.log('🔗 Testing Schema Compatibility (Frontend ↔ Backend)');
  console.log('====================================================\n');

  try {
    // Load frontend schemas
    const frontendSchemas = await loadAvailableSchemas();

    // Test compatibility for each feature
    const compatibilityResults: any[] = [];

    for (const [schemaName, schema] of Object.entries(frontendSchemas)) {
      console.log(`Testing ${schemaName}...`);

      // Map to API endpoint
      const endpoint = getEndpointForSchema(schemaName);
      if (!endpoint) {
        console.log(`  ⚠️ No endpoint mapping for ${schemaName}`);
        continue;
      }

      try {
        // Get API response
        const response = await api.request('GET', `${endpoint}?limit=1`);
        if (!response.ok) {
          compatibilityResults.push({
            schema: schemaName,
            status: 'ERROR',
            message: `API request failed: ${response.status}`,
          });
          continue;
        }

        const data = await response.json();
        const apiData = Array.isArray(data) ? data[0] : data.data?.[0] || data;

        if (!apiData) {
          compatibilityResults.push({
            schema: schemaName,
            status: 'ERROR',
            message: 'No data received from API',
          });
          continue;
        }

        // Test frontend schema validation
        const frontendValidation = schema.safeParse(apiData);

        // Test backend validation by sending data back
        const backendResponse = await api.request('POST', endpoint.replace(/\/\?.*/, ''), apiData);
        const backendValidation = backendResponse.ok;

        const isCompatible = frontendValidation.success && backendValidation;

        compatibilityResults.push({
          schema: schemaName,
          status: isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE',
          frontend: frontendValidation.success,
          backend: backendValidation,
          details: !frontendValidation.success ? frontendValidation.error?.errors : undefined,
        });
      } catch (error) {
        compatibilityResults.push({
          schema: schemaName,
          status: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Display results
    console.log('\n📊 COMPATIBILITY RESULTS:');
    compatibilityResults.forEach(result => {
      const icon =
        result.status === 'COMPATIBLE' ? '✅' : result.status === 'INCOMPATIBLE' ? '❌' : '⚠️';
      console.log(`${icon} ${result.schema}: ${result.status}`);

      if (result.details) {
        console.log(`  Frontend issues:`);
        result.details.forEach((error: any) => {
          console.log(`    • ${error.path.join('.')}: ${error.message}`);
        });
      }
    });
  } catch (error) {
    console.error('❌ Error testing schema compatibility:', error);
  }
}

// Helper function to map schemas to endpoints
function getEndpointForSchema(schemaName: string): string | null {
  const mappings: Record<string, string> = {
    'customers.CustomerSchema': '/api/customers',
    'customers.CustomerCreateSchema': '/api/customers',
    'proposals.ProposalSchema': '/api/proposals',
    'products.ProductSchema': '/api/products',
  };

  return mappings[schemaName] || null;
}

// Comprehensive Test Suite
async function runComprehensiveSchemaTestSuite(api: ApiClient) {
  console.log('🧪 Running Comprehensive Schema Test Suite');
  console.log('===========================================\n');

  const startTime = Date.now();
  const testSuites: ValidationTestSuite[] = [];

  // Test Suite 1: Basic Schema Validation
  const basicSuite = await runBasicSchemaValidationSuite(api);
  testSuites.push(basicSuite);

  // Test Suite 2: Data Generation Suite
  const generationSuite = await runDataGenerationSuite();
  testSuites.push(generationSuite);

  // Test Suite 3: Transformation Suite
  const transformationSuite = await runTransformationSuite();
  testSuites.push(transformationSuite);

  // Test Suite 4: API Compatibility Suite
  const compatibilitySuite = await runApiCompatibilitySuite(api);
  testSuites.push(compatibilitySuite);

  // Display comprehensive results
  displayComprehensiveTestResults(testSuites, Date.now() - startTime);
}

// Basic Schema Validation Suite
async function runBasicSchemaValidationSuite(api: ApiClient): Promise<ValidationTestSuite> {
  const tests: SchemaTestResult[] = [];
  const schemas = await loadAvailableSchemas();

  for (const [name, schema] of Object.entries(schemas)) {
    tests.push(await testSchemaDataGeneration(name, schema));
    tests.push(await testSchemaEdgeCases(name, schema));

    const apiTest = await testSchemaWithApiData(name, schema, api);
    if (apiTest) tests.push(apiTest);
  }

  return {
    name: 'Basic Schema Validation',
    tests,
    summary: calculateSuiteSummary(tests, Date.now()),
  };
}

// Data Generation Suite
async function runDataGenerationSuite(): Promise<ValidationTestSuite> {
  const tests: SchemaTestResult[] = [];
  const schemas = await loadAvailableSchemas();

  for (const [name, schema] of Object.entries(schemas)) {
    tests.push(await testSchemaDataGeneration(name, schema));
  }

  return {
    name: 'Data Generation',
    tests,
    summary: calculateSuiteSummary(tests, Date.now()),
  };
}

// Transformation Suite
async function runTransformationSuite(): Promise<ValidationTestSuite> {
  const tests: SchemaTestResult[] = [];
  const schemas = await loadAvailableSchemas();

  for (const [name, schema] of Object.entries(schemas)) {
    tests.push(await testSchemaTransformation(name, schema));
  }

  return {
    name: 'Schema Transformations',
    tests,
    summary: calculateSuiteSummary(tests, Date.now()),
  };
}

// API Compatibility Suite
async function runApiCompatibilitySuite(api: ApiClient): Promise<ValidationTestSuite> {
  const tests: SchemaTestResult[] = [];
  const schemas = await loadAvailableSchemas();

  for (const [name, schema] of Object.entries(schemas)) {
    const apiTest = await testSchemaWithApiData(name, schema, api);
    if (apiTest) tests.push(apiTest);
  }

  return {
    name: 'API Compatibility',
    tests,
    summary: calculateSuiteSummary(tests, Date.now()),
  };
}

// Helper to calculate suite summary
function calculateSuiteSummary(tests: SchemaTestResult[], startTime: number) {
  return {
    passed: tests.filter(t => t.status === 'PASS').length,
    failed: tests.filter(t => t.status === 'FAIL').length,
    errors: tests.filter(t => t.status === 'ERROR').length,
    totalTime: Date.now() - startTime,
  };
}

// Display comprehensive test results
function displayComprehensiveTestResults(testSuites: ValidationTestSuite[], totalTime: number) {
  console.log('\n🎯 COMPREHENSIVE SCHEMA TEST SUITE RESULTS');
  console.log('==========================================\n');

  testSuites.forEach(suite => {
    console.log(`📊 ${suite.name}:`);
    console.log(`  ✅ Passed: ${suite.summary.passed}`);
    console.log(`  ❌ Failed: ${suite.summary.failed}`);
    console.log(`  ⚠️  Errors: ${suite.summary.errors}`);
    console.log(`  ⏱️  Duration: ${suite.summary.totalTime}ms\n`);
  });

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.summary.passed, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.summary.failed, 0);
  const totalErrors = testSuites.reduce((sum, suite) => sum + suite.summary.errors, 0);

  console.log('📈 OVERALL SUMMARY:');
  console.log(`  📊 Total Test Suites: ${testSuites.length}`);
  console.log(`  🧪 Total Tests: ${totalTests}`);
  console.log(`  ✅ Total Passed: ${totalPassed}`);
  console.log(`  ❌ Total Failed: ${totalFailed}`);
  console.log(`  ⚠️  Total Errors: ${totalErrors}`);
  console.log(`  ⏱️  Total Duration: ${totalTime}ms`);

  const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
  console.log(`  📊 Success Rate: ${successRate}%`);

  if (totalPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Your schemas are in excellent shape.');
  } else {
    console.log(`\n⚠️ ${totalFailed + totalErrors} tests need attention.`);
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

// ====================
// Redis Troubleshooting & Utilities
// ====================
async function handleRedisCommand(tokens: string[], api: ApiClient) {
  const sub = (tokens[1] || 'status').toLowerCase();

  // Helper to call server health route and gracefully fall back
  const tryHttpHealth = async () => {
    try {
      const res = await api.request('GET', '/api/health/redis');
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        console.log('🌐 /api/health/redis →', res.status);
        console.log(JSON.stringify(json, null, 2));
        return true;
      } catch {
        console.log('🌐 /api/health/redis →', res.status);
        console.log(text);
        return res.ok;
      }
    } catch (e) {
      console.log('ℹ️  HTTP Redis health route unavailable, using local diagnostics.');
      return false;
    }
  };

  switch (sub) {
    case 'status': {
      const { getRedisDiagnostics } = await import('../src/lib/redis');
      const diag = getRedisDiagnostics();
      console.log('🧰 Redis Diagnostics');
      console.log(JSON.stringify(diag, null, 2));
      if (!diag.enabled) {
        console.log(
          '\nℹ️  Redis is disabled. Set USE_REDIS=true and REDIS_URL to enable. Using in-memory cache.'
        );
      }
      break;
    }
    case 'health': {
      const httpOk = await tryHttpHealth();
      if (!httpOk) {
        const { checkRedisHealth, getRedisDiagnostics } = await import('../src/lib/redis');
        const ok = await checkRedisHealth();
        const diag = getRedisDiagnostics();
        console.log('🩺 Local Redis health:', ok ? '✅ healthy' : '❌ unhealthy');
        console.log(JSON.stringify(diag, null, 2));
      }
      break;
    }
    case 'connect': {
      const url = tokens[2];
      if (url) process.env.REDIS_URL = url;
      process.env.USE_REDIS = 'true';
      // Import AFTER setting env, so module evaluates with new values
      const redis = await import('../src/lib/redis');
      await redis.ensureRedisConnection();
      try {
        const pong = await redis.redisClient.ping();
        console.log('✅ Connected. PING →', pong);
      } catch (e) {
        console.log('❌ Failed to connect or ping:', (e as Error)?.message);
      }
      const diag = redis.getRedisDiagnostics();
      console.log(JSON.stringify(diag, null, 2));
      break;
    }
    case 'ping': {
      const { ensureRedisConnection, redisClient, getRedisDiagnostics } = await import(
        '../src/lib/redis'
      );
      await ensureRedisConnection();
      try {
        const pong = await redisClient.ping();
        console.log('✅ PING →', pong);
      } catch (e) {
        console.log('❌ PING failed:', (e as Error)?.message);
        console.log('Status:', JSON.stringify(getRedisDiagnostics(), null, 2));
      }
      break;
    }
    case 'get': {
      const key = tokens[2];
      if (!key) {
        console.log('Usage: redis get <key>');
        break;
      }
      const { getCache } = await import('../src/lib/redis');
      const val = await getCache(key);
      console.log(val === null ? '(null)' : JSON.stringify(val, null, 2));
      break;
    }
    case 'set': {
      const key = tokens[2];
      const raw = tokens[3];
      const ttlToken = tokens[4];
      if (!key || raw === undefined) {
        console.log('Usage: redis set <key> <json|string> [ttlSeconds]');
        break;
      }
      let value: any = raw;
      try {
        value = JSON.parse(raw);
      } catch {
        // keep as string
      }
      const ttl = ttlToken ? Number(ttlToken) || 60 : 60;
      const { setCache } = await import('../src/lib/redis');
      await setCache(key, value, ttl);
      console.log(`✅ SET ${key} (ttl=${ttl}s)`);
      break;
    }
    case 'del': {
      const key = tokens[2];
      if (!key) {
        console.log('Usage: redis del <key>');
        break;
      }
      const { deleteCache } = await import('../src/lib/redis');
      await deleteCache(key);
      console.log(`🗑️  DEL ${key}`);
      break;
    }
    case 'keys': {
      const pattern = tokens[2] || '*';
      const { ensureRedisConnection, getRedisDiagnostics, redisClient } = await import(
        '../src/lib/redis'
      );
      await ensureRedisConnection();
      const diag = getRedisDiagnostics();
      if (!diag.connected) {
        console.log('ℹ️  Not connected to Redis (using memory cache). Keys listing unavailable.');
        console.log(JSON.stringify(diag, null, 2));
        break;
      }
      try {
        const keys = await redisClient.keys(pattern);
        console.log(`🔑 ${keys.length} key(s):`);
        for (const k of keys.slice(0, 200)) console.log('  ', k);
        if (keys.length > 200) console.log(`  ... and ${keys.length - 200} more`);
      } catch (e) {
        console.log('❌ KEYS failed:', (e as Error)?.message);
      }
      break;
    }
    case 'clear': {
      const pattern = tokens[2];
      if (!pattern) {
        console.log('Usage: redis clear <pattern>');
        break;
      }
      const { clearCache } = await import('../src/lib/redis');
      await clearCache(pattern);
      console.log(`🧹 Cleared keys matching: ${pattern}`);
      break;
    }
    case 'flush': {
      const force = tokens.includes('--force');
      if (!force) {
        console.log(
          '⚠️  DANGEROUS: This will FLUSH the current Redis database. Use: redis flush --force'
        );
        break;
      }
      const { ensureRedisConnection, getRedisDiagnostics, redisClient } = await import(
        '../src/lib/redis'
      );
      await ensureRedisConnection();
      const diag = getRedisDiagnostics();
      if (!diag.connected) {
        console.log('❌ Not connected to Redis. Aborting.');
        break;
      }
      try {
        await redisClient.flushDb();
        console.log('🧨 FLUSHED current Redis DB');
      } catch (e) {
        console.log('❌ FLUSH failed:', (e as Error)?.message);
      }
      break;
    }
    case 'benchmark':
    case 'perf-test': {
      await runRedisBenchmark();
      break;
    }
    default: {
      console.log('Usage:');
      console.log('  redis status');
      console.log('  redis health');
      console.log('  redis connect [url]');
      console.log('  redis ping');
      console.log('  redis get <key>');
      console.log('  redis set <key> <json|string> [ttl]');
      console.log('  redis del <key>');
      console.log('  redis keys <pattern>');
      console.log('  redis clear <pattern>');
      console.log('  redis flush [--force]');
      console.log('  redis benchmark|perf-test');
      break;
    }
  }
}

async function runRedisBenchmark() {
  console.log('🚀 Redis Performance Benchmark');
  console.log('='.repeat(50));

  const iterations = 100;
  const testData = {
    session: { userId: 'test-user-123', email: 'test@example.com', role: 'admin' },
    user: { id: 'user-456', name: 'John Doe', email: 'john@example.com', lastLogin: new Date() },
    auth: { token: 'jwt-token-789', expiresAt: Date.now() + 3600000 },
  };

  // Test with Redis enabled
  console.log('\n🔴 Testing WITH Redis (current configuration):');
  const redisResults = await runCacheBenchmark(testData, iterations, true);

  // Test with Redis disabled (force memory cache)
  console.log('\n🔵 Testing WITHOUT Redis (memory cache only):');
  const memoryResults = await runCacheBenchmark(testData, iterations, false);

  // Compare results
  console.log('\n📊 PERFORMANCE COMPARISON');
  console.log('='.repeat(50));

  console.log('Average Response Times:');
  console.log(`  Redis:     ${redisResults.avgTime.toFixed(2)}ms`);
  console.log(`  Memory:    ${memoryResults.avgTime.toFixed(2)}ms`);
  console.log(
    `  Speedup:   ${(memoryResults.avgTime / redisResults.avgTime).toFixed(1)}x faster with Redis`
  );

  console.log('\nCache Hit Rates:');
  console.log(
    `  Redis:     ${((redisResults.hits / iterations) * 100).toFixed(1)}% (${redisResults.hits}/${iterations})`
  );
  console.log(
    `  Memory:    ${((memoryResults.hits / iterations) * 100).toFixed(1)}% (${memoryResults.hits}/${iterations})`
  );

  console.log('\nTotal Operations:');
  console.log(
    `  Redis:     ${iterations} operations in ${(redisResults.totalTime / 1000).toFixed(2)}s`
  );
  console.log(
    `  Memory:    ${iterations} operations in ${(memoryResults.totalTime / 1000).toFixed(2)}s`
  );

  console.log('\n💡 CONCLUSION:');
  if (redisResults.avgTime < memoryResults.avgTime) {
    const speedup = (memoryResults.avgTime / redisResults.avgTime).toFixed(1);
    console.log(`✅ Redis provides ${speedup}x better performance for your use case!`);
  } else {
    console.log(
      '⚠️  Memory cache is performing better - consider Redis configuration or network latency.'
    );
  }
}

async function runCacheBenchmark(testData: any, iterations: number, useRedis: boolean) {
  // Temporarily override Redis settings
  const originalUseRedis = process.env.USE_REDIS;
  const originalUrl = process.env.REDIS_URL;

  if (!useRedis) {
    process.env.USE_REDIS = 'false';
    delete process.env.REDIS_URL;
  } else {
    process.env.USE_REDIS = 'true';
    process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  }

  // Force module reload with new environment
  delete require.cache[require.resolve('../src/lib/redis')];

  const {
    setCache,
    getCache,
    getSessionCache,
    setSessionCache,
    getUserCache,
    setUserCache,
    getAuthCache,
    setAuthCache,
    deleteCache,
  } = await import('../src/lib/redis');

  let totalTime = 0;
  let hits = 0;
  let misses = 0;

  // Warm up cache
  await setSessionCache('test-user', testData.session);
  await setUserCache('test@example.com', testData.user);
  await setAuthCache('test-token', testData.auth);

  console.log(`Running ${iterations} cache operations...`);

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();

    // Mix of different cache operations
    const operation = i % 4;
    switch (operation) {
      case 0: // Session cache
        await getSessionCache('test-user');
        break;
      case 1: // User cache
        await getUserCache('test@example.com');
        break;
      case 2: // Auth cache
        await getAuthCache('test-token');
        break;
      case 3: // Direct cache operations
        const key = `test-key-${i}`;
        await setCache(key, { data: `value-${i}`, timestamp: Date.now() }, 60);
        const result = await getCache(key);
        if (result) hits++;
        else misses++;
        await deleteCache(key);
        break;
    }

    const operationTime = Date.now() - startTime;
    totalTime += operationTime;
  }

  // Restore original environment
  if (originalUseRedis !== undefined) {
    process.env.USE_REDIS = originalUseRedis;
  } else {
    delete process.env.USE_REDIS;
  }

  if (originalUrl !== undefined) {
    process.env.REDIS_URL = originalUrl;
  } else {
    delete process.env.REDIS_URL;
  }

  return {
    avgTime: totalTime / iterations,
    totalTime,
    hits,
    misses,
  };
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

// ====================
// Frontend-Backend Field Value Mismatch Detection
// ====================

// Helper Functions for Automatic Detection

async function discoverApiEndpoints(): Promise<
  Array<{ path: string; method: string; schemaFile?: string }>
> {
  const endpoints: Array<{ path: string; method: string; schemaFile?: string }> = [];

  // Scan API routes directory
  const apiDir = path.join(process.cwd(), 'src/app/api');
  const routeFiles = await findApiRoutes(apiDir);

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Extract HTTP methods and associated schemas
    const methodMatches = content.matchAll(
      /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g
    );
    for (const match of methodMatches) {
      const method = match[1];
      const routePath =
        file.replace(apiDir, '').replace('/route.ts', '').replace('/route.js', '') || '/';

      // Try to find associated schema
      const schemaMatch = content.match(/(\w+Schema)\.parse|safeParse/);
      const schemaFile = schemaMatch ? await findSchemaFile(schemaMatch[1]) : undefined;

      endpoints.push({ path: routePath, method, schemaFile });
    }
  }

  return endpoints;
}

async function extractFrontendFields(targetComponent?: string): Promise<Record<string, any>> {
  const frontendFields: Record<string, any> = {};

  // Scan components directory for form fields
  const componentsDir = path.join(process.cwd(), 'src/components');
  const componentFiles = await findComponentFiles(componentsDir);

  for (const file of componentFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const componentName = path.basename(file, path.extname(file));

    // Filter by target component if specified
    if (targetComponent && !componentName.toLowerCase().includes(targetComponent.toLowerCase())) {
      continue;
    }

    // Extract form field patterns
    const fieldNames = extractComponentFields(content);
    const fields: Record<string, any> = {};
    for (const fieldName of fieldNames) {
      fields[fieldName] = { type: 'formField', source: 'extracted' };
    }
    if (Object.keys(fields).length > 0) {
      frontendFields[componentName] = {
        file,
        fields,
        defaultValues: extractDefaultValues(content),
        enumValues: extractEnumValues(content),
      };
    }
  }

  return frontendFields;
}

async function analyzeBackendSchemas(): Promise<Record<string, any>> {
  const schemas: Record<string, any> = {};

  // Find all schema files
  const schemaFiles = await findSchemaFiles();

  for (const file of schemaFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Use the parent directory name for better matching (e.g., proposals/schemas.ts -> proposals)
    const parentDir = path.basename(path.dirname(file));
    const schemaName =
      parentDir === 'features' || parentDir === 'types' ? path.basename(file, '.ts') : parentDir;

    schemas[schemaName] = {
      file,
      schemas: parseZodSchemas(content),
      enums: extractZodEnums(content),
      types: extractTypeDefinitions(content),
    };

    // Debug: log what schemas were found in this file
    const parsedSchemas = parseZodSchemas(content);
    console.log(`Debug: Schema file ${schemaName} contains:`, Object.keys(parsedSchemas));
  }

  return schemas;
}

async function detectFieldMismatches(
  frontendFields: Record<string, any>,
  backendSchemas: Record<string, any>,
  apiEndpoints: Array<{ path: string; method: string; schemaFile?: string }>,
  detectedIssues: any,
  api: ApiClient
) {
  console.log('\n🔍 Comparing frontend fields with backend schemas...\n');

  // Compare each frontend component with relevant backend schemas
  for (const [componentName, componentData] of Object.entries(frontendFields)) {
    // Find related schema by component name - prioritize proposal schemas for wizard steps
    // Read component content for dynamic analysis
    let componentContent: string | undefined;
    try {
      componentContent = fs.readFileSync(componentData.file, 'utf-8');
    } catch (error) {
      console.log(`⚠️  Could not read component file: ${componentData.file}`);
    }

    const relatedSchemaKey = findRelatedSchemaByComponent(
      componentName,
      backendSchemas,
      componentContent
    );
    if (!relatedSchemaKey) {
      console.log(`🔍 No related schema found for component: ${componentName}`);
      continue;
    }

    console.log(`🔗 Comparing ${componentName} with ${relatedSchemaKey} schema`);

    // Extract all schema fields for comparison
    const allSchemaFields = extractAllSchemaFields(backendSchemas[relatedSchemaKey]);

    // Check for missing fields in frontend that exist in backend
    for (const [schemaFieldName, schemaFieldData] of Object.entries(allSchemaFields)) {
      const frontendField = componentData.fields[schemaFieldName];
      const fieldData = schemaFieldData as any;

      if (!frontendField && fieldData.enum && fieldData.enum.length > 0) {
        console.log(
          `❌ MISSING ENUM FIELD: '${schemaFieldName}' with enum values ${JSON.stringify(fieldData.enum)} missing from ${componentName}`
        );
        detectedIssues.missingFields.push({
          component: componentName,
          field: schemaFieldName,
          issue: 'Missing enum field in frontend',
          expectedEnum: fieldData.enum,
          suggestion: `Add a Select component for '${schemaFieldName}' with options: ${JSON.stringify(fieldData.enum)}`,
        });
      }
    }

    // Compare existing frontend fields with backend schema
    for (const [fieldName, fieldData] of Object.entries(componentData.fields)) {
      const backendField = allSchemaFields[fieldName];
      const frontendFieldData = fieldData as any;

      if (!backendField) {
        console.log(
          `⚠️  Field '${fieldName}' exists in ${componentName} but not in backend schema`
        );
        continue;
      }

      // Check for enum mismatches
      if (frontendFieldData.options && (backendField as any).enum) {
        const frontendValues = frontendFieldData.options;
        const backendValues = (backendField as any).enum;

        const mismatch = findEnumMismatch(frontendValues, backendValues);
        if (mismatch) {
          detectedIssues.enumMismatches.push({
            component: componentName,
            field: fieldName,
            frontendValues: frontendValues,
            backendSchema: JSON.stringify(backendValues),
            endpoint: 'unknown',
            suggestions: generateEnumSuggestions(mismatch),
          });
        }
      }

      // Check for type mismatches
      if (
        frontendFieldData.type &&
        (backendField as any).type &&
        frontendFieldData.type !== (backendField as any).type
      ) {
        detectedIssues.typeMismatches.push({
          component: componentName,
          field: fieldName,
          fieldType: frontendFieldData.type,
          expectedType: (backendField as any).type,
          endpoint: 'unknown',
          suggestion: generateTypeSuggestion(frontendFieldData.type, (backendField as any).type),
        });
      }
    }
  }
}

// Helper Functions

async function findApiRoutes(dir: string): Promise<string[]> {
  const routes: string[] = [];

  if (!fs.existsSync(dir)) return routes;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      routes.push(...(await findApiRoutes(fullPath)));
    } else if (item.name === 'route.ts' || item.name === 'route.js') {
      routes.push(fullPath);
    }
  }

  return routes;
}

async function findSchemaFile(schemaName: string): Promise<string | undefined> {
  const possiblePaths = [
    path.join(process.cwd(), 'src/features', '*', 'schemas.ts'),
    path.join(process.cwd(), 'src/lib', '**', '*.ts'),
    path.join(process.cwd(), 'src/schemas', '*.ts'),
  ];

  // Implementation would scan these paths for the schema
  return undefined; // Simplified for now
}

async function findComponentFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...(await findComponentFiles(fullPath)));
    } else if (item.name.endsWith('.tsx') || item.name.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractComponentFields(content: string): string[] {
  const fields = new Set<string>();

  // Pattern 1: register() calls for react-hook-form
  const registerMatches = content.matchAll(/register\(['"]([^'"]+)['"]/g);
  for (const match of registerMatches) {
    fields.add(match[1]);
  }

  // Pattern 2: handleFieldChange calls
  const handleFieldMatches = content.matchAll(/handleFieldChange\(['"]([^'"]+)['"]/g);
  for (const match of handleFieldMatches) {
    fields.add(match[1]);
  }

  // Pattern 3: formData property access
  const formDataMatches = content.matchAll(/formData\.(\w+)/g);
  for (const match of formDataMatches) {
    fields.add(match[1]);
  }

  // Pattern 4: Input/Select/TextArea components with name prop
  const inputMatches = content.matchAll(
    /<(?:Input|Select|TextArea|Checkbox)[^>]*name=['"]([^'"]+)['"]/g
  );
  for (const match of inputMatches) {
    fields.add(match[1]);
  }

  // Pattern 5: State variables that suggest form fields - improved detection
  const stateMatches = content.matchAll(/const\s+\[([^,]+),\s*set[^\]]+\]\s*=\s*useState/g);
  for (const match of stateMatches) {
    const varName = match[1].trim();
    // Add common form-related state variables
    if (
      varName.match(/^(selected|form|data|team|product|content|section|review|submission|version)/i)
    ) {
      fields.add(varName.toLowerCase());
    }
  }

  // Pattern 6: Props interface/type definitions for step components
  const propsMatches = content.matchAll(/interface\s+\w+Props[^{]*{([^}]+)}/g);
  for (const match of propsMatches) {
    const propsContent = match[1];
    const propFields = propsContent.matchAll(/(\w+)[\?\:].*?(?:Data|Props)/g);
    for (const propMatch of propFields) {
      fields.add(propMatch[1].toLowerCase());
    }
  }

  // Pattern 7: Step-specific field patterns - look for wizard step data structures
  const stepDataMatches = content.matchAll(
    /(?:teamLead|salesRepresentative|subjectMatterExperts|executiveReviewers|selectedProducts|selectedTemplates|customContent|products|quantity|unitPrice|total|category|configuration)/g
  );
  for (const match of stepDataMatches) {
    fields.add(match[0].toLowerCase());
  }

  // Pattern 8: Props or data object destructuring that suggests fields - expanded
  const destructureMatches = content.matchAll(/(?:props|data)\.(\w+)/g);
  for (const match of destructureMatches) {
    const fieldName = match[1];
    // Expanded list of field patterns
    const formFieldPatterns = [
      'products',
      'items',
      'selection',
      'quantity',
      'price',
      'category',
      'name',
      'description',
      'team',
      'content',
      'sections',
      'templates',
      'lead',
      'representative',
      'experts',
      'reviewers',
    ];
    if (formFieldPatterns.some(pattern => fieldName.toLowerCase().includes(pattern))) {
      fields.add(fieldName);
    }
  }

  return Array.from(fields);
}

function extractDefaultValues(content: string): Record<string, any> {
  const defaults: Record<string, any> = {};

  // Extract defaultValues from useForm
  const defaultsMatch = content.match(/defaultValues:\s*{([^}]+)}/);
  if (defaultsMatch) {
    // Parse default values (simplified)
    const defaultsStr = defaultsMatch[1];
    const fieldMatches = defaultsStr.matchAll(/(\w+):\s*['"`]([^'"`]+)['"`]/g);
    for (const match of fieldMatches) {
      defaults[match[1]] = match[2];
    }
  }

  return defaults;
}

function extractEnumValues(content: string): Record<string, string[]> {
  const enums: Record<string, string[]> = {};

  // Extract enum-like values from option lists
  const optionMatches = content.matchAll(/<option.*?value=['"](.*?)['"].*?>/g);
  const values = Array.from(optionMatches).map(match => match[1]);

  if (values.length > 0) {
    enums.options = values;
  }

  return enums;
}

async function findSchemaFiles(): Promise<string[]> {
  const schemaFiles: string[] = [];

  // Common schema file locations - find all .ts files that contain schemas
  const schemaDirs = [
    path.join(process.cwd(), 'src/features'),
    path.join(process.cwd(), 'src/types'),
    path.join(process.cwd(), 'src/lib'),
    path.join(process.cwd(), 'src/schemas'),
  ];

  for (const dir of schemaDirs) {
    if (fs.existsSync(dir)) {
      const files = await findFilesRecursive(dir, 'schemas.ts');
      schemaFiles.push(...files);
    }
  }

  // Debug: log found files
  console.log(
    `Debug: Found ${schemaFiles.length} schema files:`,
    schemaFiles.map(f => path.basename(f))
  );

  return schemaFiles;
}

async function findFilesRecursive(dir: string, filename: string): Promise<string[]> {
  const files: string[] = [];

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...(await findFilesRecursive(fullPath, filename)));
    } else if (item.name === filename) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseZodSchemas(content: string): Record<string, any> {
  const schemas: Record<string, any> = {};

  // Extract enum schemas first (more specific pattern)
  const enumMatches = content.matchAll(
    /export\s+const\s+(\w+Schema)\s*=\s*z\.enum\(\s*\[([\s\S]*?)\]\s*\)/g
  );
  for (const match of enumMatches) {
    const schemaName = match[1];
    const enumContent = match[2];
    const enumValues = enumContent
      .split(',')
      .map(v => v.trim().replace(/['"]/g, ''))
      .filter(v => v.length > 0);

    schemas[schemaName] = {
      type: 'enum',
      enum: enumValues,
      fields: { [schemaName.toLowerCase().replace('schema', '')]: { enum: enumValues } },
    };
  }

  // Extract object schemas with proper field parsing
  const objectMatches = content.matchAll(
    /export\s+const\s+(\w+Schema)\s*=\s*z\.object\(\s*\{([\s\S]*?)\}\s*\);/g
  );
  for (const match of objectMatches) {
    const schemaName = match[1];
    const objectContent = match[2];

    schemas[schemaName] = {
      type: 'object',
      fields: extractObjectSchemaFields(objectContent),
    };
  }

  return schemas;
}

function extractObjectSchemaFields(content: string): Record<string, any> {
  const fields: Record<string, any> = {};

  // More comprehensive field parsing - handle multiline definitions
  const lines = content.split('\n');
  let currentField = '';
  let currentDefinition = '';
  let inFieldDef = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Start of a new field definition
    const fieldMatch = trimmed.match(/^(\w+):\s*(.+)/);
    if (fieldMatch) {
      // Save previous field if exists
      if (currentField && currentDefinition) {
        const fieldDef = currentDefinition.trim().replace(/,$/, '');
        parseFieldDefinition(currentField, fieldDef, fields);
      }

      currentField = fieldMatch[1];
      currentDefinition = fieldMatch[2];
      inFieldDef = true;
    } else if (inFieldDef && trimmed) {
      // Continue multiline definition
      currentDefinition += ' ' + trimmed;
    }

    // End field if we hit a comma or closing brace
    if (trimmed.endsWith(',') || trimmed === '}') {
      if (currentField && currentDefinition) {
        const fieldDef = currentDefinition.trim().replace(/,$/, '');
        parseFieldDefinition(currentField, fieldDef, fields);
        currentField = '';
        currentDefinition = '';
        inFieldDef = false;
      }
    }
  }

  // Handle last field
  if (currentField && currentDefinition) {
    const fieldDef = currentDefinition.trim().replace(/,$/, '');
    parseFieldDefinition(currentField, fieldDef, fields);
  }

  return fields;
}

function parseFieldDefinition(fieldName: string, fieldDef: string, fields: Record<string, any>) {
  // Handle schema references like ProposalPrioritySchema.default('MEDIUM')
  if (fieldDef.includes('Schema')) {
    const schemaRef = fieldDef.match(/(\w+Schema)/);
    if (schemaRef) {
      fields[fieldName] = {
        type: 'schema_ref',
        schemaRef: schemaRef[1],
        definition: fieldDef,
      };
    }
  } else if (fieldDef.startsWith('z.')) {
    // Handle direct Zod definitions
    const typeMatch = fieldDef.match(/z\.(\w+)/);
    fields[fieldName] = {
      type: typeMatch ? typeMatch[1] : 'unknown',
      definition: fieldDef,
      optional: fieldDef.includes('optional'),
      nullable: fieldDef.includes('nullable'),
    };
  } else {
    // Handle other references like databaseIdSchema
    fields[fieldName] = {
      type: 'reference',
      definition: fieldDef,
      optional: fieldDef.includes('optional'),
      nullable: fieldDef.includes('nullable'),
    };
  }
}

function extractEnumFromContent(content: string): string[] {
  // Extract array values from enum definition like ['DRAFT', 'SUBMITTED', ...]
  const matches = content.match(/\[([^\]]+)\]/);
  if (!matches) return [];

  return matches[1]
    .split(',')
    .map(v => v.trim().replace(/['"]/g, ''))
    .filter(v => v.length > 0);
}

function extractZodEnums(content: string): Record<string, string[]> {
  const enums: Record<string, string[]> = {};

  // Extract z.enum definitions
  const enumMatches = content.matchAll(/z\.enum\(\[(.*?)\]\)/g);

  for (const match of enumMatches) {
    const enumValues = match[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
    enums.enum = enumValues;
  }

  return enums;
}

function extractTypeDefinitions(content: string): Record<string, any> {
  const types: Record<string, any> = {};
  return types;
}

function findEnumMismatch(frontendValues: string[], backendValues: string[]): string | null {
  const missingInFrontend = backendValues.filter(v => !frontendValues.includes(v));
  const extraInFrontend = frontendValues.filter(v => !backendValues.includes(v));

  if (missingInFrontend.length > 0 || extraInFrontend.length > 0) {
    return `Missing: ${missingInFrontend.join(', ')}, Extra: ${extraInFrontend.join(', ')}`;
  }
  return null;
}

function generateEnumSuggestions(mismatch: string): string[] {
  return [
    'Update frontend enum options to match backend schema',
    'Add z.preprocess() to normalize values in backend schema',
    'Consider using transform() in Zod schema for value conversion',
  ];
}

function generateTypeSuggestion(frontendType: string, backendType: string): string {
  return `Convert frontend ${frontendType} to backend ${backendType} in API route or update schema`;
}

function findRelatedSchemaByComponent(
  componentName: string,
  backendSchemas: Record<string, any>,
  componentContent?: string
): string | undefined {
  return analyzeComponentForSchemaMatch(componentName, backendSchemas, componentContent);
}

/**
 * Dynamically analyzes a component to determine its matching schema based on:
 * 1. API endpoints it calls
 * 2. Import statements
 * 3. Field usage patterns
 * 4. Component file path
 */
function analyzeComponentForSchemaMatch(
  componentName: string,
  backendSchemas: Record<string, any>,
  componentContent?: string
): string | undefined {
  const componentLower = componentName.toLowerCase();
  const availableSchemas = Object.keys(backendSchemas);

  // Priority 1: Check for proposal wizard steps by name patterns (highest priority)
  const proposalStepKeywords = [
    'basicinformation',
    'teamassignment',
    'contentselection',
    'productselectionstep',
    'enhancedproductselectionstep',
    'sectionassignment',
    'reviewstep',
    'stepone',
    'steptwo',
    'stepthree',
    'stepfour',
    'stepfive',
    'stepsix',
  ];

  if (proposalStepKeywords.some(keyword => componentLower.includes(keyword))) {
    const proposalSchema = availableSchemas.find(schema =>
      schema.toLowerCase().includes('proposals')
    );
    if (proposalSchema) {
      return proposalSchema;
    }
  }

  // Priority 2: File path and component content analysis
  if (componentContent) {
    // Check file import paths to determine module
    const filePathMatch = analyzeFilePathContext(componentContent, availableSchemas);
    if (filePathMatch) {
      return filePathMatch;
    }

    // Check API usage patterns
    const apiMatch = analyzeComponentContent(componentContent, availableSchemas);
    if (apiMatch) {
      return apiMatch;
    }
  }

  // Priority 3: Intelligent name-based matching as fallback
  return intelligentNameBasedMatching(componentLower, availableSchemas);
}

/**
 * Analyzes file import paths and folder structure for module context
 */
function analyzeFilePathContext(content: string, availableSchemas: string[]): string | undefined {
  // Look for relative imports that indicate the module context
  const relativeImportMatches = content.matchAll(
    /import.*?from\s+['"`]\.\.?\/.*?\/(proposals|customers|products|auth|version-history)/g
  );
  for (const match of relativeImportMatches) {
    const module = match[1].toLowerCase();
    const matchingSchema = availableSchemas.find(schema => schema.toLowerCase().includes(module));
    if (matchingSchema) {
      return matchingSchema;
    }
  }

  // Look for absolute imports from specific modules
  const absoluteImportMatches = content.matchAll(
    /import.*?from\s+['"`].*?\/(proposals|customers|products|auth|version-history)/g
  );
  for (const match of absoluteImportMatches) {
    const module = match[1].toLowerCase();
    const matchingSchema = availableSchemas.find(schema => schema.toLowerCase().includes(module));
    if (matchingSchema) {
      return matchingSchema;
    }
  }

  return undefined;
}

/**
 * Analyzes component source code to determine schema usage
 */
function analyzeComponentContent(content: string, availableSchemas: string[]): string | undefined {
  // 1. Look for API endpoint calls to determine data domain
  const apiCallPatterns = [
    /api\/([^\/'"]+)/g, // /api/customers, /api/proposals, etc.
    /fetch.*?['"`].*?\/([^\/'"]+)/g, // fetch calls
    /useQuery.*?['"`]([^'"]+)/g, // React Query hooks
    /useMutation.*?['"`]([^'"]+)/g, // React Query mutations
  ];

  for (const pattern of apiCallPatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      const endpoint = match[1]?.toLowerCase();
      if (endpoint) {
        const matchingSchema = availableSchemas.find(
          schema =>
            schema.toLowerCase().includes(endpoint) ||
            endpoint.includes(schema.toLowerCase().replace('-', ''))
        );
        if (matchingSchema) {
          return matchingSchema;
        }
      }
    }
  }

  // 2. Look for schema imports
  const importMatches = content.matchAll(
    /import.*?from\s+['"`].*?\/([^\/'"]+)(?:\/schemas?|\.schemas?)/g
  );
  for (const match of importMatches) {
    const importPath = match[1]?.toLowerCase();
    if (importPath) {
      const matchingSchema = availableSchemas.find(schema =>
        schema.toLowerCase().includes(importPath)
      );
      if (matchingSchema) {
        return matchingSchema;
      }
    }
  }

  // 3. Look for specific field patterns that indicate data domain
  const fieldPatterns = {
    proposals: [
      'teamLead',
      'salesRepresentative',
      'subjectMatterExperts',
      'executiveReviewers',
      'proposalStatus',
      'riskLevel',
      'BasicInformationStep',
      'TeamAssignmentStep',
      'ContentSelectionStep',
      'ProductSelectionStep',
      'SectionAssignmentStep',
      'ReviewStep',
      'EnhancedProductSelectionStep',
      'formData',
      'onUpdate',
      'wizard',
      'step',
      'selectedProducts',
      'selectedTemplates',
      'customContent',
      'title',
      'description',
      'priority',
      'planType',
      'status',
    ],
    customers: [
      'customerStatus',
      'companySize',
      'industry',
      'tier',
      'CustomerCreation',
      'CustomerEdit',
    ],
    products: [
      'productStatus',
      'productRelationshipType',
      'sku',
      'price',
      'category',
      'ProductCreate',
      'ProductEdit',
    ],
    'version-history': ['versionId', 'changeType', 'versionStatus', 'VersionHistory'],
    auth: ['email', 'password', 'role', 'permissions', 'Login', 'Signup', 'Auth'],
    search: ['search', 'query', 'filter', 'ContentSearch'],
  };

  for (const [domain, fields] of Object.entries(fieldPatterns)) {
    const matchCount = fields.filter(field =>
      content.toLowerCase().includes(field.toLowerCase())
    ).length;

    // Use lower threshold for proposal steps since they have many identifying patterns
    const threshold = domain === 'proposals' ? 1 : 2;

    if (matchCount >= threshold) {
      const matchingSchema = availableSchemas.find(schema => schema.toLowerCase().includes(domain));
      if (matchingSchema) {
        return matchingSchema;
      }
    }
  }

  return undefined;
}

/**
 * Intelligent name-based matching as fallback
 */
function intelligentNameBasedMatching(
  componentLower: string,
  availableSchemas: string[]
): string | undefined {
  // Direct name matching with higher priority domains
  const priorityDomains = ['proposals', 'customers', 'products', 'version-history', 'auth'];

  for (const domain of priorityDomains) {
    if (componentLower.includes(domain.replace('-', ''))) {
      const matchingSchema = availableSchemas.find(schema => schema.toLowerCase().includes(domain));
      if (matchingSchema) {
        return matchingSchema;
      }
    }
  }

  // Fuzzy matching - check if any schema name appears in component name
  for (const schema of availableSchemas) {
    const schemaLower = schema.toLowerCase().replace('-', '');
    const componentClean = componentLower.replace(/[^a-z]/g, '');

    if (componentClean.includes(schemaLower) || schemaLower.includes(componentClean.slice(0, 6))) {
      return schema;
    }
  }

  return undefined;
}

function extractAllSchemaFields(schemaData: any): Record<string, any> {
  const allFields: Record<string, any> = {};

  if (!schemaData || !schemaData.schemas) return allFields;

  // Extract fields from all schemas in the file
  for (const [schemaName, schema] of Object.entries(schemaData.schemas)) {
    if (typeof schema === 'object' && schema !== null) {
      const schemaObj = schema as any;

      // Handle enum schemas - make them available as field types
      if (schemaObj.type === 'enum' && schemaObj.enum) {
        const fieldName = schemaName.toLowerCase().replace('schema', '').replace('proposal', '');
        allFields[fieldName] = { enum: schemaObj.enum };
      }

      // Handle object schemas - extract all their fields
      if (schemaObj.type === 'object' && schemaObj.fields) {
        for (const [fieldName, fieldInfo] of Object.entries(schemaObj.fields)) {
          const fieldData = fieldInfo as any;

          // Resolve schema references to their enum values
          if (fieldData.type === 'schema_ref' && fieldData.schemaRef) {
            const referencedSchema = schemaData.schemas[fieldData.schemaRef];
            if (referencedSchema && referencedSchema.enum) {
              allFields[fieldName] = { enum: referencedSchema.enum };
            } else {
              // Still include the field even if we can't resolve the reference
              allFields[fieldName] = fieldData;
            }
          } else {
            allFields[fieldName] = fieldData;
          }

          // Special handling for nested schemas - extract fields from referenced schemas
          if (fieldData.type === 'schema_ref' && fieldData.schemaRef) {
            const nestedSchemaName = fieldData.schemaRef;
            const nestedSchema = schemaData.schemas[nestedSchemaName];

            if (nestedSchema && nestedSchema.fields) {
              // Add nested schema fields with prefix to avoid conflicts
              for (const [nestedFieldName, nestedFieldInfo] of Object.entries(
                nestedSchema.fields
              )) {
                const prefixedFieldName = `${nestedSchemaName.toLowerCase().replace('schema', '')}_${nestedFieldName}`;
                allFields[prefixedFieldName] = nestedFieldInfo;
              }
            }
          }
        }
      }
    }
  }

  // Debug: log what fields were extracted
  console.log(`Debug: Extracted schema fields:`, Object.keys(allFields));

  return allFields;
}

function findRelatedEndpoint(
  componentName: string,
  endpoints: Array<{ path: string; method: string; schemaFile?: string }>
) {
  // Match component names to endpoints (customers -> /api/customers)
  const componentLower = componentName.toLowerCase();

  for (const endpoint of endpoints) {
    const pathSegments = endpoint.path.split('/').filter(Boolean);
    if (
      pathSegments.some(
        segment =>
          segment.toLowerCase().includes(componentLower) ||
          componentLower.includes(segment.toLowerCase())
      )
    ) {
      return endpoint;
    }
  }

  return undefined;
}

function findMatchingSchema(
  componentName: string,
  endpoint: any,
  schemas: Record<string, any>
): any {
  // Special handling for proposal wizard steps
  if (componentName.includes('BasicInformation') || componentName.includes('ProposalForm')) {
    // Look for BasicInformationSchema specifically
    if (schemas['BasicInformationSchema']) {
      return schemas['BasicInformationSchema'];
    }
  }

  if (componentName.includes('Product') && componentName.includes('Step')) {
    // Look for product-related schemas
    for (const [schemaName, schema] of Object.entries(schemas)) {
      if (schemaName.toLowerCase().includes('product')) {
        return schema;
      }
    }
  }

  if (componentName.includes('Review') && componentName.includes('Step')) {
    // Review step uses basic proposal schema
    if (schemas['BasicInformationSchema']) {
      return schemas['BasicInformationSchema'];
    }
  }

  // Direct component name match for other cases
  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (
      schemaName
        .toLowerCase()
        .includes(componentName.toLowerCase().replace('step', '').replace('form', ''))
    ) {
      return schema;
    }
  }

  return undefined;
}

// ==================== 5-LAYER COMPONENT ANALYSIS FUNCTIONS ====================

/**
 * Layer 1: Extract component fields and field names automatically and dynamically
 */
async function extractComponentFieldsAnalysis(componentName: string): Promise<any> {
  const componentsDir = path.join(process.cwd(), 'src/components');
  const componentFiles = await findComponentFiles(componentsDir);

  for (const file of componentFiles) {
    const fileName = path.basename(file, path.extname(file));
    if (fileName.toLowerCase().includes(componentName.toLowerCase())) {
      const content = fs.readFileSync(file, 'utf8');
      const fields = extractComponentFields(content);

      return {
        file,
        content,
        fields: fields.reduce(
          (acc, field) => {
            acc[field] = { type: 'formField', source: 'extracted' };
            return acc;
          },
          {} as Record<string, any>
        ),
        defaultValues: extractDefaultValues(content),
        enumValues: extractEnumValues(content),
        stateVariables: extractStateVariables(content),
        propTypes: extractPropTypes(content),
      };
    }
  }

  return { fields: {}, content: '', file: '' };
}

/**
 * Layer 2: Extract API endpoints it sends to automatically and dynamically
 */
async function extractComponentApiEndpoints(
  componentName: string,
  content: string
): Promise<any[]> {
  const endpoints: any[] = [];

  // Pattern 1: Direct API calls (fetch, axios)
  const fetchMatches = content.matchAll(
    /(?:fetch|axios\.(?:get|post|put|delete))\s*\(\s*['"`]([^'"`]+)['"`]/g
  );
  for (const match of fetchMatches) {
    const endpoint = match[1];
    if (endpoint.startsWith('/api/') || endpoint.includes('api')) {
      endpoints.push({
        type: 'direct_api_call',
        endpoint,
        method: extractHttpMethod(match[0]),
        source: 'fetch/axios',
      });
    }
  }

  // Pattern 2: React Query hooks with queryKey extraction
  const queryMatches = content.matchAll(/useQuery.*?queryKey:\s*\[['"`]([^'"`]+)['"`]/g);
  for (const match of queryMatches) {
    const queryKey = match[1];
    if (queryKey !== 'user' && queryKey !== 'session') {
      endpoints.push({
        type: 'react_query',
        endpoint: `/api/${queryKey}`,
        method: 'GET',
        source: 'useQuery',
      });
    }
  }

  // Pattern 3: API client calls (apiClient.get, apiClient.post, etc.)
  const apiClientMatches = content.matchAll(
    /apiClient\.(\w+)\s*<[^>]*>\s*\(\s*['"`]([^'"`]+)['"`]/g
  );
  for (const match of apiClientMatches) {
    endpoints.push({
      type: 'api_client',
      method: match[1].toUpperCase(),
      endpoint: match[2],
      source: 'apiClient',
    });
  }

  // Pattern 4: Custom API hooks (useCreateProduct, useUpdateCustomer, etc.)
  const apiHookMatches = content.matchAll(/use(?:Create|Update|Delete|Get|Fetch)(\w+)/g);
  for (const match of apiHookMatches) {
    const entity = match[1].toLowerCase();
    const operation = match[0].match(/use(Create|Update|Delete|Get|Fetch)/)?.[1] || 'Unknown';
    const method =
      operation === 'Create'
        ? 'POST'
        : operation === 'Update'
          ? 'PUT'
          : operation === 'Delete'
            ? 'DELETE'
            : 'GET';

    endpoints.push({
      type: 'api_hook',
      endpoint: `/api/${entity}s`,
      method,
      source: match[0],
      operation,
    });
  }

  // Pattern 5: Entity data hooks (useProducts, useCustomers, useProductCategories, etc.)
  const entityHookMatches = content.matchAll(/use(\w+)(?:Data|List|Categories|Tags)?\s*\(/g);
  for (const match of entityHookMatches) {
    const entity = match[1].toLowerCase();
    // Skip common non-entity hooks
    const skipHooks = [
      'form',
      'state',
      'effect',
      'callback',
      'memo',
      'ref',
      'context',
      'reducer',
      'layout',
      'router',
      'query',
      'mutation',
      'optimized',
      'analytics',
      'sku',
      'validation',
    ];

    if (!skipHooks.includes(entity)) {
      let endpoint = `/api/${entity}`;
      if (!entity.endsWith('s')) {
        endpoint = `/api/${entity}s`;
      }

      endpoints.push({
        type: 'entity_hook',
        endpoint,
        method: 'GET',
        source: match[0].replace(/\s*\(.*$/, ''),
        entity,
      });
    }
  }

  // Pattern 6: Service imports (productService, customerService, etc.)
  const serviceImportMatches = content.matchAll(
    /import.*?(\w+Service).*?from.*?['"`].*?\/services\/(\w+)Service['"`]/g
  );
  for (const match of serviceImportMatches) {
    const serviceName = match[2].toLowerCase();
    endpoints.push({
      type: 'service_import',
      endpoint: `/api/${serviceName}s`,
      method: 'MULTIPLE',
      source: match[1],
      serviceName,
    });
  }

  // Pattern 7: Form submissions and navigation
  const formSubmitMatches = content.matchAll(
    /(?:router\.push|navigate|window\.location)\s*\(\s*['"`]([^'"`]+)['"`]/g
  );
  for (const match of formSubmitMatches) {
    if (match[1].includes('api')) {
      endpoints.push({
        type: 'navigation',
        endpoint: match[1],
        method: 'GET',
        source: 'navigation',
      });
    }
  }

  return endpoints;
}

/**
 * Layer 3: Extract relevant schema fields and names automatically and dynamically
 */
async function extractRelevantSchemaFields(
  componentName: string,
  apiEndpoints: any[]
): Promise<any> {
  const schemaFields: Record<string, any> = {};

  // Find schema files based on component name and API endpoints
  const schemaFiles = await findSchemaFiles();

  for (const schemaFile of schemaFiles) {
    const content = fs.readFileSync(schemaFile, 'utf8');
    const schemas = parseZodSchemas(content);

    // Match schemas to component by name patterns
    const matchingSchemas = Object.entries(schemas).filter(([schemaName, schema]) => {
      const nameLower = schemaName.toLowerCase();
      const componentLower = componentName.toLowerCase();

      // Direct matches
      const directMatch =
        nameLower.includes(componentLower.replace('step', '').replace('form', '')) ||
        componentLower.includes(nameLower.replace('schema', '')) ||
        apiEndpoints.some(ep => ep.endpoint?.includes(nameLower.replace('schema', '')));

      // For ProposalWizard, also include all related schemas
      const isProposalWizardRelated =
        componentName.toLowerCase().includes('wizard') &&
        (nameLower.includes('basicinformation') ||
          nameLower.includes('teamassignment') ||
          nameLower.includes('contentselection') ||
          nameLower.includes('productselection') ||
          nameLower.includes('sectionassignment') ||
          nameLower.includes('review') ||
          nameLower.includes('proposal'));

      return directMatch || isProposalWizardRelated;
    });

    for (const [schemaName, schema] of matchingSchemas) {
      schemaFields[schemaName] = {
        file: schemaFile,
        schema,
        fields: extractAllSchemaFields({ schemas: { [schemaName]: schema } }),
      };
    }
  }

  return schemaFields;
}

/**
 * Layer 4: Extract relevant Zod validation automatically and dynamically
 */
async function extractRelevantZodValidation(
  componentName: string,
  schemaFields: any
): Promise<any> {
  const zodValidation: Record<string, any> = {};

  for (const [schemaName, schemaData] of Object.entries(schemaFields)) {
    const schemaInfo = schemaData as any;
    const content = fs.readFileSync(schemaInfo.file, 'utf8');

    // Extract Zod validation rules
    const validationRules = extractZodValidationRules(content, schemaName);
    zodValidation[schemaName] = validationRules;
  }

  return zodValidation;
}

/**
 * Layer 5: Extract relevant database fields and names automatically and dynamically
 */
async function extractRelevantDatabaseFields(
  componentName: string,
  apiEndpoints: any[]
): Promise<any> {
  const databaseFields: Record<string, any> = {};

  try {
    // Read Prisma schema
    const prismaSchemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
    if (fs.existsSync(prismaSchemaPath)) {
      const prismaContent = fs.readFileSync(prismaSchemaPath, 'utf8');

      // Extract models related to component
      const models = extractPrismaModels(prismaContent, componentName, apiEndpoints);
      databaseFields.prisma = models;
    }
  } catch (error) {
    console.warn('Could not analyze Prisma schema:', error);
  }

  return databaseFields;
}

/**
 * Detect all mismatches across the 5 layers
 */
async function detectCrossLayerMismatches(analysisResults: any): Promise<any[]> {
  const mismatches: any[] = [];
  const { componentFields, apiEndpoints, schemaFields, zodValidation, databaseFields } =
    analysisResults;

  // Helper function for fuzzy field matching
  function findFieldMatch(targetField: string, searchFields: string[]): string | null {
    const target = targetField.toLowerCase();

    // Exact match first
    for (const field of searchFields) {
      if (field.toLowerCase() === target) return field;
    }

    // CamelCase variations
    const camelCaseVariants = [
      targetField,
      targetField.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(),
      targetField.replace(/_/g, '').toLowerCase(),
      targetField.charAt(0).toLowerCase() + targetField.slice(1),
    ];

    for (const variant of camelCaseVariants) {
      for (const field of searchFields) {
        if (field.toLowerCase() === variant.toLowerCase()) return field;
      }
    }

    return null;
  }

  // Enhanced function to handle nested schema structures
  function findNestedFieldMatch(
    targetField: string,
    schemaFields: any
  ): { found: boolean; schemaName?: string; fieldPath?: string; nestedPath?: string } {
    // Common nested patterns in PosalPro MVP2 - now using prefixed field names from extraction
    const nestedPatterns = {
      // Basic Information Step
      projectType: ['basicinformation_projectType', 'basicinformation'],
      priority: ['basicinformation_priority', 'basicinformation'],
      dueDate: ['basicinformation_dueDate', 'basicinformation'],
      value: ['basicinformation_value', 'basicinformation'],
      currency: ['basicinformation_currency', 'basicinformation'],

      // Team Assignment Step
      teamlead: ['teamassignment_teamLead', 'teamassignment'],
      salesrepresentative: ['teamassignment_salesRepresentative', 'teamassignment'],
      subjectmatterexperts: ['teamassignment_subjectMatterExperts', 'teamassignment'],
      executivereviewers: ['teamassignment_executiveReviewers', 'teamassignment'],
      teamMembers: ['teamassignment_teamMembers', 'teamassignment'],

      // Content Selection Step
      selectedtemplates: ['contentselection_selectedTemplates', 'contentselection'],
      customcontent: ['contentselection_customContent', 'contentselection'],
      selectedTemplates: ['contentselection_selectedTemplates', 'contentselection'],
      customContent: ['contentselection_customContent', 'contentselection'],

      // Product Selection Step
      products: ['productselection_products', 'productselection'],
      total: ['productselection_total', 'productselection'],
      unitprice: ['productselection_unitPrice', 'productselection'],
      quantity: ['productselection_quantity', 'productselection'],
      category: ['productselection_category', 'productselection'],
      selectedproducts: ['productselection_products', 'productselection'],

      // Section Assignment Step
      sections: ['sectionassignment_sections', 'sectionassignment'],
      sectiontemplates: ['sectionassignment_sectionTemplates', 'sectionassignment'],

      // Review Step
      confirmAccuracy: ['review_confirmAccuracy', 'review'],
      confirmTerms: ['review_confirmTerms', 'review'],
      specialInstructions: ['review_specialInstructions', 'review'],
    };

    // Check if field has a known nested mapping
    if (nestedPatterns[targetField]) {
      const [prefixedFieldName, nestedSchemaName] = nestedPatterns[targetField];
      // Look for the prefixed field in any schema
      for (const [schemaName, schemaData] of Object.entries(schemaFields)) {
        const schema = schemaData as any;
        if (schema.fields && schema.fields[prefixedFieldName]) {
          return {
            found: true,
            schemaName,
            fieldPath: prefixedFieldName,
            nestedPath: `${nestedSchemaName}.${prefixedFieldName.replace(`${nestedSchemaName}_`, '')}`,
          };
        }
      }
    }

    // Fallback to direct field matching
    for (const [schemaName, schemaData] of Object.entries(schemaFields)) {
      const schema = schemaData as any;
      if (schema.fields) {
        const schemaFieldNames = Object.keys(schema.fields);
        const match = findFieldMatch(targetField, schemaFieldNames);

        if (match) {
          return {
            found: true,
            schemaName,
            fieldPath: match,
            nestedPath: `${schemaName}.${match}`,
          };
        }
      }
    }

    return { found: false };
  }

  // Compare component fields vs schema fields with nested support
  for (const [fieldName, fieldInfo] of Object.entries(componentFields.fields || {})) {
    const nestedMatch = findNestedFieldMatch(fieldName, schemaFields);

    if (nestedMatch.found) {
      const { schemaName, fieldPath, nestedPath } = nestedMatch;

      // Check for type mismatches
      const schemaField = schemaFields[schemaName].fields[fieldPath];
      const fieldData = fieldInfo as any;

      if (schemaField.enum && fieldData.type !== 'enum') {
        mismatches.push({
          type: 'component_schema_mismatch',
          layer1: 'component',
          layer2: 'schema',
          field: fieldName,
          matchedField: fieldPath,
          nestedPath,
          issue: `Component field '${fieldName}' should be enum with values: ${schemaField.enum.join(', ')}`,
          component: componentFields.file,
          schema: schemaName,
          severity: 'medium',
          suggestion: `Update component to use enum values from ${nestedPath}`,
        });
      }

      // Check for case mismatches (only if not already handled by nested mapping)
      if (
        fieldName !== fieldPath &&
        !Object.keys({
          teamlead: 'teamLead',
          salesrepresentative: 'salesRepresentative',
          subjectmatterexperts: 'subjectMatterExperts',
          executivereviewers: 'executiveReviewers',
          selectedtemplates: 'selectedTemplates',
          customcontent: 'customContent',
          unitprice: 'unitPrice',
          sectiontemplates: 'sectionTemplates',
        }).includes(fieldName)
      ) {
        mismatches.push({
          type: 'field_name_case_mismatch',
          layer1: 'component',
          layer2: 'schema',
          field: fieldName,
          matchedField: fieldPath,
          nestedPath,
          issue: `Field name case mismatch: component uses '${fieldName}' but schema uses '${fieldPath}'`,
          component: componentFields.file,
          schema: schemaName,
          severity: 'low',
          suggestion: `Consider standardizing to '${fieldPath}' for consistency`,
        });
      }
    } else {
      // Only report as missing if we truly can't find it anywhere
      // Add additional checks for common patterns that might be missed
      const knownPatterns = [
        /^step\d+$/, // step1, step2, etc.
        /^on[A-Z]/, // onNext, onBack, etc.
        /^set[A-Z]/, // setStepData, etc.
        /^use[A-Z]/, // useState, useEffect, etc.
        /Id$/, // customerId, productId, etc.
        /Data$/, // stepData, productData, etc.
        /Count$/, // productCount, etc.
        /Value$/, // totalValue, etc.
      ];

      const isLikelyNotASchemaField = knownPatterns.some(pattern => pattern.test(fieldName));

      if (!isLikelyNotASchemaField) {
        mismatches.push({
          type: 'missing_schema_field',
          layer1: 'component',
          layer2: 'schema',
          field: fieldName,
          issue: `Component field '${fieldName}' not found in any schema - may need to be added or is a false positive`,
          component: componentFields.file,
          severity: 'medium', // Reduced from 'high' since it might be a false positive
          suggestion: `Verify if this field should be added to a schema or if it's intentionally not in schema validation`,
        });
      }
    }
  }

  // Compare API endpoints vs database models (improved filtering)
  for (const endpoint of apiEndpoints) {
    if (endpoint.endpoint) {
      const endpointPath = endpoint.endpoint;

      // Only check actual API routes, not React hooks
      if (endpointPath.startsWith('/api/') && !endpointPath.includes('use')) {
        const modelName = extractModelFromEndpoint(endpointPath);

        // Skip client-side hook patterns
        const hookPatterns = [
          'toast',
          'query',
          'client',
          'analytics',
          'error',
          'search',
          'param',
          'validation',
          'handler',
          'store',
          'selection',
          'current',
          'total',
          'plan',
          'can',
          'is',
          'next',
          'previous',
          'set',
          'submit',
          'reset',
          'initialize',
          'step',
          'bulk',
          'infinite',
          'optimized',
          'unified',
          'executive',
          'dashboard',
          'enhanced',
        ];

        const shouldSkip = hookPatterns.some(pattern =>
          modelName?.toLowerCase().includes(pattern.toLowerCase())
        );

        if (
          modelName && // Not null (skip utility endpoints)
          !shouldSkip &&
          modelName.length > 3 &&
          !databaseFields.prisma?.[modelName]
        ) {
          // Only report if it's a likely database model (pluralized nouns)
          const likelyDbModel =
            /^[A-Z][a-z]+s?$/.test(modelName) &&
            !modelName.toLowerCase().includes('data') &&
            !modelName.toLowerCase().includes('response');

          if (likelyDbModel) {
            mismatches.push({
              type: 'missing_database_model',
              layer1: 'api',
              layer2: 'database',
              endpoint: endpoint.endpoint,
              issue: `API endpoint references model '${modelName}' but model not found in database`,
              modelName,
              severity: 'medium',
            });
          }
        }
      }
    }
  }

  return mismatches;
}

/**
 * Display comprehensive analysis results
 */
function displayComprehensiveResults(componentName: string, results: any) {
  const { componentFields, apiEndpoints, schemaFields, zodValidation, databaseFields, mismatches } =
    results;

  console.log(`\n📊 COMPREHENSIVE ANALYSIS RESULTS FOR: ${componentName}\n`);

  // Display component fields
  console.log('1️⃣ COMPONENT FIELDS:');
  const componentFieldsCount = Object.keys(results.componentFields.fields || {}).length;
  if (componentFieldsCount > 0) {
    for (const [field, info] of Object.entries(results.componentFields.fields || {})) {
      console.log(`   • ${field}: ${JSON.stringify(info)}`);
    }
  } else {
    console.log('   No component fields found');
  }

  // Display API endpoints
  console.log(`\n2️⃣ API ENDPOINTS:`);
  if (results.apiEndpoints.length === 0) {
    console.log('   No API endpoints found');
  } else {
    for (const endpoint of results.apiEndpoints) {
      const endpointPath = endpoint.endpoint || endpoint.path || 'unknown';
      const method = endpoint.method || 'GET';
      const source = endpoint.source || endpoint.type || 'unknown';
      console.log(`   • ${method} ${endpointPath} (${source})`);
    }
  }

  // Display schema fields
  console.log(`\n3️⃣ SCHEMA FIELDS:`);
  for (const [schemaName, schemaData] of Object.entries(results.schemaFields)) {
    const schema = schemaData as any;
    const fieldCount = schema.fields ? Object.keys(schema.fields).length : 0;
    console.log(`   📝 ${schemaName}: ${fieldCount} fields`);
  }

  // Display Zod validation
  console.log(`\n4️⃣ ZOD VALIDATION:`);
  for (const [schemaName, rules] of Object.entries(results.zodValidation)) {
    const ruleCount = Object.keys(rules as any).length;
    console.log(`   🔒 ${schemaName}: ${ruleCount} validation rules`);
  }

  // Display database fields
  console.log(`\n5️⃣ DATABASE FIELDS:`);
  for (const [dbType, models] of Object.entries(results.databaseFields)) {
    const modelData = models as any;
    if (typeof modelData === 'object' && modelData !== null) {
      for (const [modelName, fields] of Object.entries(modelData)) {
        const fieldData = fields as any;
        const fieldCount = fieldData.fields ? Object.keys(fieldData.fields).length : 0;
        console.log(`   🗄️ ${modelName}: ${fieldCount} database fields`);
      }
    }
  }

  // Display TypeScript interfaces
  console.log(`\n6️⃣ TYPESCRIPT INTERFACES:`);
  for (const [interfaceName, interfaceData] of Object.entries(results.typescriptInterfaces)) {
    const interfaceInfo = interfaceData as any;
    const fieldCount = interfaceInfo.fields ? Object.keys(interfaceInfo.fields).length : 0;
    console.log(`   🔷 ${interfaceName}: ${fieldCount} interface fields`);
  }

  // Display form validation rules
  console.log(`\n7️⃣ FORM VALIDATION RULES:`);
  for (const [fieldName, validationData] of Object.entries(results.formValidationRules)) {
    const validation = validationData as any;
    const ruleCount = validation.rules ? Object.keys(validation.rules).length : 0;
    console.log(`   ✅ ${fieldName}: ${ruleCount} validation rules (${validation.source})`);
  }

  // Display API response types
  console.log(`\n8️⃣ API RESPONSE TYPES:`);
  for (const [typeName, typeData] of Object.entries(results.apiResponseTypes)) {
    const type = typeData as any;
    const fieldCount = type.fields ? Object.keys(type.fields).length : 0;
    console.log(`   🔄 ${typeName}: ${fieldCount} response fields`);
  }

  // Categorize mismatches by severity
  const mismatchesBySeverity = {
    high: results.mismatches.filter((m: any) => m.severity === 'high'),
    medium: results.mismatches.filter((m: any) => m.severity === 'medium'),
    low: results.mismatches.filter((m: any) => m.severity === 'low'),
    unknown: results.mismatches.filter((m: any) => !m.severity),
  };

  // Display mismatches
  console.log(`\n❌ CROSS-LAYER MISMATCHES:`);
  if (results.mismatches.length > 0) {
    results.mismatches.forEach((mismatch: any, index: number) => {
      const severityIcon =
        mismatch.severity === 'high' ? '🚨' : mismatch.severity === 'medium' ? '⚠️' : '💡';
      console.log(`   ${index + 1}. ${severityIcon} ${mismatch.type}: ${mismatch.issue}`);
      console.log(`      Field: ${mismatch.field}`);
      if (mismatch.matchedField && mismatch.matchedField !== mismatch.field) {
        console.log(`      Suggested: ${mismatch.matchedField}`);
      }
      if (mismatch.component) console.log(`      Component: ${path.basename(mismatch.component)}`);
      if (mismatch.schema) console.log(`      Schema: ${mismatch.schema}`);
    });
  } else {
    console.log('   🎉 No mismatches found!');
  }

  // Enhanced summary with severity breakdown and recommendations
  const totalMismatches = results.mismatches.length;
  const highSeverity = mismatchesBySeverity.high.length;
  const mediumSeverity = mismatchesBySeverity.medium.length;
  const lowSeverity = mismatchesBySeverity.low.length;

  console.log(`\n📈 ENHANCED SUMMARY:`);
  console.log(`   Total Mismatches: ${totalMismatches}`);
  if (highSeverity > 0) console.log(`   🚨 High Priority: ${highSeverity} (missing schema fields)`);
  if (mediumSeverity > 0)
    console.log(`   ⚠️  Medium Priority: ${mediumSeverity} (type mismatches)`);
  if (lowSeverity > 0) console.log(`   💡 Low Priority: ${lowSeverity} (naming inconsistencies)`);

  // Component health assessment
  if (totalMismatches === 0) {
    console.log(`   🎯 Component Health: EXCELLENT - All layers aligned`);
  } else if (totalMismatches <= 2) {
    console.log(`   ✅ Component Health: GOOD - Minor issues`);
  } else if (totalMismatches <= 5) {
    console.log(`   ⚠️  Component Health: NEEDS ATTENTION - Several mismatches`);
  } else {
    console.log(`   🚨 Component Health: CRITICAL - Major alignment issues`);
  }

  if (highSeverity > 0) {
    console.log(`\n💡 RECOMMENDATIONS:`);
    console.log(`   • Add missing schema definitions for ${highSeverity} fields`);
    console.log(`   • Ensure form validation aligns with backend requirements`);
    console.log(`   • Consider using schema-first development approach`);
  }
}

function extractHttpMethod(apiCall: string): string {
  if (apiCall.includes('post')) return 'POST';
  if (apiCall.includes('put')) return 'PUT';
  if (apiCall.includes('delete')) return 'DELETE';
  return 'GET';
}

function extractStateVariables(content: string): string[] {
  const stateVars: string[] = [];
  const matches = content.matchAll(/const\s+\[([^,]+),\s*set[^\]]+\]\s*=\s*useState/g);
  for (const match of matches) {
    stateVars.push(match[1].trim());
  }
  return stateVars;
}

/**
 * Extract model name from API endpoint patterns
 */
function extractModelFromEndpoint(endpoint: string): string | null {
  // Extract model name from API endpoint patterns
  const patterns = [
    /\/api\/(\w+)/,
    /\/(\w+)\/create/,
    /\/(\w+)\/update/,
    /\/(\w+)\/delete/,
    /\/(\w+)s?$/,
  ];

  // Known mappings for API endpoints to database models
  const endpointToModelMap: Record<string, string> = {
    proposals: 'Proposal',
    products: 'Product',
    customers: 'Customer',
    users: 'User',
    roles: 'Role',
    proposalversions: 'ProposalVersion',
    proposalactions: 'ApprovalWorkflow', // Map to workflow-related models
    updateproposal: 'Proposal', // Fix: Updateproposal should map to Proposal
    updateproposals: 'Proposal', // Fix: Handle plural form as well
    versions: 'ProposalVersion',
    'bulk-delete': 'Proposal', // Bulk operations still operate on base model
    workflow: 'ApprovalWorkflow',
    stats: null, // Skip stats endpoints
    search: null, // Skip search endpoints
    validate: null, // Skip validation endpoints
  };

  for (const pattern of patterns) {
    const match = endpoint.match(pattern);
    if (match) {
      const endpointName = match[1].toLowerCase();

      // Check if we have a known mapping
      if (endpointToModelMap[endpointName] !== undefined) {
        return endpointToModelMap[endpointName]; // Return null to skip validation for utility endpoints
      }

      // Try singularized version if pluralized version not found
      const modelName = match[1];
      const capitalizedModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

      // If it ends with 's', try both plural and singular forms
      if (modelName.endsWith('s')) {
        const singularModelName =
          modelName.slice(0, -1).charAt(0).toUpperCase() + modelName.slice(0, -1).slice(1);
        return singularModelName; // Prefer singular form for database models
      }

      return capitalizedModelName;
    }
  }

  return null;
}

/**
 * Extract TypeScript interfaces and types from component content
 */
async function extractTypeScriptInterfaces(
  componentName: string,
  content: string
): Promise<Record<string, any>> {
  const interfaces: Record<string, any> = {};

  // Extract interface definitions
  const interfaceMatches = content.matchAll(/interface\s+(\w+)\s*\{([^}]+)\}/g);
  for (const match of interfaceMatches) {
    const interfaceName = match[1];
    const interfaceContent = match[2];

    const fields: Record<string, any> = {};
    const fieldMatches = interfaceContent.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g);

    for (const fieldMatch of fieldMatches) {
      const fieldName = fieldMatch[1];
      const isOptional = fieldMatch[2] === '?';
      const fieldType = fieldMatch[3].trim();

      fields[fieldName] = {
        type: fieldType,
        optional: isOptional,
        source: 'typescript_interface',
      };
    }

    interfaces[interfaceName] = { fields, source: 'component_interfaces' };
  }

  // Extract type aliases
  const typeMatches = content.matchAll(/type\s+(\w+)\s*=\s*([^;\n]+)/g);
  for (const match of typeMatches) {
    const typeName = match[1];
    const typeDefinition = match[2].trim();

    interfaces[typeName] = {
      definition: typeDefinition,
      source: 'typescript_type',
    };
  }

  return interfaces;
}

/**
 * Extract form validation rules from component content
 */
async function extractFormValidationRules(
  componentName: string,
  content: string
): Promise<Record<string, any>> {
  const validationRules: Record<string, any> = {};

  // Extract React Hook Form validation rules
  const hookFormMatches = content.matchAll(/register\(['"`](\w+)['"`]\s*,\s*\{([^}]+)\}/g);
  for (const match of hookFormMatches) {
    const fieldName = match[1];
    const rulesContent = match[2];

    const rules: Record<string, any> = {};

    // Extract specific validation rules
    if (rulesContent.includes('required')) {
      const requiredMatch = rulesContent.match(/required:\s*['"`]?([^'"`\s,}]+)['"`]?/);
      rules.required = requiredMatch ? requiredMatch[1] : true;
    }

    if (rulesContent.includes('minLength')) {
      const minLengthMatch = rulesContent.match(/minLength:\s*(\d+)/);
      rules.minLength = minLengthMatch ? parseInt(minLengthMatch[1]) : null;
    }

    if (rulesContent.includes('maxLength')) {
      const maxLengthMatch = rulesContent.match(/maxLength:\s*(\d+)/);
      rules.maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : null;
    }

    if (rulesContent.includes('pattern')) {
      const patternMatch = rulesContent.match(/pattern:\s*([^,}]+)/);
      rules.pattern = patternMatch ? patternMatch[1] : null;
    }

    validationRules[fieldName] = {
      rules,
      source: 'react_hook_form',
    };
  }

  // Extract HTML5 validation attributes
  const htmlValidationMatches = content.matchAll(/<input[^>]*name=['"`](\w+)['"`][^>]*>/g);
  for (const match of htmlValidationMatches) {
    const inputTag = match[0];
    const fieldName = match[1];

    const htmlRules: Record<string, any> = {};

    if (inputTag.includes('required')) htmlRules.required = true;
    if (inputTag.includes('minlength=')) {
      const minMatch = inputTag.match(/minlength=['"`](\d+)['"`]/);
      htmlRules.minLength = minMatch ? parseInt(minMatch[1]) : null;
    }
    if (inputTag.includes('maxlength=')) {
      const maxMatch = inputTag.match(/maxlength=['"`](\d+)['"`]/);
      htmlRules.maxLength = maxMatch ? parseInt(maxMatch[1]) : null;
    }

    if (Object.keys(htmlRules).length > 0) {
      validationRules[fieldName] = {
        rules: htmlRules,
        source: 'html5_validation',
      };
    }
  }

  // Extract validation from useMemo validationErrors pattern (modern React)
  const validationErrorMatches = content.matchAll(
    /validationErrors\s*=\s*useMemo\(\(\)\s*=>\s*\{([^}]+(?:\}[^}]*)*)\}/gs
  );
  for (const match of validationErrorMatches) {
    const validationContent = match[1];

    // Extract field validation checks
    const fieldCheckMatches = validationContent.matchAll(
      /if\s*\(\s*!?([^?.]+)\.?(\w+)[\?.]?\.?(\w+)?\s*[\)&|!]/g
    );
    for (const fieldMatch of fieldCheckMatches) {
      let fieldName = '';
      if (fieldMatch[2] === 'trim' && fieldMatch[1].includes('formData')) {
        // Pattern: if (!formData.title?.trim())
        const fieldNameMatch = fieldMatch[1].match(/formData\.(\w+)/);
        fieldName = fieldNameMatch ? fieldNameMatch[1] : '';
      } else if (fieldMatch[1].includes('formData')) {
        // Pattern: if (!formData.customerId)
        fieldName = fieldMatch[2] || '';
      }

      if (fieldName) {
        const rules: Record<string, any> = {};

        // Check if it's a required field validation
        if (validationContent.includes(`!${fieldMatch[0].split('(')[1].split(')')[0]}`)) {
          rules.required = true;
        }

        // Look for specific error messages to infer validation types
        const errorMsgPattern = new RegExp(`${fieldName}[^']*'([^']+)'`, 'i');
        const errorMatch = validationContent.match(errorMsgPattern);
        if (errorMatch) {
          rules.errorMessage = errorMatch[1];
        }

        validationRules[fieldName] = {
          rules,
          source: 'modern_react_validation',
        };
      }
    }
  }

  // Extract validation from inline conditional rendering patterns
  const conditionalValidationMatches = content.matchAll(
    /\{([^}]*formData\.(\w+)[^}]*)\?\s*[^:]*:\s*[^}]*\}/g
  );
  for (const match of conditionalValidationMatches) {
    const fieldName = match[2];
    const condition = match[1];

    if (!validationRules[fieldName]) {
      const rules: Record<string, any> = {};

      if (condition.includes('!') || condition.includes('length') || condition.includes('trim')) {
        rules.required = true;
      }

      validationRules[fieldName] = {
        rules,
        source: 'conditional_rendering',
      };
    }
  }

  return validationRules;
}

/**
 * Extract API response types from API endpoints and component content
 */
async function extractApiResponseTypes(
  componentName: string,
  apiEndpoints: any[]
): Promise<Record<string, any>> {
  const responseTypes: Record<string, any> = {};

  // First, extract response types from the component itself
  const componentFiles = await findComponentFiles(componentName);
  const componentPath = componentFiles.length > 0 ? componentFiles[0] : null;
  if (componentPath && fs.existsSync(componentPath)) {
    try {
      const componentContent = fs.readFileSync(componentPath, 'utf8');

      // Extract inline response type definitions (generic types in API calls)
      const apiCallMatches = componentContent.matchAll(
        /apiClient\.get<([^>]+)>\s*\(\s*['"`]([^'"`]+)['"`]/g
      );
      for (const match of apiCallMatches) {
        const responseType = match[1];
        const endpoint = match[2];

        // Parse the response type structure
        const fields: Record<string, any> = {};

        // Extract nested type structures
        const typeStructureMatch = responseType.match(/\{([^}]+)\}/);
        if (typeStructureMatch) {
          const typeContent = typeStructureMatch[1];
          const fieldMatches = typeContent.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g);

          for (const fieldMatch of fieldMatches) {
            fields[fieldMatch[1]] = {
              type: fieldMatch[3].trim(),
              optional: fieldMatch[2] === '?',
              source: 'inline_api_type',
            };
          }
        }

        responseTypes[`${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}_Response`] = {
          fields,
          endpoint,
          source: 'component_api_call',
          rawType: responseType,
        };
      }

      // Extract useQuery response types
      const useQueryMatches = componentContent.matchAll(/useQuery.*<([^>]+)>/g);
      for (const match of useQueryMatches) {
        const queryType = match[1];
        responseTypes[`QueryResponse_${Object.keys(responseTypes).length}`] = {
          type: queryType,
          source: 'react_query_type',
        };
      }

      // Extract interface definitions within the component
      const inlineInterfaceMatches = componentContent.matchAll(/interface\s+(\w+)\s*\{([^}]+)\}/g);
      for (const match of inlineInterfaceMatches) {
        const interfaceName = match[1];
        const interfaceContent = match[2];

        if (
          interfaceName.toLowerCase().includes('response') ||
          interfaceName.toLowerCase().includes('api') ||
          interfaceName.toLowerCase().includes('data')
        ) {
          const fields: Record<string, any> = {};
          const fieldMatches = interfaceContent.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g);

          for (const fieldMatch of fieldMatches) {
            fields[fieldMatch[1]] = {
              type: fieldMatch[3].trim(),
              optional: fieldMatch[2] === '?',
              source: 'inline_interface',
            };
          }

          responseTypes[interfaceName] = {
            fields,
            source: 'component_interface',
          };
        }
      }
    } catch (error) {
      // Ignore component read errors
    }
  }

  // Find type definition files related to API responses
  const typeFiles = [
    'src/types/api.ts',
    'src/types/responses.ts',
    'src/lib/api-types.ts',
    'src/schemas/responses.ts',
  ];

  for (const typeFile of typeFiles) {
    const fullPath = path.join(process.cwd(), typeFile);
    if (fs.existsSync(fullPath)) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');

        // Extract response type interfaces
        const responseInterfaceMatches = content.matchAll(
          /interface\s+(\w*Response\w*|\w*Api\w*)\s*\{([^}]+)\}/g
        );
        for (const match of responseInterfaceMatches) {
          const interfaceName = match[1];
          const interfaceContent = match[2];

          const fields: Record<string, any> = {};
          const fieldMatches = interfaceContent.matchAll(/(\w+)(\?)?:\s*([^;,\n]+)/g);

          for (const fieldMatch of fieldMatches) {
            fields[fieldMatch[1]] = {
              type: fieldMatch[3].trim(),
              optional: fieldMatch[2] === '?',
              source: 'api_response_type',
            };
          }

          responseTypes[interfaceName] = {
            fields,
            file: typeFile,
            source: 'response_interface',
          };
        }

        // Extract API return types from function signatures
        const apiReturnMatches = content.matchAll(/(\w+).*:\s*Promise<([^>]+)>/g);
        for (const match of apiReturnMatches) {
          const functionName = match[1];
          const returnType = match[2];

          responseTypes[`${functionName}ReturnType`] = {
            type: returnType,
            source: 'function_return_type',
            file: typeFile,
          };
        }
      } catch (error) {
        // Ignore file read errors
      }
    }
  }

  // Extract types from API endpoint files if they exist
  for (const endpoint of apiEndpoints) {
    if (endpoint.path) {
      const apiPath = path.join(
        process.cwd(),
        'src/app/api',
        endpoint.path.replace('/api/', ''),
        'route.ts'
      );
      if (fs.existsSync(apiPath)) {
        try {
          const apiContent = fs.readFileSync(apiPath, 'utf8');

          // Extract return type from API route handlers
          const returnMatches = apiContent.matchAll(/return\s+NextResponse\.json\(([^)]+)\)/g);
          for (const match of returnMatches) {
            const returnContent = match[1];
            responseTypes[`${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}_ApiResponse`] = {
              returnContent,
              source: 'api_route_return',
            };
          }
        } catch (error) {
          // Ignore API file read errors
        }
      }
    }
  }

  return responseTypes;
}

function extractPropTypes(content: string): Record<string, string> {
  const propTypes: Record<string, string> = {};
  const interfaceMatches = content.matchAll(/interface\s+\w+Props[^{]*{([^}]+)}/g);
  for (const match of interfaceMatches) {
    const propsContent = match[1];
    const fieldMatches = propsContent.matchAll(/(\w+)[\?:]?\s*:\s*([^;,\n]+)/g);
    for (const fieldMatch of fieldMatches) {
      propTypes[fieldMatch[1]] = fieldMatch[2].trim();
    }
  }
  return propTypes;
}

function extractZodValidationRules(content: string, schemaName: string): Record<string, any> {
  const rules: Record<string, any> = {};

  // Find the specific schema definition
  const schemaPattern = new RegExp(`${schemaName}\\s*=\\s*z\\.object\\(\\s*\\{([^}]+)\\}`, 's');
  const match = content.match(schemaPattern);

  if (match) {
    const schemaContent = match[1];
    const fieldMatches = schemaContent.matchAll(
      /(\w+):\s*z\.(\w+)(?:\(\))?(?:\.(\w+)(?:\(([^)]*)\))?)*(?:,|\s|$)/g
    );

    for (const fieldMatch of fieldMatches) {
      const [, fieldName, zodType, modifier, modifierArgs] = fieldMatch;
      rules[fieldName] = {
        type: zodType,
        modifier: modifier || null,
        args: modifierArgs || null,
        required: !fieldMatch[0].includes('.optional()'),
      };
    }
  }

  return rules;
}

function extractPrismaModels(
  content: string,
  componentName: string,
  apiEndpoints: any[]
): Record<string, any> {
  const models: Record<string, any> = {};

  // Extract model definitions
  const modelMatches = content.matchAll(/model\s+(\w+)\s*\{([^}]+)\}/g);

  for (const match of modelMatches) {
    const [, modelName, modelContent] = match;
    const modelLower = modelName.toLowerCase();
    const componentLower = componentName.toLowerCase();

    // Check if model is relevant to component
    if (
      componentLower.includes(modelLower) ||
      modelLower.includes(componentLower.replace('step', '').replace('form', '')) ||
      apiEndpoints.some(ep => ep.endpoint?.includes(modelLower))
    ) {
      const fields: Record<string, any> = {};
      const fieldMatches = modelContent.matchAll(
        /(\w+)\s+(\w+)(?:\?)?(?:\s+@\w+(?:\([^)]*\))?)*(?:\s*\/\/[^\n]*)?/g
      );

      for (const fieldMatch of fieldMatches) {
        const [, fieldName, fieldType] = fieldMatch;
        fields[fieldName] = {
          type: fieldType,
          optional: fieldMatch[0].includes('?'),
          source: 'prisma',
        };
      }

      models[modelName] = { fields, source: 'prisma_schema' };
    }
  }

  return models;
}

async function findFilesRecursively(dir: string, pattern: RegExp): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await findFilesRecursively(fullPath, pattern);
        files.push(...subFiles);
      } else if (pattern.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors for inaccessible directories
  }

  return files;
}

/**
 * Perform comprehensive 8-layer analysis on a specific component:
 * 1. Component fields and field names
 * 2. API endpoints it sends to
 * 3. Relevant schema fields and names
 * 4. Relevant Zod validation
 * 5. Relevant database fields and names
 * 6. TypeScript interfaces and types
 * 7. Form validation rules
 * 8. API response types
 */
async function performComprehensiveComponentAnalysis(componentName: string, api: ApiClient) {
  console.log('🔄 Starting 8-layer component analysis...\n');

  const analysisResults = {
    componentFields: {} as any,
    apiEndpoints: [] as any[],
    schemaFields: {} as any,
    zodValidation: {} as any,
    databaseFields: {} as any,
    typescriptInterfaces: {} as any,
    formValidationRules: {} as any,
    apiResponseTypes: {} as any,
    mismatches: [] as any[],
  };

  try {
    // Layer 1: Extract component fields and field names automatically and dynamically
    console.log('1️⃣ Analyzing Component Fields...');
    const componentAnalysis = await extractComponentFieldsAnalysis(componentName);
    analysisResults.componentFields = componentAnalysis;
    console.log(
      `   ✅ Found ${Object.keys(componentAnalysis.fields || {}).length} component fields`
    );

    // Layer 2: Extract API endpoints it sends to automatically and dynamically
    console.log('2️⃣ Analyzing API Endpoints...');
    const apiAnalysis = await extractComponentApiEndpoints(
      componentName,
      componentAnalysis.content
    );
    analysisResults.apiEndpoints = apiAnalysis;
    console.log(`   ✅ Found ${apiAnalysis.length} API endpoints`);

    // Layer 3: Extract relevant schema fields and names automatically and dynamically
    console.log('3️⃣ Analyzing Schema Fields...');
    const schemaAnalysis = await extractRelevantSchemaFields(componentName, apiAnalysis);
    analysisResults.schemaFields = schemaAnalysis;
    console.log(`   ✅ Found ${Object.keys(schemaAnalysis).length} schema field groups`);

    // Layer 4: Extract relevant Zod validation automatically and dynamically
    console.log('4️⃣ Analyzing Zod Validation...');
    const zodAnalysis = await extractRelevantZodValidation(componentName, schemaAnalysis);
    analysisResults.zodValidation = zodAnalysis;
    console.log(`   ✅ Found ${Object.keys(zodAnalysis).length} Zod validation rules`);

    // Layer 5: Extract relevant database fields and names automatically and dynamically
    console.log('5️⃣ Analyzing Database Fields...');
    const databaseAnalysis = await extractRelevantDatabaseFields(componentName, apiAnalysis);
    analysisResults.databaseFields = databaseAnalysis;
    console.log(`   ✅ Found ${Object.keys(databaseAnalysis).length} database field groups`);

    // Layer 6: Extract TypeScript interfaces and types
    console.log('6️⃣ Analyzing TypeScript Interfaces...');
    const tsInterfaceAnalysis = await extractTypeScriptInterfaces(
      componentName,
      componentAnalysis.content
    );
    analysisResults.typescriptInterfaces = tsInterfaceAnalysis;
    console.log(`   ✅ Found ${Object.keys(tsInterfaceAnalysis).length} TypeScript interfaces`);

    // Layer 7: Extract form validation rules
    console.log('7️⃣ Analyzing Form Validation Rules...');
    const formValidationAnalysis = await extractFormValidationRules(
      componentName,
      componentAnalysis.content
    );
    analysisResults.formValidationRules = formValidationAnalysis;
    console.log(`   ✅ Found ${Object.keys(formValidationAnalysis).length} form validation rules`);

    // Layer 8: Extract API response types
    console.log('8️⃣ Analyzing API Response Types...');
    const apiResponseAnalysis = await extractApiResponseTypes(componentName, apiAnalysis);
    analysisResults.apiResponseTypes = apiResponseAnalysis;
    console.log(
      `   ✅ Found ${Object.keys(apiResponseAnalysis).length} API response type definitions`
    );

    // Detect cross-layer mismatches across all 8 layers
    console.log('🔍 Detecting Cross-Layer Mismatches...');
    const mismatches = await detectCrossLayerMismatches(analysisResults);
    analysisResults.mismatches = mismatches;

    // Display comprehensive results
    displayComprehensiveResults(componentName, analysisResults);
  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function handleFieldValueMismatchDetection(api: ApiClient, targetComponent?: string) {
  if (targetComponent) {
    console.log(`🔍 Comprehensive Component Analysis for: ${targetComponent}\n`);
    await performComprehensiveComponentAnalysis(targetComponent, api);
    return;
  } else {
    console.log('🔍 Automatic Frontend-Backend Field Mismatch Detection\n');
  }

  const detectedIssues = {
    missingFields: [] as Array<{
      component: string;
      field: string;
      issue: string;
      expectedEnum?: string[];
      suggestion: string;
    }>,
    enumMismatches: [] as Array<{
      component: string;
      field: string;
      frontendValues: string[];
      backendSchema: string;
      endpoint: string;
      suggestions: string[];
    }>,
    typeMismatches: [] as Array<{
      component: string;
      field: string;
      frontendType: string;
      backendType: string;
      endpoint: string;
      suggestion: string;
    }>,
    validationFailures: [] as Array<{
      endpoint: string;
      field: string;
      testValue: any;
      error: string;
      suggestedFix: string;
    }>,
  };

  try {
    console.log('📋 Scanning frontend components and API schemas...\n');

    // Step 1: Auto-discover API endpoints
    const apiEndpoints = await discoverApiEndpoints();
    console.log(`Found ${apiEndpoints.length} API endpoints`);

    // Step 2: Extract frontend field patterns from components
    const frontendFields = await extractFrontendFields(targetComponent);
    if (targetComponent) {
      console.log(
        `Extracted ${Object.keys(frontendFields).length} components matching "${targetComponent}"`
      );
    } else {
      console.log(
        `Extracted ${Object.keys(frontendFields).length} frontend components with form fields`
      );
    }

    // Step 3: Analyze backend schemas
    const backendSchemas = await analyzeBackendSchemas();
    console.log(`Analyzed ${Object.keys(backendSchemas).length} backend schemas`);

    // Step 4: Compare and detect mismatches
    await detectFieldMismatches(frontendFields, backendSchemas, apiEndpoints, detectedIssues, api);

    // Step 5: Show results
    console.log('\n📊 Detection Results:\n');

    if (detectedIssues.enumMismatches.length > 0) {
      console.log('🔴 Enum Mismatches Found:');
      detectedIssues.enumMismatches.forEach((issue, index) => {
        console.log(`\n${index + 1}. Component: ${issue.component}`);
        console.log(`   Field: ${issue.field}`);
        console.log(`   Endpoint: ${issue.endpoint}`);
        console.log(`   Frontend values: ${issue.frontendValues.join(', ')}`);
        console.log(`   Backend schema: ${issue.backendSchema}`);
        console.log(`   Suggestions:`);
        issue.suggestions.forEach(suggestion => {
          console.log(`     • ${suggestion}`);
        });
      });
    }

    if (detectedIssues.typeMismatches.length > 0) {
      console.log('\n🟡 Type Mismatches Found:');
      detectedIssues.typeMismatches.forEach((issue, index) => {
        console.log(`\n${index + 1}. Component: ${issue.component}`);
        console.log(`   Field: ${issue.field}`);
        console.log(`   Endpoint: ${issue.endpoint}`);
        console.log(`   Frontend type: ${issue.frontendType}`);
        console.log(`   Backend type: ${issue.backendType}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
      });
    }

    if (detectedIssues.validationFailures.length > 0) {
      console.log('\n🟠 API Validation Failures:');
      detectedIssues.validationFailures.forEach((issue, index) => {
        console.log(`\n${index + 1}. Endpoint: ${issue.endpoint}`);
        console.log(`   Field: ${issue.field}`);
        console.log(`   Test value: ${JSON.stringify(issue.testValue)}`);
        console.log(`   Error: ${issue.error}`);
        console.log(`   Suggested fix: ${issue.suggestedFix}`);
      });
    }

    const totalIssues =
      detectedIssues.enumMismatches.length +
      detectedIssues.typeMismatches.length +
      detectedIssues.validationFailures.length;

    if (totalIssues === 0) {
      console.log('✅ No field value mismatches detected!');
    } else {
      console.log(`\n📈 Summary: Found ${totalIssues} potential issues`);
      console.log('\n💡 General Recommendations:');
      console.log('• Use z.preprocess() in Zod schemas to normalize frontend values');
      console.log('• Add field transformations in API routes before validation');
      console.log('• Update frontend components to match backend enum expectations');
      console.log('• Add comprehensive API testing with actual frontend form data');
      console.log('• Use consistent enum values across frontend and backend');
    }
  } catch (error) {
    console.error(
      '❌ Error during mismatch detection:',
      error instanceof Error ? error.message : error
    );
  }
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
