# PosalPro MVP2 - Application Sitemap

## Overview

This document provides a comprehensive sitemap for PosalPro MVP2, mapping out
the application's page structure, navigation paths, and technical implementation
details. Use this as a reference for implementing the refined wireframes into
the Next.js 15 application architecture.

## Application Structure

```
posalpro-app/                                 # Next.js application root
└── src/
    ├── app/                                  # Next.js App Router pages
    │   ├── (auth)/                           # Authentication group
    │   │   ├── login/                        # Login screen
    │   │   ├── register/                     # Registration screen
    │   │   ├── forgot-password/              # Password recovery
    │   │   └── layout.tsx                    # Auth layout
    │   │
    │   ├── (dashboard)/                      # Main application group
    │   │   ├── dashboard/                    # Main dashboard
    │   │   │   └── page.tsx                  # Dashboard page
    │   │   │
    │   │   ├── proposals/                    # Proposal management section
    │   │   │   ├── page.tsx                  # Proposal dashboard
    │   │   │   ├── create/                   # Create proposal wizard
    │   │   │   │   ├── page.tsx              # Wizard container
    │   │   │   │   ├── customer/             # Step 1: Customer selection
    │   │   │   │   ├── products/             # Step 2: Product selection
    │   │   │   │   ├── details/              # Step 3: Proposal details
    │   │   │   │   ├── review/               # Step 4: Review
    │   │   │   │   └── layout.tsx            # Wizard layout
    │   │   │   │
    │   │   │   ├── [id]/                     # Proposal detail
    │   │   │   │   ├── page.tsx              # Detail view
    │   │   │   │   ├── edit/                 # Edit proposal
    │   │   │   │   ├── validation/           # Validation screen
    │   │   │   │   └── submit/               # Submission
    │   │   │   │
    │   │   │   ├── validation/               # Validation dashboard
    │   │   │   │   ├── page.tsx              # Main validation view
    │   │   │   │   ├── rules/                # Rule management
    │   │   │   │   ├── issues/               # Issue management
    │   │   │   │   └── predictive/           # Predictive validation
    │   │   │   │       ├── page.tsx          # Main predictive view
    │   │   │   │       ├── analysis/         # Risk analysis
    │   │   │   │       ├── learning/         # Pattern learning
    │   │   │   │       └── configuration/    # AI configuration
    │   │   │   │
    │   │   │   └── approvals/                # Approval workflows
    │   │   │       ├── page.tsx              # Approval dashboard
    │   │   │       ├── pending/              # Pending approvals
    │   │   │       ├── [id]/                 # Specific approval
    │   │   │       └── templates/            # Workflow templates
    │   │   │
    │   │   ├── products/                     # Product management
    │   │   │   ├── page.tsx                  # Product dashboard
    │   │   │   ├── [id]/                     # Product detail
    │   │   │   │   ├── page.tsx              # Detail view
    │   │   │   │   └── edit/                 # Edit product
    │   │   │   │
    │   │   │   ├── create/                   # Create product
    │   │   │   └── relationships/            # Product relationships
    │   │   │       ├── page.tsx              # Relationship dashboard
    │   │   │       ├── visual/               # Visual graph
    │   │   │       ├── matrix/               # Matrix view
    │   │   │       └── rules/                # Relationship rules
    │   │   │
    │   │   ├── content/                      # Content management
    │   │   │   ├── page.tsx                  # Content dashboard
    │   │   │   ├── search/                   # Content search
    │   │   │   ├── [id]/                     # Content detail
    │   │   │   └── create/                   # Create content
    │   │   │
    │   │   ├── customers/                    # Customer management
    │   │   │   ├── page.tsx                  # Customer dashboard
    │   │   │   ├── [id]/                     # Customer detail
    │   │   │   └── create/                   # Create customer
    │   │   │
    │   │   ├── admin/                        # Admin section
    │   │   │   ├── page.tsx                  # Admin dashboard
    │   │   │   ├── users/                    # User management
    │   │   │   ├── roles/                    # Role management
    │   │   │   │   ├── page.tsx              # Roles list
    │   │   │   │   ├── [id]/                 # Role detail/edit
    │   │   │   │   ├── create/               # Create role
    │   │   │   │   ├── matrix/               # Permission matrix
    │   │   │   │   └── hierarchy/            # Role hierarchy
    │   │   │   ├── settings/                 # System settings
    │   │   │   ├── integrations/             # External integrations
    │   │   │   └── audit/                    # Audit logs
    │   │   │
    │   │   ├── profile/                      # User profile
    │   │   │   ├── page.tsx                  # Profile view
    │   │   │   └── settings/                 # User settings
    │   │   │
    │   │   └── layout.tsx                    # Main application layout
    │   │
    │   ├── api/                              # API routes
    │   │   ├── auth/                         # Auth endpoints
    │   │   ├── proposals/                    # Proposal endpoints
    │   │   ├── products/                     # Product endpoints
    │   │   ├── validation/                   # Validation endpoints
    │   │   ├── approvals/                    # Approval endpoints
    │   │   ├── customers/                    # Customer endpoints
    │   │   ├── content/                      # Content endpoints
    │   │   └── admin/                        # Admin endpoints
    │   │
    │   ├── layout.tsx                        # Root layout
    │   └── page.tsx                          # Root page (redirect)
    │
    ├── components/                           # Reusable UI components
    │   ├── ui/                               # Basic UI components
    │   │   ├── button.tsx                    # Button component
    │   │   ├── card.tsx                      # Card component
    │   │   ├── dialog.tsx                    # Dialog component
    │   │   ├── dropdown.tsx                  # Dropdown component
    │   │   ├── form/                         # Form components
    │   │   │   ├── input.tsx                 # Input component
    │   │   │   ├── select.tsx                # Select component
    │   │   │   └── checkbox.tsx              # Checkbox component
    │   │   ├── table.tsx                     # Table component
    │   │   ├── tabs.tsx                      # Tabs component
    │   │   └── toast.tsx                     # Toast component
    │   │
    │   ├── layouts/                          # Layout components
    │   │   ├── sidebar-nav.tsx               # Sidebar navigation
    │   │   ├── header.tsx                    # Application header
    │   │   └── footer.tsx                    # Application footer
    │   │
    │   ├── proposals/                        # Proposal-specific components
    │   │   ├── proposal-card.tsx             # Proposal card
    │   │   ├── proposal-form.tsx             # Proposal form
    │   │   ├── proposal-status.tsx           # Status indicator
    │   │   ├── proposal-history.tsx          # Version history
    │   │   ├── proposal-analytics.tsx        # Analytics dashboard
    │   │   └── lifecycle-visualization.tsx   # Lifecycle visualization
    │   │
    │   ├── products/                         # Product-specific components
    │   │   ├── product-card.tsx              # Product card
    │   │   ├── product-form.tsx              # Product form
    │   │   ├── relationship-graph.tsx        # Relationship visualization
    │   │   ├── relationship-matrix.tsx       # Relationship matrix
    │   │   └── rule-builder.tsx              # Relationship rule builder
    │   │
    │   ├── validation/                       # Validation components
    │   │   ├── validation-issue.tsx          # Issue display
    │   │   ├── rule-editor.tsx               # Rule editor
    │   │   ├── rule-builder.tsx              # Visual rule builder
    │   │   ├── predictive/                   # Predictive components
    │   │   │   ├── risk-heatmap.tsx          # Risk visualization
    │   │   │   ├── pattern-chart.tsx         # Pattern analysis chart
    │   │   │   └── recommendation-card.tsx   # Rule recommendation
    │   │   └── fix-suggestion.tsx            # Auto-fix suggestion
    │   │
    │   ├── approvals/                        # Approval components
    │   │   ├── approval-card.tsx             # Approval card
    │   │   ├── workflow-editor.tsx           # Workflow editor
    │   │   ├── decision-form.tsx             # Decision form
    │   │   ├── workflow-visualizer.tsx       # Workflow visualization
    │   │   └── sla-tracker.tsx               # SLA tracking
    │   │
    │   └── admin/                            # Admin components
    │       ├── user-table.tsx                # User management table
    │       ├── role-editor.tsx               # Role editor
    │       ├── permission-matrix.tsx         # Permission matrix
    │       ├── audit-log.tsx                 # Audit log viewer
    │       ├── system-metrics.tsx            # System metrics
    │       └── hierarchy-visualizer.tsx      # Role hierarchy visualizer
    │
    ├── lib/                                  # Utility functions and config
    │   ├── api/                              # API client utilities
    │   │   ├── client.ts                     # API client setup
    │   │   ├── proposals.ts                  # Proposal API methods
    │   │   ├── products.ts                   # Product API methods
    │   │   ├── validation.ts                 # Validation API methods
    │   │   └── users.ts                      # User API methods
    │   │
    │   ├── validation/                       # Validation logic
    │   │   ├── rules.ts                      # Rule execution engine
    │   │   ├── validators.ts                 # Validation functions
    │   │   └── predictive/                   # Predictive validation engine
    │   │       ├── risk-analyzer.ts          # Risk analysis
    │   │       ├── pattern-detector.ts       # Pattern detection
    │   │       └── rule-generator.ts         # Rule generation
    │   │
    │   ├── auth/                             # Authentication utilities
    │   │   ├── auth-options.ts               # Auth configuration
    │   │   ├── session.ts                    # Session management
    │   │   └── protection.ts                 # Route protection
    │   │
    │   ├── rbac/                             # Role-based access control
    │   │   ├── roles.ts                      # Role definitions
    │   │   ├── permissions.ts                # Permission definitions
    │   │   ├── checks.ts                     # Permission check functions
    │   │   ├── hierarchy.ts                  # Role hierarchy logic
    │   │   └── context.ts                    # RBAC context provider
    │   │
    │   └── utils/                            # General utilities
    │       ├── date.ts                       # Date formatting
    │       ├── formatting.ts                 # Text formatting
    │       ├── validation.ts                 # Form validation
    │       └── analytics.ts                  # Analytics helpers
    │
    ├── types/                                # TypeScript type definitions
    │   ├── proposal.ts                       # Proposal types
    │   ├── product.ts                        # Product types
    │   ├── validation.ts                     # Validation types
    │   ├── approval.ts                       # Approval types
    │   ├── user.ts                           # User types
    │   ├── rbac.ts                           # RBAC types
    │   └── common.ts                         # Common types
    │
    └── styles/                               # Global styles
        ├── globals.css                       # Global CSS
        └── theme.ts                          # Theme definitions
```

## Route Mapping

| Wireframe             | App Router Route                   | Component Path                                                 | Access Control                 |
| --------------------- | ---------------------------------- | -------------------------------------------------------------- | ------------------------------ |
| Login Screen          | `/login`                           | `src/app/(auth)/login/page.tsx`                                | Public                         |
| Dashboard Screen      | `/dashboard`                       | `src/app/(dashboard)/dashboard/page.tsx`                       | All Users                      |
| Proposal Creation     | `/proposals/create`                | `src/app/(dashboard)/proposals/create/page.tsx`                | Proposal Managers              |
| Proposal Management   | `/proposals`                       | `src/app/(dashboard)/proposals/page.tsx`                       | Proposal Managers, Sales Teams |
| Product Selection     | `/proposals/create/products`       | `src/app/(dashboard)/proposals/create/products/page.tsx`       | Proposal Managers              |
| Product Management    | `/products`                        | `src/app/(dashboard)/products/page.tsx`                        | Product Managers, Admins       |
| Product Relationships | `/products/relationships`          | `src/app/(dashboard)/products/relationships/page.tsx`          | Product Managers               |
| Approval Workflow     | `/proposals/approvals`             | `src/app/(dashboard)/proposals/approvals/page.tsx`             | Approvers, Managers            |
| Customer Profile      | `/customers/[id]`                  | `src/app/(dashboard)/customers/[id]/page.tsx`                  | Sales, Account Managers        |
| Content Search        | `/content/search`                  | `src/app/(dashboard)/content/search/page.tsx`                  | All Users                      |
| Validation Dashboard  | `/proposals/validation`            | `src/app/(dashboard)/proposals/validation/page.tsx`            | Proposal Managers, Admins      |
| Predictive Validation | `/proposals/validation/predictive` | `src/app/(dashboard)/proposals/validation/predictive/page.tsx` | Proposal Managers, Admins      |
| Admin Screen          | `/admin`                           | `src/app/(dashboard)/admin/page.tsx`                           | Admins                         |

## Navigation Hierarchy

### Primary Navigation (Left Sidebar)

- Dashboard
- Proposals
  - View All
  - Create New
  - Validation
  - Approvals
- Products
  - View All
  - Create New
  - Relationships
- Content
  - View All
  - Search
  - Create New
- Customers
  - View All
  - Create New
- Admin (admin users only)
  - System
  - Users
  - Roles
  - Settings
  - Audit Logs
- Profile

### Secondary Navigation (Tabs/Subnav)

- Proposals > Validation
  - Active Issues
  - Rules
  - History
  - Analytics
  - Predictive
- Products > Relationships
  - Visual Graph
  - Matrix
  - Rules
  - Simulator
- Admin > Roles
  - Role List
  - Permissions Matrix
  - Templates
  - Role Hierarchy

## Implementation Priorities

### Phase 1: Core Framework

1. Application structure and routing setup
2. Authentication system
3. Basic RBAC framework
4. Common UI components
5. API foundation

### Phase 2: Primary Features

1. Dashboard
2. Proposal creation and management
3. Product management (basic)
4. Customer management
5. Content management (basic)

### Phase 3: Advanced Features

1. Validation system
2. Approval workflows
3. Product relationships
4. Enhanced content management

### Phase 4: AI Integration

1. Predictive validation
2. Content recommendations
3. Approval optimization
4. Analytics dashboards

## Technical Specifications

### State Management

- Server components for data fetching
- React Context for global state
- React Query for server state
- Form state with React Hook Form and Zod validation

### Data Fetching

- Server actions for mutations
- API routes for client-side operations
- Middleware for authentication and RBAC

### UI Framework

- Tailwind CSS for styling
- Headless UI components
- Custom component library

### Performance Considerations

- Static rendering where possible
- Dynamic rendering for personalized content
- Streaming for long operations
- Optimistic updates for improved UX

## Role-Based Access Control

The implementation will follow the enhanced RBAC system defined in the Admin
Screen wireframe, with:

- Role hierarchy and inheritance
- Dynamic role capabilities (ABAC extension)
- Separation of duties controls
- Temporary access and delegation
- Permission impact analysis
- Role templates and provisioning
- Advanced auditing and monitoring

## Next Steps

1. Initialize Next.js 15 application with TypeScript
2. Configure project structure following the sitemap
3. Set up authentication and RBAC framework
4. Create core UI components
5. Implement the first set of pages based on priority
