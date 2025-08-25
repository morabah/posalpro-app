# Bridge Pattern Templates Migration Guide

This comprehensive guide provides step-by-step instructions for migrating to the
Bridge Pattern using the provided templates, with testing-based success
validation.

## Complete Migration Workflow

### Phase 1: Pre-Migration Assessment

**Step 1.1: Identify Migration Target**

```bash
# Analyze existing component/page for bridge migration
# Example: src/components/CustomerList.tsx → Bridge Pattern

# Run compliance check on current implementation
node scripts/verify-all-bridge-compliance.js src/components/CustomerList.tsx
```

**Step 1.2: Plan Template Combination**

- ✅ API Bridge (required for data layer)
- ✅ Management Bridge (required for state management)
- ✅ Bridge Hook (optional, for complex operations)
- ✅ Bridge Component (required for UI)
- ✅ Bridge Page (required for full-page implementations)

### Phase 2: Implementation

**Step 2.1: Create API Bridge**

```bash
# Copy and customize the API bridge template
cp templates/design-patterns/bridge/api-bridge.template.ts src/lib/bridges/CustomerApiBridge.ts

# Replace placeholders:
# __BRIDGE_NAME__ → CustomerManagement
# __ENTITY_TYPE__ → Customer
# __RESOURCE_NAME__ → customers
# __USER_STORY__ → US-3.1
# __HYPOTHESIS__ → H4
```

**✅ Success Test**: API Bridge validation

```bash
node scripts/verify-all-bridge-compliance.js src/lib/bridges/CustomerApiBridge.ts
# Expected: >90% compliance score
```

**Step 2.2: Create Management Bridge**

```bash
# Copy and customize the management bridge template
cp templates/design-patterns/bridge/management-bridge.template.tsx src/components/bridges/CustomerManagementBridge.tsx

# Replace same placeholders as above
```

**✅ Success Test**: Management Bridge validation

```bash
node scripts/verify-all-bridge-compliance.js src/components/bridges/CustomerManagementBridge.tsx
# Expected: >90% compliance score
# Test provider context works
npm test -- --testNamePattern="CustomerManagementBridge"
```

**Step 2.3: Create Bridge Hook (Optional)**

```bash
# Copy and customize the bridge hook template
cp templates/design-patterns/bridge/bridge-hook.template.ts src/hooks/useCustomer.ts

# Replace placeholders as above
```

**✅ Success Test**: Hook validation

```bash
node scripts/verify-all-bridge-compliance.js src/hooks/useCustomer.ts
# Expected: >85% compliance score
# Test hook functionality
npm test -- --testNamePattern="useCustomer"
```

**Step 2.4: Create Bridge Component**

```bash
# Copy and customize the component template
cp templates/design-patterns/bridge/bridge-component.template.tsx src/components/CustomerList.tsx

# Replace placeholders:
# __COMPONENT_NAME__ → CustomerList
# Plus same bridge placeholders as above
```

**✅ Success Test**: Component validation

```bash
node scripts/verify-all-bridge-compliance.js src/components/CustomerList.tsx
# Expected: >90% compliance score
# Test component renders correctly
npm test -- --testNamePattern="CustomerList"
```

**Step 2.5: Create Bridge Page**

```bash
# Copy and customize the page template
cp templates/design-patterns/bridge/bridge-page.template.tsx src/app/(dashboard)/customers/page.tsx

# Replace placeholders:
# __PAGE_NAME__ → Customer
# __ROUTE_PATH__ → customers
# Plus same placeholders as above
```

**✅ Success Test**: Page validation

```bash
node scripts/verify-all-bridge-compliance.js src/app/\(dashboard\)/customers/page.tsx
# Expected: >85% compliance score
# Test page loads correctly
npm test -- --testNamePattern="CustomerPage"
```

### Phase 3: Integration Testing

**Step 3.1: End-to-End Bridge Integration**

```bash
# Test complete bridge flow
npm test -- --testNamePattern="Customer.*integration"

# Run full compliance check on all bridge files
node scripts/verify-all-bridge-compliance.js
```

**Step 3.2: Performance Validation**

```bash
# Test performance metrics
npm run test:performance -- --component=CustomerList

# Validate caching works
# Check Network tab: should see cache hits after first load
```

**Step 3.3: Accessibility Testing**

```bash
# Run accessibility tests
npm run test:a11y -- --component=CustomerList

# Manual test with screen reader
# Verify ARIA labels and keyboard navigation
```

### Phase 4: Migration Success Checklist

**✅ Code Quality Checklist**

- [ ] All bridge files pass >90% compliance score
- [ ] No TypeScript errors or warnings
- [ ] All tests pass (unit, integration, e2e)
- [ ] ESLint passes with no errors
- [ ] Prettier formatting applied

**✅ Functionality Checklist**

- [ ] CRUD operations work correctly
- [ ] Loading states display properly
- [ ] Error handling shows user-friendly messages
- [ ] Caching reduces API calls (check Network tab)
- [ ] Analytics events fire correctly

**✅ Performance Checklist**

- [ ] Initial page load < 2 seconds
- [ ] Component renders < 100ms after data load
- [ ] Memory usage stable (no leaks)
- [ ] Bundle size impact < 50KB

**✅ Accessibility Checklist**

- [ ] Screen reader announces content correctly
- [ ] Keyboard navigation works completely
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Touch targets ≥ 44px on mobile

**✅ Security Checklist**

- [ ] RBAC validation enforced
- [ ] API permissions checked
- [ ] No sensitive data in logs
- [ ] Security audit events logged

**✅ Mobile Checklist**

- [ ] Responsive design works on all breakpoints
- [ ] Touch interactions work properly
- [ ] Performance acceptable on mobile devices
- [ ] Offline handling graceful

### Phase 5: Deployment Validation

**Step 5.1: Pre-Deployment Tests**

```bash
# Run full test suite
npm run test:all

# Build and verify no errors
npm run build

# Run production compliance check
NODE_ENV=production node scripts/verify-all-bridge-compliance.js
```

**Step 5.2: Staging Environment Tests**

```bash
# Deploy to staging
npm run deploy:staging

# Run smoke tests
npm run test:smoke -- --env=staging

# Performance testing
npm run test:lighthouse -- --url=https://staging.posalpro.com/customers
```

**Step 5.3: Production Readiness**

- [ ] All staging tests pass
- [ ] Performance metrics meet targets
- [ ] Error monitoring configured
- [ ] Analytics tracking verified
- [ ] Rollback plan prepared

## Real Example Implementation

### Example: Customer Management Bridge

**Step 1: API Bridge** (`src/lib/bridges/CustomerApiBridge.ts`)

```typescript
// Replace placeholders:
// __BRIDGE_NAME__ → CustomerManagement
// __ENTITY_TYPE__ → Customer
// __RESOURCE_NAME__ → customers
// __USER_STORY__ → US-3.1
// __HYPOTHESIS__ → H4

export interface Customer {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export class CustomerManagementApiBridge {
  // ... implementation follows template
}

export function useCustomerManagementApiBridge() {
  // ... hook implementation follows template
}
```

**Step 2: Management Bridge**
(`src/components/bridges/CustomerManagementBridge.tsx`)

```typescript
export function CustomerManagementBridge({
  children,
}: {
  children: React.ReactNode;
}) {
  // ... implementation follows template with Customer types
}

export function useCustomerBridge() {
  // ... hook follows template
}
```

**Step 3: Component** (`src/components/CustomerList.tsx`)

```typescript
export function CustomerList() {
  const bridge = useCustomerBridge();
  // ... implementation follows template with Customer-specific logic
}
```

**Step 4: Page** (`src/app/(dashboard)/customers/page.tsx`)

```typescript
export default async function CustomerPage() {
  return (
    <CustomerManagementBridge>
      <CustomerList />
    </CustomerManagementBridge>
  );
}
```

## Migration from Existing Components

### Before (Direct API calls)

```typescript
function CustomerList() {
  const apiClient = useApiClient();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    apiClient.get('/customers').then(response => {
      setCustomers(response.data);
    });
  }, []);

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}
```

### After (Bridge Pattern)

```typescript
function CustomerList() {
  const bridge = useCustomerBridge();

  const { data: customers, loading, error } = useCustomerList({
    params: { fields: 'id,name,email,status' }
  });

  if (error) return <ErrorDisplay error={error} />;
  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {customers.map(customer => (
        <div key={customer.id}>{customer.name}</div>
      ))}
    </div>
  );
}

// Wrap in page:
export default function CustomerPage() {
  return (
    <CustomerManagementBridge>
      <CustomerList />
    </CustomerManagementBridge>
  );
}
```

## Template Placeholder Reference

| Placeholder           | Example              | Description            |
| --------------------- | -------------------- | ---------------------- |
| `__BRIDGE_NAME__`     | `CustomerManagement` | Main bridge identifier |
| `__API_BRIDGE_NAME__` | `CustomerApi`        | API service name       |
| `__RESOURCE_NAME__`   | `customers`          | API resource path      |
| `__ENTITY_TYPE__`     | `Customer`           | TypeScript entity type |
| `__COMPONENT_NAME__`  | `CustomerList`       | React component name   |
| `__PAGE_NAME__`       | `Customer`           | Page identifier        |
| `__ROUTE_PATH__`      | `customers`          | URL route path         |
| `__USER_STORY__`      | `US-3.1`             | User story reference   |
| `__HYPOTHESIS__`      | `H4`                 | Hypothesis reference   |

## Best Practices

### 1. Naming Conventions

- **API Bridge**: `{Entity}ApiBridge` (e.g., `CustomerApiBridge`)
- **Management Bridge**: `{Entity}ManagementBridge` (e.g.,
  `CustomerManagementBridge`)
- **Hook**: `use{Entity}` (e.g., `useCustomer`)
- **Component**: `{Entity}List`, `{Entity}Form` (e.g., `CustomerList`)

### 2. File Organization

```
src/
├── lib/bridges/
│   ├── CustomerApiBridge.ts
│   ├── ProductApiBridge.ts
│   └── index.ts
├── components/bridges/
│   ├── CustomerManagementBridge.tsx
│   ├── ProductManagementBridge.tsx
│   └── index.ts
├── hooks/
│   ├── useCustomer.ts
│   ├── useProduct.ts
│   └── index.ts
└── app/(dashboard)/
    ├── customers/
    │   └── page.tsx
    └── products/
        └── page.tsx
```

### 3. Performance Optimization

- Use minimal fields in API requests: `fields: 'id,name,status'`
- Implement proper caching with TTL: `cacheTTL: 5 * 60 * 1000`
- Limit results per CORE_REQUIREMENTS: `limit: Math.min(params.limit, 50)`
- Enable request deduplication for concurrent calls

### 4. Error Handling

- Always use `ErrorHandlingService.processError()`
- Provide user-friendly error messages
- Log errors with proper metadata
- Track analytics for error events

### 5. Analytics Integration

- Include `userStory` and `hypothesis` in all events
- Track performance metrics (load times, cache hit rates)
- Monitor user interactions and success rates
- Use proper priority levels: `'low' | 'medium' | 'high'`

## Comprehensive Testing Strategy

### Unit Tests (Required for Migration Success)

**API Bridge Tests**

```typescript
import { CustomerManagementApiBridge } from '@/lib/bridges/CustomerApiBridge';

describe('CustomerManagementApiBridge', () => {
  test('singleton pattern works correctly', () => {
    const bridge1 = CustomerManagementApiBridge.getInstance();
    const bridge2 = CustomerManagementApiBridge.getInstance();
    expect(bridge1).toBe(bridge2);
  });

  test('CRUD operations have correct signatures', () => {
    const bridge = CustomerManagementApiBridge.getInstance();
    expect(typeof bridge.fetchCustomers).toBe('function');
    expect(typeof bridge.createCustomer).toBe('function');
    expect(typeof bridge.updateCustomer).toBe('function');
    expect(typeof bridge.deleteCustomer).toBe('function');
  });

  test('error handling processes correctly', async () => {
    const bridge = CustomerManagementApiBridge.getInstance();
    // Mock API error
    jest
      .spyOn(bridge, 'fetchCustomers')
      .mockRejectedValue(new Error('API Error'));

    await expect(bridge.fetchCustomers()).rejects.toThrow('API Error');
    // Verify ErrorHandlingService was called
  });
});
```

**Management Bridge Tests**

```typescript
import { renderHook } from '@testing-library/react';
import { useCustomerBridge } from '@/components/bridges/CustomerManagementBridge';

test('useCustomerBridge hook works correctly', async () => {
  const wrapper = ({ children }) => (
    <CustomerManagementBridge>{children}</CustomerManagementBridge>
  );

  const { result } = renderHook(() => useCustomerBridge(), { wrapper });

  expect(result.current.state.loading).toBe(false);
  expect(result.current.fetch).toBeDefined();
  expect(result.current.create).toBeDefined();
  expect(result.current.update).toBeDefined();
  expect(result.current.delete).toBeDefined();
});

test('bridge context throws error when used outside provider', () => {
  expect(() => {
    renderHook(() => useCustomerBridge());
  }).toThrow('useCustomerBridge must be used within CustomerManagementBridge');
});
```

**Component Tests**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerList } from '@/components/CustomerList';
import { CustomerManagementBridge } from '@/components/bridges/CustomerManagementBridge';

test('CustomerList renders customers from bridge', async () => {
  render(
    <CustomerManagementBridge>
      <CustomerList />
    </CustomerManagementBridge>
  );

  expect(await screen.findByText('Customer List')).toBeInTheDocument();
  expect(screen.getByTestId('customer-list')).toBeInTheDocument();
});

test('CustomerList handles loading states', async () => {
  render(
    <CustomerManagementBridge>
      <CustomerList />
    </CustomerManagementBridge>
  );

  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});

test('CustomerList handles error states', async () => {
  // Mock API error
  render(
    <CustomerManagementBridge>
      <CustomerList />
    </CustomerManagementBridge>
  );

  await waitFor(() => {
    expect(screen.getByTestId('error-display')).toBeInTheDocument();
  });
});
```

### Integration Tests (Critical for Migration Validation)

**Full Bridge Flow Tests**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerPage } from '@/app/(dashboard)/customers/page';

describe('Customer Bridge Integration', () => {
  test('complete CRUD flow works end-to-end', async () => {
    render(<CustomerPage />);

    // Test list loads
    await waitFor(() => {
      expect(screen.getByTestId('customer-list')).toBeInTheDocument();
    });

    // Test create
    fireEvent.click(screen.getByTestId('create-customer-button'));
    fireEvent.change(screen.getByTestId('customer-name-input'), {
      target: { value: 'Test Customer' }
    });
    fireEvent.click(screen.getByTestId('save-customer-button'));

    await waitFor(() => {
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });

    // Test update
    fireEvent.click(screen.getByTestId('edit-customer-button'));
    fireEvent.change(screen.getByTestId('customer-name-input'), {
      target: { value: 'Updated Customer' }
    });
    fireEvent.click(screen.getByTestId('save-customer-button'));

    await waitFor(() => {
      expect(screen.getByText('Updated Customer')).toBeInTheDocument();
    });

    // Test delete
    fireEvent.click(screen.getByTestId('delete-customer-button'));
    fireEvent.click(screen.getByTestId('confirm-delete-button'));

    await waitFor(() => {
      expect(screen.queryByText('Updated Customer')).not.toBeInTheDocument();
    });
  });

  test('caching works correctly', async () => {
    const apiSpy = jest.spyOn(CustomerManagementApiBridge.getInstance(), 'fetchCustomers');

    render(<CustomerPage />);

    await waitFor(() => {
      expect(screen.getByTestId('customer-list')).toBeInTheDocument();
    });

    expect(apiSpy).toHaveBeenCalledTimes(1);

    // Navigate away and back - should use cache
    // ... navigation logic ...

    expect(apiSpy).toHaveBeenCalledTimes(1); // Still only called once due to caching
  });
});
```

### Performance Tests (Migration Success Criteria)

```typescript
import { render, screen } from '@testing-library/react';
import { CustomerList } from '@/components/CustomerList';

describe('Customer Bridge Performance', () => {
  test('component renders within performance budget', async () => {
    const startTime = performance.now();

    render(
      <CustomerManagementBridge>
        <CustomerList />
      </CustomerManagementBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId('customer-list')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(100); // 100ms budget
  });

  test('memory usage remains stable', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;

    const { unmount } = render(
      <CustomerManagementBridge>
        <CustomerList />
      </CustomerManagementBridge>
    );

    await waitFor(() => {
      expect(screen.getByTestId('customer-list')).toBeInTheDocument();
    });

    unmount();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = performance.memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
  });
});
```

### Accessibility Tests (WCAG 2.1 AA Compliance)

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CustomerList } from '@/components/CustomerList';

expect.extend(toHaveNoViolations);

test('CustomerList meets accessibility standards', async () => {
  const { container } = render(
    <CustomerManagementBridge>
      <CustomerList />
    </CustomerManagementBridge>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('keyboard navigation works correctly', async () => {
  render(
    <CustomerManagementBridge>
      <CustomerList />
    </CustomerManagementBridge>
  );

  const firstButton = screen.getByTestId('create-customer-button');
  firstButton.focus();

  expect(document.activeElement).toBe(firstButton);

  // Test Tab navigation
  fireEvent.keyDown(firstButton, { key: 'Tab' });

  const nextElement = screen.getByTestId('customer-search-input');
  expect(document.activeElement).toBe(nextElement);
});
```

## Troubleshooting

### Common Issues

1. **Provider Not Found Error**

   ```
   Error: useCustomerBridge must be used within CustomerManagementBridge
   ```

   **Solution**: Ensure component is wrapped with the Management Bridge
   provider.

2. **API Bridge Not Initialized**

   ```
   TypeError: Cannot read property 'fetchCustomers' of undefined
   ```

   **Solution**: Check that `useCustomerApiBridge()` is called correctly.

3. **Cache Not Working** **Solution**: Verify `enableCache: true` in bridge
   config and check TTL settings.

4. **TypeScript Errors** **Solution**: Ensure all placeholders are replaced and
   types are correctly imported.

### Debugging Tips

1. **Enable Debug Logging**

   ```typescript
   const bridge = useCustomerApiBridge({
     enableCache: true,
     // Add debug logging
   });
   ```

2. **Check Network Requests**
   - Open DevTools Network tab
   - Look for API calls to `/customers`
   - Verify request/response structure

3. **Verify Provider Hierarchy**

   ```tsx
   <CustomerManagementBridge>
     <CustomerList /> {/* ✅ Correct */}
   </CustomerManagementBridge>

   <CustomerList /> {/* ❌ Will fail */}
   ```

## Advanced Usage

### Multiple Entity Types

```typescript
// For complex pages with multiple entities
<CustomerManagementBridge>
  <ProductManagementBridge>
    <CustomerProductView />
  </ProductManagementBridge>
</CustomerManagementBridge>
```

### Custom Bridge Configuration

```typescript
const bridge = useCustomerApiBridge({
  enableCache: true,
  retryAttempts: 5,
  timeout: 20000,
  cacheTTL: 10 * 60 * 1000, // 10 minutes
});
```

### Real-time Updates

```typescript
function CustomerList() {
  const bridge = useCustomerBridge();

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      bridge.refreshCustomers();
    }, 30000);

    return () => clearInterval(interval);
  }, [bridge]);
}
```




