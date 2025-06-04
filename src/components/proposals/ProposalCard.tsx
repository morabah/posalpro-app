/**
 * Proposal Card Component
 *
 * Displays a summary of a proposal with key metrics and status.
 * Follows our component composition patterns and design system.
 *
 * @stage Development
 * @quality-gate Component
 */

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/formatters';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.2', 'AC-3.2.1'],
  methods: ['displayProposalSummary()', 'calculateWinProbability()'],
  hypotheses: ['H2'],
  testCases: ['TC-H2-001', 'TC-H2-002'],
};

// Type definitions for component props
export interface ProposalCardProps {
  /** Unique identifier for the proposal */
  id: string;
  /** Title of the proposal */
  title: string;
  /** Current status of the proposal */
  status: 'draft' | 'in-review' | 'submitted' | 'won' | 'lost';
  /** Client or organization name */
  client: string;
  /** Total proposal value */
  value: number;
  /** Probability of winning (0-100) */
  winProbability?: number;
  /** Due date for the proposal */
  dueDate: string | Date;
  /** Last modified timestamp */
  lastModified: string | Date;
  /** Optional click handler */
  onClick?: (id: string) => void;
  /** Optional additional class names */
  className?: string;
}

/**
 * Maps proposal status to badge variant for visual indication
 */
const getStatusBadgeVariant = (status: ProposalCardProps['status']) => {
  const variantMap: Record<
    ProposalCardProps['status'],
    React.ComponentProps<typeof Badge>['variant']
  > = {
    draft: 'secondary',
    'in-review': 'warning',
    submitted: 'default',
    won: 'success',
    lost: 'destructive',
  };

  return variantMap[status] || 'default';
};

/**
 * Formats status for display with proper capitalization and hyphen removal
 */
const formatStatus = (status: string): string => {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * ProposalCard component displays a summary card for a proposal
 */
export const ProposalCard: React.FC<ProposalCardProps> = ({
  id,
  title,
  status,
  client,
  value,
  winProbability = 0,
  dueDate,
  lastModified,
  onClick,
  className = '',
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <div
      className={`flex flex-col p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}
      onClick={handleClick}
      data-testid="proposal-card"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 truncate" title={title}>
          {title}
        </h3>
        <Badge variant={getStatusBadgeVariant(status)}>{formatStatus(status)}</Badge>
      </div>

      <p className="text-sm text-gray-600 mb-3">{client}</p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Value</span>
          <span className="text-sm font-medium">{formatCurrency(value)}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Win Probability</span>
          <span className="text-sm font-medium">{winProbability}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-gray-100">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Due Date</span>
          <span className="text-xs">{formatDate(dueDate, 'short')}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-500">Last Modified</span>
          <span className="text-xs">{formatDate(lastModified, 'short')}</span>
        </div>
      </div>
    </div>
  );
};
