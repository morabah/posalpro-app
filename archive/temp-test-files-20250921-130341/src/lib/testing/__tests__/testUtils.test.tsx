/**
 * Test utilities validation
 */

import { describe, expect, it } from '@jest/globals';
import '@testing-library/jest-dom';
import { mockSession, renderWithProviders, mockUser, mockAnalytics, mockApiClient } from '../testUtils';

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
    expect(mockSession.user.roles).toContain('User');
  });

  it('mockUser has correct structure', () => {
    expect(mockUser).toHaveProperty('id');
    expect(mockUser).toHaveProperty('name');
    expect(mockUser).toHaveProperty('email');
    expect(mockUser).toHaveProperty('department');
    expect(mockUser).toHaveProperty('roles');
    expect(mockUser).toHaveProperty('permissions');
  });

  it('mockAnalytics has required methods', () => {
    expect(mockAnalytics).toHaveProperty('track');
    expect(mockAnalytics).toHaveProperty('identify');
    expect(mockAnalytics).toHaveProperty('page');
    expect(mockAnalytics).toHaveProperty('reset');
    expect(typeof mockAnalytics.track).toBe('function');
  });

  it('mockApiClient has required methods', () => {
    expect(mockApiClient).toHaveProperty('get');
    expect(mockApiClient).toHaveProperty('post');
    expect(mockApiClient).toHaveProperty('put');
    expect(mockApiClient).toHaveProperty('delete');
    expect(typeof mockApiClient.get).toBe('function');
  });
});
