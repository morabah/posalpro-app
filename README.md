# PosalPro MVP2

> Enterprise-grade proposal management platform with AI-powered coordination and
> systematic learning capture.

[![TypeScript](https://img.shields.io/badge/TypeScript-99%25-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Production](https://img.shields.io/badge/Production-Ready-green.svg)](https://posalpro-mvp2.windsurf.build)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 🎯 Overview

PosalPro MVP2 is a comprehensive, AI-powered proposal management platform
designed to solve critical business challenges in proposal creation, team
coordination, and client relationship management. Built with enterprise-grade
architecture and systematic learning capture.

**🚀 Live Demo**:
[https://posalpro-mvp2.windsurf.build](https://posalpro-mvp2.windsurf.build)
**📚 Documentation**: Comprehensive guides in `/docs/` directory **🏗️
Architecture**: Next.js 15 + TypeScript + Prisma **🔒 Security**: NextAuth.js
with RBAC + Rate Limiting **📊 Analytics**: Real-time performance monitoring

---

## 🛠️ Tech Stack

### **Core Framework**

- **[Next.js 15](https://nextjs.org/)** - App Router with server-side rendering
- **[TypeScript](https://www.typescriptlang.org/)** - 99% type safety with
  strict mode
- **[React 18.3.1](https://react.dev/)** - Component architecture with hooks
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling system

### **Backend & Database**

- **[Prisma 5.7.0](https://www.prisma.io/)** - Type-safe database ORM with 44+
  tables
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database with
  optimized indexes
- In development we use lightweight in-memory caches for selected endpoints;
  Redis is used only in production.
- **[NextAuth.js 4.24.11](https://next-auth.js.org/)** - Authentication with
  RBAC

### **Form & Validation**

- **[React Hook Form 7.57.0](https://react-hook-form.com/)** - Form state
  management
- **[Zod](https://zod.dev/)** - Runtime validation with TypeScript integration
- **[@hookform/resolvers 3.10.0](https://github.com/react-hook-form/resolvers)** -
  Form validation

### **UI & Design System**

- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Headless UI 2.2.4](https://headlessui.com/)** - Unstyled, accessible
  components
- **[Framer Motion 12.15.0](https://www.framer.com/motion/)** - Animation
  library
- **[Sonner 2.0.5](https://sonner.emilkowal.ski/)** - Toast notifications

### **Performance & Analytics**

- **useApiClient pattern** for client fetching with centralized error handling
- **@vercel/analytics** for performance monitoring
- **Virtualized lists** for large data sets

---

## 🏗️ Architecture

### **Core Patterns**

#### **Data Fetching**

```typescript
// ✅ Always use useApiClient pattern (client)
const apiClient = useApiClient();

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/endpoint');
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []); // Empty dependency array for mount-only execution
```

#### **Error Handling**

```typescript
// ✅ Use standardized ErrorHandlingService
import { ErrorHandlingService, useErrorHandler } from '@/lib/errors';

const errorHandlingService = ErrorHandlingService.getInstance();
const { handleAsyncError } = useErrorHandler();

try {
  // Your code here
} catch (error) {
  const standardError = handleAsyncError(error, 'Operation failed', {
    component: 'ComponentName',
    operation: 'operationName',
  });
}
```

#### **Date Processing**

```typescript
// ✅ UTC-based date creation for consistency
const parseDate = (dateValue: string | Date | null): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    if (dateValue.includes('T')) return new Date(dateValue);
    const [year, month, day] = dateValue.split('-').map(Number);
    if (year && month && day) {
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    }
    return new Date(dateValue);
  }
  return null;
};
```

### **Performance Optimization**

#### **Analytics Throttling**

```typescript
// ✅ Prevent analytics spam
const lastAnalyticsTime = useRef<number>(0);
const ANALYTICS_THROTTLE_INTERVAL = 2000;

const trackThrottledEvent = useCallback(
  eventData => {
    const currentTime = Date.now();
    if (currentTime - lastAnalyticsTime.current > ANALYTICS_THROTTLE_INTERVAL) {
      analytics?.trackEvent?.(eventData);
      lastAnalyticsTime.current = currentTime;
    }
  },
  [analytics]
);
```

---

## 🚀 Quick Start

### **Prerequisites**

- Node.js 20.17.0+
- npm 10.0.0+
- Git

### **Installation**

```bash
# Clone repository
git clone <repository-url>
cd posalpro-app

# Install dependencies
npm install --legacy-peer-deps

# Set up environment
cp .env.example .env.local
# Configure your environment variables

# Set up database
npm run db:generate
npm run db:push
npm run db:seed

# Start development server
npm run dev:smart
```

**Open**: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Development

### **Quality Gates**

```bash
npm run type-check         # TypeScript validation
npm run quality:check      # Full quality validation
npm run pre-commit         # Pre-commit validation
npm run build              # Production build
npm run analyze            # Build with bundle analyzer
npm run ci:bundle          # Enforce 300KB route bundle budgets
npm run ci:obs             # Check observability contract (Server-Timing, x-request-id)
```

### **Available Scripts**

```bash
# Development
npm run dev:smart          # Start with health checks
npm run build              # Production build
npm run type-check         # TypeScript validation
npm run lint               # ESLint checking

# Testing (CLI examples)
# Canonical perf/auth test
node scripts/test-proposals-authenticated.js
# Real-world perf sweep
node scripts/real-world-performance-test.js
# Proposal wizard E2E (Puppeteer)
node scripts/test-proposal-wizard-puppeteer.js

# Database
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema to database
npm run db:seed            # Seed database

# Deployment
npm run deploy:alpha       # Alpha deployment
npm run deploy:beta        # Beta deployment
npm run deploy:patch       # Production fixes
```

---

## 🏗️ Project Structure

```
posalpro-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── api/               # API routes with NextAuth integration
│   │   ├── auth/              # Authentication pages
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── performance/       # Performance monitoring
│   │   └── proposals/         # Proposal management pages
│   ├── components/            # Reusable UI components
│   │   ├── admin/             # Admin dashboard components
│   │   ├── analytics/         # Analytics components
│   │   ├── auth/              # Authentication components
│   │   ├── coordination/      # Team coordination components
│   │   ├── customers/         # Customer management
│   │   ├── dashboard/         # Dashboard components
│   │   ├── deadlines/         # Deadline tracking
│   │   ├── layout/            # Layout components
│   │   ├── mobile/            # Mobile optimization
│   │   ├── performance/       # Performance components
│   │   ├── products/          # Product management
│   │   ├── proposals/         # Proposal management
│   │   ├── providers/         # Context providers
│   │   └── ui/                # Base UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions and services
│   │   ├── api/              # API client and endpoints
│   │   ├── auth/             # Authentication utilities
│   │   ├── errors/           # Error handling system
│   │   ├── performance/      # Performance monitoring
│   │   ├── security/         # Security utilities
│   │   ├── services/         # Business logic services
│   │   ├── store/            # State management
│   │   └── validation/       # Zod validation schemas
│   ├── types/                # TypeScript type definitions
│   ├── utils/                # Utility functions
│   └── styles/               # Global styles and CSS
├── prisma/                   # Database schema and migrations
├── docs/                     # Comprehensive documentation
├── scripts/                  # Development and deployment scripts
└── test/                     # Test files and utilities
```

---

## 🔧 Critical Development Patterns

### **Auth & Session (Unified)**

- Always import `useAuth` from `@/components/providers/AuthProvider`.
- SessionProvider tuned for dev: `refetchOnWindowFocus=false`,
  `refetchInterval=600`.
- Dev-only smoothing: ultra-short TTL throttle (~2s) inside `callbacks.session`
  (development only). Short-lived SW cache for `/api/auth/session` and
  `/api/auth/providers` (development only).

### **Database Transaction Patterns**

### **Observability**

- Request correlation via `x-request-id` header (middleware injects if absent)
- Standard `Server-Timing` on APIs: `app;dur=…` and `db;dur=…` when available
- Metrics endpoint: `GET /api/observability/metrics`
  (requests/db/cache/webVitals)
- Client Web Vitals: emitted via `src/app/reportWebVitals.ts` →
  `POST /api/observability/web-vitals`
- CI checks: `ci:bundle` (bundles ≤300KB), `ci:obs` (headers present on hot
  routes)

```typescript
// ✅ CORRECT: Use prisma.$transaction for related queries
const [items, count] = await prisma.$transaction([
  prisma.item.findMany({ where: { status: 'ACTIVE' } }),
  prisma.item.count({ where: { status: 'ACTIVE' } }),
]);

// ❌ FORBIDDEN: Separate queries creating inconsistency risks
const [items, count] = await Promise.all([
  prisma.item.findMany({ where: { status: 'ACTIVE' } }),
  prisma.item.count({ where: { status: 'ACTIVE' } }),
]);
```

### **Date Processing Pipeline Patterns**

```typescript
// ✅ CORRECT: Multi-layer date processing pipeline
// 1. Form Input: Consistent date format handling
// 2. Form Processing: formatDateForInput() and parseDate() functions
// 3. Data Processing: UTC-based date conversion for API submission
// 4. API Validation: Proper ISO datetime strings for database storage

// ✅ CORRECT: UTC-based date creation for consistency
const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

// ✅ CORRECT: Consistent date format handling
const formatDateForInput = (date: Date | string | null): string => {
  if (!date) return '';
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  if (typeof date === 'string') {
    return date.includes('T') ? date.split('T')[0] : date;
  }
  return '';
};
```

### **Component Traceability Matrix**

```typescript
// ✅ CORRECT: Map all implementations
const COMPONENT_MAPPING = {
  userStories: ['US-2.2', 'US-4.1'],
  acceptanceCriteria: ['AC-2.2.1', 'AC-4.1.1'],
  methods: ['methodName()'],
  hypotheses: ['H4'],
  testCases: ['TC-H4-001'],
};
```

### **Error Handling Standards**

- **Client Errors**: User-friendly messages with recovery actions
- **Server Errors**: Detailed logging with error codes
- **Validation Errors**: Field-specific feedback with suggestions
- **Network Errors**: Retry mechanisms with exponential backoff

---

## 📚 Documentation & Learning

### **Critical Reference Documents**

- **CORE_REQUIREMENTS.md** - Non-negotiable development standards
- **LESSONS_LEARNED.md** - Systematic knowledge capture and patterns (34+
  lessons)
- **PROJECT_REFERENCE.md** - Central navigation hub
- **DEVELOPMENT_STANDARDS.md** - Code quality and architecture patterns
- **FUTURE_DEVELOPMENT_STANDARDS.md** - Advanced development guidelines
- **PERFORMANCE_OPTIMIZATION_GUIDE.md** - Performance best practices

### **Wireframe Integration**

- **WIREFRAME_INTEGRATION_GUIDE.md** - UI/UX implementation guide
- **USER_STORY_TRACEABILITY_MATRIX.md** - Feature mapping
- **COMPONENT_STRUCTURE.md** - Architecture patterns
- **MOBILE_RESPONSIVENESS_GUIDE.md** - Mobile optimization patterns

### **Implementation Tracking**

- **IMPLEMENTATION_LOG.md** - Mandatory after every implementation
- **VERSION_HISTORY.md** - Automated deployment tracking
- **LESSONS_LEARNED.md** - Complex implementation insights
- **ERROR_HANDLING_IMPLEMENTATION.md** - Error handling patterns
- **PERFORMANCE_OPTIMIZATION_GUIDE.md** - Performance optimization insights

---

## 🚀 Deployment & Production

### **Production Environment**

- **Platform**: Netlify with serverless functions
- **Database**: PostgreSQL with connection pooling
- **Caching**: Redis for session and data caching (dev uses in-memory caches)
- **Monitoring**: Real-time performance analytics
- **Version**: 0.2.1-alpha.3

### **Deployment Commands**

```bash
npm run deploy:alpha    # Feature development
npm run deploy:beta     # Feature complete testing
npm run deploy:patch    # Production bug fixes
npm run deployment:info # Check deployment status
```

---

## 🔌 API Endpoints (Recent Additions)

These endpoints were added or enhanced for version history, analytics, and admin
role management. All follow standardized error handling and selective hydration
from CORE_REQUIREMENTS.md.

- Proposals
  - GET `/api/proposals` — cursor pagination, selective field selection via
    `fields`, optional includes (`includeProducts`, `includeTeam`)
  - GET `/api/proposals/stats` — lightweight KPIs (total, inProgress, overdue,
    winRate, totalValue). In-memory TTL cache (dev disabled)
  - GET `/api/proposals/versions` — latest versions across all proposals (limit)
  - GET `/api/proposals/[id]/versions` — versions for a proposal (limit)
  - GET `/api/proposals/[id]/versions?version=NUM&detail=1` — diff view with
    `productsMap` and `customerName`
  - POST `/api/proposals/[id]/versions` — create a snapshot (server-side)

- Product Relationships
  - GET `/api/products/relationships/versions?productId=...&limit=...` — version
    entries involving a product

- Admin Roles
  - GET `/api/admin/users/roles?userId=... | email=...` — list active roles
  - POST `/api/admin/users/roles` — assign role `{ userId, roleId | roleName }`
  - DELETE `/api/admin/users/roles` — remove role
    `{ userId, roleId | roleName }`

UI Entry Points

- Page: `/proposals/version-history` — explore proposal version history with
  diff viewer

Performance & Caching

- Appropriate `Cache-Control` headers on read endpoints
- In-memory cache used only where safe, TTL kept short, disabled in development

Security & RBAC

- Proposals route uses dev-only permission bypass to ease local diagnostics;
  production performs checks and logs. Diagnostics logging is gated behind
  `NODE_ENV !== 'production'`.

---

## 🤝 Contributing

### **Before Contributing**

1. Read **[CORE_REQUIREMENTS.md](docs/CORE_REQUIREMENTS.md)** thoroughly
2. Review **[LESSONS_LEARNED.md](docs/LESSONS_LEARNED.md)** for patterns
3. Check existing implementations in `/src/lib/services/`
4. Run `npm run audit:duplicates` to avoid conflicts
5. Follow established patterns from similar components
6. Ensure TypeScript compliance with `npm run type-check`

### **Code Review Checklist**

- [ ] TypeScript compliance (0 errors)
- [ ] Error handling using ErrorHandlingService
- [ ] Data fetching using useApiClient pattern
- [ ] Mobile touch interaction compliance
- [ ] Performance optimization applied
- [ ] Component Traceability Matrix implemented
- [ ] Documentation updated
- [ ] Date processing follows UTC-based patterns

### **Development Patterns**

- **Data Fetching**: Always use useApiClient pattern for consistent API calls
- **Error Handling**: Implement standardized ErrorHandlingService across
  components
- **Database Operations**: Use prisma.$transaction for related queries
- **Performance**: Apply analytics throttling and infinite loop prevention
- **Type Safety**: Maintain 99% TypeScript compliance with strict typing
- **Date Processing**: Use UTC-based date creation for consistency
- **Mobile Optimization**: Implement touch-friendly interactions with 44px+
  targets
- **Component Architecture**: Follow established patterns from similar
  components

---

## 📚 Documentation

- **[CORE_REQUIREMENTS.md](docs/CORE_REQUIREMENTS.md)** - Non-negotiable
  development standards
- **[LESSONS_LEARNED.md](docs/LESSONS_LEARNED.md)** - Systematic knowledge
  capture (34+ lessons)
- **[PROJECT_REFERENCE.md](docs/PROJECT_REFERENCE.md)** - Central navigation hub
- **[DEVELOPMENT_STANDARDS.md](docs/DEVELOPMENT_STANDARDS.md)** - Code quality
  and architecture patterns
- **[PERFORMANCE_OPTIMIZATION_GUIDE.md](docs/PERFORMANCE_OPTIMIZATION_GUIDE.md)** -
  Performance best practices

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/morabah/posalpro-app/issues)
  for bug reports and feature requests
- **Discussions**:
  [GitHub Discussions](https://github.com/morabah/posalpro-app/discussions) for
  questions and ideas
- **Documentation**: Comprehensive guides in `/docs/` directory

---

**Built with ❤️ using Next.js 15, TypeScript, and enterprise-grade
architecture**
