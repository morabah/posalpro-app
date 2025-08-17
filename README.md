# PosalPro MVP2

> Proposal management for assembling, reviewing, and tracking complex B2B offers. Built with Next.js, TypeScript, Prisma, and PostgreSQL. Includes RBAC with NextAuth and basic observability.

[![TypeScript](https://img.shields.io/badge/TypeScript-99%25-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Live Demo](https://img.shields.io/badge/Demo-Running-green.svg)](https://posalpro-mvp2.windsurf.build)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & Patterns](#architecture--patterns)
  - [Data Fetching](#data-fetching)
  - [Error Handling](#error-handling)
  - [Date Processing](#date-processing)
  - [Transactions](#transactions)
  - [Observability](#observability)
- [Quick Start](#quick-start)
- [Development](#development)
  - [Quality Gates](#quality-gates)
  - [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Authenticated E2E via App CLI](#authenticated-e2e-via-app-cli)
- [Deployment](#deployment)
- [API Endpoints (Recent)](#api-endpoints-recent)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

---

## Overview

PosalPro MVP2 focuses on three workflows:
1. **Proposal assembly**: products, sections, pricing, and version history.
2. **Team coordination**: roles, basic approvals, and audit-friendly changes.
3. **Status & analytics**: quick KPIs and performance checks.

A live demo is available at **https://posalpro-mvp2.windsurf.build** (test data; no SLA).

---

## Tech Stack

**Core**
- **Next.js 15** (App Router, SSR)
- **TypeScript** (strict)
- **React 18.3.1**
- **Tailwind CSS**

**Backend & DB**
- **Prisma 5.7.0** (44+ models)
- **PostgreSQL** (with indexes)
- **NextAuth.js 4.24.11** (Email/Password for demo + RBAC)
- In development, selected endpoints use in-memory caches; production uses Redis.

**Forms & Validation**
- **React Hook Form 7.57.0**
- **Zod**
- **@hookform/resolvers 3.10.0**

**UI & Utilities**
- **Radix UI**, **Headless UI 2.2.4**, **Framer Motion 12.15.0**, **Sonner 2.0.5**

**Performance**
- `useApiClient` pattern
- `@vercel/analytics`
- Virtualized lists

---

## Architecture & Patterns

### Data Fetching
```ts
// Client-side example using the shared API client
const apiClient = useApiClient();

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/endpoint');
      if (response.success && response.data) setData(response.data);
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### Error Handling
```ts
import { ErrorHandlingService, useErrorHandler } from '@/lib/errors';

const errorHandlingService = ErrorHandlingService.getInstance();
const { handleAsyncError } = useErrorHandler();

try {
  // ...
} catch (error) {
  const standardError = handleAsyncError(error, 'Operation failed', {
    component: 'ComponentName',
    operation: 'operationName',
  });
}
```

### Date Processing
```ts
// UTC-based parsing for consistency
const parseDate = (dateValue: string | Date | null): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    if (dateValue.includes('T')) return new Date(dateValue);
    const [y, m, d] = dateValue.split('-').map(Number);
    if (y && m && d) return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    return new Date(dateValue);
  }
  return null;
};

// UI helpers
const formatDateForInput = (date: Date | string | null): string => {
  if (!date) return '';
  if (date instanceof Date) return date.toISOString().split('T')[0];
  if (typeof date === 'string') return date.includes('T') ? date.split('T')[0] : date;
  return '';
};
```

### Transactions
```ts
// Related queries should share a transaction
const [items, count] = await prisma.$transaction([
  prisma.item.findMany({ where: { status: 'ACTIVE' } }),
  prisma.item.count({ where: { status: 'ACTIVE' } }),
]);
```

### Observability
- `x-request-id` correlation (middleware injects when missing)
- `Server-Timing` headers on APIs (`app;dur=…`, `db;dur=…`)
- Metrics: `GET /api/observability/metrics`
- Client Web Vitals → `POST /api/observability/web-vitals`

**Analytics throttling**
```ts
const lastAnalyticsTime = useRef<number>(0);
const ANALYTICS_THROTTLE_INTERVAL = 2000;

const trackThrottledEvent = useCallback((eventData) => {
  const now = Date.now();
  if (now - lastAnalyticsTime.current > ANALYTICS_THROTTLE_INTERVAL) {
    analytics?.trackEvent?.(eventData);
    lastAnalyticsTime.current = now;
  }
}, [analytics]);
```

---

## Quick Start

**Prerequisites**
- Node.js 20.17.0+
- npm 10+
- Git

**Install & Run**
```bash
# Clone repository
git clone <repository-url>
cd posalpro-app

# Install dependencies
npm install --legacy-peer-deps

# Configure env
cp .env.example .env.local
# Set NEXTAUTH_SECRET, DATABASE_URL, NEXTAUTH_URL, etc.

# Database
npm run db:generate
npm run db:push
npm run db:seed

# Start (with health checks)
npm run dev:smart
```
Open http://localhost:3000

---

## Development

### Quality Gates
```bash
npm run type-check     # TypeScript
npm run quality:check  # Full validation
npm run pre-commit     # Pre-commit hook
npm run build          # Production build
npm run analyze        # Bundle analyzer
npm run ci:bundle      # Bundle budgets (≤300KB per route)
npm run ci:obs         # Observability headers check
```

### Available Scripts
```bash
# Development
npm run dev:smart
npm run build
npm run type-check
npm run lint

# Testing (CLI examples)
node scripts/test-proposals-authenticated.js
node scripts/real-world-performance-test.js
node scripts/test-proposal-wizard-puppeteer.js

# Database
npm run db:generate
npm run db:push
npm run db:seed

# Deployment
npm run deploy:alpha
npm run deploy:beta
npm run deploy:patch

# App CLI (interactive API + DB)
npm run app:cli
```

---

## Project Structure

```
posalpro-app/
├── src/
│   ├── app/                    # App Router
│   ├── components/             # UI components
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Services, api, auth, errors, etc.
│   ├── types/                  # Type definitions
│   ├── utils/                  # Utilities
│   └── styles/                 # Global styles
├── prisma/                     # Schema & migrations
├── docs/                       # Project docs
├── scripts/                    # Dev/CI utilities
└── test/                       # Tests
```

---

## Authenticated E2E via App CLI

Use the CLI for authenticated, DB-backed API testing without opening the UI. It maintains a session cookie jar and supports RBAC checks.

**Guidelines**
- Start server: `npm run dev:smart`
- Local base: `--base http://127.0.0.1:3000`
- Use real DB IDs via `db` commands
- Non-interactive: `npm run app:cli -- --command "..."`

**Examples**
```bash
# Login (creates a session for later commands)
npm run app:cli -- --base http://127.0.0.1:3000 --command "login admin@posalpro.com 'ProposalPro2024!' 'System Administrator'"

# Get active product/customer IDs from the DB
npm run app:cli -- --command "db product findFirst '{\"where\":{\"isActive\":true},\"select\":{\"id\":true,\"price\":true}}'"
npm run app:cli -- --command "db customer findFirst '{\"where\":{\"status\":\"ACTIVE\"},\"select\":{\"id\":true,\"name\":true}}'"

# Create a proposal (schema-compliant payload)
npm run app:cli -- --command "post /api/proposals '{\"title\":\"CLI Test\",\"customerId\":\"<id>\",\"priority\":\"MEDIUM\",\"contactPerson\":\"Admin\",\"contactEmail\":\"admin@posalpro.com\",\"products\":[{\"productId\":\"<prodId\",\"quantity\":1,\"unitPrice\":15000,\"discount\":0}],\"sections\":[{\"title\":\"Intro\",\"content\":\"Hello\",\"type\":\"TEXT\",\"order\":1}]}'"

# RBAC check
npm run app:cli -- --command "rbac try GET /api/proposals"
```

---

## Deployment

**Environment**
- **Platform**: Netlify (serverless functions)
- **Database**: PostgreSQL with pooling
- **Caching**: Redis in production; in-memory in development
- **Monitoring**: `@vercel/analytics` + custom metrics
- **Version**: 0.2.1-alpha.3

**Commands**
```bash
npm run deploy:alpha    # Feature development
npm run deploy:beta     # Feature complete testing
npm run deploy:patch    # Production fixes
npm run deployment:info # Deployment status
```

---

## API Endpoints (Recent)

**Proposals**
- `GET /api/proposals` — cursor pagination, selective fields (`fields`), optional includes (`includeProducts`, `includeTeam`)
- `GET /api/proposals/stats` — KPIs (total, inProgress, overdue, winRate, totalValue)
- `GET /api/proposals/versions` — latest versions (global)
- `GET /api/proposals/[id]/versions` — versions for a proposal
- `GET /api/proposals/[id]/versions?version=NUM&detail=1` — diff view with `productsMap` and `customerName`
- `POST /api/proposals/[id]/versions` — create a snapshot (server-side)

**Product Relationships**
- `GET /api/products/relationships/versions?productId=...&limit=...`

**Admin Roles**
- `GET /api/admin/users/roles?userId=... | email=...`
- `POST /api/admin/users/roles` — assign role `{ userId, roleId | roleName }`
- `DELETE /api/admin/users/roles` — remove role `{ userId, roleId | roleName }`

**UI Entry Points**
- `/proposals/version-history` — explore proposal version history with diff viewer

**Caching & Security**
- Short TTL caches on safe reads (disabled in development)
- RBAC checks in production; development includes limited bypass for diagnostics

---

## Documentation

Core references live in `/docs/`:
- `CORE_REQUIREMENTS.md` — mandatory standards
- `LESSONS_LEARNED.md` — patterns and learnings
- `PROJECT_REFERENCE.md` — navigation hub
- `DEVELOPMENT_STANDARDS.md` — code & architecture guidance
- `PERFORMANCE_OPTIMIZATION_GUIDE.md` — performance tips
- `WIREFRAME_INTEGRATION_GUIDE.md`, `USER_STORY_TRACEABILITY_MATRIX.md`, `COMPONENT_STRUCTURE.md`, `MOBILE_RESPONSIVENESS_GUIDE.md`

---

## Contributing

Before opening a PR:
1. Read `docs/CORE_REQUIREMENTS.md`
2. Review `docs/LESSONS_LEARNED.md`
3. Check existing services in `src/lib/services/`
4. Run `npm run audit:duplicates`
5. Ensure TypeScript passes with `npm run type-check`

**Review checklist**
- [ ] TypeScript errors: 0
- [ ] ErrorHandlingService used where needed
- [ ] `useApiClient` for API calls
- [ ] Mobile touch targets ≥44px
- [ ] Performance safeguards applied
- [ ] Component traceability in place
- [ ] Docs updated
- [ ] UTC date handling

---

## Support
- Issues: use **GitHub Issues** for bugs and requests
- Discussions: use **GitHub Discussions** for questions and ideas

## License

MIT — see `LICENSE`.
