# Bridge Migration Instructions - Complete Guide

## Overview

This document provides comprehensive instructions for migrating components to
use the bridge pattern architecture in PosalPro MVP2. The bridge pattern
provides centralized state management, error handling, and analytics tracking.

## 🚨 CRITICAL: BRIDGE PATTERN BEST PRACTICES

### Common Problems

React components using bridge patterns can experience issues when:

**Infinite Loop Issues:**

- useEffect dependencies include unstable functions
- Bridge calls are made directly during render cycles
- Event subscriptions trigger state updates that cause re-renders
- Auto-refresh mechanisms create circular dependencies

**Filter/Search Issues:**

- Parameter precedence is wrong in bridge fetch methods
- State filters override passed parameters
- Search parameters get converted to empty strings
- Debug logging is insufficient to trace parameter flow

**API Response Structure Issues:**

- Frontend TypeScript interfaces don't match actual API response structure
- Navigation logic expects flat response but API returns nested objects
- Form submission handlers use incorrect response data access patterns

### The Solution: Seven Critical Patterns

#### 1. ✅ useEffect with Empty Dependency Arrays

**Pattern**: Use empty dependency arrays for mount-only effects

```typescript
// ✅ CORRECT: Empty dependency array
useEffect(() => {
  // Mount-only logic
  loadData();
}, []); // CRITICAL: Empty dependency array to prevent infinite loops

// ❌ WRONG: Unstable dependencies
useEffect(() => {
  loadData();
}, [loadData]); // Causes infinite loops!
```

**When to Use**:

- Data fetching on component mount
- Event subscriptions
- Auto-refresh setup
- One-time initialization

#### 2. ✅ setTimeout Pattern for Bridge Calls

**Pattern**: Defer bridge calls using setTimeout

```typescript
// ✅ CORRECT: Deferred bridge calls
const setFilters = useCallback(filters => {
  setTimeout(() => {
    stateBridge.setFilters(filters);
    analytics('filters_changed', data);
  }, 0);
}, []);

// ❌ WRONG: Direct bridge calls
const setFilters = useCallback(
  filters => {
    stateBridge.setFilters(filters); // Causes infinite loops!
  },
  [stateBridge]
);
```

**When to Use**:

- All bridge.set\* method calls
- Analytics tracking calls
- State updates that might trigger re-renders
- Event handler responses

#### 3. ✅ Event Subscription Safety

**Pattern**: Safe event subscription with cleanup

```typescript
// ✅ CORRECT: Safe event subscription
useEffect(() => {
  const listener = eventBridge.subscribe('DATA_REFRESHED', payload => {
    setTimeout(() => {
      refreshData();
    }, 0);
  });

  return () => {
    eventBridge.unsubscribe('DATA_REFRESHED', listener);
  };
}, []); // Empty dependency array

// ❌ WRONG: Unsafe event subscription
useEffect(() => {
  const listener = eventBridge.subscribe('DATA_REFRESHED', refreshData);
  return () => eventBridge.unsubscribe('DATA_REFRESHED', listener);
}, [refreshData]); // Causes infinite loops!
```

#### 4. ✅ Auto-refresh Safety

**Pattern**: Safe auto-refresh implementation

```typescript
// ✅ CORRECT: Safe auto-refresh
useEffect(() => {
  if (!autoRefresh) return;

  const interval = setInterval(() => {
    setTimeout(() => {
      refreshData();
    }, 0);
  }, refreshInterval);

  return () => clearInterval(interval);
}, []); // Empty dependency array

// ❌ WRONG: Unsafe auto-refresh
useEffect(() => {
  if (!autoRefresh) return;

  const interval = setInterval(refreshData, refreshInterval);
  return () => clearInterval(interval);
}, [autoRefresh, refreshInterval, refreshData]); // Causes infinite loops!
```

#### 5. ✅ State Update Safety

**Pattern**: Defer state updates that might cause loops

```typescript
// ✅ CORRECT: Deferred state updates
const updateState = useCallback(newData => {
  setTimeout(() => {
    setState(prev => ({ ...prev, ...newData }));
    analytics('state_updated', { data: newData });
  }, 0);
}, []);

// ❌ WRONG: Direct state updates
const updateState = useCallback(
  newData => {
    setState(prev => ({ ...prev, ...newData }));
    analytics('state_updated', { data: newData });
  },
  [analytics]
); // Causes infinite loops!
```

#### 6. ✅ Parameter Precedence in Bridge Fetch Methods

**Pattern**: Ensure passed parameters override default state filters

```typescript
// ✅ CORRECT: Passed params override state filters
const fetchCustomers = useCallback(
  async (params?: CustomerFetchParams) => {
    const fetchParams = {
      ...state.filters, // Default filters from state
      ...params, // Override with passed parameters
      fields: 'id,name,status,updatedAt',
    };

    const result = await apiBridge.fetchCustomers(fetchParams);
  },
  [apiBridge, state.filters]
);

// ❌ WRONG: State filters override passed params
const fetchCustomers = useCallback(
  async (params?: CustomerFetchParams) => {
    const fetchParams = {
      ...params, // Passed parameters
      ...state.filters, // Override with state filters (breaks search!)
      fields: 'id,name,status,updatedAt',
    };

    const result = await apiBridge.fetchCustomers(fetchParams);
  },
  [apiBridge, state.filters]
);
```

**Why This Matters**:

- Components passing search/filter parameters expect them to be used
- State filters should be defaults, not overrides
- Search functionality breaks when parameters are overridden
- Direct API calls from components should take precedence

#### 7. ✅ API Response Structure Validation

**Pattern**: Ensure TypeScript interfaces match actual API response structure

```typescript
// ❌ WRONG: Assuming flat response structure
interface CustomerResponse {
  id: string;
  name: string;
  email: string;
}

// Navigation code expecting flat structure
router.push(`/customers/${response.data!.id}`); // ❌ Fails: data.id is undefined

// ✅ CORRECT: Match actual API response structure
interface CustomerResponse {
  customer: {
    // API returns nested object
    id: string;
    name: string;
    email: string;
  };
}

// Navigation code using correct structure
router.push(`/customers/${response.data!.customer.id}`); // ✅ Works correctly
```

**When to Use**:

- Before implementing form submission handlers
- When setting up navigation after API calls
- During TypeScript interface definition
- When debugging "undefined" navigation issues

**Common API Response Patterns**:

```typescript
// Create operations typically return:
{
  success: boolean,
  message: string,
  data: {
    [entityName]: Entity  // Nested under entity name
  }
}

// List operations typically return:
{
  success: boolean,
  data: {
    [entityName + 's']: Entity[],  // Nested under plural entity name
    pagination: { ... }
  }
}
```

### Implementation Checklist

When implementing bridge patterns, ensure:

- [ ] All useEffect hooks use empty dependency arrays for mount-only effects
- [ ] All bridge.set\* calls are wrapped in setTimeout
- [ ] All analytics calls are deferred when in callbacks
- [ ] Event subscriptions are properly cleaned up
- [ ] Auto-refresh mechanisms use empty dependency arrays
- [ ] State updates that might trigger re-renders are deferred
- [ ] Parameter precedence is correct in bridge fetch methods
- [ ] TypeScript interfaces match actual API response structures

### Common Pitfalls to Avoid

1. **Including unstable functions in useEffect dependencies**
2. **Making direct bridge calls during render cycles**
3. **Forgetting to clean up event subscriptions**
4. **Including refresh functions in auto-refresh dependencies**
5. **Making analytics calls directly in state update callbacks**
6. **Wrong parameter precedence in bridge fetch methods** - Always use
   `...state.filters, ...params` order
7. **Mismatched API response interfaces** - Always validate TypeScript
   interfaces against actual API responses

### Debugging Issues

#### Infinite Loops

If you encounter infinite loops:

1. Check useEffect dependency arrays - should be empty for mount-only effects
2. Look for direct bridge calls in render cycles
3. Verify event subscriptions are properly cleaned up
4. Check auto-refresh mechanisms for circular dependencies
5. Ensure analytics calls are deferred when needed

#### Filter/Search Not Working

If filters or search parameters aren't working:

1. **Check parameter precedence** in bridge fetch methods:

   ```typescript
   // ✅ CORRECT
   const fetchParams = { ...state.filters, ...params };

   // ❌ WRONG
   const fetchParams = { ...params, ...state.filters };
   ```

2. **Add debug logging** to trace parameter flow:

   ```typescript
   logDebug('Bridge: Sending params', { params, state: state.filters });
   ```

3. **Verify API calls** include expected parameters in network tab

4. **Check for empty string conversion** - ensure search values aren't being
   converted to `""`

5. **Verify API route handling** - ensure backend processes search/filter
   parameters correctly

#### API Response Structure Issues

If you encounter "undefined" errors in navigation or form submissions:

1. **Inspect actual API response** in Network tab:

   ```javascript
   // Check the actual response structure
   console.log('API Response:', response);
   console.log('Response Data:', response.data);
   ```

2. **Validate TypeScript interfaces** against actual API responses:

   ```typescript
   // If API returns { data: { customer: {...} } }
   // But interface expects { data: { id, name, email } }
   // Update interface to match reality
   ```

3. **Common patterns to check**:
   - Create operations: `response.data.customer` vs `response.data`
   - List operations: `response.data.customers` vs `response.data`
   - Nested pagination: `response.data.pagination` vs `response.pagination`

4. **Debug navigation issues**:

   ```typescript
   console.log('Navigation ID:', response.data?.customer?.id);
   // vs
   console.log('Expected ID:', response.data?.id);
   ```

5. **Verify API route implementation** - ensure response structure matches
   frontend expectations

### Template Compliance

All bridge templates now include these patterns:

- Management Bridge Template: Updated with setTimeout patterns
- API Bridge Template: Updated with singleton safety patterns
- Both templates include comprehensive documentation

## Migration Process

### Step 1: Identify Components for Migration

Look for components that:

- Have complex state management
- Make multiple API calls
- Need error handling
- Require analytics tracking
- Have performance issues

### Step 2: Choose the Right Template

- **Management Bridge**: For components that manage UI state and user
  interactions
- **API Bridge**: For components that primarily handle data fetching and API
  operations

### Step 3: Apply Infinite Loop Prevention Patterns

1. Replace useEffect dependencies with empty arrays where appropriate
2. Wrap all bridge calls in setTimeout
3. Defer analytics calls in callbacks
4. Ensure proper cleanup of subscriptions

### Step 4: Test Thoroughly

- Test component mounting/unmounting
- Test data fetching and updates
- Test error scenarios
- Test performance under load
- Verify no infinite loops in console

## Template Usage

### Management Bridge Template

```bash
# Copy template
cp templates/design-patterns/bridge/management-bridge.template.tsx src/components/bridges/MyEntityManagementBridge.tsx

# Replace placeholders
sed -i 's/__BRIDGE_NAME__/MyEntity/g' src/components/bridges/MyEntityManagementBridge.tsx
sed -i 's/__ENTITY_TYPE__/MyEntity/g' src/components/bridges/MyEntityManagementBridge.tsx
sed -i 's/__RESOURCE_NAME__/my-entities/g' src/components/bridges/MyEntityManagementBridge.tsx
sed -i 's/__USER_STORY__/US-X.X/g' src/components/bridges/MyEntityManagementBridge.tsx
sed -i 's/__HYPOTHESIS__/HX/g' src/components/bridges/MyEntityManagementBridge.tsx
```

### API Bridge Template

```bash
# Copy template
cp templates/design-patterns/bridge/api-bridge.template.ts src/lib/bridges/MyEntityApiBridge.ts

# Replace placeholders
sed -i 's/__BRIDGE_NAME__/MyEntity/g' src/lib/bridges/MyEntityApiBridge.ts
sed -i 's/__ENTITY_TYPE__/MyEntity/g' src/lib/bridges/MyEntityApiBridge.ts
sed -i 's/__RESOURCE_NAME__/my-entities/g' src/lib/bridges/MyEntityApiBridge.ts
sed -i 's/__USER_STORY__/US-X.X/g' src/lib/bridges/MyEntityApiBridge.ts
sed -i 's/__HYPOTHESIS__/HX/g' src/lib/bridges/MyEntityApiBridge.ts
```

## Verification

After migration, run:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Bridge compliance verification
node scripts/verify-all-bridge-compliance.js

# Performance testing
npm run test:performance
```

## Best Practices

1. **Always use templates** - Don't create bridges from scratch
2. **Follow infinite loop prevention patterns** - This is critical
3. **Test thoroughly** - Especially error scenarios
4. **Document user stories and hypotheses** - For traceability
5. **Use proper error handling** - Always use ErrorHandlingService
6. **Include analytics** - Track user interactions and performance
7. **Optimize for performance** - Use caching and deduplication

## Troubleshooting

### Common Issues

1. **TypeScript errors**: Check import paths and type definitions
2. **Runtime errors**: Verify bridge initialization and cleanup
3. **Performance issues**: Check caching and deduplication
4. **Infinite loops**: Apply the five prevention patterns above

### Getting Help

1. Check the template documentation
2. Review existing bridge implementations
3. Run compliance verification
4. Check the console for error messages
5. Verify all patterns are applied correctly

## Conclusion

The bridge pattern provides powerful state management and error handling
capabilities. By following these instructions and applying the critical patterns
for both infinite loop prevention and proper parameter handling, you can create
robust, performant components that integrate seamlessly with the PosalPro MVP2
architecture.

Remember: **Always apply these critical patterns**:

1. **Infinite loop prevention** - Critical for preventing runtime errors
2. **Proper parameter precedence** - Critical for search/filter functionality
3. **API response structure validation** - Critical for navigation and form
   handling
4. **Structured debug logging** - Critical for troubleshooting issues

These patterns ensure smooth user experience, maintainable code, and robust
error handling.
