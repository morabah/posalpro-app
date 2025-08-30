# @PROMPT_H2.3_ENTITY_SCHEMAS_AND_SCREEN_ASSEMBLY.md

## H2.3: Entity Schema Implementation + Screen Assembly

### Implementation Status

**Phase**: H2.3 - Entity Schema Implementation + Screen Assembly
**Prerequisites**: ✅ H2.1 (Type System + Design Tokens) + ✅ H2.2 (Validation +
Components) **Duration Estimate**: 8-10 hours **Complexity**: High (Full-Stack
Integration + Screen Assembly)

### Strategic Context

Building on H2.2's validation infrastructure and atomic component library, H2.3
establishes complete entity management capabilities and assembles the first
functional screens. This phase bridges the contract-first foundation with
working user interfaces, enabling parallel backend development while delivering
tangible UI progress.

**Hybrid Development Enablement**: Frontend teams can continue with mock data
integration while backend teams implement actual data persistence using the
established entity schemas.

### Implementation Tracks

#### Track 1: Entity Schema & Data Management (3-4 hours)

**Focus**: Complete entity lifecycle management with full CRUD operations

**Entity Implementation Priority**:

1. **User Entity Complete** - Full user lifecycle with preferences, security,
   notifications
2. **Proposal Entity Complete** - End-to-end proposal management with workflow
   states
3. **Authentication Entity Complete** - Session management, security events,
   audit logs

**Deliverables**:

- `src/lib/entities/` - Complete entity management layer
- `src/lib/api/` - API client infrastructure with error handling
- `src/hooks/entities/` - Entity-specific hooks for data management
- Enhanced mock data with full entity relationships

#### Track 2: Screen Assembly & Navigation (4-5 hours)

**Focus**: Functional screen implementation using atomic components

**Screen Implementation Priority** (Based on wireframe references):

1. **Login Screen** - LOGIN_SCREEN.md implementation
2. **User Registration Screen** - USER_REGISTRATION_SCREEN.md multi-step flow
3. **Dashboard Screen** - DASHBOARD_SCREEN.md layout and widgets

**Deliverables**:

- `src/app/(auth)/` - Complete authentication flow screens
- `src/app/dashboard/` - Dashboard layout with navigation
- `src/components/screens/` - Screen-level components
- `src/components/navigation/` - Navigation and layout components

#### Track 3: Integration & State Management (1-2 hours)

**Focus**: Screen-to-entity integration with state management

**Integration Components**:

- Global state management patterns
- Error boundary implementation
- Loading state coordination
- Analytics event integration

**Deliverables**:

- `src/lib/store/` - State management infrastructure
- `src/components/providers/` - Context providers and state management
- Enhanced error handling and user feedback
- Analytics integration for user interactions

### Detailed Implementation Specifications

#### 🏗️ Track 1: Entity Schema & Data Management

##### Entity Management Layer Structure

```typescript
// src/lib/entities/user.ts
export class UserEntity {
  // Full CRUD operations
  static async create(data: CreateUserData): Promise<UserEntity>;
  static async findById(id: string): Promise<UserEntity | null>;
  static async update(id: string, data: UpdateUserData): Promise<UserEntity>;
  static async delete(id: string): Promise<void>;
  static async search(
    criteria: UserSearchCriteria
  ): Promise<PaginatedResponse<UserEntity>>;

  // User-specific operations
  async updatePreferences(prefs: UserPreferences): Promise<void>;
  async updateSecurity(settings: UserSecuritySettings): Promise<void>;
  async uploadAvatar(file: File): Promise<string>;
}
```

##### API Client Infrastructure

```typescript
// src/lib/api/client.ts
export class ApiClient {
  // HTTP client with authentication
  // Error handling and retry logic
  // Request/response interceptors
  // Mock data integration for development
}

// src/lib/api/endpoints/
// - auth.ts - Authentication endpoints
// - users.ts - User management endpoints
// - proposals.ts - Proposal management endpoints
```

##### Entity Hooks Pattern

```typescript
// src/hooks/entities/useUser.ts
export function useUser(userId?: string) {
  return {
    user: UserEntity | null,
    loading: boolean,
    error: Error | null,
    actions: {
      create: (data: CreateUserData) => Promise<UserEntity>,
      update: (data: UpdateUserData) => Promise<UserEntity>,
      delete: () => Promise<void>,
      updatePreferences: (prefs: UserPreferences) => Promise<void>,
    },
  };
}
```

#### 🎨 Track 2: Screen Assembly & Navigation

##### Authentication Flow Implementation

**Reference**: `front end structure /wireframes/LOGIN_SCREEN.md`

```typescript
// src/app/(auth)/login/page.tsx
export default function LoginPage() {
  // Implement wireframe specifications exactly
  // Two-panel layout with branding and form
  // Form validation using H2.2 schemas
  // Loading states and error handling
  // Analytics tracking for login attempts
  // Accessibility compliance (WCAG 2.1 AA)
}
```

**Key Requirements**:

- Split-panel layout matching wireframe exactly
- Role selection dropdown with proper validation
- "Remember me" functionality with security considerations
- Progressive enhancement for form interactions
- Comprehensive error handling with user-friendly messages

##### Registration Flow Implementation

**Reference**: `front end structure /wireframes/USER_REGISTRATION_SCREEN.md`

```typescript
// src/app/(auth)/register/page.tsx
export default function RegisterPage() {
  // Multi-step form implementation
  // Step indicators and navigation
  // Form state persistence between steps
  // Validation per step using H2.2 schemas
  // Progress saving and recovery
}
```

**Multi-Step Structure**:

1. **Step 1**: Personal Information (firstName, lastName, email, phone,
   jobTitle, department)
2. **Step 2**: Role & Access (role selection, permissions, justification)
3. **Step 3**: Security Setup (password, security question, 2FA preferences)
4. **Step 4**: Notifications (email/SMS preferences, terms acceptance)

##### Dashboard Screen Implementation

**Reference**: `front end structure /wireframes/DASHBOARD_SCREEN.md`

```typescript
// src/app/dashboard/page.tsx
export default function DashboardPage() {
  // Widget-based layout system
  // Role-based content filtering
  // Real-time data updates
  // Responsive grid system
  // Interactive charts and metrics
}
```

##### Navigation Infrastructure

```typescript
// src/components/navigation/
// - MainNav.tsx - Primary navigation component
// - UserMenu.tsx - User profile dropdown
// - Breadcrumbs.tsx - Hierarchical navigation
// - MobileNav.tsx - Mobile-responsive navigation
```

#### 🔧 Track 3: Integration & State Management

##### State Management Pattern

```typescript
// src/lib/store/
// - authStore.ts - Authentication state
// - userStore.ts - User profile and preferences
// - proposalStore.ts - Proposal management state
// - uiStore.ts - UI state (modals, notifications, loading)
```

##### Error Boundary Implementation

```typescript
// src/components/providers/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  // Graceful error handling
  // Error reporting and logging
  // User-friendly error screens
  // Recovery mechanisms
}
```

##### Analytics Integration

```typescript
// Integration with H2.2 analytics infrastructure
// Screen view tracking
// User interaction events
// Form completion metrics
// Error occurrence tracking
```

### Wireframe Compliance Requirements

#### MANDATORY Wireframe References

- **LOGIN_SCREEN.md** - Exact layout implementation required
- **USER_REGISTRATION_SCREEN.md** - Multi-step flow fidelity
- **DASHBOARD_SCREEN.md** - Widget layout and responsive behavior
- **ACCESSIBILITY_SPECIFICATION.md** - WCAG 2.1 AA compliance validation
- **IMPLEMENTATION_CHECKLIST.md** - Phase completion validation

#### Design System Integration

- Use H2.1 design tokens exclusively
- Apply H2.2 component library consistently
- Maintain 44px touch targets for accessibility
- Implement proper focus management and keyboard navigation
- Ensure color contrast ratios meet WCAG standards

### Quality Assurance Standards

#### Component Traceability Matrix (REQUIRED)

```typescript
const COMPONENT_MAPPING = {
  userStories: ['US-2.1', 'US-2.2', 'US-2.3', 'US-3.1', 'US-4.1'],
  acceptanceCriteria: ['AC-2.1.1', 'AC-2.2.1', 'AC-2.3.1', 'AC-3.1.1'],
  methods: [
    'LoginScreen.render()',
    'RegisterScreen.handleStepChange()',
    'Dashboard.loadWidgets()',
  ],
  hypotheses: ['H2', 'H3', 'H5', 'H7'],
  testCases: ['TC-H2-001', 'TC-H3-001', 'TC-H5-001'],
};
```

#### Analytics Integration Requirements

- **Screen Navigation**: Track page views, time on page, exit points
- **Form Interactions**: Step completion rates, validation errors, abandonment
  points
- **Entity Operations**: CRUD operation success/failure rates, performance
  metrics
- **User Experience**: Accessibility feature usage, error recovery patterns

#### Accessibility Validation (WCAG 2.1 AA)

- [ ] Screen reader compatibility for all interactive elements
- [ ] Keyboard navigation flow matches visual hierarchy
- [ ] Form labels properly associated with inputs
- [ ] Error announcements for assistive technology
- [ ] Color-independent status indicators
- [ ] Proper heading structure and landmark regions

#### Security Implementation

- [ ] Input validation at all entity boundaries
- [ ] Authentication state management with session handling
- [ ] CSRF protection for form submissions
- [ ] XSS prevention in dynamic content rendering
- [ ] Audit logging for entity operations

### Performance Requirements

#### Bundle Size Optimization

- [ ] Code splitting for screen-level components
- [ ] Lazy loading for non-critical entity operations
- [ ] Tree shaking for unused validation schemas
- [ ] Component memoization for expensive rendering

#### Loading Performance

- [ ] Initial screen render <2 seconds
- [ ] Entity data fetch <500ms with loading states
- [ ] Form validation feedback <100ms
- [ ] Screen transitions <300ms

### Testing & Validation Strategy

#### Entity Testing

```typescript
// Test entity CRUD operations
// Validate schema compliance
// Test error handling and edge cases
// Performance testing for large datasets
```

#### Screen Integration Testing

```typescript
// End-to-end user flows
// Form submission and validation
// Navigation and state persistence
// Responsive behavior testing
```

#### Accessibility Testing

```typescript
// Screen reader testing with NVDA/JAWS
// Keyboard navigation validation
// Color contrast verification
// Focus management testing
```

### Success Criteria & Deliverables

#### ✅ Functional Deliverables

- [ ] Complete user authentication flow (login, register, logout)
- [ ] Functional dashboard with role-based content
- [ ] Entity management infrastructure operational
- [ ] Navigation system with breadcrumbs and user menu
- [ ] Error handling and recovery mechanisms

#### ✅ Technical Deliverables

- [ ] Entity layer with full CRUD operations
- [ ] API client infrastructure with mock/real data toggle
- [ ] State management for authentication and user preferences
- [ ] Screen-level components matching wireframe specifications
- [ ] Analytics integration for user behavior tracking

#### ✅ Quality Deliverables

- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Component Traceability Matrix completion
- [ ] Performance benchmarks within requirements
- [ ] Security audit checklist completion
- [ ] Error boundary and recovery testing

### Implementation Dependencies

#### External Dependencies

```bash
# State management
npm install zustand immer

# Date handling
npm install date-fns

# Additional UI utilities
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Analytics (if not already installed)
npm install @vercel/analytics
```

#### File Structure Requirements

```
src/
├── lib/
│   ├── entities/           # Entity management layer
│   │   ├── user.ts
│   │   ├── proposal.ts
│   │   └── auth.ts
│   ├── api/               # API client infrastructure
│   │   ├── client.ts
│   │   ├── endpoints/
│   │   └── types.ts
│   └── store/             # State management
│       ├── authStore.ts
│       ├── userStore.ts
│       └── uiStore.ts
├── hooks/
│   └── entities/          # Entity-specific hooks
│       ├── useUser.ts
│       ├── useProposal.ts
│       └── useAuth.ts
├── app/
│   ├── (auth)/           # Authentication screens
│   │   ├── login/
│   │   └── register/
│   └── dashboard/        # Dashboard screens
├── components/
│   ├── screens/          # Screen-level components
│   ├── navigation/       # Navigation components
│   └── providers/        # Context providers
```

### Risk Mitigation

#### Technical Risks

- **State Management Complexity**: Use simple patterns initially, enhance
  incrementally
- **Entity Relationship Management**: Start with simple associations, build
  complexity
- **Performance with Mock Data**: Implement pagination and filtering early

#### UX Risks

- **Screen Complexity**: Break complex screens into focused sub-components
- **Navigation Confusion**: Implement clear breadcrumbs and consistent patterns
- **Form Abandonment**: Save progress frequently, provide clear error recovery

### Phase Completion Validation

#### Before H2.4 Handoff

- [ ] All screens functional with navigation
- [ ] Entity CRUD operations tested
- [ ] Analytics events firing correctly
- [ ] Accessibility audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated in IMPLEMENTATION_LOG.md

#### H2.4 Preparation

- [ ] API client ready for real backend integration
- [ ] Component library proven with screen assembly
- [ ] State management patterns established
- [ ] Error handling patterns proven
- [ ] Analytics infrastructure validated

### Expected Outcomes

#### User Experience

- Fully functional authentication and registration flows
- Intuitive dashboard with role-appropriate content
- Seamless navigation between screens
- Comprehensive error handling with recovery paths

#### Developer Experience

- Proven entity management patterns
- Reusable screen assembly techniques
- Established state management conventions
- Clear separation between UI and data layers

#### Technical Foundation

- Production-ready entity infrastructure
- Scalable screen assembly patterns
- Comprehensive error boundaries
- Analytics-driven UX optimization capabilities

---

**Next Phase Preview**: H2.4 will focus on Advanced Entity Relationships +
Complex Screen Workflows, building proposal creation flows and team
collaboration features.
