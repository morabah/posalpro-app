# Future Development Standards for PosalPro MVP2

## 🎯 **Purpose**

This document ensures all future features maintain the **100% TypeScript
compliance** and **standardized error handling** achieved in our historic type
safety implementation. Following these standards prevents technical debt and
eliminates the need for future type safety cleanup phases.

---

## ⚡ **QUICK REFERENCE CHECKLIST**

### **Before You Code**

```bash
# Required pre-development checks
npm run type-check    # Must return 0 errors
npm run lint         # Must be clean
npm run quality:check # All checks pass
```

### **TypeScript Essentials**

```typescript
// ✅ DO: Explicit interfaces
interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ❌ DON'T: Any types
const data: any = response; // NEVER use any
```

### **Component Template Pattern**

```typescript
// Component Traceability Matrix (MANDATORY)
const COMPONENT_MAPPING = {
  userStories: ['US-X.X'],
  acceptanceCriteria: ['AC-X.X.X'],
  methods: ['methodName()'],
  hypotheses: ['HX'],
  testCases: ['TC-HX-XXX'],
};

interface Props {
  data: TypedData;
  onAction: (result: ActionResult) => void;
}

export function Component({ data, onAction }: Props) {
  const { handleAsyncError } = useErrorHandling();
  const analytics = useAnalytics();

  // Component logic with error handling
  return <div>Content</div>;
}
```

### **Pre-Commit Validation Checklist**

- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → passes
- [ ] `npm run test` → all pass
- [ ] Error handling → standardized patterns
- [ ] Component Traceability Matrix → implemented
- [ ] WCAG 2.1 AA → compliant
- [ ] Documentation → updated

---

## 🚨 **CRITICAL WARNING: Always Use Established Error Handling System**

**⚠️ LESSON LEARNED**: Never implement custom error handling! Always use the
standardized system:

### **Mandatory Error Handling Imports**

```typescript
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { useErrorHandler } from '@/components/providers/ErrorBoundary';
```

### **Required Pattern for All Error Handling**

```typescript
// Initialize in component
const errorHandlingService = ErrorHandlingService.getInstance();
const throwError = useErrorHandler();

// Use in catch blocks
try {
  // ... your code
} catch (err) {
  const processedError = errorHandlingService.processError(
    err,
    'Operation failed',
    ErrorCodes.VALIDATION.INVALID_INPUT,
    {
      component: 'ComponentName',
      operation: 'methodName',
      userId: user?.id,
      userFriendlyMessage: 'User-facing message',
    }
  );

  const userMessage =
    errorHandlingService.getUserFriendlyMessage(processedError);
  setError(userMessage);
}
```

**✅ Always check: Are you using ErrorHandlingService.processError()?** **❌
Never do: Custom error processing or manual error type checking**

---

## 📋 **Pre-Development Checklist**

### **Before Writing Any Code**

- [ ] Read this entire document
- [ ] Review existing error handling patterns in `src/lib/errors/`
- [ ] Check Component Traceability Matrix requirements
- [ ] Verify wireframe documentation exists for UI features
- [ ] Set up TypeScript strict mode validation

### **Required Setup Commands**

```bash
# Verify type safety before starting
npm run type-check

# Ensure linting is clean
npm run lint

# Run all quality checks
npm run quality:check
```

---

## 🛡️ **TypeScript Standards (MANDATORY)**

### **1. Strict Type Definitions**

```typescript
// ✅ CORRECT: Explicit typing
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  preferences?: UserPreferences;
}

// ❌ AVOID: Any types
const userData: any = fetchUser(); // NEVER DO THIS

// ✅ CORRECT: Proper generic typing
function processData<T extends BaseEntity>(data: T): ProcessedResult<T> {
  return transformEntity(data);
}
```

### **2. Required Type Patterns**

```typescript
// API Response Types
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  code?: string;
}

// Component Props with Required Traceability
interface ComponentProps {
  // Core props
  data: RequiredDataType;
  onAction: (result: ActionResult) => void;

  // Component Traceability Matrix (MANDATORY)
  componentMapping: {
    userStories: string[];
    acceptanceCriteria: string[];
    methods: string[];
    hypotheses: string[];
    testCases: string[];
  };
}

// Error Handling Types
import { ProcessedError, ErrorCategory } from '@/lib/errors';
```

### **3. Forbidden Practices**

```typescript
// ❌ NEVER USE
const data: any = response;
const result = data as SomeType; // Unsafe casting
function processStuff(input: any): any; // No any types

// ✅ USE INSTEAD
const data: ApiResponse<UserData> = response;
const result = validateAndTransform(data);
function processUserData(input: UserData): ProcessedUserData;
```

---

## 🚨 **Error Handling Standards (MANDATORY)**

### **1. Use Established Error System**

```typescript
import {
  ErrorCategory,
  ProcessedError,
  errorInterceptor
} from '@/lib/errors';
import { useErrorHandling } from '@/hooks/useErrorHandling';

// ✅ CORRECT: Component-level error handling
function MyComponent() {
  const { handleAsyncError, displayError, clearError } = useErrorHandling();

  const handleAction = async () => {
    try {
      const result = await apiCall();
      // Handle success
    } catch (error) {
      handleAsyncError(error, {
        context: 'MyComponent.handleAction',
        userMessage: 'Failed to perform action. Please try again.',
        retryable: true
      });
    }
  };

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### **2. API Route Error Handling**

```typescript
// ✅ CORRECT: API route with standardized error handling
import { NextRequest, NextResponse } from 'next/server';
import { errorInterceptor } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = validateSchema(body);

    // Process request
    const result = await processData(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Operation completed successfully',
    });
  } catch (error) {
    const processedError = errorInterceptor.processError(error as Error, {
      url: request.url,
      method: 'POST',
      headers: Object.fromEntries(request.headers.entries()),
    });

    return NextResponse.json(
      {
        success: false,
        message: processedError.userMessage,
        code: processedError.code,
        error: processedError.message,
      },
      { status: getHttpStatus(processedError.category) }
    );
  }
}
```

### **3. Service Layer Error Handling**

```typescript
// ✅ CORRECT: Service with proper error categorization
class NewFeatureService {
  async processFeature(data: FeatureData): Promise<ApiResponse<FeatureResult>> {
    try {
      // Validate input
      if (!this.validateInput(data)) {
        throw new ValidationError('Invalid feature data provided');
      }

      // Process business logic
      const result = await this.executeFeatureLogic(data);

      return {
        success: true,
        data: result,
        message: 'Feature processed successfully',
      };
    } catch (error) {
      // Let error interceptor handle categorization
      const processedError = errorInterceptor.processError(error as Error, {
        url: 'NewFeatureService.processFeature',
        method: 'POST',
        headers: {},
      });

      return {
        success: false,
        message: processedError.userMessage,
        error: processedError.message,
        code: processedError.code,
      };
    }
  }
}
```

---

## 🎯 **Component Development Standards**

### **1. Component Structure Template**

```typescript
import React from 'react';
import { useErrorHandling } from '@/hooks/useErrorHandling';
import { useAnalytics } from '@/hooks/useAnalytics';

// Component Traceability Matrix (MANDATORY)
const COMPONENT_MAPPING = {
  userStories: ['US-X.X'],
  acceptanceCriteria: ['AC-X.X.X'],
  methods: ['methodName()'],
  hypotheses: ['HX'],
  testCases: ['TC-HX-XXX'],
};

interface ComponentProps {
  // Properly typed props
  data: ComponentData;
  onAction: (result: ActionResult) => void;

  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function NewComponent({
  data,
  onAction,
  variant = 'primary',
  disabled = false
}: ComponentProps) {
  // Error handling hook
  const { handleAsyncError } = useErrorHandling();

  // Analytics tracking
  const analytics = useAnalytics();

  // Component logic with proper error handling
  const handleAction = async () => {
    try {
      analytics.track('new_component_action_started', {
        variant,
        componentMapping: COMPONENT_MAPPING
      });

      const result = await performAction(data);
      onAction(result);

      analytics.track('new_component_action_completed', {
        success: true,
        componentMapping: COMPONENT_MAPPING
      });

    } catch (error) {
      handleAsyncError(error, {
        context: 'NewComponent.handleAction',
        userMessage: 'Action failed. Please try again.',
        retryable: true
      });

      analytics.track('new_component_action_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        componentMapping: COMPONENT_MAPPING
      });
    }
  };

  return (
    <div className="new-component">
      {/* WCAG 2.1 AA compliant markup */}
      <button
        onClick={handleAction}
        disabled={disabled}
        aria-label="Perform component action"
        className={`btn-${variant}`}
      >
        Action Button
      </button>
    </div>
  );
}

export default NewComponent;
```

### **2. Hook Development Standards**

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useErrorHandling } from '@/hooks/useErrorHandling';

interface UseNewFeatureOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseNewFeatureReturn {
  data: FeatureData | null;
  loading: boolean;
  error: ProcessedError | null;
  refetch: () => Promise<void>;
}

export function useNewFeature(
  options: UseNewFeatureOptions = {}
): UseNewFeatureReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  const { handleAsyncError, clearError } = useErrorHandling();

  const [data, setData] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ProcessedError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    clearError();

    try {
      const result = await featureService.getData();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      const processedError = handleAsyncError(err, {
        context: 'useNewFeature.fetchData',
        userMessage: 'Failed to load feature data',
        retryable: true,
      });
      setError(processedError);
    } finally {
      setLoading(false);
    }
  }, [handleAsyncError, clearError]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
```

---

## 📝 **Development Workflow**

### **1. Pre-Development Setup**

```bash
# 1. Create feature branch
git checkout -b feature/new-feature-name

# 2. Verify clean state
npm run type-check
npm run lint

# 3. Run quality checks
npm run quality:check
```

### **2. During Development**

```bash
# Check types frequently
npm run type-check

# Verify no new linting issues
npm run lint

# Test changes
npm run test
```

### **3. Pre-Commit Validation**

```bash
# Final quality check
npm run quality:check

# Ensure all tests pass
npm run test

# Verify type safety
npm run type-check

# Check accessibility compliance
npm run test:a11y
```

---

## 🧪 **Testing Standards**

### **1. Component Testing Template**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils/testUtils';
import NewComponent from './NewComponent';

// Mock dependencies
jest.mock('@/hooks/useErrorHandling', () => ({
  useErrorHandling: () => ({
    handleAsyncError: jest.fn(),
    clearError: jest.fn(),
    displayError: jest.fn()
  })
}));

describe('NewComponent', () => {
  const defaultProps = {
    data: mockFeatureData,
    onAction: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    render(<NewComponent {...defaultProps} />);

    expect(screen.getByText('Action Button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Perform component action');
  });

  it('handles errors properly', async () => {
    const mockError = new Error('Test error');
    const mockHandleAsyncError = jest.fn();

    jest.mocked(useErrorHandling).mockReturnValue({
      handleAsyncError: mockHandleAsyncError,
      clearError: jest.fn(),
      displayError: jest.fn()
    });

    render(<NewComponent {...defaultProps} />);

    // Trigger error
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockHandleAsyncError).toHaveBeenCalledWith(
        expect.any(Error),
        {
          context: 'NewComponent.handleAction',
          userMessage: 'Action failed. Please try again.',
          retryable: true
        }
      );
    });
  });
});
```

---

## 📚 **Documentation Requirements**

### **1. Component Documentation**

````typescript
/**
 * NewComponent - Brief description of the component
 *
 * @description Detailed description of what this component does
 *
 * @example
 * ```tsx
 * <NewComponent
 *   data={featureData}
 *   onAction={handleAction}
 *   variant="primary"
 * />
 * ```
 *
 * @wireframe Reference to wireframe document: WIREFRAME_NAME.md
 * @userStories US-X.X - User story description
 * @acceptanceCriteria AC-X.X.X - Acceptance criteria
 * @accessibility WCAG 2.1 AA compliant - screen reader compatible
 * @analytics Tracks: component_action_started, component_action_completed
 */
````

### **2. Update Implementation Log**

```markdown
## YYYY-MM-DD HH:MM - New Feature Implementation

**Phase**: X.Y.Z - Feature Name **Status**: ✅ Complete **Files Modified**:

- src/components/NewComponent.tsx
- src/hooks/useNewFeature.ts
- src/lib/services/newFeatureService.ts

**TypeScript Compliance**: ✅ Zero errors added **Error Handling**: ✅
Standardized patterns used **Testing**: ✅ Comprehensive test coverage
**Accessibility**: ✅ WCAG 2.1 AA compliant **Analytics**: ✅ Component
traceability implemented
```

---

## ⚠️ **Common Pitfalls to Avoid**

### **1. TypeScript Violations**

```typescript
// ❌ DON'T: Use any types
const data: any = response;

// ❌ DON'T: Unsafe type assertions
const user = data as User;

// ❌ DON'T: Missing error handling
async function fetchData() {
  const response = await api.call(); // No try/catch
  return response;
}

// ❌ DON'T: Ignore null/undefined
const name = user.profile.name; // Could crash

// ✅ DO: Proper typing and safety
const data: ApiResponse<User> = response;
const user = validateUserData(data.data);
if (user.profile?.name) {
  const name = user.profile.name;
}
```

### **2. Error Handling Violations**

```typescript
// ❌ DON'T: Generic error handling
catch (error) {
  console.error(error); // Not helpful to users
}

// ❌ DON'T: Silent failures
catch (error) {
  // Do nothing - user doesn't know what happened
}

// ✅ DO: Use standardized error handling
catch (error) {
  handleAsyncError(error, {
    context: 'FeatureName.functionName',
    userMessage: 'Specific user-friendly message',
    retryable: true
  });
}
```

---

## 🎯 **Quality Gates**

### **Before Every Commit**

- [ ] `npm run type-check` returns 0 errors
- [ ] `npm run lint` passes without new warnings
- [ ] `npm run test` all tests pass
- [ ] Error handling uses established patterns
- [ ] Component Traceability Matrix implemented
- [ ] Accessibility requirements met
- [ ] Documentation updated

### **Before Every Pull Request**

- [ ] All quality gates passed
- [ ] IMPLEMENTATION_LOG.md updated
- [ ] Test coverage maintained/improved
- [ ] No technical debt introduced
- [ ] Wireframe compliance verified (for UI components)

---

## 🚀 **Quick Start Checklist for New Features**

1. **Planning Phase**:
   - [ ] Review wireframe documentation
   - [ ] Define TypeScript interfaces
   - [ ] Plan error handling strategy
   - [ ] Design Component Traceability Matrix

2. **Development Phase**:
   - [ ] Use established patterns from this guide
   - [ ] Implement standardized error handling
   - [ ] Add comprehensive TypeScript types
   - [ ] Include analytics tracking

3. **Testing Phase**:
   - [ ] Write unit tests with error scenarios
   - [ ] Test accessibility compliance
   - [ ] Verify TypeScript compilation
   - [ ] Test error handling flows

4. **Documentation Phase**:
   - [ ] Update IMPLEMENTATION_LOG.md
   - [ ] Add inline code documentation
   - [ ] Update relevant wireframe mappings
   - [ ] Record any lessons learned

---

## 📞 **Support Resources**

- **Error Handling Reference**: `src/lib/errors/index.ts`
- **Component Patterns**: `src/components/` (existing components)
- **Hook Patterns**: `src/hooks/` (existing hooks)
- **Testing Utilities**: `src/test/utils/testUtils.ts`
- **Type Definitions**: `src/types/`
- **Wireframe Documentation**: `front end structure/wireframes/`

---

**🎯 Following these standards ensures every new feature maintains our historic
100% TypeScript compliance and enterprise-grade error handling excellence!**

# CORE REQUIREMENTS (Non-Negotiable)

## 🔧 ERROR HANDLING & TYPE SAFETY

### Error Handling: Use standardized ErrorHandlingService system only

- **Import**: ErrorHandlingService, StandardError, ErrorCodes, useErrorHandler
- **Pattern**: errorHandlingService.processError() in all catch blocks
- **Never**: Custom error handling - always use established infrastructure
- **Validation**: All components must use standardized error patterns

### TypeScript: Maintain 100% type safety (0 errors)

- **Verify**: npm run type-check → 0 errors before any commit
- **Use**: Explicit interfaces, strict typing, no any types
- **Standard**: Follow FUTURE_DEVELOPMENT_STANDARDS.md patterns
- **Compliance**: Zero tolerance for type errors in production

## ♻️ EXISTING PATTERNS & INFRASTRUCTURE

### Existing Patterns: Check for established implementations first

- **Search**: src/lib/services/, src/hooks/, src/components/
- **Reuse**: Don't recreate existing functionality - leverage established
  patterns
- **Extend**: Build upon current infrastructure and proven solutions
- **Analysis**: Conduct systematic pattern analysis before implementation

## 📱 MOBILE TOUCH INTERACTION STANDARDS (CRITICAL)

### Touch Event Conflict Prevention: Mandatory for all touch-enabled components

- **Pattern**: Smart event target filtering for components with gestures + forms
- **Implementation**:
  ```javascript
  const isInteractiveElement =
    target.matches(
      'input, select, textarea, button, [role="button"], [tabindex], a'
    ) ||
    target.closest(
      'input, select, textarea, button, [role="button"], [tabindex], a'
    );
  if (isInteractiveElement) return; // Skip gesture handling
  ```
- **Form Components**: Must use stopPropagation() + visual feedback
- **Testing**: Single-tap field access verification on mobile devices

### Systematic Analysis Requirement: For components with touch interactions

- **Coverage**: 100% analysis of touch-enabled components required
- **Classification**: Safe/Problematic/Enhanced component categorization
- **Documentation**: Touch interaction patterns must be documented
- **Prevention**: Proactive conflict identification and resolution

## ⚡ PERFORMANCE & ANALYTICS

### Component Traceability Matrix: Map all implementations

- **Required**: User stories, acceptance criteria, hypotheses, test cases
- **Analytics**: useAnalytics() with hypothesis validation tracking
- **Performance**: Web Vitals monitoring with usePerformanceOptimization()
- **Mobile**: Touch interaction performance metrics included

### Optimization: Use existing performance infrastructure

- **Caching**: AdvancedCacheManager, ApiResponseCache
- **Database**: DatabaseQueryOptimizer for all queries
- **Bundle**: Lazy loading with BundleOptimizer
- **Mobile**: Touch event optimization for reduced conflicts

## ♿ ACCESSIBILITY & UI STANDARDS

### Wireframe Compliance: Reference wireframe documents for all UI

- **Path**: front end structure/wireframes/[SCREEN_NAME].md
- **Pattern**: Follow WIREFRAME_INTEGRATION_GUIDE.md
- **Consistency**: Apply WIREFRAME_CONSISTENCY_REVIEW.md standards
- **Mobile**: Touch interaction compliance with wireframe specifications

### WCAG 2.1 AA: Mandatory accessibility compliance

- **Touch**: 44px+ minimum targets for mobile (enforced)
- **Contrast**: 4.5:1 ratio minimum
- **Navigation**: Full keyboard and screen reader support
- **Mobile**: Single-tap field access for all interactive elements

## 📚 DOCUMENTATION & VALIDATION

### Required Updates: Update documentation after implementation

- **Always**: IMPLEMENTATION_LOG.md with phase, status, traceability
- **Complex**: LESSONS_LEARNED.md for significant implementations
- **Major**: PROJECT_REFERENCE.md for new components/APIs

---

# 🚀 QUICK REFERENCE SECTIONS

## ⚡ IMMEDIATE PRE-DEVELOPMENT VALIDATION CHECKLIST

### 🔧 Technical Prerequisites

- [ ] `npm run type-check` → 0 errors ✅
- [ ] ErrorHandlingService imports ready (ErrorHandlingService, StandardError,
      ErrorCodes, useErrorHandler)
- [ ] Existing pattern search completed (src/lib/, src/hooks/, src/components/)
- [ ] Performance optimization strategy defined

### 📱 Mobile Touch Interaction Review (CRITICAL)

- [ ] Component contains touch handlers? → **Smart event filtering REQUIRED**
- [ ] Form fields present? → **stopPropagation() pattern REQUIRED**
- [ ] Touch target sizing verified (44px+ minimum)
- [ ] Single-tap field access tested on mobile devices

### 🎨 UI & Accessibility Compliance

- [ ] Wireframe reference identified:
      `front end structure/wireframes/[SCREEN_NAME].md`
- [ ] WCAG 2.1 AA compliance verified (contrast 4.5:1, keyboard navigation)
- [ ] Component Traceability Matrix planned (user stories, acceptance criteria,
      hypotheses)

## 🔥 CRITICAL IMPLEMENTATION PATTERNS

### 📱 Mobile Touch Event Conflict Prevention (MANDATORY)

```javascript
// ✅ REQUIRED: Smart event target filtering for touch + form components
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  const target = e.target as HTMLElement;
  const isInteractiveElement =
    target.matches('input, select, textarea, button, [role="button"], [tabindex], a') ||
    target.closest('input, select, textarea, button, [role="button"], [tabindex], a');

  // Skip gesture handling if touching form fields
  if (isInteractiveElement) return;

  // Continue with gesture handling...
}, []);

// ✅ REQUIRED: Form component touch isolation
const handleTouchStart = useCallback((e: React.TouchEvent) => {
  e.stopPropagation(); // Prevent parent interference
  // Add visual feedback...
}, []);
```

### 🔧 Database-Agnostic Validation Pattern

```typescript
const validateCustomerId = (
  customerId: unknown,
  customerName?: string
): boolean => {
  if (!customerId || !customerName?.trim()) {
    return false;
  }

  // Accept multiple ID formats
  const isValidId =
    (typeof customerId === 'string' &&
      customerId.length > 0 &&
      customerId !== 'undefined') ||
    (typeof customerId === 'number' && customerId > 0);

  return isValidId;
};
```

### 🔧 Safe Navigation with Fallback

```typescript
const handleSafeNavigation = (response: ApiResponse, resourceType: string) => {
  // Debug logging
  console.log(`[${resourceType}] Navigation attempt:`, {
    success: response.success,
    id: response.data?.id,
    dataKeys: response.data ? Object.keys(response.data) : 'none',
  });

  // Validate response
  const id = response.data?.id;
  if (!id || id === 'undefined') {
    console.warn(`Invalid ${resourceType} ID, using fallback`);
    router.push(`/${resourceType.toLowerCase()}s/manage`);
    return;
  }

  // Safe navigation
  router.push(`/${resourceType.toLowerCase()}s/${id}`);
};
```

## 🔍 SYSTEMATIC ANALYSIS METHODOLOGY

### Touch-Enabled Component Analysis

1. **Pattern Search**: `grep -r "onTouchStart|onTouchMove|onTouchEnd" src/`
2. **Classification**: Safe/Problematic/Enhanced
3. **Conflict Detection**: Touch event hierarchy analysis
4. **Solution Application**: Smart event filtering implementation
5. **Documentation**: Touch patterns and prevention strategies

### Validation Pattern Analysis

1. **Check actual database ID formats first**
2. **Use business-logic validation over format validation**
3. **Support multiple ID formats (UUID, string, number)**
4. **Handle edge cases (`'undefined'` strings, empty values)**
5. **Add comprehensive debug logging**
6. **Align UI and schema validation**
7. **Test with real database data**

## ✅ POST-IMPLEMENTATION VALIDATION

### 🔧 Technical Verification

- [ ] `npm run type-check` → 0 errors
- [ ] `npm run build` → successful compilation
- [ ] Mobile testing: Single-tap field access verified
- [ ] Performance metrics within thresholds

### 📚 Documentation Updates (MANDATORY)

- [ ] **IMPLEMENTATION_LOG.md** updated with phase, status, traceability
- [ ] **LESSONS_LEARNED.md** updated for complex implementations
- [ ] Touch interaction patterns documented
- [ ] Prevention strategies established

### 📱 Mobile Touch Validation

- [ ] Systematic analysis completed for touch-enabled components
- [ ] Universal solution patterns applied consistently
- [ ] Touch conflict prevention documented
- [ ] Single-tap accessibility verified

### ✅ Navigation Safety Checklist

- [ ] Validate API response structure before navigation
- [ ] Check for undefined/null/invalid IDs
- [ ] Provide meaningful fallback routes
- [ ] Add response structure logging
- [ ] Use StandardError for navigation failures
- [ ] Test with actual API responses

## 🚨 CRITICAL FAILURE POINTS TO AVOID

### ❌ NEVER DO

- Custom error handling (use ErrorHandlingService only)
- TypeScript `any` types (maintain 100% type safety)
- Touch handlers without interactive element filtering
- Form components without stopPropagation()
- UI implementation without wireframe reference
- Missing Component Traceability Matrix
- Format-specific validation without business justification
- Unsafe navigation without response validation

### ✅ ALWAYS DO

- Search existing patterns before implementing
- Apply smart event target filtering for touch + form combinations
- Use established performance infrastructure
- Update documentation after implementation
- Test mobile touch interactions on real devices
- Follow systematic analysis methodology
- Use database-agnostic validation patterns
- Implement safe navigation with fallbacks

## 🎯 QUALITY GATES CHECKLIST

### Pre-Commit Validation

- [ ] TypeScript: 0 errors
- [ ] Mobile: Touch interactions tested
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Performance: Optimizations applied
- [ ] Documentation: Updates completed

### Mobile Touch Interaction Gates

- [ ] Smart event filtering implemented
- [ ] Form field isolation verified
- [ ] Touch target sizing validated (44px+)
- [ ] Single-tap field access confirmed
- [ ] Cross-platform testing completed

### Validation & Navigation Gates

- [ ] Database-agnostic validation implemented
- [ ] Business logic validation over format restrictions
- [ ] Safe navigation patterns applied
- [ ] Fallback routes configured
- [ ] API response validation implemented

## 🔄 COPY-PASTE TEMPLATES

### Template: Customer Validation

```typescript
const validateCustomerSelection = (
  customerId: unknown,
  customerName?: string
): string[] => {
  const errors: string[] = [];

  if (!customerId || !customerName?.trim()) {
    errors.push('Valid customer selection is required');
    return errors;
  }

  const isValidId =
    (typeof customerId === 'string' &&
      customerId.length > 0 &&
      customerId !== 'undefined') ||
    (typeof customerId === 'number' && customerId > 0);

  if (!isValidId) {
    errors.push('Valid customer selection is required');
  }

  return errors;
};
```

### Template: Error Processing Wrapper

```typescript
const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  component: string,
  operationName: string,
  userMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const standardError = errorHandlingService.processError(
      error,
      userMessage,
      ErrorCodes.BUSINESS.PROCESS_FAILED,
      {
        component,
        operation: operationName,
        timestamp: Date.now(),
      }
    );

    throw standardError;
  }
};
```

---

**⚡ SPEED TIP**: Use these checklists and templates for every implementation to
maintain our industry-leading 100% TypeScript compliance, zero mobile touch
conflicts, and comprehensive quality standards!

- **Mobile**: Touch interaction patterns and conflict resolution documented

### Quality Gates: All implementations must pass

- **Build**: npm run build → successful compilation
- **Types**: npm run type-check → 0 errors
- **Mobile**: Touch interaction testing on real devices
- **Performance**: Web Vitals within acceptable thresholds

## 🔍 PRE-IMPLEMENTATION CHECKLIST (ENHANCED)

### Technical Validation

- [ ] npm run type-check → 0 errors
- [ ] Existing pattern search completed (src/lib/, src/hooks/, src/components/)
- [ ] ErrorHandlingService imports ready
- [ ] Performance optimization strategy defined

### Mobile Touch Interaction Review (NEW)

- [ ] Component contains touch handlers? → Smart event filtering required
- [ ] Form fields present? → stopPropagation() pattern applied
- [ ] Touch target sizing verified (44px+ minimum)
- [ ] Single-tap field access tested on mobile devices

### UI & Accessibility Compliance

- [ ] Wireframe reference identified and reviewed
- [ ] WCAG 2.1 AA compliance verified
- [ ] Component Traceability Matrix planned
- [ ] Touch interaction accessibility validated

### Documentation & Quality Assurance

- [ ] Documentation update plan established
- [ ] Analytics integration planned with hypothesis tracking
- [ ] Systematic analysis methodology applied
- [ ] Prevention strategy documented for future development

## 🚀 QUALITY ASSURANCE FRAMEWORK (ENHANCED)

### Systematic Analysis Methodology

1. **Pattern Identification**: Search for similar implementations
2. **Component Classification**: Safe/Problematic/Enhanced categorization
3. **Conflict Detection**: Touch event hierarchy analysis
4. **Universal Solutions**: Standardized pattern application
5. **Prevention Documentation**: Lessons learned capture

### Mobile Touch Interaction Standards

- **Design Pattern**: Smart event target filtering for gesture + form
  combinations
- **Code Standards**: Interactive element detection with CSS selectors
- **Testing Standards**: Cross-platform mobile device verification
- **Performance Standards**: Reduced event conflicts and improved responsiveness

### Long-term Strategic Value

- **Maintainability**: Clear patterns for future component development
- **Scalability**: Systematic approach applicable to new features
- **Quality**: Established testing framework prevents regression
- **Consistency**: Standardized touch interactions across platform

## 📋 POST-IMPLEMENTATION VALIDATION

### Technical Verification

- [ ] TypeScript compilation: 0 errors
- [ ] Build successful: All static pages generated
- [ ] Performance metrics: Within acceptable thresholds
- [ ] Mobile testing: Single-tap field access verified

### Documentation Compliance

- [ ] IMPLEMENTATION_LOG.md updated with comprehensive details
- [ ] LESSONS_LEARNED.md updated for complex implementations
- [ ] Touch interaction patterns documented
- [ ] Prevention strategies established

### Quality Assurance

- [ ] Systematic analysis completed for touch-enabled components
- [ ] Universal solution patterns applied consistently
- [ ] Future development standards updated
- [ ] Code review checklist includes mobile touch validation

---

**CRITICAL NOTE**: These standards are based on systematic codebase analysis and
proven solutions. The mobile touch interaction requirements are mandatory
following our comprehensive audit that achieved 100% touch component coverage
and zero remaining multi-tap issues. All future development must follow these
established patterns to maintain the industry-leading mobile touch interaction
reliability we have achieved.

## 📋 VALIDATION & NAVIGATION STANDARDS

### 🔍 Database-Agnostic Validation Patterns

**CRITICAL**: Always validate based on business logic, not technical formats.

#### ✅ RECOMMENDED: Business-Logic Validation

```typescript
// Database-agnostic customer ID validation
const validateCustomerId = (
  customerId: unknown,
  customerName?: string
): boolean => {
  if (!customerId || !customerName?.trim()) {
    return false;
  }

  // Accept multiple ID formats from database
  const isValidId =
    (typeof customerId === 'string' &&
      customerId.length > 0 &&
      customerId !== 'undefined') ||
    (typeof customerId === 'number' && customerId > 0);

  return isValidId;
};
```

#### ❌ FORBIDDEN: Format-Specific Validation

```typescript
// Don't assume specific ID formats
if (!isValidUUID(customerId)) {
  throw new Error('Invalid customer ID');
}
```

### 🔍 Adaptive Schema Validation

#### ✅ RECOMMENDED: Business-Rule Schemas

```typescript
// Flexible schema accepting multiple ID formats
const customerSchema = z.object({
  customerId: z
    .union([
      z.string().uuid(), // UUID format
      z.string().min(1), // String format
      z.number().int().positive(), // Integer format
    ])
    .or(z.string().min(1, 'Customer ID is required'))
    .refine(id => {
      return String(id) !== 'undefined' && String(id).trim().length > 0;
    }, 'Invalid customer ID format'),
});
```

#### ❌ FORBIDDEN: Format-Enforced Schemas

```typescript
// Don't enforce specific formats without business justification
customerId: z.string().uuid('Invalid customer ID');
```

### 🧭 Safe Navigation Patterns

**CRITICAL**: Always validate API responses before navigation.

#### ✅ RECOMMENDED: Validated Navigation with Fallback

```typescript
const handleSafeNavigation = (response: ApiResponse, resourceType: string) => {
  // Comprehensive response logging for debugging
  console.log(`[${resourceType}] Navigation attempt:`, {
    success: response.success,
    data: response.data,
    id: response.data?.id,
    dataKeys: response.data ? Object.keys(response.data) : 'no data',
  });

  // Validate response structure
  const id = response.data?.id;
  if (!id) {
    throw new StandardError({
      message: `${resourceType} was created but no ID was returned.`,
      code: ErrorCodes.API.INVALID_RESPONSE,
      metadata: {
        component: 'NavigationHandler',
        operation: 'handleSafeNavigation',
        apiResponse: response,
      },
    });
  }

  // Safe navigation with fallback
  if (id && id !== 'undefined' && typeof id === 'string') {
    router.push(`/${resourceType.toLowerCase()}s/${id}`);
  } else {
    console.warn(`Invalid ${resourceType} ID, using fallback navigation`);
    router.push(`/${resourceType.toLowerCase()}s/manage`);
  }
};
```

#### ❌ FORBIDDEN: Direct Navigation Without Validation

```typescript
// Never navigate directly from API responses
router.push(`/proposals/${response.data.id}`);
```

### 🔧 Universal Error Processing

#### ✅ RECOMMENDED: Standardized Error Handling

```typescript
const processOperationError = (
  error: unknown,
  component: string,
  operation: string,
  userFriendlyMessage: string,
  metadata: Record<string, any> = {}
) => {
  // Always use ErrorHandlingService
  const standardError = errorHandlingService.processError(
    error,
    userFriendlyMessage,
    ErrorCodes.BUSINESS.PROCESS_FAILED,
    {
      component,
      operation,
      userStories: metadata.userStories || [],
      hypotheses: metadata.hypotheses || [],
      ...metadata,
    }
  );

  return standardError;
};
```

### 📋 PRE-IMPLEMENTATION VALIDATION CHECKLIST

Before implementing any validation logic:

- [ ] **Database Reality Check**: Verify actual ID formats in database
- [ ] **Business Logic First**: Design validation based on business requirements
- [ ] **Multiple Format Support**: Plan for UUID, string, and number ID formats
- [ ] **Edge Case Handling**: Account for `'undefined'` strings and empty values
- [ ] **Debugging Integration**: Add comprehensive logging for troubleshooting
- [ ] **Schema Alignment**: Ensure UI and backend validation are consistent
- [ ] **Error Standardization**: Use ErrorHandlingService for all error
      processing
- [ ] **Navigation Safety**: Plan safe navigation with fallback routes
- [ ] **Component Traceability**: Map to user stories and hypotheses
- [ ] **Real Data Testing**: Test with actual database data, not mock data

### 📋 NAVIGATION SAFETY CHECKLIST

Before implementing navigation logic:

- [ ] **Response Validation**: Validate API response structure before navigation
- [ ] **ID Validation**: Check for undefined, null, or invalid IDs
- [ ] **Fallback Routes**: Define meaningful fallback navigation paths
- [ ] **Response Logging**: Add comprehensive response structure logging
- [ ] **Error Integration**: Use StandardError for navigation failures
- [ ] **User Experience**: Prioritize UX over technical implementation details
- [ ] **Edge Case Testing**: Test with various API response scenarios
- [ ] **Type Safety**: Ensure proper TypeScript types for navigation data
- [ ] **Mobile Compatibility**: Verify navigation works on mobile devices
- [ ] **Analytics Integration**: Track navigation success/failure rates

### 📋 ERROR HANDLING CHECKLIST

For all error handling implementations:

- [ ] **ErrorHandlingService**: Use centralized error processing
- [ ] **StandardError**: Create StandardError instances with proper metadata
- [ ] **Error Codes**: Use appropriate ErrorCodes for categorization
- [ ] **User Messages**: Provide actionable, user-friendly error messages
- [ ] **Context Metadata**: Include component, operation, and business context
- [ ] **Component Traceability**: Map errors to user stories and hypotheses
- [ ] **Debugging Information**: Add sufficient context for troubleshooting
- [ ] **Analytics Integration**: Track error rates and resolution metrics
- [ ] **Security Considerations**: Avoid exposing sensitive data in error
      messages
- [ ] **Recovery Actions**: Provide clear next steps for users

## 📁 **FILE RESPONSIBILITY MATRIX** (Prevent Duplicates)

### Core Principle: Single Responsibility

**Never create files that duplicate existing functionality.** Each file should
have a clear, unique purpose that doesn't overlap with others.

### **Current File Responsibilities**

#### **Deployment & Build Scripts**

- **`scripts/deploy.sh`** ⭐ **PRIMARY DEPLOYMENT SCRIPT**
  - **Purpose**: Complete deployment orchestration (version bump, build, deploy,
    commit)
  - **Scope**: Production deployments with full workflow
  - **Usage**: `npm run deploy:alpha`, `npm run deploy:beta`, etc.

- **`scripts/deployment-info.js`** ⭐ **DEPLOYMENT INFORMATION**
  - **Purpose**: Display deployment history and current status
  - **Scope**: Information display only, no deployment actions
  - **Usage**: `npm run deployment:info`

- **`scripts/update-version-history.js`** ⭐ **VERSION DOCUMENTATION**
  - **Purpose**: Automated version history updates from git commits
  - **Scope**: Documentation generation only
  - **Usage**: Called automatically by pre-deployment hooks

#### **Development Scripts**

- **`scripts/dev-clean.sh`** ⭐ **DEVELOPMENT STARTUP**
  - **Purpose**: Health checks and smart development server startup
  - **Scope**: Local development environment only
  - **Usage**: `npm run dev:smart`

- **`scripts/demo-port-management.sh`** ⭐ **DEMO/TESTING**
  - **Purpose**: Demonstrate port management capabilities
  - **Scope**: Educational and testing purposes only
  - **Usage**: Manual execution for demonstrations

#### **Production Setup**

- **`scripts/setup-production.sh`** ⭐ **PRODUCTION ENVIRONMENT SETUP**
  - **Purpose**: One-time production environment configuration
  - **Scope**: Initial production setup, not regular deployments
  - **Usage**: `npm run production:setup`

#### **Configuration Files**

- **`package.json`** ⭐ **NPM SCRIPTS ORCHESTRATION**
  - **Purpose**: Define all npm commands and coordinate script execution
  - **Scope**: Script definitions and dependencies only
  - **Usage**: Central command registry

### **⚠️ DUPLICATE DETECTION CHECKLIST**

Before creating any new file, ask:

1. **Does this functionality already exist?**
   - Search existing scripts: `find scripts/ -name "*.sh" -o -name "*.js"`
   - Check package.json scripts: `npm run`
   - Review docs/CRITICAL_REFERENCE_DOCUMENTS.md

2. **Can I extend an existing file instead?**
   - Add functions to existing scripts
   - Use command-line arguments for variations
   - Create helper functions within existing files

3. **Is this truly unique functionality?**
   - Different enough to warrant separate file
   - Serves distinct user needs
   - Cannot be merged without complexity

4. **Will this create confusion?**
   - Similar names to existing files
   - Overlapping command structures
   - Unclear which script to use

### **🔧 REFACTORING STRATEGY**

When duplicates are found:

#### **Step 1: Identify Primary File**

- Most comprehensive functionality
- Better error handling and validation
- More recent and maintained
- Follows current standards

#### **Step 2: Migration Plan**

- Extract unique functionality from secondary files
- Integrate into primary file as options/flags
- Update all references and documentation
- Test thoroughly before removal

#### **Step 3: Cleanup Process**

- Archive old files in `docs/archive/deprecated-scripts/`
- Update package.json script references
- Update documentation and README files
- Notify team of changes

### **📋 CURRENT DUPLICATION ANALYSIS**

#### **Identified Duplications:**

1. **Version History Updates**
   - **Primary**: `scripts/update-version-history.js` (automated, comprehensive)
   - **Secondary**: Manual entries in `docs/VERSION_HISTORY.md`
   - **Resolution**: Keep automated script, remove manual entries

2. **Deployment Information**
   - **Primary**: `scripts/deployment-info.js` (comprehensive status)
   - **Secondary**: Scattered deployment info in various docs
   - **Resolution**: Centralize all deployment info in primary script

3. **Development Server Startup**
   - **Primary**: `scripts/dev-clean.sh` (comprehensive health checks)
   - **Secondary**: Basic `npm run dev` command
   - **Resolution**: Use dev-clean.sh as default via `npm run dev:smart`

### **🚀 PREVENTION GUIDELINES**

#### **Before Creating New Scripts:**

1. **Search Existing Functionality**

   ```bash
   # Search for similar scripts
   find scripts/ -type f -exec grep -l "keyword" {} \;

   # Check package.json scripts
   npm run | grep -i "keyword"

   # Search documentation
   grep -r "functionality" docs/
   ```

2. **Consult File Responsibility Matrix**
   - Check this section for existing responsibilities
   - Identify the correct file to extend
   - Follow established patterns

3. **Use Naming Conventions**
   - **Scripts**: `action-scope.sh` (e.g., `deploy-production.sh`)
   - **Node Scripts**: `action-scope.js` (e.g., `update-version.js`)
   - **Documentation**: `CATEGORY_PURPOSE.md` (e.g., `DEPLOYMENT_GUIDE.md`)

4. **Add to Package.json Properly**
   ```json
   {
     "scripts": {
       "category:action": "path/to/script",
       "category:action:variant": "path/to/script --variant"
     }
   }
   ```

#### **Documentation Requirements:**

1. **Update File Responsibility Matrix**
   - Add new file purpose and scope
   - Document relationship to existing files
   - Specify when to use vs alternatives

2. **Cross-Reference Updates**
   - Update PROJECT_REFERENCE.md
   - Add to CRITICAL_REFERENCE_DOCUMENTS.md if important
   - Update relevant guides and documentation

3. **Version History Entry**
   - Document new file creation
   - Explain why existing files weren't sufficient
   - Note any refactoring or consolidation

### **🎯 IMPLEMENTATION EXAMPLE**

#### **Correct Approach: Extending Existing Script**

```bash
# Instead of creating new-deployment-script.sh
# Extend existing deploy.sh with new options

./scripts/deploy.sh alpha --with-notifications --skip-tests
```

#### **Incorrect Approach: Creating Duplicate**

```bash
# DON'T create these:
# scripts/deploy-alpha.sh
# scripts/deploy-with-notifications.sh
# scripts/quick-deploy.sh
```

### **📊 MONITORING AND MAINTENANCE**

#### **Regular Audits**

- Monthly review of scripts/ directory
- Check for similar functionality across files
- Identify consolidation opportunities
- Update File Responsibility Matrix

#### **Quality Gates**

- Pre-commit hooks check for duplicate script names
- Code review process includes duplication check
- Documentation reviews validate file purposes

#### **Metrics to Track**

- Number of scripts in each category
- Script usage frequency (via analytics)
- User confusion reports about which script to use
- Time spent debugging script conflicts

### **🔗 INTEGRATION WITH EXISTING STANDARDS**

This File Responsibility Matrix integrates with:

- **TypeScript Standards**: Ensure scripts follow typing standards
- **Error Handling**: Use ErrorHandlingService patterns in Node scripts
- **Testing Standards**: Include test coverage for all scripts
- **Documentation Standards**: Maintain comprehensive documentation

### **📝 TEAM COMMUNICATION**

When creating or modifying scripts:

1. **Announce Intent**: Communicate planned script changes
2. **Review Process**: Include duplication check in code reviews
3. **Update Training**: Ensure team knows which scripts to use
4. **Feedback Loop**: Collect user feedback on script clarity

---

## 🚀 **FUTURE DEVELOPMENT STANDARDS**

### **🎯 TypeScript Excellence Standards**

#### **Mandatory Type Safety**

```typescript
// ✅ CORRECT: Strict typing
interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
}

// ❌ FORBIDDEN: Any types
const user: any = getUser(); // NEVER use 'any'
const data = response.data; // Always type response data
```

#### **Required Patterns**

1. **Interface-First Development**

   ```typescript
   // Define interfaces before implementation
   interface ComponentProps {
     data: DataType;
     onAction: (id: string) => void;
     isLoading?: boolean;
   }
   ```

2. **Generic Type Usage**

   ```typescript
   // Use generics for reusable components
   interface ApiResponse<T> {
     data: T;
     success: boolean;
     message?: string;
   }
   ```

3. **Strict Error Handling**
   ```typescript
   // Use ErrorHandlingService for all errors
   try {
     const result = await apiCall();
     return result;
   } catch (error) {
     errorHandlingService.processError(error, 'API call failed');
     throw new StandardError('API_ERROR', 'Request failed');
   }
   ```

### **🔧 Error Handling Standards**

#### **Mandatory ErrorHandlingService Usage**

```typescript
// ✅ REQUIRED: Use standardized error handling
import { ErrorHandlingService, StandardError, ErrorCodes } from '@/lib/errors';

const errorHandlingService = ErrorHandlingService.getInstance();

try {
  // Your code here
} catch (error) {
  const standardError = errorHandlingService.processError(error, {
    component: 'ComponentName',
    operation: 'operationName',
    context: 'additional context',
  });

  // User-friendly message
  const userMessage =
    errorHandlingService.getUserFriendlyMessage(standardError);
}
```

#### **Forbidden Practices**

```typescript
// ❌ NEVER: Direct console.error
console.error('Something went wrong', error);

// ❌ NEVER: Custom error handling
throw new Error('Custom error message');

// ❌ NEVER: Ignore errors
try {
  riskyOperation();
} catch (error) {
  // Empty catch block
}
```

### **🧪 Testing Standards**

#### **Component Testing Requirements**

```typescript
// ✅ REQUIRED: Test all components
describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<Component data={mockData} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle errors gracefully', () => {
    // Test error scenarios
  });

  it('should be accessible', () => {
    // Test accessibility compliance
  });
});
```

#### **Integration Testing**

```typescript
// ✅ REQUIRED: Test API integrations
describe('API Integration', () => {
  it('should handle successful responses', async () => {
    // Test success scenarios
  });

  it('should handle error responses', async () => {
    // Test error scenarios
  });
});
```

### **♿ Accessibility Standards**

#### **WCAG 2.1 AA Compliance**

```typescript
// ✅ REQUIRED: Accessible components
<button
  aria-label="Close dialog"
  aria-describedby="dialog-description"
  onClick={handleClose}
>
  <XIcon aria-hidden="true" />
</button>
```

#### **Required Accessibility Features**

1. **Semantic HTML**: Use proper HTML elements
2. **ARIA Attributes**: Include appropriate ARIA labels
3. **Keyboard Navigation**: Full keyboard support
4. **Screen Reader Support**: Proper focus management
5. **Color Contrast**: 4.5:1 minimum ratio

### **📊 Performance Standards**

#### **Bundle Size Limits**

```javascript
// ✅ REQUIRED: Performance budgets
module.exports = {
  performance: {
    maxAssetSize: 250000, // 250KB
    maxEntrypointSize: 400000, // 400KB
    hints: 'warning',
  },
};
```

#### **Component Performance**

```typescript
// ✅ REQUIRED: Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Component logic
});

// ✅ REQUIRED: Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handler logic
}, [dependencies]);
```

### **🔒 Security Standards**

#### **Input Validation**

```typescript
// ✅ REQUIRED: Validate all inputs
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const validatedData = userSchema.parse(inputData);
```

#### **Authentication Requirements**

```typescript
// ✅ REQUIRED: Check authentication
const ProtectedComponent = () => {
  const { data: session } = useSession();

  if (!session) {
    return <UnauthorizedMessage />;
  }

  return <ProtectedContent />;
};
```

### **📝 Documentation Standards**

#### **Component Documentation**

```typescript
/**
 * UserProfile Component
 *
 * Displays user profile information with editing capabilities.
 *
 * @param {UserProfileProps} props - Component props
 * @param {User} props.user - User data to display
 * @param {Function} props.onEdit - Edit handler
 * @param {boolean} props.isLoading - Loading state
 *
 * @example
 * <UserProfile
 *   user={userData}
 *   onEdit={handleEdit}
 *   isLoading={false}
 * />
 */
```

#### **API Documentation**

```typescript
/**
 * GET /api/users
 *
 * Retrieves a list of users with optional filtering.
 *
 * @param {string} page - Page number (default: 1)
 * @param {string} limit - Items per page (default: 50)
 * @param {string} search - Search term
 *
 * @returns {ApiResponse<User[]>} List of users
 *
 * @throws {401} Unauthorized - Invalid session
 * @throws {403} Forbidden - Insufficient permissions
 */
```

### **🎯 Quality Gates**

#### **Pre-Commit Requirements**

1. **TypeScript**: `npm run type-check` must pass
2. **Linting**: `npm run lint` must pass
3. **Testing**: `npm run test` must pass
4. **Build**: `npm run build` must succeed
5. **Documentation**: All new features must be documented

#### **Code Review Checklist**

- [ ] TypeScript strict mode compliance
- [ ] Error handling using ErrorHandlingService
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Performance considerations
- [ ] Security validation
- [ ] Test coverage
- [ ] Documentation updates

### **📈 Monitoring and Metrics**

#### **Required Metrics**

1. **TypeScript Errors**: Zero errors in production
2. **Build Success Rate**: 100% successful builds
3. **Test Coverage**: >80% coverage
4. **Performance**: <2s page load times
5. **Accessibility**: 100% WCAG compliance

#### **Quality Assurance**

- Automated testing on all pull requests
- Performance monitoring in production
- Regular accessibility audits
- Security vulnerability scanning
- Code quality metrics tracking
