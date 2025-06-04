/**
 * ProposalCard Component Tests
 *
 * Includes snapshot testing and interaction testing for ProposalCard component.
 * Follows our quality-first approach and testing best practices.
 *
 * @stage Development
 * @quality-gate Component Testing
 */

import React from 'react';
import { render, screen, fireEvent, cleanup } from '@/test/utils/test-utils';
import { ProposalCard } from '../ProposalCard';

describe('ProposalCard Component', () => {
  const mockProposal = {
    id: 'proposal-123',
    title: 'Enterprise Cloud Migration Proposal',
    status: 'in-review' as const,
    client: 'Acme Corporation',
    value: 150000,
    winProbability: 75,
    dueDate: '2025-07-15T00:00:00.000Z',
    lastModified: '2025-06-01T14:30:00.000Z',
  };

  it('renders correctly with all props', () => {
    const { container } = render(<ProposalCard {...mockProposal} />);

    // Verify key elements are present
    expect(screen.getByText('Enterprise Cloud Migration Proposal')).toBeInTheDocument();
    expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();

    // Take a snapshot
    expect(container).toMatchSnapshot();
  });

  it('renders with correct status badge variant', () => {
    // Test for each status type
    const statuses = ['draft', 'in-review', 'submitted', 'won', 'lost'] as const;

    statuses.forEach(status => {
      render(<ProposalCard {...mockProposal} status={status} />);

      // Check if status text is rendered with proper formatting
      const expectedText =
        status === 'in-review' ? 'In Review' : status.charAt(0).toUpperCase() + status.slice(1);
      const statusBadge = screen.getByText(expectedText);
      expect(statusBadge).toBeInTheDocument();

      // Clean up for next iteration
      cleanup();
    });
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<ProposalCard {...mockProposal} onClick={handleClick} />);

    const card = screen.getByTestId('proposal-card');
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockProposal.id);
  });

  it('formats currency and dates correctly', () => {
    render(<ProposalCard {...mockProposal} />);

    // Check currency formatting
    expect(screen.getByText('$150,000.00')).toBeInTheDocument();

    // Check date formatting (depends on locale settings in formatters)
    // This assumes the short date format, which should be predictable
    expect(screen.getByText(/7\/15\/2025/)).toBeInTheDocument();
    expect(screen.getByText(/6\/1\/2025/)).toBeInTheDocument();
  });

  it('renders without crashing when winProbability is not provided', () => {
    const { winProbability, ...proposalWithoutWinProb } = mockProposal;
    render(<ProposalCard {...proposalWithoutWinProb} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
