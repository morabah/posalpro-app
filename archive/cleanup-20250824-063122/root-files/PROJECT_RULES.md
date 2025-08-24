# PosalPro MVP2 - Project-Specific Rules

## Project Context

- **Technology Stack**: Next.js 15, TypeScript, Tailwind CSS, ESLint,
  NextAuth.js, React Hook Form, Zod, Lucide React
- **Project Structure**: App Router with src/ directory organization
- **Documentation Hub**: PROJECT_REFERENCE.md (central navigation)
- **Authentication**: NextAuth.js with custom session management and role-based
  access control
- **Validation**: Zod schemas with React Hook Form integration
- **Analytics**: Comprehensive tracking with hypothesis validation framework

## Implementation Constraints (CRITICAL)

- Execute ONLY tasks specified in current prompt
- NO additional features, logic, files, or suggestions beyond request
- Adhere strictly to specified paths, names, and versions
- Follow the 11-phase implementation structure from
  INTEGRATED_AI_DEVELOPMENT_FRAMEWORK.md
- Maintain Component Traceability Matrix for all implementations
- Integrate analytics tracking for hypothesis validation

## Code Quality Standards (Senior-Level)

- Robust error handling with specific client/server distinction
- Comprehensive input validation at all boundaries using Zod schemas
- Efficient algorithms and performance optimization
- Secure coding practices and data sanitization
- Clear variable/function names following Next.js conventions
- Modular code adhering to Single Responsibility Principle
- WCAG 2.1 AA accessibility compliance for all UI components
- Component Traceability Matrix implementation for all major components

## Project Structure

```
posalpro-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication pages (login, register, reset-password)
│   │   ├── dashboard/         # Protected dashboard pages
│   │   └── api/               # API routes with NextAuth integration
│   ├── components/            # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegistrationForm.tsx
│   │   │   ├── PasswordResetForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   └── providers/         # Context providers
│   │       └── AuthProvider.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── auth/              # Authentication-specific hooks
│   │   │   ├── useLoginAnalytics.ts
│   │   │   └── useUserRegistrationAnalytics.ts
│   │   └── useAnalytics.ts    # Base analytics hook
│   ├── lib/                   # Utility functions and configurations
│   ├── types/                 # TypeScript type definitions
│   └── styles/                # Global styles and design tokens
├── docs/                      # Project documentation (symlinked from parent)
├── platform/                  # Platform engineering configs (symlinked from parent)
└── ...config files
```

## Reference Documentation Framework

### Wireframe & Implementation Documents (MANDATORY REFERENCE)

All development work MUST reference the appropriate wireframe and implementation
documents. These documents provide the foundation for consistent UI/UX
implementation and technical architecture.

**📁 Base Paths:**

- **Wireframes**: `front end structure /wireframes/`
- **Implementation**: `front end structure /implementation/`

#### **Core Reference Documents (ALWAYS CONSULT)**

**📋 WIREFRAME_INTEGRATION_GUIDE.md**

- **Path**: `front end structure /wireframes/WIREFRAME_INTEGRATION_GUIDE.md`
- **When to Use**: Before starting ANY UI component implementation
- **Purpose**: Master guide for integrating all wireframe specifications
- **Required for**: Component design, layout implementation, user flow
  validation

**📊 USER_STORY_TRACEABILITY_MATRIX.md**

- **Path**: `front end structure /wireframes/USER_STORY_TRACEABILITY_MATRIX.md`
- **When to Use**: When implementing features tied to user stories
- **Purpose**: Maps user stories to acceptance criteria and components
- **Required for**: Component Traceability Matrix validation, hypothesis testing

**✅ IMPLEMENTATION_CHECKLIST.md**

- **Path**: `front end structure /wireframes/IMPLEMENTATION_CHECKLIST.md`
- **When to Use**: Before, during, and after each implementation phase
- **Purpose**: Ensures all requirements are met and nothing is missed
- **Required for**: Quality assurance, phase completion validation

**🏗️ COMPONENT_STRUCTURE.md**

- **Path**: `front end structure /implementation/COMPONENT_STRUCTURE.md`
- **When to Use**: When creating new components or modifying existing ones
- **Purpose**: Defines component architecture, patterns, and relationships
- **Required for**: Consistent component implementation, reusability patterns

#### **Screen-Specific Wireframes (USE FOR RESPECTIVE IMPLEMENTATIONS)**

**Authentication & User Management:**

- **LOGIN_SCREEN.md** - `front end structure /wireframes/LOGIN_SCREEN.md` -
  Login form implementation (✅ COMPLETED Phase 2.1.3)
- **USER_REGISTRATION_SCREEN.md** -
  `front end structure /wireframes/USER_REGISTRATION_SCREEN.md` - Registration
  workflow (✅ COMPLETED Phase 2.1.3)
- **USER_PROFILE_SCREEN.md** -
  `front end structure /wireframes/USER_PROFILE_SCREEN.md` - User profile
  management and settings

**Dashboard & Navigation:**

- **DASHBOARD_SCREEN.md** -
  `front end structure /wireframes/DASHBOARD_SCREEN.md` - Main dashboard layout
  and widgets
- **COORDINATION_HUB_SCREEN.md** -
  `front end structure /wireframes/COORDINATION_HUB_SCREEN.md` -
  Cross-department collaboration interface

**Proposal Management:**

- **PROPOSAL_CREATION_SCREEN.md** -
  `front end structure /wireframes/PROPOSAL_CREATION_SCREEN.md` - Proposal
  creation workflow
- **PROPOSAL_MANAGEMENT_DASHBOARD.md** -
  `front end structure /wireframes/PROPOSAL_MANAGEMENT_DASHBOARD.md` - Proposal
  status and management
- **APPROVAL_WORKFLOW_SCREEN.md** -
  `front end structure /wireframes/APPROVAL_WORKFLOW_SCREEN.md` - Multi-stage
  approval process
- **EXECUTIVE_REVIEW_SCREEN.md** -
  `front end structure /wireframes/EXECUTIVE_REVIEW_SCREEN.md` - Executive-level
  proposal review

**Product & Customer Management:**

- **PRODUCT_MANAGEMENT_SCREEN.md** -
  `front end structure /wireframes/PRODUCT_MANAGEMENT_SCREEN.md` - Product
  catalog and configuration
- **PRODUCT_SELECTION_SCREEN.md** -
  `front end structure /wireframes/PRODUCT_SELECTION_SCREEN.md` - Product
  selection and customization
- **PRODUCT_RELATIONSHIPS_SCREEN.md** -
  `front end structure /wireframes/PRODUCT_RELATIONSHIPS_SCREEN.md` - Product
  dependencies and relationships
- **CUSTOMER_PROFILE_SCREEN.md** -
  `front end structure /wireframes/CUSTOMER_PROFILE_SCREEN.md` - Customer
  information and history

**Content & Search:**

- **CONTENT_SEARCH_SCREEN.md** -
  `front end structure /wireframes/CONTENT_SEARCH_SCREEN.md` - Content discovery
  and search functionality
- **RFP_PARSER_SCREEN.md** -
  `front end structure /wireframes/RFP_PARSER_SCREEN.md` - RFP document analysis
  and parsing

**SME & Validation:**

- **SME_CONTRIBUTION_SCREEN.md** -
  `front end structure /wireframes/SME_CONTRIBUTION_SCREEN.md` - Subject matter
  expert input interface
- **VALIDATION_DASHBOARD_SCREEN.md** -
  `front end structure /wireframes/VALIDATION_DASHBOARD_SCREEN.md` - Technical
  validation and review
- **PREDICTIVE_VALIDATION_MODULE.md** -
  `front end structure /wireframes/PREDICTIVE_VALIDATION_MODULE.md` - AI-powered
  validation features

**Administration:**

- **ADMIN_SCREEN.md** - `front end structure /wireframes/ADMIN_SCREEN.md` -
  System administration and configuration

#### **Implementation Architecture Documents (TECHNICAL FOUNDATION)**

**🗂️ DATA_MODEL.md**

- **Path**: `front end structure /implementation/DATA_MODEL.md`
- **When to Use**: When implementing data structures, API endpoints, database
  schemas
- **Purpose**: Defines all data models, relationships, and validation rules
- **Required for**: Type definitions, API design, database migrations

**🗺️ SITEMAP.md**

- **Path**: `front end structure /implementation/SITEMAP.md`
- **When to Use**: When implementing routing, navigation, or page structures
- **Purpose**: Complete application structure and navigation hierarchy
- **Required for**: App Router setup, navigation components, breadcrumbs

**📋 IMPLEMENTATION_PLAN.md**

- **Path**: `front end structure /implementation/IMPLEMENTATION_PLAN.md`
- **When to Use**: For phase planning and development sequencing
- **Purpose**: Structured approach to feature implementation
- **Required for**: Sprint planning, dependency management, milestone tracking

#### **Quality Assurance Documents**

**♿ ACCESSIBILITY_SPECIFICATION.md**

- **Path**: `front end structure /wireframes/ACCESSIBILITY_SPECIFICATION.md`
- **When to Use**: For EVERY UI component implementation
- **Purpose**: WCAG 2.1 AA compliance requirements and testing procedures
- **Required for**: Accessibility validation, screen reader compatibility

**🧪 TESTING_SCENARIOS_SPECIFICATION.md**

- **Path**: `front end structure /wireframes/TESTING_SCENARIOS_SPECIFICATION.md`
- **When to Use**: When writing tests for components and features
- **Purpose**: Comprehensive testing scenarios and validation criteria
- **Required for**: Test case development, QA validation

**🔍 WIREFRAME_CONSISTENCY_REVIEW.md**

- **Path**: `front end structure /wireframes/WIREFRAME_CONSISTENCY_REVIEW.md`
- **When to Use**: During design review and implementation validation
- **Purpose**: Ensures consistency across all wireframes and implementations
- **Required for**: Design system compliance, UI consistency

### **Document Usage Workflow (MANDATORY PROCESS)**

#### **Pre-Implementation Phase**

1. **ALWAYS START** with
   `front end structure /wireframes/WIREFRAME_INTEGRATION_GUIDE.md`
2. **REFERENCE** the specific screen wireframe (e.g.,
   `front end structure /wireframes/LOGIN_SCREEN.md`)
3. **CONSULT** `front end structure /implementation/COMPONENT_STRUCTURE.md` for
   architectural patterns
4. **CHECK** `front end structure /wireframes/USER_STORY_TRACEABILITY_MATRIX.md`
   for acceptance criteria
5. **REVIEW** `front end structure /implementation/DATA_MODEL.md` for data
   requirements
6. **VALIDATE** against
   `front end structure /wireframes/ACCESSIBILITY_SPECIFICATION.md`

#### **During Implementation**

1. **FOLLOW** the specific wireframe specifications exactly
2. **IMPLEMENT** Component Traceability Matrix as defined
3. **VALIDATE** against
   `front end structure /wireframes/IMPLEMENTATION_CHECKLIST.md` continuously
4. **REFERENCE** `front end structure /implementation/SITEMAP.md` for navigation
   and routing
5. **APPLY** patterns from
   `front end structure /implementation/COMPONENT_STRUCTURE.md`

#### **Post-Implementation Validation**

1. **COMPLETE** all items in
   `front end structure /wireframes/IMPLEMENTATION_CHECKLIST.md`
2. **TEST** scenarios from
   `front end structure /wireframes/TESTING_SCENARIOS_SPECIFICATION.md`
3. **VERIFY** accessibility with
   `front end structure /wireframes/ACCESSIBILITY_SPECIFICATION.md`
4. **REVIEW** consistency with
   `front end structure /wireframes/WIREFRAME_CONSISTENCY_REVIEW.md`
5. **UPDATE** documentation as needed

### **Document Integration with Development Phases**

#### **Phase-Specific Document Requirements**

**Authentication Phases (2.1.x):**

- Primary: `front end structure /wireframes/LOGIN_SCREEN.md`,
  `front end structure /wireframes/USER_REGISTRATION_SCREEN.md`
- Support: `front end structure /wireframes/USER_PROFILE_SCREEN.md`,
  `front end structure /wireframes/ACCESSIBILITY_SPECIFICATION.md`
- Architecture: `front end structure /implementation/COMPONENT_STRUCTURE.md`,
  `front end structure /implementation/DATA_MODEL.md`

**Dashboard Development (2.2.x):**

- Primary: `front end structure /wireframes/DASHBOARD_SCREEN.md`,
  `front end structure /wireframes/COORDINATION_HUB_SCREEN.md`
- Support: `front end structure /implementation/SITEMAP.md`,
  `front end structure /wireframes/WIREFRAME_INTEGRATION_GUIDE.md`
- Architecture: `front end structure /implementation/COMPONENT_STRUCTURE.md`,
  `front end structure /implementation/DATA_MODEL.md`

**Proposal Management (2.3.x):**

- Primary: `front end structure /wireframes/PROPOSAL_CREATION_SCREEN.md`,
  `front end structure /wireframes/PROPOSAL_MANAGEMENT_DASHBOARD.md`
- Support: `front end structure /wireframes/APPROVAL_WORKFLOW_SCREEN.md`,
  `front end structure /wireframes/EXECUTIVE_REVIEW_SCREEN.md`
- Architecture: `front end structure /implementation/DATA_MODEL.md`,
  `front end structure /implementation/IMPLEMENTATION_PLAN.md`

**Product Management (2.4.x):**

- Primary: `front end structure /wireframes/PRODUCT_MANAGEMENT_SCREEN.md`,
  `front end structure /wireframes/PRODUCT_SELECTION_SCREEN.md`
- Support: `front end structure /wireframes/PRODUCT_RELATIONSHIPS_SCREEN.md`,
  `front end structure /wireframes/CUSTOMER_PROFILE_SCREEN.md`
- Architecture: `front end structure /implementation/DATA_MODEL.md`,
  `front end structure /implementation/SITEMAP.md`

### **Documentation Compliance Validation**

**Before ANY implementation, verify:**

- [ ] Appropriate wireframe document identified and reviewed from
      `front end structure /wireframes/`
- [ ] Component Traceability Matrix requirements understood from
      `front end structure /wireframes/USER_STORY_TRACEABILITY_MATRIX.md`
- [ ] Data model requirements from
      `front end structure /implementation/DATA_MODEL.md` integrated
- [ ] Accessibility requirements from
      `front end structure /wireframes/ACCESSIBILITY_SPECIFICATION.md` planned
- [ ] Implementation checklist items prepared from
      `front end structure /wireframes/IMPLEMENTATION_CHECKLIST.md`

**During implementation, ensure:**

- [ ] Wireframe specifications followed exactly
- [ ] Component structure patterns maintained per
      `front end structure /implementation/COMPONENT_STRUCTURE.md`
- [ ] User story traceability maintained per
      `front end structure /wireframes/USER_STORY_TRACEABILITY_MATRIX.md`
- [ ] Testing scenarios considered from
      `front end structure /wireframes/TESTING_SCENARIOS_SPECIFICATION.md`

**After implementation, confirm:**

- [ ] All checklist items completed from
      `front end structure /wireframes/IMPLEMENTATION_CHECKLIST.md`
- [ ] Accessibility compliance verified with
      `front end structure /wireframes/ACCESSIBILITY_SPECIFICATION.md`
- [ ] Wireframe consistency maintained per
      `front end structure /wireframes/WIREFRAME_CONSISTENCY_REVIEW.md`
- [ ] Documentation updated appropriately

### **Critical Integration Points**

⚠️ **NEVER implement UI components without consulting the corresponding
wireframe** ⚠️ **ALWAYS reference COMPONENT_STRUCTURE.md for architectural
decisions** ⚠️ **MANDATORY accessibility validation with
ACCESSIBILITY_SPECIFICATION.md** ⚠️ **REQUIRED traceability validation with
USER_STORY_TRACEABILITY_MATRIX.md**

## Authentication & Authorization Standards

### NextAuth.js Integration

- Custom session management with role-based access control
- Extended session provider with analytics integration
- Activity tracking and auto-refresh mechanisms
- Session warning modals with countdown timers

### Role-Based Access Control (RBAC)

- Granular permission system with inheritance
- Route-level and component-level protection
- Real-time access validation with audit logging
- Higher-order component patterns for protection

### Security Implementation

- Rate limiting: 5 attempts/min registration, 3/15min password reset
- Input validation with Zod schemas at all boundaries
- Password requirements: 8+ chars, mixed case, numbers, special chars
- CSRF protection with token-based validation
- Session management with timeout and activity monitoring

## Analytics & Hypothesis Validation Framework

### Component Traceability Matrix (MANDATORY)

```typescript
const COMPONENT_MAPPING = {
  userStories: ['US-X.X'],
  acceptanceCriteria: ['AC-X.X.X'],
  methods: ['methodName()'],
  hypotheses: ['HX'],
  testCases: ['TC-HX-XXX'],
};
```

### Analytics Implementation Requirements

- Base analytics hook for centralized tracking
- Component-specific analytics hooks for specialized tracking
- Hypothesis validation tracking with performance metrics
- User experience analytics with interaction tracking
- Security event monitoring and audit logging
- Local storage for development, production service integration points

### Analytics Events Standards

- `authentication_attempt` - Login/logout with role and duration
- `registration_step_completion` - Progressive disclosure analytics
- `role_selection` - Role assignment and permission application
- `access_denied` - Unauthorized access attempts with reasons
- `session_management` - Session lifecycle and activity tracking
- `hypothesis_validation` - A/B testing and feature validation metrics

## Accessibility Standards (WCAG 2.1 AA Compliance)

### Mandatory Requirements

- Form labels associated with all input elements
- Error announcements compatible with screen readers
- Full keyboard navigation support with visible focus indicators
- Color-independent feedback using icons and text
- Alt text for all interactive elements
- Proper heading hierarchy and semantic markup
- Touch targets minimum 44px for mobile accessibility

### Implementation Patterns

- aria-label and aria-describedby for complex interactions
- role attributes for custom components
- Skip navigation links for keyboard users
- High contrast mode compatibility
- Reduced motion preferences support

## Form Validation & Data Handling

### Zod Schema Requirements

- Client-side validation with Zod schemas
- Server-side validation with same schemas for consistency
- Comprehensive error messages with field-specific feedback
- Type-safe form data handling with React Hook Form integration

### Form Standards

- Progressive disclosure for complex forms
- Real-time validation with onChange events
- Loading states with descriptive text and spinners
- Error recovery with clear actionable feedback
- Auto-save capabilities for long forms

## UI/UX Design System

### Tailwind CSS Implementation

- Blue primary color (#2563EB) with semantic color palette
- Consistent typography scale with proper line heights
- 24px content padding, 16px element spacing, 8px label-input gaps
- 6px border radius on all form elements
- 40px input height, 44px button height for accessibility

### Component Design Patterns

- Split panel layouts for authentication screens
- Progressive disclosure with step indicators
- Loading states with spinner animations and descriptive text
- Error states with alert components, icons, and contextual messages
- Success states with confirmation screens and clear next actions
- Mobile-first responsive design with progressive enhancement

## Performance & Optimization Standards

### Bundle Optimization

- Code splitting with dynamic imports for large components
- Tree shaking for unused code elimination
- Memoization with useCallback and useMemo for expensive operations
- Suspense boundaries for async operations

### Performance Metrics

- Component bundle size optimization
- Initial load time <2 seconds for auth pages
- Interactive time <1 second for form interactions
- Analytics overhead <50ms for event tracking
- Web Vitals monitoring and optimization

## Documentation Integration Requirements

- Update PROJECT_REFERENCE.md for major architectural changes
- Document new patterns in PROMPT_PATTERNS.md
- Capture lessons learned in LESSONS_LEARNED.md for complex implementations
- Log all prompt executions in IMPLEMENTATION_LOG.md
- Maintain cross-references between related components
- Update PHASE_X_X_X_COMPLETION.md for each phase completion

## POST-IMPLEMENTATION DOCUMENTATION RULES

### MANDATORY: After Every Implementation

**Always update these documents immediately after completing any
implementation:**

1. **IMPLEMENTATION_LOG.md** - REQUIRED for ALL implementations
   ```
   ## [DATE] [TIME] - [Brief Description]
   **Phase**: [Phase Number] - [Phase Name]
   **Status**: [✅ Complete | ⚠️ Partial | ❌ Failed]
   **Files Modified**: [List of files changed]
   **Key Changes**: [Bullet points of main changes]
   **Analytics Integration**: [Tracking implemented]
   **Accessibility**: [WCAG compliance measures]
   ```

### CONDITIONAL: Based on Implementation Type

#### When to Update **LESSONS_LEARNED.md**:

- ✅ **Complex Problem Solving**: Multi-step solutions, debugging sessions
- ✅ **Architecture Decisions**: Major structural changes, pattern
  implementations
- ✅ **Error Resolution**: Significant bugs fixed, security issues resolved
- ✅ **Performance Optimizations**: Speed improvements, resource optimization
- ✅ **Integration Challenges**: Third-party services, API integrations
- ✅ **Best Practice Discoveries**: New patterns, better approaches found
- ✅ **Analytics Implementation**: Hypothesis validation setup, tracking
  patterns
- ✅ **Accessibility Solutions**: WCAG compliance techniques, assistive
  technology support
- ✅ **Wireframe Implementation**: Complex UI components, design system
  extensions

#### When to Update **PROJECT_REFERENCE.md**:

- ✅ **New Major Components**: Core system additions
- ✅ **API Endpoints**: New routes, significant route changes
- ✅ **Configuration Changes**: Environment variables, build settings
- ✅ **Directory Structure**: New folders, organization changes
- ✅ **Dependencies**: Major package additions/removals
- ✅ **Deployment Changes**: Infrastructure, hosting modifications
- ✅ **Authentication Changes**: Auth providers, role configurations
- ✅ **Analytics Integration**: New tracking capabilities, metrics
- ✅ **Wireframe Implementations**: New screens, major UI changes

#### When to Update **PROMPT_PATTERNS.md**:

- ✅ **New Prompt Techniques**: Effective prompt strategies discovered
- ✅ **AI Interaction Patterns**: Successful collaboration approaches
- ✅ **Debugging Patterns**: Systematic troubleshooting approaches
- ✅ **Code Generation Patterns**: Effective code creation strategies
- ✅ **Documentation Patterns**: Successful documentation approaches
- ✅ **Analytics Prompts**: Tracking implementation and validation patterns
- ✅ **Accessibility Prompts**: WCAG compliance and testing approaches
- ✅ **Wireframe Integration Prompts**: UI implementation strategies,
  design-to-code patterns

### COMPLETION TRIGGERS

**Update documentation when ANY of these occur:**

#### ✅ **Phase Completion**

- Update all relevant documents
- Add phase summary to IMPLEMENTATION_LOG.md
- Capture major lessons in LESSONS_LEARNED.md
- Update PROJECT_REFERENCE.md with new capabilities
- Create comprehensive PHASE_X_X_X_COMPLETION.md document

#### ✅ **Feature Implementation**

- Log implementation details in IMPLEMENTATION_LOG.md
- Document any architectural decisions in LESSONS_LEARNED.md
- Update PROJECT_REFERENCE.md if feature adds new endpoints/components
- Record analytics integration and hypothesis validation setup

#### ✅ **Bug Resolution**

- Always log in IMPLEMENTATION_LOG.md
- Add to LESSONS_LEARNED.md if complex or teaches important lesson
- Update PROJECT_REFERENCE.md if fix changes API or behavior
- Document security implications if applicable

#### ✅ **Configuration Changes**

- Log in IMPLEMENTATION_LOG.md
- Update PROJECT_REFERENCE.md for environment/build changes
- Add to LESSONS_LEARNED.md if configuration was complex
- Update authentication and analytics configurations

#### ✅ **Error Handling**

- Always log resolution in IMPLEMENTATION_LOG.md
- Add debugging approach to LESSONS_LEARNED.md
- Consider adding pattern to PROMPT_PATTERNS.md if AI-assisted
- Document accessibility impact if UI-related

#### ✅ **Performance Improvements**

- Log metrics in IMPLEMENTATION_LOG.md
- Document approach in LESSONS_LEARNED.md
- Update PROJECT_REFERENCE.md if changes affect system behavior
- Include analytics performance impact assessment

#### ✅ **Wireframe Implementation**

- Always log wireframe compliance in IMPLEMENTATION_LOG.md
- Document design decisions and deviations in LESSONS_LEARNED.md
- Update PROJECT_REFERENCE.md with new UI components
- Validate accessibility compliance with ACCESSIBILITY_SPECIFICATION.md

### DOCUMENTATION QUALITY STANDARDS

#### **IMPLEMENTATION_LOG.md Format**:

```markdown
## YYYY-MM-DD HH:MM - [Implementation Title]

**Phase**: X.Y.Z - [Phase Name] **Status**: [✅/⚠️/❌] [Status Description]
**Duration**: [Time spent] **Files Modified**:

- path/to/file1.ts
- path/to/file2.tsx **Key Changes**:
- Bullet point summary **Wireframe Reference**: [Specific wireframe document(s)
  used] **Component Traceability**: [User stories, acceptance criteria mapped]
  **Analytics Integration**: [Events tracked, hypotheses validated]
  **Accessibility**: [WCAG compliance measures implemented] **Security**:
  [Security measures implemented] **Testing**: [How verified] **Performance
  Impact**: [Bundle size, load time impact] **Wireframe Compliance**: [How
  implementation matches wireframe specs] **Design Deviations**: [Any deviations
  from wireframe and justification] **Notes**: [Any important context]
```

#### **LESSONS_LEARNED.md Format**:

```markdown
## [Category] - [Lesson Title]

**Date**: YYYY-MM-DD **Phase**: X.Y.Z - [Phase Name] **Context**: [What was
being implemented] **Problem**: [What challenge was faced] **Solution**: [How it
was resolved] **Key Insights**: [What was learned] **Prevention**: [How to avoid
in future] **Analytics Impact**: [How tracking/validation was affected]
**Accessibility Considerations**: [WCAG implications] **Security Implications**:
[Security lessons learned] **Related**: [Links to other docs/patterns]
```

#### **PROJECT_REFERENCE.md Updates**:

- Keep architecture section current with authentication patterns
- Update API endpoint listings with auth routes
- Maintain dependency lists with versions
- Update deployment instructions with auth configuration
- Cross-reference related documentation
- Include analytics and monitoring setup
- Document accessibility compliance status

### DOCUMENTATION VALIDATION

**Before considering implementation complete:**

- [ ] IMPLEMENTATION_LOG.md updated with current session
- [ ] Relevant conditional docs updated based on change type
- [ ] All cross-references between docs verified
- [ ] Documentation reflects actual implemented state
- [ ] Future developers can understand changes from docs alone
- [ ] Component Traceability Matrix documented
- [ ] Analytics integration verified and documented
- [ ] Accessibility compliance documented
- [ ] Security implications assessed and documented
- [ ] Wireframe compliance verified with reference document
- [ ] Design deviations justified and documented
- [ ] Implementation checklist completed from IMPLEMENTATION_CHECKLIST.md
- [ ] Testing scenarios validated against TESTING_SCENARIOS_SPECIFICATION.md

## Validation Requirements

- Execute comprehensive testing for all implemented features
- Functional verification with role-based access testing
- Integration testing for authentication flows
- Analytics validation with event tracking verification
- Accessibility testing with WCAG 2.1 AA compliance
- Security testing with penetration testing principles
- Performance impact assessment with metrics
- Documentation completeness verification

## Technology-Specific Guidelines

### Next.js 15 App Router

- Use App Router patterns exclusively with proper layout hierarchy
- Implement server components where possible for performance
- Use client components only when necessary for interactivity
- Proper metadata implementation for SEO and accessibility

### TypeScript Standards

- Strict mode with comprehensive type safety
- Zod schemas for runtime validation and type inference
- Proper interface definitions for all data structures
- Generic type usage for reusable components

### Tailwind CSS Implementation

- Utility-first approach with design system consistency
- Responsive design with mobile-first methodology
- Custom utilities for component-specific styling
- Accessibility-focused utilities for focus states and contrast

### NextAuth.js Configuration

- Custom session management with role and permission extensions
- Secure provider configuration with proper callbacks
- Session token management with refresh strategies
- Analytics integration for authentication events

## Platform Engineering Integration

- Follow golden path templates from platform/ directory
- Reference platform engineering foundation patterns
- Integrate with developer experience metrics tracking
- Maintain compatibility with Internal Developer Platform (IDP)
- Implement monitoring and observability patterns

## AI Development Context

- Reference PROMPT_PATTERNS.md for standardized interactions
- Use established prompt patterns for consistency
- Maintain context management throughout sessions
- Apply validation criteria for quality assurance
- Document AI-assisted development patterns

## Environment Configuration

- Support multiple environments (local, development, staging, production)
- Environment-aware API client implementation with auth configuration
- Proper environment variable validation with Zod schemas
- Configuration utility for type-safe access
- Analytics service configuration per environment

## Error Handling Standards

- Implement comprehensive error boundaries with fallback UI
- Use categorized error types (Network, Auth, Validation, Business)
- Provide user-friendly error messages with recovery strategies
- Include context and debugging information for development
- Integrate with logging infrastructure and analytics
- Accessibility-compliant error announcements

## Performance Requirements

- Implement caching strategies with LRU and browser caching
- Performance monitoring and measurement utilities
- Web Vitals tracking and optimization with analytics integration
- Bundle size optimization and code splitting
- Lazy loading for non-critical components
- Analytics performance optimization with batching

## Security Implementation

- Input validation at all boundaries with Zod schemas
- Proper authentication and authorization patterns with NextAuth.js
- Secure API communication with CSRF protection
- Data sanitization and XSS prevention
- Security headers and CORS configuration
- Rate limiting implementation with Redis or memory stores
- Audit logging for security events with analytics integration

## Accessibility Requirements (WCAG 2.1 AA)

- Semantic HTML with proper landmark regions
- Keyboard navigation support with focus management
- Screen reader compatibility with ARIA attributes
- Color contrast compliance with 4.5:1 ratio minimum
- Touch target sizing with 44px minimum
- Error identification and description for form validation
- Skip navigation and focus management patterns

## Mobile & Responsive Design

- Mobile-first responsive design approach
- Touch-friendly interface with appropriate gesture support
- Progressive web app capabilities where applicable
- Device-specific input types for optimal user experience
- Viewport optimization with proper meta tags
- Performance optimization for mobile networks

## Testing Standards

- Unit testing for individual components and hooks
- Integration testing for authentication flows
- End-to-end testing for complete user journeys
- Accessibility testing with automated and manual verification
- Performance testing with load time and interaction metrics
- Security testing with vulnerability assessment
- Analytics testing with event tracking verification

## Forbidden Practices

- No direct DOM manipulation - use React patterns
- No inline styles - use Tailwind CSS classes
- No console.log in production code - use proper logging with analytics
- No hardcoded API URLs - use environment variables
- No skipping TypeScript strict mode checks
- No modifications without documentation updates
- No authentication bypass in production code
- No accessibility shortcuts that violate WCAG 2.1 AA
- No analytics tracking without user consent where required
- No security headers omission in production deployments
- No UI implementation without consulting corresponding wireframe documents
- No deviations from wireframe specifications without documentation and
  justification
- No skipping Component Traceability Matrix implementation
- No implementation without completing IMPLEMENTATION_CHECKLIST.md validation
