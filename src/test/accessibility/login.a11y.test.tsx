import React from 'react';
import { render } from '@/test/utils/test-utils';
import { LoginForm } from '@/components/auth/LoginForm';
import { axe, toHaveNoViolations } from 'jest-axe';

declare global {
  // augment jest matchers to include toHaveNoViolations for TS
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

expect.extend(toHaveNoViolations);

describe('Accessibility - LoginForm (WCAG 2.1 AA)', () => {
  it('should have no detectable a11y violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
