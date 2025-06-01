# PosalPro MVP2 - Wireframe Integration Guide

## Overview

This document ensures consistency and integration across all PosalPro MVP2
wireframes, establishing clear navigation paths, shared components, and data
flows between screens. Use this guide to maintain design coherence and
functional connectivity across the application.

**Last Updated**: June 1, 2025 - Includes all 15 core wireframes

### Complete Wireframe List

1. **Dashboard**
2. **Login Screen**
3. **Content Search Screen**
4. **Proposal Creation Wizard**
5. **Proposal Management Dashboard**
6. **Validation Dashboard**
7. **Predictive Validation Module**
8. **Approval Workflow**
9. **Product Relationships Management**
10. **Admin Screen**
11. **SME Contribution Portal**
12. **Coordination Hub**
13. **RFP Requirement Parser**
14. **Executive Review Portal**
15. **User Profile Screen**
16. **User Registration Screen**

## Design System Consistency

### Global Navigation Structure

```
+-----------------------------------------------+
| POSALPRO                      [Search] [👤 MR] |
+------------+----------------------------------|
|            |                                  |
| Dashboard  | Current Section > Current Page   |
|            |                                  |
| Proposals  | [Primary Action] [Secondary Action] |
|            |                                  |
| Products   | +-------------------------------+ |
|            | | Content Panel                | |
| Content    | +-------------------------------+ |
|            |                                  |
| Parser     | /* Complete navigation structure */ |
|            |                                  |
| Assignments| /* With all 13 screens included */ |
|            |                                  |
| Coordination|                                  |
|            |                                  |
| Validation |                                  |
|            |                                  |
| Approvals  |                                  |
|            |                                  |
| Review     |                                  |
|            |                                  |
| Customers  |                                  |
|            |                                  |
| Profile    |                                  |
|            |                                  |
| Admin      |                                  |
| Settings   |                                  |
|            |                                  |
+------------+----------------------------------+
```

### Shared UI Components

| Component         | Used In                          | Description                   | States                                     |
| ----------------- | -------------------------------- | ----------------------------- | ------------------------------------------ |
| Left Sidebar      | All authenticated screens        | Main navigation               | Normal, Active, Collapsed (Mobile)         |
| Breadcrumb        | All authenticated screens        | Location indicator            | Normal, Clickable                          |
| Action Buttons    | All screens                      | Primary and secondary actions | Normal, Hover, Disabled, Loading           |
| Content Cards     | Dashboard, Products, Customers   | Information container         | Normal, Active, Error, Loading             |
| Status Indicators | Proposals, Approvals, Validation | Visual state representation   | Success, Warning, Error, Neutral, Progress |
| Tab Navigation    | Products, Customers, Approvals   | Section switcher              | Normal, Active, Disabled                   |
| Search Input      | All screens                      | Global and contextual search  | Normal, Focus, Results, No Results         |
| User Menu         | All authenticated screens        | Account and role actions      | Collapsed, Expanded                        |

### Typography & Color System

| Element       | Style         | Usage                         |
| ------------- | ------------- | ----------------------------- |
| Page Title    | 24px/Semibold | Main screen headings          |
| Section Title | 18px/Semibold | Content area divisions        |
| Card Title    | 16px/Medium   | Individual card headers       |
| Body Text     | 14px/Regular  | Main content                  |
| Small Text    | 12px/Regular  | Supporting information        |
| Status Text   | 12px/Medium   | Status indicators             |
| Primary Blue  | #0070f3       | Primary actions, active state |
| Success Green | #10b981       | Success states, approvals     |
| Warning Amber | #f59e0b       | Warning states, pending       |
| Error Red     | #ef4444       | Error states, rejections      |
| Neutral Gray  | #6b7280       | Inactive elements             |

## Screen Integration Flows

### 1. Proposal Creation Path

```
DASHBOARD → PROPOSAL CREATION → CUSTOMER PROFILE → PRODUCT SELECTION
                  ↓
        PRODUCT RELATIONSHIPS
                  ↓
       VALIDATION DASHBOARD → APPROVAL WORKFLOW → EXECUTIVE REVIEW → DASHBOARD (Updated)
```

#### Integration Points:

- **Dashboard to Proposal Creation**: "Create New Proposal" action button
- **Proposal Creation to Customer Selection**: Step 1 in wizard
- **Customer Profile Integration**: Customer data flows to proposal details
- **Product Selection Integration**: Selected products populate proposal line
  items
- **Product Relationships Validation**: Validates compatibility of selected
  products
- **Validation Dashboard**: Comprehensive rule engine with visual builder and
  real-time validation
- **Approval Workflow**: Intelligent workflow orchestration with conditional
  paths and SLA tracking
- **Executive Review**: Final decision by executive stakeholders with
  AI-assisted insights
- **Dashboard Update**: Proposal status reflected in metrics with validation
  analytics

### 2. Product Management Path

```
DASHBOARD → PRODUCT MANAGEMENT → PRODUCT RELATIONSHIPS
              ↓                          ↑
 CONTENT SEARCH SCREEN                   |
              ↓                          |
   PRODUCT SELECTION SCREEN -------------+
```

#### Integration Points:

- **Dashboard to Product Management**: Admin navigation or "Manage Products"
  action
- **Product Management to Relationships**: "Manage Relationships" link on
  product detail
- **Content Search Integration**: AI-assisted content discovery for product
  descriptions
- **Product Selection Integration**: Products from catalog shown in selection
  screen
- **Relationship Validation**: Rules applied during product selection

### 3. Customer Engagement Path

```
DASHBOARD → CUSTOMER PROFILE → PROPOSAL CREATION
              ↓                       ↑
        CONTENT SEARCH                |
              ↓                       |
         PROPOSAL HISTORY -------------+
```

#### Integration Points:

- **Dashboard to Customer**: "View Customers" or customer metrics cards
- **Customer to Proposals**: "New Proposal" action from customer profile
- **Content Search Integration**: Contextual content based on customer
  industry/needs
- **Proposal History**: Complete view of customer's proposal activity

### 4. Proposal Lifecycle Management Path

```
DASHBOARD → PROPOSAL MANAGEMENT DASHBOARD → PROPOSAL DETAIL
              ↓                                  ↑  ↓
PROPOSAL CREATION → VALIDATION DASHBOARD → APPROVAL WORKFLOW
              ↓           ↑                      ↓
    CONTENT SEARCH         +-------------- EXECUTIVE REVIEW
```

#### Integration Points:

- **Dashboard to Proposal Management**: "View Proposals" or proposal metrics
  cards
- **Proposal Management to Creation**: "Create New Proposal" action
- **Proposal Management to Detail**: Direct links to individual proposals
- **Lifecycle Integration**: Visual pipeline showing proposal progress across
  stages
- **Analytics Integration**: Performance metrics from all stages consolidated in
  dashboard
- **Client View Integration**: Customer engagement analytics fed back to
  management view

### 5. Approval Management Path

```
DASHBOARD → APPROVAL WORKFLOW → PROPOSAL DETAIL
              ↓                      ↓
     VALIDATION DASHBOARD       CUSTOMER PROFILE
              ↓                      ↓
       EXECUTIVE REVIEW
```

#### Integration Points:

- **Dashboard to Approvals**: "Pending Approvals" counter with SLA-based
  prioritization
- **Approval to Proposal**: Contextual link to full proposal with highlighted
  decision points
- **Intelligent Workflow Orchestration**: Dynamic approval paths based on
  proposal characteristics
- **Decision Interface**: Advanced contextual information panel with rule
  validation status
- **Validation Integration**: Comprehensive technical and relationship
  validation status in approval screen
- **SLA Management**: Real-time compliance tracking and bottleneck detection
- **Collaborative Review Tools**: Shared annotations and decision history
  tracking
- **Template-based Workflow Management**: Consistent approval paths by proposal
  type
- **Mobile Approval Experience**: Optimized interfaces for on-the-go decision
  making
- **AI Workload Balancing**: Intelligent routing based on approver capacity
- **Customer Context**: Enhanced customer information with relationship history
- **Executive Review**: Final review stage with AI-assisted decision support

### 5. RFP Management Path

```
DASHBOARD → RFP PARSER SCREEN → PROPOSAL CREATION
              ↓                        ↓
      CONTENT SEARCH             COORDINATION HUB
```

#### Integration Points:

### 6. Predictive Validation Path

```
DASHBOARD → VALIDATION DASHBOARD → PREDICTIVE VALIDATION MODULE
              ↓                            ↓
PROPOSAL MANAGEMENT → PRODUCT RELATIONSHIPS MANAGEMENT
              ↓                            ↓
    PROPOSAL CREATION ←--------- APPROVAL WORKFLOW
```

#### Integration Points:

- **Dashboard to Validation**: "Validation Issues" counter with risk-based
  prioritization
- **Validation to Predictive Module**: "Analyze Risk" action for proactive
  validation
- **Risk Visualization**: Heatmap of proposal risk across portfolio
- **Pattern Learning**: Historical validation issue patterns inform product
  relationship rules
- **Pre-emptive Validation**: Early warning system integrated with proposal
  creation
- **AI Recommendation Engine**: Suggested rule improvements based on resolution
  patterns
- **Approval Integration**: Risk scores inform approval routing decisions
- **Product Management Integration**: Pattern-based relationship suggestions
- **Mobile Risk Assessment**: Optimized interfaces for on-the-go risk evaluation
- **Analytics Pipeline**: Validation metrics feed into proposal performance
  analytics
- **Dashboard to RFP Parser**: "Parse New RFP" action button
- **RFP Parser to Proposal Creation**: Transfer extracted requirements to
  proposal
- **Content Search Integration**: Find relevant content matching RFP
  requirements
- **Coordination Hub**: Assign extracted requirements to appropriate SMEs

### 6. SME Contribution Path

```
DASHBOARD → SME CONTRIBUTION → COORDINATION HUB
              ↓                       ↓
      CONTENT SEARCH             VALIDATION DASHBOARD
              ↓                       ↓
      PROPOSAL CREATION          APPROVAL WORKFLOW
```

#### Integration Points:

- **Dashboard to SME Contribution**: "My Assignments" counter or notifications
- **SME Contribution to Content**: Search for relevant content for assigned
  sections
- **Coordination Integration**: Cross-team collaboration on proposal sections
- **Validation Integration**: SME contributions validated against requirements
- **Proposal Creation**: SME content integrated into master proposal document

### 7. User Profile Management Path

```
GLOBAL HEADER → USER PROFILE → PREFERENCES
              ↓                   ↓
        NOTIFICATIONS        ACCESS & SECURITY
              ↓                   ↓
           DASHBOARD             ADMIN SCREEN
```

#### Integration Points:

- **Global Header to Profile**: User avatar/name in global header across all
  screens
- **Profile to Preferences**: Personal customization of the application
  experience
- **Notifications Integration**: Configuration affects alerts across all screens
- **Security Integration**: MFA and session management for system-wide security
- **Dashboard Customization**: Personalized dashboard based on profile
  preferences
- **Admin Integration**: Role permissions set in Admin reflected in User Profile

### 8. User Registration Path

```
LOGIN SCREEN → REQUEST ACCESS → USER REGISTRATION → CONFIRMATION
                                      ↓
                              USER PROFILE SCREEN

ADMIN SCREEN → USER MANAGEMENT → CREATE USER → USER REGISTRATION → CONFIRMATION
                                                          ↓
                                                  USER PROFILE SCREEN
```

#### Integration Points:

- **Login Screen to Registration**: "Request Access" initiates self-service
  registration
- **Admin to Registration**: Admin-initiated user creation process
- **Registration to Profile**: Newly created users directed to complete profile
- **Role Assignment**: Integration with role-based permissions system
- **Team Integration**: New users added to relevant teams in Coordination Hub
- **Onboarding Process**: Training materials and welcome sequence triggered

## Data Flows Across Screens

### Customer Data

- Flows from **Customer Profile** to **Proposal Creation**
- Displayed in **Approval Workflow** for context
- Referenced in **Validation Dashboard** for rule processing
- Linked from **Dashboard** metrics and activity feeds
- Available in **Executive Review Portal** for decision context

### Product Data

- Managed in **Product Management Screen**
- Relationships defined in **Product Relationships Management Screen** with
  advanced dependency visualization
- Selected in **Product Selection Screen** during proposal creation with
  relationship validation
- Validated in **Validation Dashboard** against complex business rules and
  dependency constraints
- Circular dependency detection and resolution handled during proposal creation
- Relationship impact analysis available during product selection
- Visible in **Approval Workflow** for detailed review context
- Summarized in **Executive Review Portal** for decision makers with dependency
  insights

### Proposal Data

- Created in **Proposal Creation Screen**
- Products added via **Product Selection Screen**
- Validated via **Product Relationships Screen** rules
- Checked in **Validation Dashboard**
- Routed through **Approval Workflow Screen**
- Presented in **Executive Review Portal** for final decision
- Status shown in **Dashboard** metrics

### Content Data

- Searched in **Content Search Screen**
- Linked to products in **Product Management**
- Associated with proposals in **Proposal Creation**
- Related to customers in **Customer Profile**
- Used by SMEs in **SME Contribution Screen**
- Reused across teams via **Coordination Hub**

### RFP Data

- Extracted in **RFP Parser Screen** from source documents
- Categorized and prioritized for response
- Mapped to existing content via **Content Search**
- Assigned to SMEs through **Coordination Hub**
- Converted to proposal sections in **Proposal Creation**
- Validated for compliance in **Validation Dashboard**

### SME Contribution Data

- Assigned in **Coordination Hub**
- Created/edited in **SME Contribution Screen**
- Linked to RFP requirements from **RFP Parser**
- Integrated into master proposal in **Proposal Creation**
- Version-controlled with history tracking
- Validated against requirements in **Validation Dashboard**

### Coordination Data

- Team assignments managed in **Coordination Hub**
- Cross-department collaboration facilitated
- Task status tracked and visualized
- Bottlenecks identified and predicted
- Progress reported to **Dashboard** metrics
- Deadline compliance monitored

### User Profile Data

- Managed in **User Profile Screen**
- Preferences applied across all application screens
- Notification settings control alerts in all workflows
- Security settings enforce authentication requirements
- Role permissions defined in **Admin Screen**, viewed in profile
- Expertise areas influence SME assignments in **Coordination Hub**
- UI customizations affect **Dashboard** and all other screens
- Activity history tracked across all user interactions

## Role-Based Navigation Integration

| Role                    | Primary Screens                                                               | Key Integration Points                                                       |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Proposal Manager        | Dashboard, Proposal Creation, Product Selection, Customer Profile, RFP Parser | Create proposal → Parse RFP → Select customer → Choose products → Submit     |
| Product Manager         | Product Management, Product Relationships, Content Search                     | Manage products → Define relationships → Link content                        |
| Approver                | Dashboard, Approval Workflow, Validation Dashboard                            | View pending approvals → Review proposal → Approve/reject                    |
| Executive               | Dashboard, Executive Review Portal, Approval Workflow                         | View pending decisions → Review summary → Make decision                      |
| Sales / Account Manager | Dashboard, Customer Profile, Proposal History, RFP Parser                     | View customers → Parse RFP → Check history → Initiate proposal               |
| Subject Matter Expert   | Dashboard, SME Contribution, Content Search, Coordination Hub                 | View assignments → Find content → Create response → Submit                   |
| Proposal Coordinator    | Dashboard, Coordination Hub, Validation Dashboard, Approval Workflow          | Monitor progress → Assign tasks → Resolve bottlenecks → Coordinate approvals |
| RFP Analyst             | RFP Parser, Content Search, Coordination Hub                                  | Parse RFP → Extract requirements → Map to content → Assign sections          |
| Admin                   | All screens                                                                   | Complete access to all integration points                                    |

## Mobile Responsiveness

All screens implement consistent mobile patterns:

- Collapsible sidebar replaced with hamburger menu
- Single column layout prioritizing critical information
- Responsive action buttons fixed to bottom
- Simplified tabbed navigation
- Touch-optimized interaction targets

## AI Integration Consistency

| AI Feature                  | Primary Screen                   | Integration Points                                            |
| --------------------------- | -------------------------------- | ------------------------------------------------------------- |
| Content Suggestions         | Content Search                   | Proposal Creation, Product Management, SME Contribution       |
| Relationship Detection      | Product Relationships Management | Product Selection, Validation, Circular Dependency Resolution |
| Customer Insights           | Customer Profile                 | Proposal Creation, Dashboard                                  |
| Approval Prioritization     | Approval Workflow                | Dashboard notifications, Executive Review, SLA Management     |
| Validation Assistance       | Validation Dashboard             | Proposal Creation, Approval                                   |
| RFP Requirement Extraction  | RFP Parser                       | Proposal Creation, SME Contribution, Coordination Hub         |
| SME Assignment Optimization | Coordination Hub                 | Dashboard, SME Contribution                                   |
| Bottleneck Prediction       | Coordination Hub                 | Dashboard, Approval Workflow                                  |
| Executive Decision Support  | Executive Review                 | Approval Workflow, Dashboard                                  |
| Draft Generation            | SME Contribution                 | Content Search, Coordination Hub                              |
| Version Comparison          | SME Contribution                 | Validation Dashboard, Approval Workflow                       |
| Profile Completion          | User Profile                     | Dashboard, Admin Screen                                       |
| UI Personalization          | User Profile                     | All screens (theme, layout, accessibility)                    |
| Notification Optimization   | User Profile                     | All alert-generating screens                                  |
| Expertise Recognition       | User Profile                     | SME Contribution, Coordination Hub                            |

## Detailed Cross-Screen User Journeys

### Primary User Journeys

#### 1. New Proposal Creation Journey

```
LOGIN → DASHBOARD → PROPOSAL CREATION → RFP PARSER → COORDINATION HUB → SME CONTRIBUTION → VALIDATION → APPROVAL → EXECUTIVE REVIEW
```

**Screen-to-Screen Transitions**:

- **Dashboard to Proposal Creation**: "Create Proposal" button launches wizard
- **Proposal Creation to RFP Parser**: "Parse Requirements" button in
  Requirements tab
- **RFP Parser to Coordination Hub**: "Assign Resources" after parsing
  completion
- **Coordination Hub to SME Contribution**: Email notifications + dashboard
  alerts to SMEs
- **SME Contribution to Validation**: "Submit for Validation" triggers workflow
- **Validation to Approval**: Auto-transition when validation passes
- **Approval to Executive Review**: Final approval stage for executive sign-off

**Data Persistence**:

- Proposal ID and metadata maintained across all screens
- RFP requirements linked to proposal sections
- SME assignments and contributions tracked through workflow
- Validation status and history preserved
- Approval audit trail maintained

#### 2. Customer Engagement Journey

```
DASHBOARD → CUSTOMER PROFILE → PROPOSAL HISTORY → CONTENT SEARCH → PROPOSAL CREATION
```

**Screen-to-Screen Transitions**:

- **Dashboard to Customer Profile**: Via customer list or search
- **Customer Profile to Proposal History**: "View Proposals" tab
- **Proposal History to Content Search**: "Find Similar Content" action
- **Content Search to Proposal Creation**: "Use in New Proposal" action

**Context Preservation**:

- Customer data carried forward to new proposals
- Previous proposal context available for reference
- Search parameters informed by customer profile
- Content relevance scored against customer history

#### 3. Product Configuration Journey

```
DASHBOARD → PRODUCT SELECTION → PRODUCT RELATIONSHIPS → VALIDATION → PROPOSAL CREATION
```

**Screen-to-Screen Transitions**:

- **Dashboard to Product Selection**: Via product catalog or proposal wizard
- **Product Selection to Relationships**: Auto-check for dependencies
- **Relationships to Validation**: Compatibility validation
- **Validation to Proposal Creation**: Insert validated configuration

**Data Synchronization**:

- Product configuration maintained as atomic unit
- Relationship rules enforced across screens
- Validation status visually consistent
- Configuration metadata preserved

#### 4. Approval Workflow Journey

```
DASHBOARD → APPROVAL NOTIFICATIONS → APPROVAL WORKFLOW → EXECUTIVE REVIEW → DASHBOARD (with status update)
```

**Screen-to-Screen Transitions**:

- **Dashboard to Notifications**: Alert indicators and counts
- **Notifications to Approval**: Direct deep links to pending approvals
- **Approval to Executive Review**: Escalation path for high-value proposals
- **Executive Review to Dashboard**: Completion notification and status update

**State Persistence**:

- Approval status consistently displayed across screens
- Comments and feedback visible throughout workflow
- Decision history maintained and accessible
- Notification state synchronized with approval status

### Secondary User Journeys

#### 1. User Management Journey

```
LOGIN → REQUEST ACCESS → USER REGISTRATION → USER PROFILE → DASHBOARD
```

or

```
ADMIN SCREEN → USER MANAGEMENT → USER REGISTRATION → ADMIN SCREEN
```

**Screen-to-Screen Transitions**:

- **Login to Registration**: Via "Request Access" link
- **Registration to Profile**: Auto-direction after account creation
- **Admin to Registration**: Via "Create User" in User Management

#### 2. Content Management Journey

```
DASHBOARD → CONTENT SEARCH → CONTENT EDITING → VALIDATION → CONTENT SEARCH
```

**Screen-to-Screen Transitions**:

- **Dashboard to Content Search**: Via "Manage Content" tile
- **Search to Editing**: Via edit action on content item
- **Editing to Validation**: Auto-validation on save
- **Validation to Search**: Return to results with status update

## Mobile Responsiveness Integration

### Mobile View Consistency

- **Navigation**: Collapsible sidebar with hamburger menu on all screens
- **Layout**: Single column for small screens, dual column for tablets
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Typography**: Increased font size on smaller screens (min 16px)
- **Actions**: Critical actions remain visible, secondary actions in overflow
  menu
- **Tables**: Responsive tables with horizontal scroll or stacked views
- **Forms**: Full-width inputs with floating labels
- **Modals**: Full-screen on mobile devices
- **Filters**: Collapsible filter panels on small screens

### Device-Specific Adaptations

- **Phone Portrait**: Streamlined experience with focused content
- **Phone Landscape**: Enhanced data tables and visualization
- **Tablet Portrait**: Sidebar navigation with content focus
- **Tablet Landscape**: Close to desktop experience with optimization
- **Desktop**: Full feature set with optimized layout

### Touch-First Design Elements

- Swipe gestures for common actions
- Pull-to-refresh for data updates
- Bottom navigation bar for critical actions
- Floating action buttons for primary actions
- Contextual toolbars that appear when needed

## Implementation Path

1. Implement core layout and navigation system
2. Build shared component library based on this document
3. Develop individual screens following integration guidelines
4. Implement cross-screen navigation
5. Connect data flows between screens
6. Add AI integration points
7. Test complete user journeys across integration paths

## Next Steps

- Create interactive prototype demonstrating key flows
- Validate navigation patterns with user testing
- Finalize component specifications for development
- Document API contracts for backend integration
