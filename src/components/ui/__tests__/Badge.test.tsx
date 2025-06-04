/**
 * Component tests for Badge component
 *
 * Following component composition and testing best practices as outlined
 * in our quality-first approach.
 *
 * @stage Development
 * @quality-gate Component Testing
 */

import React from 'react';
import { render, screen } from '@/test/utils/test-utils';
import { Badge } from '../Badge';

describe('Badge Component', () => {
  it('renders with default variant', () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-primary');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);
    const badge = screen.getByText('Secondary Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-secondary');
  });

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Destructive Badge</Badge>);
    const badge = screen.getByText('Destructive Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-destructive');
  });

  it('renders with outline variant', () => {
    render(<Badge variant="outline">Outline Badge</Badge>);
    const badge = screen.getByText('Outline Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('border-input');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success Badge</Badge>);
    const badge = screen.getByText('Success Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-500');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning Badge</Badge>);
    const badge = screen.getByText('Warning Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-500');
  });

  it('applies active state styling when active prop is true', () => {
    render(<Badge active>Active Badge</Badge>);
    const badge = screen.getByText('Active Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('ring-2');
    expect(badge).toHaveClass('ring-ring');
  });

  it('applies custom className when provided', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);
    const badge = screen.getByText('Custom Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('custom-class');
  });

  it('passes additional props to the underlying div', () => {
    render(<Badge data-testid="test-badge">Test Badge</Badge>);
    const badge = screen.getByTestId('test-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Test Badge');
  });
});
