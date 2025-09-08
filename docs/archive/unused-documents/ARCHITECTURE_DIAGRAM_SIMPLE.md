# 📊 PosalPro MVP2 - Simplified Architecture Diagram

## 🏗️ **Quick Reference Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    🎯 USER LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Browser   │ │ Next.js     │ │  React Components   │   │
│  │   Client    │ │ App Router  │ │  • Forms, Tables    │   │
│  │             │ │ • /app/*    │ │  • Modals, Charts   │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   🔧 APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ React Query │ │ Zustand     │ │  Custom Hooks      │   │
│  │ • Caching   │ │ • UI State  │ │  • useProposal     │   │
│  │ • Mutations │ │ • Forms     │ │  • useCustomer     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ Services    │ │ Validation  │ │  Authentication    │   │
│  │ • Proposal  │ │ • Zod       │ │  • NextAuth.js     │   │
│  │ • Customer  │ │ • Schemas   │ │  • RBAC            │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  🖥️ INFRASTRUCTURE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ API Routes  │ │ Database    │ │  External Services  │   │
│  │ • /api/*    │ │ • Prisma    │ │  • Email Service    │   │
│  │ • REST APIs │ │ • PostgreSQL│ │  • File Storage     │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 **Data Flow in 3 Steps**

### **1. User Action → Database**
```
User Click → Component → Hook → Service → HTTP → API Route → Prisma → Database
```

### **2. Database → UI Update**
```
Database → Prisma → API Route → HTTP → Service → Hook → Component → UI
```

### **3. State Management**
```
Server State: React Query Cache (30s stale, 2min GC)
Client State: Zustand Store (Immediate updates)
UI State: useState/useReducer (Local component state)
```

## 📁 **File Organization at a Glance**

```
📁 src/
├── 📁 app/              # Next.js Pages (/dashboard, /auth, /api)
├── 📁 components/       # UI Components (ui/, forms/, tables/)
├── 📁 hooks/           # Custom Hooks (useProposal, useCustomer)
├── 📁 services/        # Business Logic (ProposalService, etc.)
├── 📁 lib/             # Infrastructure (api/, auth/, store/)
├── 📁 features/        # Feature Organization (proposals/, customers/)
├── 📁 types/           # TypeScript Types (api.ts, auth.ts)
└── 📁 utils/           # Helper Functions

📁 prisma/              # Database Schema & Migrations
📁 docs/               # Documentation & Guides
```

## 🏗️ **Architecture Principles**

### **1. Separation of Concerns**
- **UI Layer**: Pure presentation components
- **Application Layer**: Business logic and data fetching
- **Infrastructure Layer**: Database, APIs, external services

### **2. State Management Strategy**
- **Server State**: React Query (API data, caching)
- **Client State**: Zustand (UI state, forms, navigation)
- **Local State**: useState/useReducer (component-specific)

### **3. Data Flow Patterns**
- **Unidirectional**: User → Component → Hook → Service → API
- **Reactive**: Changes propagate up through layers
- **Cached**: Intelligent caching at multiple levels

### **4. Error Handling**
- **Boundary**: Error boundaries catch UI errors
- **Service**: ErrorHandlingService processes all errors
- **Logging**: Structured logging with context
- **Recovery**: Retry mechanisms and fallback UI

## ⚡ **Key Technologies**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 | Full-stack React framework |
| **State** | React Query + Zustand | Server + client state management |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Backend** | Next.js API Routes | Serverless API endpoints |
| **Database** | PostgreSQL + Prisma | Type-safe database ORM |
| **Auth** | NextAuth.js | Authentication & authorization |
| **Validation** | Zod | Runtime type validation |
| **UI** | Radix UI + Lucide | Accessible component library |

---

## 📋 **Quick Development Reference**

### **Adding a New Feature**
1. **Database**: Add model to `prisma/schema.prisma`
2. **API**: Create route in `src/app/api/`
3. **Service**: Add business logic in `src/services/`
4. **Hooks**: Create data hooks in `src/hooks/`
5. **Components**: Build UI in `src/components/`
6. **Pages**: Add route in `src/app/`

### **Data Flow Checklist**
- ✅ Database schema updated
- ✅ API route created with validation
- ✅ Service layer implemented
- ✅ React Query hooks added
- ✅ Components consume data
- ✅ Error handling added
- ✅ Loading states handled
- ✅ Caching configured

### **Performance Checklist**
- ✅ React Query caching (30s stale, 2min GC)
- ✅ HTTP client optimization (retry, dedup)
- ✅ Database indexing
- ✅ Bundle splitting
- ✅ Image optimization
- ✅ Error boundaries

---

*This simplified diagram provides a quick reference for understanding PosalPro MVP2's architecture and development patterns.*
