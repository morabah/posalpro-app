# PosalPro MVP2

> Enterprise-grade proposal management platform with modern React architecture,
> comprehensive TypeScript coverage, and advanced performance optimization.

[![TypeScript](https://img.shields.io/badge/TypeScript-99%25-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Live Demo](https://img.shields.io/badge/Demo-Running-green.svg)](https://posalpro-mvp2.windsurf.build)

---

## Overview

PosalPro MVP2 is an enterprise-grade proposal management platform featuring:

- **Proposal Lifecycle**: Multi-step wizard, version control, workflow
  management
- **Product Management**: Dynamic catalog with relationships and pricing
- **Team Collaboration**: RBAC, SME assignments, audit trails
- **Customer Management**: Profiles, history, analytics
- **Analytics Dashboard**: Real-time KPIs, performance monitoring

**Live Demo**: https://posalpro-mvp2.windsurf.build

### Enterprise Standards

- ✅ 100% TypeScript with strict mode
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Advanced caching (Redis + React Query)
- ✅ Security hardening with rate limiting
- ✅ Performance optimization with Web Vitals

---

## Tech Stack

**Core**: Next.js 15, TypeScript 5.8, React 18, Tailwind CSS **Backend**: Prisma
5.7, PostgreSQL, NextAuth.js, Redis **State**: React Query, Zustand, React Hook
Form, Zod **UI**: Radix UI, Headless UI, Framer Motion, Recharts **Quality**:
ESLint, Jest, Prettier, Husky, lint-staged

---

## Architecture & Patterns

PosalPro MVP2 implements a modern, enterprise-grade architecture with
feature-based organization and bridge patterns.

### Feature-Based Architecture

```typescript
src/features/[domain]/
├── schemas.ts        # Zod schemas, types, validation
├── keys.ts          # React Query keys, centralized caching
├── hooks/           # Feature-specific React Query hooks
└── index.ts         # Consolidated exports
```

### Bridge Pattern Architecture

**Three-Layer Pattern**: Components → Management Bridge → API Bridge → API
Routes

### Modern Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI        │───▶│ React Query │───▶│  Service    │
│ Components  │    │   Hooks     │    │   Layer     │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Zustand     │    │ Centralized │    │   API       │
│ UI State    │    │ Query Keys  │    │  Routes     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Key Patterns

- **Database-First**: Schema alignment with Prisma models
- **Service Layer**: Stateless services with singleton pattern
- **Error Handling**: Centralized with `ErrorHandlingService`
- **Performance**: Cursor pagination, optimistic updates, multi-layer caching

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

# Configure environment
cp .env.example .env.local
# Set NEXTAUTH_SECRET, DATABASE_URL, NEXTAUTH_URL, etc.

# Database setup
npm run db:generate
npm run db:push
npm run db:seed

# Start development server
npm run dev:smart
```

Open http://localhost:3000

## Development

### Quality Gates

```bash
npm run type-check          # TypeScript strict mode (0 errors)
npm run quality:check       # Lint + type-check + format
npm run build              # Production build validation
npm run pre-commit         # Pre-commit hooks (automatic)
```

### Essential Scripts

```bash
npm run dev:smart          # Clean development server (port 3000)
npm run build              # Production build
npm run type-check         # TypeScript validation
npm run app:cli            # Interactive API/DB testing
npm run db:studio          # Open Prisma Studio
npm run test               # Jest test runner
npm run test:ci            # CI test suite
```

## Project Structure

```
posalpro-app/
├── src/
│   ├── app/               # Next.js App Router
│   ├── features/          # Feature-based organization
│   │   ├── proposals/     # Proposal domain
│   │   ├── customers/     # Customer domain
│   │   └── products/      # Product domain
│   ├── components/        # Reusable UI components
│   ├── lib/               # Core utilities & services
│   │   ├── services/      # Service layer
│   │   ├── store/         # Zustand stores
│   │   └── errors/        # Error handling system
│   └── types/             # TypeScript definitions
├── prisma/                # Database schema & migrations
├── docs/                  # Comprehensive documentation
└── scripts/               # Development utilities
```

## API Endpoints

### Core APIs

```typescript
GET    /api/proposals              # List with pagination & filtering
GET    /api/proposals/[id]         # Individual proposal details
POST   /api/proposals              # Create new proposal
PUT    /api/proposals/[id]         # Update proposal
DELETE /api/proposals/[id]         # Delete proposal
GET    /api/proposals/stats        # Real-time KPIs

GET    /api/products               # Product catalog
GET    /api/customers              # Customer list
GET    /api/admin/users            # User management with RBAC
```

### Advanced Features

- **Cursor-based Pagination**: Efficient large dataset handling
- **RBAC Security**: Role-based access control on all endpoints
- **Redis Caching**: Intelligent caching with TTL management
- **Request Correlation**: `x-request-id` tracking across services

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

## Support

- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions and ideas

## License

MIT — see `LICENSE`.
