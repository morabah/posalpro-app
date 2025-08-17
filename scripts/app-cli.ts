#!/usr/bin/env tsx

/*
 PosalPro App CLI

 Features:
 - Login via NextAuth credentials (cookie-based session)
 - Issue API requests with RBAC (GET, POST, PUT, DELETE)
 - Direct DB operations via Prisma (findMany, findUnique, create, update, delete)

 Usage:
   npm run app:cli                  # interactive REPL
   npm run app:cli -- --base http://localhost:3000 --command "login admin@posalpro.com 'Password'"
   npm run app:cli -- --command "get /api/products"
   npm run app:cli -- --command "db proposal findMany {\"take\":5}"
*/

import fetchOrig from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline';
import { URLSearchParams } from 'node:url';
import { prisma } from '../src/lib/db/prisma';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
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
    // 1) Get CSRF token
    const csrfRes = await fetchOrig(`${this.baseUrl}/api/auth/csrf`, {
      method: 'GET',
    });
    const rawSetCookie: string[] | undefined = (csrfRes.headers as any).raw?.()['set-cookie'];
    this.jar.setFromSetCookie(rawSetCookie);
    const csrfData = (await csrfRes.json()) as { csrfToken: string };

    // 2) Post credentials to NextAuth callback to obtain session cookie
    const params = new URLSearchParams();
    params.set('csrfToken', csrfData.csrfToken);
    params.set('email', email);
    params.set('password', password);
    if (role) params.set('role', role);
    params.set('callbackUrl', `${this.baseUrl}/dashboard`);

    const loginRes = await fetchOrig(`${this.baseUrl}/api/auth/callback/credentials`, {
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
      throw new Error(`Login failed (${loginRes.status}): ${text}`);
    }

    // 3) Verify session by calling NextAuth session endpoint (stable across roles)
    const verifyRes = await this.request('GET', '/api/auth/session');
    if (!verifyRes.ok) {
      throw new Error(`Login verification failed (${verifyRes.status})`);
    }
    return true;
  }

  async request(method: HttpMethod, path: string, body?: any) {
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
    const res = await fetchOrig(url, { method, headers, body: fetchBody });
    return res;
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
  db <model> <action> [json]                 # Direct Prisma operations
  Examples:
    db proposal findMany '{"take":5}'
    db customer findUnique '{"where":{"id":"..."}}'
    db product create '{"name":"Test","price":100}'

📋 PROPOSAL MANAGEMENT
  proposals get <id>                         # Get proposal details
  proposals patch-products <id> <jsonProducts>  # Update proposal products
  proposals patch-manual-total <id> <value>     # Set manual total with flag
  proposals backfill-step4 [limit] [--execute]  # Mirror DB products to metadata
  proposals add-product <proposalId> <productId> <qty> [unitPrice] [discount]
  proposals update-product <proposalId> <productId> <json>
  proposals remove-product <proposalId> <productId>
  proposals snapshot <proposalId> [changeType] [summary]

📦 PRODUCT MANAGEMENT
  products create <json>                     # POST /api/products
  products update <id> <json>                # PUT /api/products/[id]
  products delete <id>                       # DELETE /api/products/[id]

📚 VERSION CONTROL
  versions list [limit]                      # List all proposal versions
  versions for <proposalId> [limit]          # Get versions for specific proposal
  versions diff <proposalId> <version>       # Show version differences
  versions assert [proposalId]               # Assert version integrity

🔒 RBAC TESTING
  rbac try <method> <path> [json]            # Test RBAC permission
  rbac run-set [file]                        # Run RBAC test suite from file
  rbac test-roles [file]                     # Test multiple user roles

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

🔒 RBAC Testing:
  rbac try GET /api/admin/metrics
  rbac try POST /api/proposals '{"title":"Test"}'
  rbac run-set rbac-tests.json

╭─────────────────────────────────────────────────────────────╮
│                    USAGE PATTERNS                          │
╰─────────────────────────────────────────────────────────────╯

🚀 One-liner execution:
  npx tsx scripts/app-cli.ts --command "login admin@posalpro.com 'ProposalPro2024!'"
  npx tsx scripts/app-cli.ts --command "get /api/products"
  npx tsx scripts/app-cli.ts --command "db proposal findMany '{\"take\":5}'"

🔧 Interactive mode:
  npx tsx scripts/app-cli.ts
  posalpro> login admin@posalpro.com 'ProposalPro2024!'
  posalpro> get /api/admin/metrics

📊 Batch operations:
  npx tsx scripts/app-cli.ts --command "proposals backfill-step4 500 --execute"
  npx tsx scripts/app-cli.ts --command "rbac test-roles roles-test.json"

💡 Tips:
  - Use single quotes around JSON to avoid shell escaping
  - Session cookies are automatically saved between commands
  - Database operations bypass API authentication
  - Use --execute flag for destructive operations
`);
}

async function handleDbCommand(tokens: string[]) {
  const [, model, action, jsonArg] = tokens;
  if (!model || !action) {
    console.log('Usage: db <model> <action> [json]');
    return;
  }
  const args = jsonArg ? JSON.parse(jsonArg) : undefined;
  const client: any = prisma as any;
  const modelClient = client[model];
  if (!modelClient) {
    console.log(`Model not found on Prisma client: ${model}`);
    return;
  }
  if (typeof modelClient[action] !== 'function') {
    console.log(`Action not supported on model ${model}: ${action}`);
    return;
  }
  const result = await modelClient[action](args);
  console.log(JSON.stringify(result, null, 2));
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
        (api as any).baseUrl = tokens[1].replace(/\/$/, '');
      }
      console.log(`Base URL: ${(api as any).baseUrl}`);
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
          res = await api.request('GET', `/api/proposals/${proposalId}/versions?limit=200`);
        } else {
          res = await api.request('GET', `/api/proposals/versions?limit=200`);
        }
        const body: any = await res.json().catch(() => ({}) as any);
        const list: any[] = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        const missing = list.filter(
          (v: any) => typeof v.totalValue !== 'number' || !Number.isFinite(v.totalValue)
        );
        if (missing.length > 0) {
          console.log(`❌ Missing/invalid totalValue for ${missing.length} version(s)`);
          console.log(JSON.stringify(missing.slice(0, 10), null, 2));
          process.exitCode = 1;
        } else {
          console.log('✅ All versions have valid totalValue');
        }
      } else {
        console.log(
          'Usage:\n  versions list [limit]\n  versions for <proposalId> [limit]\n  versions diff <proposalId> <versionNumber>\n  versions assert [proposalId]'
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
          break;
        }
        const body = JSON.parse(json);
        const res = await api.request('POST', '/api/products', body);
        console.log(await res.text());
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
      if (sub === 'patch-products') {
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
                  discount: true,
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
                  metadata: newMeta as any,
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
          console.log(
            'Usage: proposals add-product <proposalId> <productId> <qty> [unitPrice] [discount]'
          );
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
        const total = Number((qty * price * (1 - (discount || 0) / 100)).toFixed(2));
        const created = await prisma.proposalProduct.create({
          data: {
            proposalId,
            productId,
            quantity: qty,
            unitPrice: price,
            discount: discount || 0,
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
          'Usage:\n  proposals get <id>\n  proposals patch-products <id> <jsonProducts>\n  proposals patch-manual-total <id> <value>\n  proposals backfill-step4 [limit] [--execute]\n  proposals add-product <proposalId> <productId> <qty> [unitPrice] [discount]\n  proposals update-product <proposalId> <productId> <json>\n  proposals remove-product <proposalId> <productId>\n  proposals snapshot <proposalId> [changeType] [summary]'
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
          const raw = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
          const items = JSON.parse(raw);
          if (!Array.isArray(items)) {
            console.log('RBAC set file must be an array of {method,path,body,expect}');
            break;
          }
          let pass = 0,
            fail = 0;
          for (const it of items) {
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
            ok ? pass++ : fail++;
          }
          console.log(`RBAC set results: ${pass} passed, ${fail} failed`);
          if (fail > 0) process.exitCode = 1;
        } catch (e) {
          console.log(`Failed to read set file: ${file} (${(e as Error).message})`);
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
  const api = new ApiClient(base);

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
      await execute(tokens, api);
    } catch (err) {
      console.error('Error:', (err as Error)?.message);
    }
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('Bye.');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
