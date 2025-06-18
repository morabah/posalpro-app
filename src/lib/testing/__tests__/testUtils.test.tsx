/**
 * Test utilities validation
 */

import { describe, expect, it } from '@jest/globals';
import '@testing-library/jest-dom';
import { DatabaseTestUtils, mockSession, renderWithProviders } from '../testUtils';

// Simple test component
const TestComponent = () => {
  return <div data-testid="test-component">Hello Test</div>;
};

describe('Testing Utilities', () => {
  it('renderWithProviders works correctly', () => {
    const { getByTestId } = renderWithProviders(<TestComponent />);
    expect(getByTestId('test-component')).toBeTruthy();
    expect(getByTestId('test-component').textContent).toBe('Hello Test');
  });

  it('mockSession has correct structure', () => {
    expect(mockSession).toHaveProperty('user');
    expect(mockSession.user).toHaveProperty('id');
    expect(mockSession.user).toHaveProperty('email');
    expect(mockSession.user.role).toBe('Administrator');
  });

  it('DatabaseTestUtils creates mock user', () => {
    const user = DatabaseTestUtils.createMockUser();
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user.role).toBe('Administrator');
  });

  it('DatabaseTestUtils creates mock proposal', () => {
    const proposal = DatabaseTestUtils.createMockProposal();
    expect(proposal).toHaveProperty('id');
    expect(proposal).toHaveProperty('name');
    expect(proposal).toHaveProperty('status');
    expect(proposal.status).toBe('Draft');
  });
});
