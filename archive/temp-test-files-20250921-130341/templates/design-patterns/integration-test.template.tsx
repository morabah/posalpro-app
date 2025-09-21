// __FILE_DESCRIPTION__: React Testing Library integration test skeleton (with providers)

import React from 'react';
import { render, screen } from '@/lib/testing/testUtils';

function __DUMMY_COMPONENT__() {
  return <div data-testid="__DUMMY__">Hello</div>;
}

describe('__DUMMY_INTEGRATION__', () => {
  it('renders component', () => {
    render(<__DUMMY_COMPONENT__ />);
    expect(screen.getByTestId('__DUMMY__')).toHaveTextContent('Hello');
  });
});
