# PosalPro MVP2 - Application Sitemap

## Overview

This document defines the complete application structure and routing for
PosalPro MVP2, reflecting the enhanced wireframes with comprehensive user story
traceability, analytics instrumentation, and hypothesis validation capabilities.
All routes are organized according to Next.js 15 App Router patterns with
role-based access control and performance measurement integration.

## User Story and Hypothesis Coverage Summary

### Route Coverage by Hypothesis

- **H1 (Content Discovery - 45% reduction)**: `/content-search`, `/dashboard`,
  `/product-selection`
- **H3 (SME Contribution - 50% reduction)**: `/sme-contribution`, `/dashboard`
- **H4 (Cross-Department Coordination - 40% reduction)**: `/coordination-hub`,
  `/login`, `/register`, `/admin`, `/customer-profile`
- **H6 (Requirement Extraction - 30% improvement)**: `/rfp-parser`
- **H7 (Deadline Management - 40% improvement)**: `/dashboard`,
  `/coordination-hub`, `/proposal-creation`, `/approval-workflow`,
  `/executive-review`, `/proposal-management`
- **H8 (Technical Validation - 50% reduction)**: `/validation-dashboard`,
  `/product-management`, `/product-selection`, `/product-relationships`

## Application Structure

```
PosalPro MVP2 Application
├── / (Landing/Dashboard)
├── /auth/
│   ├── login
│   ├── register
│   └── forgot-password
├── /dashboard/
│   ├── overview
│   ├── metrics
│   └── hypothesis-tracking
├── /proposals/
│   ├── manage
│   ├── create
│   ├── [id]/
│   │   ├── edit
│   │   ├── view
│   │   └── analytics
│   └── management-dashboard
├── /content/
│   ├── search
│   ├── browse
│   ├── upload
│   └── analytics
├── /products/
│   ├── catalog
│   ├── selection
│   ├── relationships
│   ├── management
│   └── validation
├── /sme/
│   ├── contribution
│   ├── assignments
│   └── dashboard
├── /coordination/
│   ├── hub
│   ├── timeline
│   └── communication
├── /validation/
│   ├── dashboard
│   ├── rules
│   ├── issues
│   └── reports
├── /approval/
│   ├── workflow
│   ├── pending
│   └── history
├── /rfp/
│   ├── parser
│   ├── analysis
│   └── requirements
├── /admin/
│   ├── users
│   ├── roles
│   ├── permissions
│   ├── system
│   └── analytics
├── /analytics/
│   ├── hypothesis-dashboard
│   ├── performance-baselines
│   ├── user-story-tracking
│   └── system-metrics
└── /settings/
    ├── profile
    ├── preferences
    └── security
```

## Detailed Route Specifications

### Root Routes

#### `/` - Main Dashboard

- **Component**: `DashboardScreen`
- **User Stories**: US-4.1, US-4.3 (Supporting overview for US-1.1, US-2.1,
  US-3.1)
- **Hypothesis Coverage**: H7 (Deadline Management), Supporting H1, H3, H4, H8
- **Analytics**: `useDashboardAnalytics()` for performance tracking
- **Access**: All authenticated users
- **Features**:
  - Role-based dashboard widgets
  - Performance metrics overview
  - Hypothesis progress tracking
  - Quick navigation to key features
  - Real-time notifications
  - Timeline visualization for H7 validation

### Authentication Routes (`/auth/`)

#### `/auth/login` - User Login

- **Component**: `LoginScreen`
- **User Stories**: US-2.3 (Supporting all user stories)
- **Hypothesis Coverage**: Supporting H4 (Cross-Department Coordination)
- **Analytics**: `useLoginAnalytics()` for authentication performance
- **Access**: Public
- **Features**:
  - Multi-factor authentication
  - Role-based login flow
  - Session management
  - Analytics for login performance
  - Security monitoring

#### `/auth/register` - User Registration

- **Component**: `UserRegistrationScreen`
- **User Stories**: US-2.3 (Supporting all user stories)
- **Hypothesis Coverage**: Supporting H4 (Cross-Department Coordination)
- **Analytics**: `useUserRegistrationAnalytics()`
- **Access**: Public or admin-controlled
- **Features**:
  - User account creation
  - Role assignment workflow
  - Email verification
  - Security configuration
  - Onboarding analytics

#### `/auth/forgot-password` - Password Recovery

- **Component**: `PasswordRecoveryScreen`
- **Access**: Public
- **Features**:
  - Secure password reset flow
  - Multi-step verification
  - Security audit logging

### Dashboard Routes (`/dashboard/`)

#### `/dashboard/overview` - Executive Overview

- **Component**: `ExecutiveReviewScreen`
- **User Stories**: US-4.1, US-4.3 (Executive visibility)
- **Hypothesis Coverage**: H7 (Deadline Management)
- **Analytics**: `useExecutiveAnalytics()`
- **Access**: Executive roles
- **Features**:
  - High-level metrics and KPIs
  - Proposal portfolio overview
  - Timeline performance (H7)
  - Risk assessment dashboard
  - Executive decision support

#### `/dashboard/metrics` - Performance Metrics

- **Component**: `MetricsDashboard`
- **User Stories**: All user stories (performance measurement)
- **Hypothesis Coverage**: All hypotheses (H1, H3, H4, H6, H7, H8)
- **Analytics**: `usePerformanceMetricsAnalytics()`
- **Access**: Manager and admin roles
- **Features**:
  - Performance trend analysis
  - Hypothesis validation progress
  - User story completion tracking
  - Benchmark comparisons

#### `/dashboard/hypothesis-tracking` - Hypothesis Validation Dashboard

- **Component**: `HypothesisTrackingDashboard`
- **User Stories**: All user stories (hypothesis validation)
- **Hypothesis Coverage**: All hypotheses (H1, H3, H4, H6, H7, H8)
- **Analytics**: `useHypothesisTrackingAnalytics()`
- **Access**: Analytics and admin roles
- **Features**:
  - Real-time hypothesis progress
  - Target vs. actual performance
  - Confidence interval tracking
  - Statistical significance analysis
  - A/B testing results

### Proposal Routes (`/proposals/`)

#### `/proposals/manage` - Proposal Management

- **Component**: `ProposalManagementDashboard`
- **User Stories**: US-4.1, US-4.3, Supporting US-2.2, US-1.3
- **Hypothesis Coverage**: H7, Supporting H4, H1
- **Analytics**: `useProposalManagementAnalytics()`
- **Access**: Proposal specialists, managers
- **Features**:
  - Proposal filtering and search
  - Status tracking and visualization
  - Performance metrics dashboard
  - Timeline accuracy tracking (H7)

#### `/proposals/create` - Proposal Creation

- **Component**: `ProposalCreationScreen`
- **User Stories**: US-4.1, US-2.2
- **Hypothesis Coverage**: H7 (Deadline Management), H4 (Coordination)
- **Analytics**: `useProposalCreationAnalytics()`
- **Access**: Proposal specialists, managers
- **Features**:
  - Multi-step proposal wizard
  - AI-assisted content suggestions
  - Intelligent timeline creation (H7)
  - Cross-department coordination (H4)
  - Real-time validation

#### `/proposals/[id]/edit` - Proposal Editor

- **Component**: `ProposalEditor`
- **User Stories**: US-4.1, US-2.2, US-1.1, US-3.1
- **Hypothesis Coverage**: H7, H4, H1, H8
- **Analytics**: `useProposalEditingAnalytics()`
- **Access**: Assigned users
- **Features**:
  - Rich text editor with AI assistance
  - Content search integration (H1)
  - Validation integration (H8)
  - Collaboration tools (H4)
  - Timeline tracking (H7)

#### `/proposals/[id]/view` - Proposal Viewer

- **Component**: `ProposalViewer`
- **Access**: Authorized users
- **Features**:
  - Read-only proposal display
  - Export functionality
  - Sharing and collaboration tools
  - Approval status tracking

#### `/proposals/[id]/analytics` - Proposal Analytics

- **Component**: `ProposalAnalyticsScreen`
- **User Stories**: Performance measurement for all proposal-related user
  stories
- **Hypothesis Coverage**: All applicable hypotheses
- **Analytics**: `useProposalSpecificAnalytics()`
- **Access**: Managers, analytics roles
- **Features**:
  - Individual proposal performance
  - Timeline accuracy analysis
  - Coordination effectiveness
  - Validation performance

#### `/proposals/management-dashboard` - Proposal Management

- **Component**: `ProposalManagementDashboard`
- **User Stories**: US-4.1, US-4.3, Supporting US-2.2, US-1.3
- **Hypothesis Coverage**: H7, Supporting H4, H1
- **Analytics**: `useProposalManagementAnalytics()`
- **Access**: Proposal managers
- **Features**:
  - Portfolio overview
  - Resource allocation
  - Performance tracking
  - Timeline management (H7)

### Content Routes (`/content/`)

#### `/content/search` - Content Search

- **Component**: `ContentSearchScreen`
- **User Stories**: US-1.1, US-1.2, US-1.3
- **Hypothesis Coverage**: H1 (Content Discovery Efficiency)
- **Analytics**: `useContentSearchAnalytics()` for H1 validation
- **Access**: All authenticated users
- **Features**:
  - AI-powered semantic search
  - Advanced filtering capabilities
  - Content preview and selection
  - Usage analytics and tracking
  - Search time optimization (45% reduction target)

#### `/content/browse` - Content Browser

- **Component**: `ContentBrowser`
- **User Stories**: US-1.2, US-1.3
- **Hypothesis Coverage**: H1
- **Analytics**: `useContentBrowsingAnalytics()`
- **Access**: All authenticated users
- **Features**:
  - Category-based browsing
  - AI-suggested content
  - Quality scoring and ratings
  - Usage pattern analysis

#### `/content/upload` - Content Upload

- **Component**: `ContentUploadScreen`
- **User Stories**: US-1.3 (Content quality tracking)
- **Hypothesis Coverage**: Supporting H1
- **Access**: Content creators
- **Features**:
  - Multi-format content upload
  - Automatic categorization
  - Quality assessment
  - Metadata extraction

#### `/content/analytics` - Content Analytics

- **Component**: `ContentAnalyticsScreen`
- **User Stories**: US-1.3 (Quality tracking)
- **Hypothesis Coverage**: H1 (Content Discovery)
- **Analytics**: `useContentAnalyticsTracking()`
- **Access**: Content managers
- **Features**:
  - Content performance metrics
  - Search efficiency analysis
  - Quality trend tracking
  - Usage pattern insights

### Product Routes (`/products/`)

#### `/products/catalog` - Product Catalog

- **Component**: `ProductManagementScreen`
- **User Stories**: US-3.2, Supporting US-3.1, US-1.2
- **Hypothesis Coverage**: H8, Supporting H1
- **Analytics**: `useProductCatalogAnalytics()`
- **Access**: All authenticated users
- **Features**:
  - Product browsing and search
  - Category management
  - Specification viewing
  - Relationship visualization

#### `/products/selection` - Product Selection

- **Component**: `ProductSelectionScreen`
- **User Stories**: US-1.2, US-3.1, Supporting US-4.1
- **Hypothesis Coverage**: H1, H8, Supporting H7
- **Analytics**: `useProductSelectionAnalytics()`
- **Access**: Proposal specialists
- **Features**:
  - AI-suggested product selection
  - Compatibility checking (H8)
  - Configuration validation
  - Relationship-aware selection

#### `/products/relationships` - Product Relationships

- **Component**: `ProductRelationshipsScreen`
- **User Stories**: US-3.1, US-3.2, Supporting US-1.2
- **Hypothesis Coverage**: H8, Supporting H1
- **Analytics**: `useProductRelationshipsAnalytics()`
- **Access**: Product managers, validation specialists
- **Features**:
  - Relationship visualization
  - Dependency mapping
  - Compatibility matrix
  - Rule management

#### `/products/management` - Product Management

- **Component**: `ProductManagementScreen`
- **User Stories**: US-3.2, Supporting US-3.1, US-1.2
- **Hypothesis Coverage**: H8, Supporting H1
- **Analytics**: `useProductManagementAnalytics()`
- **Access**: Product managers
- **Features**:
  - Product lifecycle management
  - Relationship rule configuration
  - Validation rule setup
  - Performance tracking

#### `/products/validation` - Product Validation

- **Component**: `ProductValidationScreen`
- **User Stories**: US-3.1, US-3.2
- **Hypothesis Coverage**: H8 (Technical Configuration Validation)
- **Analytics**: `useProductValidationAnalytics()`
- **Access**: Validation specialists
- **Features**:
  - Configuration validation
  - Error detection and fixing (50% reduction target)
  - Validation rule management
  - Performance analytics

### SME Routes (`/sme/`)

#### `/sme/contribution` - SME Contribution

- **Component**: `SMEContributionScreen`
- **User Stories**: US-2.1
- **Hypothesis Coverage**: H3 (SME Contribution Efficiency)
- **Analytics**: `useSMEContributionAnalytics()` for H3 validation
- **Access**: Technical SMEs
- **Features**:
  - AI-assisted content creation
  - Template guidance system
  - Assignment management
  - Progress tracking
  - Time reduction measurement (50% target)

#### `/sme/assignments` - SME Assignments

- **Component**: `SMEAssignmentDashboard`
- **User Stories**: US-2.1
- **Hypothesis Coverage**: H3
- **Analytics**: `useSMEAssignmentAnalytics()`
- **Access**: Technical SMEs
- **Features**:
  - Assignment overview
  - Priority management
  - Deadline tracking
  - Performance metrics

#### `/sme/dashboard` - SME Dashboard

- **Component**: `SMEDashboard`
- **User Stories**: US-2.1
- **Hypothesis Coverage**: H3
- **Analytics**: `useSMEDashboardAnalytics()`
- **Access**: Technical SMEs
- **Features**:
  - Personal performance metrics
  - Contribution history
  - AI assistance utilization
  - Time savings tracking

### Coordination Routes (`/coordination/`)

#### `/coordination/hub` - Coordination Hub

- **Component**: `CoordinationHubScreen`
- **User Stories**: US-2.2, US-2.3, US-4.1, US-4.3
- **Hypothesis Coverage**: H4 (Cross-Department Coordination), H7 (Deadline
  Management)
- **Analytics**: `useCoordinationAnalytics()` for H4 and H7 validation
- **Access**: Proposal managers, coordinators
- **Features**:
  - Team assignment and management
  - Communication facilitation
  - Timeline visualization
  - Bottleneck prediction
  - Coordination effort tracking (40% reduction target)

#### `/coordination/timeline` - Timeline Management

- **Component**: `TimelineManagement`
- **User Stories**: US-4.1, US-4.3
- **Hypothesis Coverage**: H7 (Deadline Management)
- **Analytics**: `useTimelineAnalytics()`
- **Access**: Project managers
- **Features**:
  - Interactive timeline creation
  - Milestone tracking
  - Critical path analysis
  - Performance prediction

#### `/coordination/communication` - Communication Center

- **Component**: `CommunicationCenter`
- **User Stories**: US-2.2, US-2.3
- **Hypothesis Coverage**: H4 (Cross-Department Coordination)
- **Analytics**: `useCommunicationAnalytics()`
- **Access**: All team members
- **Features**:
  - Integrated messaging
  - Document sharing
  - Status updates
  - Collaboration tracking

### Validation Routes (`/validation/`)

#### `/validation/dashboard` - Validation Dashboard

- **Component**: `ValidationDashboardScreen`
- **User Stories**: US-3.1, US-3.2, US-3.3
- **Hypothesis Coverage**: H8 (Technical Configuration Validation)
- **Analytics**: `useValidationAnalytics()` for H8 validation
- **Access**: Validation specialists, presales engineers
- **Features**:
  - Validation issue overview
  - Rule management interface
  - Error detection and resolution
  - Performance tracking (50% error reduction target)

#### `/validation/rules` - Validation Rules

- **Component**: `ValidationRulesScreen`
- **User Stories**: US-3.1, US-3.3
- **Hypothesis Coverage**: H8
- **Analytics**: `useValidationRulesAnalytics()`
- **Access**: Validation administrators
- **Features**:
  - Rule creation and editing
  - Rule testing and simulation
  - Performance optimization
  - AI-suggested improvements

#### `/validation/issues` - Issue Management

- **Component**: `ValidationIssuesScreen`
- **User Stories**: US-3.1, US-3.2
- **Hypothesis Coverage**: H8
- **Analytics**: `useIssueManagementAnalytics()`
- **Access**: Validation specialists
- **Features**:
  - Issue tracking and resolution
  - Fix suggestion management
  - Resolution workflow
  - Performance analytics

#### `/validation/reports` - Validation Reports

- **Component**: `ValidationReportsScreen`
- **User Stories**: US-3.2, US-3.3
- **Hypothesis Coverage**: H8
- **Analytics**: `useValidationReportingAnalytics()`
- **Access**: Managers, compliance teams
- **Features**:
  - Compliance reporting
  - Performance trend analysis
  - Validation effectiveness metrics
  - Exportable reports

### Approval Routes (`/approval/`)

#### `/approval/workflow` - Approval Workflow

- **Component**: `ApprovalWorkflowScreen`
- **User Stories**: US-4.1, US-4.3
- **Hypothesis Coverage**: H7 (Deadline Management)
- **Analytics**: `useApprovalWorkflowAnalytics()`
- **Access**: Approvers, managers
- **Features**:
  - Workflow visualization
  - Decision interfaces
  - SLA tracking
  - Performance monitoring

#### `/approval/pending` - Pending Approvals

- **Component**: `PendingApprovalsScreen`
- **User Stories**: US-4.1, US-4.3
- **Hypothesis Coverage**: H7
- **Analytics**: `usePendingApprovalsAnalytics()`
- **Access**: Approvers
- **Features**:
  - Approval queue management
  - Priority indicators
  - Quick decision tools
  - Time tracking

#### `/approval/history` - Approval History

- **Component**: `ApprovalHistoryScreen`
- **User Stories**: US-4.1, US-4.3
- **Hypothesis Coverage**: H7
- **Analytics**: `useApprovalHistoryAnalytics()`
- **Access**: Managers, auditors
- **Features**:
  - Historical approval data
  - Performance analysis
  - Audit trails
  - Trend reporting

### RFP Routes (`/rfp/`)

#### `/rfp/parser` - RFP Parser

- **Component**: `RFPParserScreen`
