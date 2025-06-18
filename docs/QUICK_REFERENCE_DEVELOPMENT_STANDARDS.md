# Quick Reference: Development Standards Checklist

## 🚀 **Before You Code**

```bash
# Required pre-development checks
npm run type-check    # Must return 0 errors
npm run lint         # Must be clean
npm run quality:check # All checks pass
```

## ⚡ **TypeScript Essentials**

### ✅ **DO**

```typescript
// Explicit interfaces
interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// Proper generics
function processData<T extends BaseEntity>(data: T): Result<T>;

// Safe property access
const name = user.profile?.name;
```

### ❌ **DON'T**

```typescript
const data: any = response; // NEVER use any
const user = data as User; // Unsafe casting
function process(input: any): any; // No any types
```

## 🚨 **Error Handling Pattern**

```typescript
import { useErrorHandling } from '@/hooks/useErrorHandling';

function Component() {
  const { handleAsyncError } = useErrorHandling();

  const handleAction = async () => {
    try {
      const result = await apiCall();
      // Handle success
    } catch (error) {
      handleAsyncError(error, {
        context: 'Component.handleAction',
        userMessage: 'User-friendly message',
        retryable: true,
      });
    }
  };
}
```

## 📋 **Component Template**

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
  // Analytics tracking
  // WCAG 2.1 AA compliance

  return <div>Content</div>;
}
```

## 🧪 **Testing Checklist**

```typescript
// Mock error handling
jest.mock('@/hooks/useErrorHandling', () => ({
  useErrorHandling: () => ({
    handleAsyncError: jest.fn(),
    clearError: jest.fn(),
  }),
}));

// Test error scenarios
it('handles errors properly', async () => {
  // Test error handling implementation
});
```

## ✅ **Pre-Commit Validation**

- [ ] `npm run type-check` → 0 errors
- [ ] `npm run lint` → passes
- [ ] `npm run test` → all pass
- [ ] Error handling → standardized patterns
- [ ] Component Traceability Matrix → implemented
- [ ] WCAG 2.1 AA → compliant
- [ ] Documentation → updated

## 📚 **Quick Links**

- **Error Handling**: `src/lib/errors/index.ts`
- **Component Patterns**: `src/components/`
- **Hook Patterns**: `src/hooks/`
- **Type Definitions**: `src/types/`
- **Testing Utils**: `src/test/utils/testUtils.ts`
- **Full Guide**: `docs/FUTURE_DEVELOPMENT_STANDARDS.md`

---

**🎯 Keep this checklist handy to maintain our 100% TypeScript compliance!**
