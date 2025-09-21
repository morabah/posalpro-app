import React from 'react';
import { render } from '@/test/utils/test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}
import ProductList from '@/components/products/ProductList';

expect.extend(toHaveNoViolations);

describe('Accessibility - ProductList (WCAG 2.1 AA)', () => {
  it('should have no detectable a11y violations (list mode)', async () => {
    const { container } = render(<ProductList viewMode="list" showSearch={false} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
