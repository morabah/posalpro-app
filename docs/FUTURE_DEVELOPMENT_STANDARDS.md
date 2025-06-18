# Future Development Standards for PosalPro MVP2

## 🎯 **Purpose**

This document ensures all future features maintain the **100% TypeScript
compliance** and **standardized error handling** achieved in our historic type
safety implementation. Following these standards prevents technical debt and
eliminates the need for future type safety cleanup phases.

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
