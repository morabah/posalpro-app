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
import { ProposalCard } from '@/components/proposals/ProposalCard';

expect.extend(toHaveNoViolations);

describe('Accessibility - ProposalCard (WCAG 2.1 AA)', () => {
  it('should have no detectable a11y violations', async () => {
    const { container } = render(
      <ProposalCard
        id="p1"
        title="Enterprise Proposal"
        status="in-review"
        client="Acme Corp"
        value={125000}
        winProbability={64}
        dueDate={new Date()}
        lastModified={new Date()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
