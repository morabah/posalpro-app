# Integration Tests

This directory contains integration tests for the PosalPro application. These tests verify that multiple components work together correctly in a more realistic environment than unit tests.

## Sidebar Navigation Tests

The `sidebarNavigation.test.tsx` file contains tests for the sidebar navigation functionality, including:

### Test Coverage

- **Rendering**: Verifies that navigation items appear correctly in the sidebar
- **Navigation Links**: Tests that clicking navigation links triggers proper navigation and analytics events
- **Role-based Visibility**: Ensures that navigation items respect user role restrictions
- **Mobile Responsiveness**: Tests the sidebar's mobile view and close functionality

### Implementation Details

- Uses Jest and React Testing Library for rendering and assertions
- Mocks the `useAnalytics` hook to verify analytics tracking
- Mocks Next.js navigation hooks for testing navigation behavior
- Uses role-based queries for reliable component selection

### Running the Tests

You can run these tests using:

```bash
# Run all integration tests
npm run test:integration

# Run just the sidebar navigation tests
npm test -- src/test/integration/sidebarNavigation.test.tsx
```

### Test Structure

1. **Setup**: Mocks for navigation and analytics hooks
2. **Navigation Items Rendering**: Tests basic rendering of navigation links
3. **Navigation Functionality**: Programmatically tests clicking each navigation item
4. **Role-based Access**: Tests visibility of navigation items based on user roles
5. **Mobile View**: Tests sidebar rendering and behavior in mobile view

### Best Practices

- Use role-based queries (`getByRole`) whenever possible for robust tests
- Mock analytics calls to verify tracking behavior
- Test both desktop and mobile views
- Consider role-based access control in tests
- Verify both rendering and behavior (e.g., navigation, expanding/collapsing)
