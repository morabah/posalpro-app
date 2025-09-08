# PosalPro MVP2 Testing Guidelines

## Overview

This document outlines the testing strategy and guidelines for the PosalPro MVP2 project, following our quality-first approach and the integrated AI development framework.

## Testing Architecture

Our testing architecture follows the Testing Trophy approach:

```
                 🏆
               /     \
              /       \
             /  E2E    \
            /           \
           /-------------\
          /  Integration  \
         /                 \
        /-------------------\
       /      Component      \
      /                       \
     /-------------------------\
    /          Unit             \
   /-------------------------------\
```

- **Unit Tests**: Fast tests focusing on isolated functions and utilities
- **Component Tests**: Tests for individual UI components
- **Integration Tests**: Tests for multi-component interactions and flows
- **E2E Tests**: Full application workflows (handled separately with Cypress)

## Test Structure

Tests are co-located with the code they're testing:

- Unit tests: `src/**/[name].test.ts`
- Component tests: `src/components/**/__tests__/[ComponentName].test.tsx`
- Integration tests: Named descriptively with `integration` in the filename

## Quality Gates

Our tests implement the 4-stage quality gates:

1. **Development Gate**: Unit tests and component tests
2. **Feature Gate**: Integration tests
3. **Commit Gate**: Test coverage thresholds
4. **Release Gate**: E2E tests

## Configuration

- Jest configuration: `jest.config.mjs`
- Jest setup: `jest.setup.js`
- Test utilities: `src/test/utils/test-utils.tsx`
- Mocks: `src/test/mocks/*`

## Testing Patterns

### Unit Testing

Unit tests should:
- Focus on a single function or method
- Test all edge cases and input variations
- Follow the AAA pattern (Arrange, Act, Assert)

Example:
```typescript
describe('formatCurrency', () => {
  it('formats currency with default USD currency', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00');
  });
});
```

### Component Testing

Component tests should:
- Test rendering, props, state changes, and user interactions
- Use React Testing Library to interact with components as users would
- Test accessibility where applicable

Example:
```typescript
describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary');
  });
});
```

### Integration Testing

Integration tests should:
- Test critical user flows across multiple components
- Mock external dependencies (API, authentication)
- Validate business logic across component boundaries

Example:
```typescript
describe('Login Flow', () => {
  it('redirects to dashboard after successful login', async () => {
    // Test implementation
  });
});
```

## Mocking Strategy

- API calls: Use `jest.mock()` or MSW (Mock Service Worker)
- Next.js functionality: Use mocks in `src/test/mocks/`
- Auth: Mock session in `src/test/mocks/session.mock.ts`
- Time/Date: Use Jest's fake timers

## Test Coverage

Coverage requirements:
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

Run coverage report:
```bash
npm run test:coverage
```

## Pre-commit Integration

Tests are integrated into our pre-commit hooks to ensure code quality:
```bash
npm run pre-commit
```

## Lessons Learned

Add testing insights to `LESSONS_LEARNED.md` after implementing significant test cases or discovering testing patterns.

## References

- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Trophy by Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
