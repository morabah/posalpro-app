# PosalPro MVP2 - Component Structure Specifications

## Overview

This document provides detailed component specifications for implementing the
PosalPro MVP2 wireframes, focusing on the complex screens that require advanced
logic and state management. It follows Next.js 15 App Router patterns,
TypeScript strict mode, and our established design system.

## Core Component Architecture

### Component Composition Pattern

We'll follow a composition-based component architecture with the following
layers:

1. **Page Components**: App Router pages that handle data fetching and layout
2. **Feature Components**: Complex components encapsulating business logic
3. **UI Components**: Reusable presentation components
4. **Hooks & Utilities**: Shared logic and state management

```typescript
// Example component composition
export default function ProposalPage() {
  // Data fetching with React Server Components
  const proposals = await fetchProposals();

  return (
    <PageLayout>
      <ProposalDashboard proposals={proposals} />
    </PageLayout>
  );
}

// Feature component with business logic
function ProposalDashboard({ proposals }: { proposals: Proposal[] }) {
  return (
    <DashboardContainer>
      <ProposalFilters />
      <ProposalList proposals={proposals} />
      <ProposalMetrics proposals={proposals} />
    </DashboardContainer>
  );
}
```

### State Management Approach

- **Server State**: React Query for remote data management
- **UI State**: React Context for shared UI state
- **Form State**: React Hook Form with Zod validation
- **Global State**: Redux Toolkit for complex cross-cutting concerns

```typescript
// Example state management with React Context
export const ValidationContext = createContext<ValidationContextType | null>(null);

export function ValidationProvider({ children }: { children: React.ReactNode }) {
  const [validationState, dispatch] = useReducer(validationReducer, initialState);

  const validateProposal = useCallback((proposal: Proposal) => {
    // Validation logic
    dispatch({ type: 'START_VALIDATION', payload: proposal.id });
    // ...
  }, []);

  return (
    <ValidationContext.Provider value={{ state: validationState, validateProposal }}>
      {children}
    </ValidationContext.Provider>
  );
}
```

## Complex Component Implementations

### 1. Product Relationships Management

#### Key Components

1. **RelationshipGraphVisualizer**

   - Interactive graph visualization for product relationships
   - Drag-and-drop interface for creating relationships
   - Zoom and filter capabilities
   - Detail panel for selected relationships

2. **RelationshipMatrixView**

   - Matrix representation of product relationships
   - Color-coded cells indicating relationship types
   - Inline editing capabilities
   - Filtering and sorting options

3. **RelationshipRuleBuilder**
   - Visual rule builder for complex relationships
   - Condition group creation with AND/OR operators
   - Preview generation for rule SQL-like syntax
   - Validation and testing capabilities

#### State Management

```typescript
interface ProductRelationshipState {
  products: Product[];
  relationships: ProductRelationship[];
  selectedRelationship: string | null;
  filters: RelationshipFilter;
  view: 'graph' | 'matrix' | 'rules';
  editMode: boolean;
}

// Custom hook for relationship management
function useProductRelationships() {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const relationshipsQuery = useQuery({
    queryKey: ['productRelationships'],
    queryFn: fetchProductRelationships,
  });

  const createRelationshipMutation = useMutation({
    mutationFn: createRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productRelationships'] });
    },
  });

  // Additional logic for relationship management

  return {
    products: productsQuery.data || [],
    relationships: relationshipsQuery.data || [],
    isLoading: productsQuery.isLoading || relationshipsQuery.isLoading,
    createRelationship: createRelationshipMutation.mutate,
    // Additional methods
  };
}
```

#### Implementation Considerations

- Use `react-force-graph` or `d3.js` for graph visualization
- Implement custom matrix visualization with CSS Grid
- Create reusable rule builder components
- Optimize rendering for large product catalogs

### 2. Approval Workflow

#### Key Components

1. **WorkflowDashboard**

   - Overview of pending approvals
   - SLA tracking with visual indicators
   - Filter and sort capabilities
   - Quick action buttons

2. **WorkflowDetailView**

   - Detailed view of specific workflow
   - Stage progression visualization
   - Current status and history
   - Decision submission interface

3. **WorkflowDesigner**
   - Visual workflow template designer
   - Stage configuration with approver assignment
   - Condition builder for conditional stages
   - Template management and versioning

#### State Management

```typescript
interface ApprovalWorkflowState {
  workflows: ApprovalWorkflow[];
  pendingApprovals: PendingApproval[];
  selectedWorkflow: string | null;
  filters: ApprovalFilter;
  userRole: string;
}

// Custom hook for approval management
function useApprovalWorkflows(userId: string) {
  const [filters, setFilters] = useState<ApprovalFilter>({
    status: 'pending',
    priority: 'all',
    assignedTo: userId,
  });

  const pendingApprovalsQuery = useQuery({
    queryKey: ['pendingApprovals', filters],
    queryFn: () => fetchPendingApprovals(filters),
  });

  const submitDecisionMutation = useMutation({
    mutationFn: submitApprovalDecision,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
  });

  // Additional approval management logic

  return {
    pendingApprovals: pendingApprovalsQuery.data || [],
    isLoading: pendingApprovalsQuery.isLoading,
    submitDecision: submitDecisionMutation.mutate,
    filters,
    setFilters,
    // Additional methods
  };
}
```

#### Implementation Considerations

- Implement state machine for workflow progression
- Use optimistic UI updates for approval decisions
- Create reusable timeline visualization
- Implement real-time notifications for pending approvals

### 3. Validation Dashboard

#### Key Components

1. **ValidationDashboard**

   - Overview of validation issues
   - Filtering and grouping capabilities
   - Severity distribution visualization
   - Quick action buttons

2. **RuleEditor**

   - Visual rule creation interface
   - Condition group builder
   - Rule testing and simulation
   - Rule management and versioning

3. **ValidationIssueManager**
   - Issue detail view
   - Fix suggestion interface
   - Resolution workflow
   - History and audit trail

#### State Management

```typescript
interface ValidationState {
  rules: ValidationRule[];
  issues: ValidationIssue[];
  selectedIssue: string | null;
  filters: ValidationFilter;
  testMode: boolean;
  testResults: TestResult[] | null;
}

// Custom hook for validation management
function useValidation() {
  const queryClient = useQueryClient();

  const validationRulesQuery = useQuery({
    queryKey: ['validationRules'],
    queryFn: fetchValidationRules,
  });

  const validationIssuesQuery = useQuery({
    queryKey: ['validationIssues', filters],
    queryFn: () => fetchValidationIssues(filters),
  });

  const createRuleMutation = useMutation({
    mutationFn: createValidationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validationRules'] });
    },
  });

  // Additional validation management logic

  return {
    rules: validationRulesQuery.data || [],
    issues: validationIssuesQuery.data || [],
    isLoading:
      validationRulesQuery.isLoading || validationIssuesQuery.isLoading,
    createRule: createRuleMutation.mutate,
    // Additional methods
  };
}
```

#### Implementation Considerations

- Create reusable condition builder components
- Implement rule engine with efficient evaluation
- Use virtual scrolling for large issue lists
- Create comprehensive issue resolution workflow

### 4. Predictive Validation Module

#### Key Components

1. **RiskAnalysisDashboard**

   - Risk score visualization
   - Contributing factor breakdown
   - Trend analysis and forecasting
   - Remediation recommendations

2. **PatternLearningInterface**

   - Validation pattern visualization
   - Learning configuration
   - Pattern evaluation metrics
   - Manual review and approval

3. **RuleRecommendationEngine**
   - AI-generated rule suggestions
   - Confidence scoring
   - Rule review and customization
   - One-click rule adoption

#### State Management

```typescript
interface PredictiveValidationState {
  riskAnalysis: RiskAnalysis | null;
  patterns: ValidationPattern[];
  recommendedRules: RecommendedRule[];
  learningStatus: LearningStatus;
  configuration: PredictiveConfiguration;
}

// Custom hook for predictive validation
function usePredictiveValidation() {
  const queryClient = useQueryClient();

  const riskAnalysisQuery = useQuery({
    queryKey: ['riskAnalysis', entityId, entityType],
    queryFn: () => fetchRiskAnalysis(entityId, entityType),
  });

  const recommendedRulesQuery = useQuery({
    queryKey: ['recommendedRules'],
    queryFn: fetchRecommendedRules,
  });

  const adoptRuleMutation = useMutation({
    mutationFn: adoptRecommendedRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validationRules'] });
      queryClient.invalidateQueries({ queryKey: ['recommendedRules'] });
    },
  });

  // Additional predictive validation logic

  return {
    riskAnalysis: riskAnalysisQuery.data,
    recommendedRules: recommendedRulesQuery.data || [],
    isLoading: riskAnalysisQuery.isLoading || recommendedRulesQuery.isLoading,
    adoptRule: adoptRuleMutation.mutate,
    // Additional methods
  };
}
```

#### Implementation Considerations

- Use D3.js for advanced visualizations
- Implement confidence scoring UI elements
- Create feedback mechanisms for improving AI recommendations
- Implement progressive loading for computationally intensive operations

### 5. Admin Screen with Enhanced RBAC

#### Key Components

1. **PermissionMatrix**

   - Comprehensive permission management interface
   - Role-to-permission mapping visualization
   - Bulk editing capabilities
   - Permission impact analysis

2. **RoleHierarchyVisualizer**

   - Visual representation of role relationships
   - Inheritance path visualization
   - Drag-and-drop hierarchy editing
   - Conflict detection

3. **ContextualPermissionEditor**
   - ABAC extension configuration
   - Attribute-based rule creation
   - Testing and simulation tools
   - Condition builder interface

#### State Management

```typescript
interface RBACState {
  roles: Role[];
  permissions: Permission[];
  selectedRole: string | null;
  selectedPermission: string | null;
  contextRules: ContextRule[];
  conflicts: RoleConflict[];
  view: 'matrix' | 'hierarchy' | 'contextual';
}

// Custom hook for RBAC management
function useRBAC() {
  const queryClient = useQueryClient();

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: fetchPermissions,
  });

  const updateRoleMutation = useMutation({
    mutationFn: updateRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  // Additional RBAC management logic

  return {
    roles: rolesQuery.data || [],
    permissions: permissionsQuery.data || [],
    isLoading: rolesQuery.isLoading || permissionsQuery.isLoading,
    updateRole: updateRoleMutation.mutate,
    // Additional methods
  };
}
```

#### Implementation Considerations

- Create custom matrix visualization with expandable sections
- Implement drag-and-drop hierarchy editor
- Create conflict detection and resolution system
- Implement impact analysis visualization

## Component Integration

### Navigation Integration

```typescript
interface NavigationState {
  currentSection: string;
  currentPage: string;
  breadcrumbs: Breadcrumb[];
  recentlyVisited: RecentPage[];
  permissions: Permission[];
}

// Navigation provider component
export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentSection: '',
    currentPage: '',
    breadcrumbs: [],
    recentlyVisited: [],
    permissions: []
  });

  // Navigation logic

  return (
    <NavigationContext.Provider value={{ state: navigationState, setCurrentPage, addBreadcrumb }}>
      <Sidebar />
      <main>
        <Header />
        {children}
      </main>
    </NavigationContext.Provider>
  );
}
```

### Permission Integration

```typescript
// Higher-order component for permission checking
function withPermission<P>(
  Component: React.ComponentType<P>,
  requiredPermission: string
): React.FC<P> {
  return function PermissionGuardedComponent(props: P) {
    const { hasPermission } = usePermissions();

    if (!hasPermission(requiredPermission)) {
      return <AccessDenied permission={requiredPermission} />;
    }

    return <Component {...props} />;
  };
}

// Usage
const ProtectedProposalDashboard = withPermission(
  ProposalDashboard,
  'proposals:view'
);
```

### Validation Integration

```typescript
// Validation provider for cross-cutting validation concerns
export function ValidationProvider({ children }: { children: React.ReactNode }) {
  // Validation state and logic

  // Register validation hook
  useEffect(() => {
    const unregister = registerValidationHook('proposal', validateProposal);
    return unregister;
  }, [validateProposal]);

  return (
    <ValidationContext.Provider value={{ validateEntity, validationState }}>
      {children}
    </ValidationContext.Provider>
  );
}

// Usage in components
function ProposalForm({ proposal }: { proposal: Proposal }) {
  const { validateEntity, validationState } = useValidation();

  const handleValidate = () => {
    validateEntity('proposal', proposal);
  };

  return (
    <Form>
      {/* Form fields */}
      <ValidationSummary issues={validationState.issues} />
      <Button onClick={handleValidate}>Validate</Button>
    </Form>
  );
}
```

## Accessibility Considerations

All components will implement the following accessibility features:

1. **Keyboard Navigation**

   - Logical tab order
   - Keyboard shortcuts for common actions
   - Focus management for modals and complex widgets

2. **Screen Reader Support**

   - ARIA attributes for dynamic content
   - Meaningful announcements for state changes
   - Descriptive labels for interactive elements

3. **Color and Contrast**

   - WCAG 2.1 AA compliant color contrast
   - Non-color-dependent information
   - High-contrast mode support

4. **Responsive Design**
   - Mobile-first approach
   - Flexible layouts for different screen sizes
   - Touch-friendly interaction targets

## Performance Optimizations

Components will implement the following performance optimizations:

1. **Rendering Optimization**

   - Component memoization
   - Virtualized lists for large data sets
   - Debounced and throttled event handlers

2. **Data Management**

   - Strategic data fetching
   - Optimistic UI updates
   - Efficient state management

3. **Code Splitting**
   - Route-based code splitting
   - Component-level dynamic imports
   - Critical path optimization

## Next Steps

1. Create component library foundation
2. Implement core layout components
3. Develop feature-specific components
4. Create integration points between components
5. Implement state management solutions
6. Test and optimize component performance
