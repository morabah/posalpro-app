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
import { AppSidebar } from '@/components/layout';

expect.extend(toHaveNoViolations);

describe('Accessibility - AppSidebar (WCAG 2.1 AA)', () => {
  it('should have no detectable a11y violations', async () => {
    const { container } = render(
      <AppSidebar isOpen={true} isMobile={false} onClose={() => {}} user={{ id: 'u1', name: 'Test', email: 't@example.com', role: 'Administrator' }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
