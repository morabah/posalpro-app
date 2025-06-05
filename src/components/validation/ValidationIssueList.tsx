/**
 * PosalPro MVP2 - Validation Issue List Component
 * Based on VALIDATION_DASHBOARD_SCREEN.md wireframe specifications
 * Component Traceability: US-3.1, US-3.2, US-3.3, AC-3.1.4, AC-3.2.2, AC-3.3.3
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useValidation } from '@/hooks/validation/useValidation';
import { ValidationIssue } from '@/types/validation';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: ['AC-3.1.4', 'AC-3.2.2', 'AC-3.3.3'],
  methods: ['statusIndicators()', 'componentWarnings()', 'exportReports()', 'prioritizeIssues()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

// Issue severity styles
const getSeverityConfig = (severity: string) => {
  const configs = {
    critical: {
      badge: 'bg-red-100 text-red-800 border-red-200',
      icon: ExclamationCircleIcon,
      iconColor: 'text-red-600',
      border: 'border-l-red-500',
    },
    high: {
      badge: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-orange-600',
      border: 'border-l-orange-500',
    },
    medium: {
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: ExclamationTriangleIcon,
      iconColor: 'text-yellow-600',
      border: 'border-l-yellow-500',
    },
    low: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-600',
      border: 'border-l-blue-500',
    },
    info: {
      badge: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: InformationCircleIcon,
      iconColor: 'text-gray-600',
      border: 'border-l-gray-500',
    },
  };
  return configs[severity as keyof typeof configs] || configs.info;
};

// Issue status styles
const getStatusConfig = (status: string) => {
  const configs = {
    open: {
      badge: 'bg-red-50 text-red-700 border-red-200',
      text: 'Open',
    },
    in_progress: {
      badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      text: 'In Progress',
    },
    resolved: {
      badge: 'bg-green-50 text-green-700 border-green-200',
      text: 'Resolved',
    },
    suppressed: {
      badge: 'bg-gray-50 text-gray-700 border-gray-200',
      text: 'Suppressed',
    },
    deferred: {
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      text: 'Deferred',
    },
  };
  return configs[status as keyof typeof configs] || configs.open;
};

interface ValidationIssueListProps {
  issues: ValidationIssue[];
  onIssueSelect?: (issue: ValidationIssue) => void;
  onFixApply?: (issueId: string, fixId: string) => Promise<boolean>;
  onBatchOperation?: (issueIds: string[], operation: string) => Promise<void>;
  showFilters?: boolean;
  showBatchActions?: boolean;
  maxHeight?: string;
}

interface IssueFilters {
  search: string;
  severity: string[];
  status: string[];
  category: string[];
  proposalId: string;
}

export function ValidationIssueList({
  issues,
  onIssueSelect,
  onFixApply,
  onBatchOperation,
  showFilters = true,
  showBatchActions = true,
  maxHeight = '600px',
}: ValidationIssueListProps) {
  const [filters, setFilters] = useState<IssueFilters>({
    search: '',
    severity: [],
    status: [],
    category: [],
    proposalId: '',
  });

  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'severity' | 'detectedAt' | 'proposalId'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const { applyFixSuggestion } = useValidation();

  // Filter and sort issues (AC-3.1.4, AC-3.2.2)
  const filteredAndSortedIssues = useMemo(() => {
    let filtered = [...issues];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        issue =>
          issue.message.toLowerCase().includes(searchLower) ||
          (issue.description && issue.description.toLowerCase().includes(searchLower)) ||
          (issue.ruleName && issue.ruleName.toLowerCase().includes(searchLower)) ||
          (issue.context?.customer && issue.context.customer.toLowerCase().includes(searchLower))
      );
    }

    // Apply severity filter
    if (filters.severity.length > 0) {
      filtered = filtered.filter(issue => filters.severity.includes(issue.severity));
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(issue => issue.status && filters.status.includes(issue.status));
    }

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(issue => filters.category.includes(issue.category));
    }

    // Apply proposal filter
    if (filters.proposalId) {
      filtered = filtered.filter(issue => issue.proposalId === filters.proposalId);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'severity') {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        const aOrder = severityOrder[a.severity as keyof typeof severityOrder];
        const bOrder = severityOrder[b.severity as keyof typeof severityOrder];
        return sortOrder === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }

      if (sortBy === 'detectedAt') {
        const aTime = a.detectedAt ? new Date(a.detectedAt).getTime() : 0;
        const bTime = b.detectedAt ? new Date(b.detectedAt).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }

      if (sortBy === 'proposalId') {
        const aVal = a.proposalId || '';
        const bVal = b.proposalId || '';
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return 0;
    });

    return filtered;
  }, [issues, filters, sortBy, sortOrder]);

  // Toggle issue selection for batch operations
  const toggleIssueSelection = useCallback((issueId: string) => {
    setSelectedIssues(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(issueId)) {
        newSelection.delete(issueId);
      } else {
        newSelection.add(issueId);
      }
      return newSelection;
    });
  }, []);

  // Toggle issue expansion for details
  const toggleIssueExpansion = useCallback((issueId: string) => {
    setExpandedIssues(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(issueId)) {
        newExpanded.delete(issueId);
      } else {
        newExpanded.add(issueId);
      }
      return newExpanded;
    });
  }, []);

  // Apply fix suggestion (AC-3.3.3)
  const handleFixApplication = useCallback(
    async (issueId: string, fixId: string) => {
      try {
        const success = await applyFixSuggestion(issueId, fixId);
        if (success && onFixApply) {
          await onFixApply(issueId, fixId);
        }
        return success;
      } catch (error) {
        console.error('Failed to apply fix:', error);
        return false;
      }
    },
    [applyFixSuggestion, onFixApply]
  );

  // Batch operations handler
  const handleBatchOperation = useCallback(
    async (operation: string) => {
      if (selectedIssues.size === 0) return;

      try {
        if (onBatchOperation) {
          await onBatchOperation(Array.from(selectedIssues), operation);
        }
        setSelectedIssues(new Set());
      } catch (error) {
        console.error('Batch operation failed:', error);
      }
    },
    [selectedIssues, onBatchOperation]
  );

  // Get unique values for filter options
  const getFilterOptions = useCallback(() => {
    const severities = [...new Set(issues.map(issue => issue.severity))];
    const statuses = [...new Set(issues.map(issue => issue.status).filter(Boolean))]; // Filter out undefined
    const categories = [...new Set(issues.map(issue => issue.category))];
    const proposals = [...new Set(issues.map(issue => issue.proposalId).filter(Boolean))]; // Filter out undefined

    return { severities, statuses, categories, proposals };
  }, [issues]);

  const filterOptions = getFilterOptions();

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search issues by message, description, or rule..."
                  value={filters.search}
                  onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Quick filters */}
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onChange={value => setSortBy(value as typeof sortBy)}
                options={[
                  { value: 'severity', label: 'Sort by Severity' },
                  { value: 'detectedAt', label: 'Sort by Date' },
                  { value: 'proposalId', label: 'Sort by Proposal' },
                ]}
              />

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className="flex items-center gap-2"
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
                {(filters.severity.length > 0 || filters.status.length > 0) && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.severity.length + filters.status.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Expanded filters panel */}
          {showFiltersPanel && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <div className="space-y-1">
                    {filterOptions.severities.map(severity => (
                      <label key={severity} className="flex items-center">
                        <Checkbox
                          checked={filters.severity.includes(severity)}
                          onChange={checked => {
                            setFilters(prev => ({
                              ...prev,
                              severity: checked
                                ? [...prev.severity, severity]
                                : prev.severity.filter(s => s !== severity),
                            }));
                          }}
                        />
                        <span className="ml-2 text-sm capitalize">{severity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <div className="space-y-1">
                    {filterOptions.statuses.map(status => (
                      <label key={status} className="flex items-center">
                        <Checkbox
                          checked={filters.status.includes(status)}
                          onChange={checked => {
                            setFilters(prev => ({
                              ...prev,
                              status: checked
                                ? [...prev.status, status]
                                : prev.status.filter(s => s !== status),
                            }));
                          }}
                        />
                        <span className="ml-2 text-sm">{getStatusConfig(status).text}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="space-y-1">
                    {filterOptions.categories.map(category => (
                      <label key={category} className="flex items-center">
                        <Checkbox
                          checked={filters.category.includes(category)}
                          onChange={checked => {
                            setFilters(prev => ({
                              ...prev,
                              category: checked
                                ? [...prev.category, category]
                                : prev.category.filter(c => c !== category),
                            }));
                          }}
                        />
                        <span className="ml-2 text-sm capitalize">
                          {category.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Batch actions */}
      {showBatchActions && selectedIssues.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedIssues.size} issue{selectedIssues.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBatchOperation('suppress')}>
                Suppress Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBatchOperation('defer')}>
                Defer Selected
              </Button>
              <Button size="sm" onClick={() => handleBatchOperation('auto_fix')}>
                Auto-Fix Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Issues list */}
      <div className="space-y-3" style={{ maxHeight, overflowY: 'auto' }}>
        {filteredAndSortedIssues.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Issues Found</h3>
            <p className="text-gray-500">
              {issues.length === 0
                ? 'All validations are passing successfully.'
                : 'No issues match your current filters.'}
            </p>
          </Card>
        ) : (
          filteredAndSortedIssues.map(issue => {
            const severityConfig = getSeverityConfig(issue.severity);
            const statusConfig = getStatusConfig(issue.status);
            const isExpanded = expandedIssues.has(issue.id);
            const isSelected = selectedIssues.has(issue.id);
            const SeverityIcon = severityConfig.icon;

            return (
              <Card
                key={issue.id}
                className={`p-4 border-l-4 ${severityConfig.border} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Selection checkbox */}
                    {showBatchActions && (
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleIssueSelection(issue.id)}
                        className="mt-1"
                      />
                    )}

                    {/* Issue icon */}
                    <SeverityIcon className={`h-5 w-5 mt-0.5 ${severityConfig.iconColor}`} />

                    {/* Issue content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {issue.message}
                          </h4>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{issue.ruleName || 'Unknown Rule'}</span>
                            <span>•</span>
                            <span>Proposal #{issue.proposalId || 'N/A'}</span>
                            <span>•</span>
                            <span>{issue.context?.customer || 'N/A'}</span>
                            <span>•</span>
                            <span>
                              {issue.detectedAt
                                ? new Date(issue.detectedAt).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge className={severityConfig.badge}>{issue.severity}</Badge>
                          <Badge className={statusConfig.badge}>{statusConfig.text}</Badge>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Description</h5>
                            <p className="text-sm text-gray-600">
                              {issue.description || 'No description available'}
                            </p>
                          </div>

                          {/* Context details */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Context</h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Owner:</span>{' '}
                                {issue.context?.proposalOwner || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Value:</span> $
                                {issue.context?.proposalValue?.toLocaleString() || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Category:</span> {issue.category}
                              </div>
                              <div>
                                <span className="font-medium">Products:</span>{' '}
                                {issue.context?.affectedProducts?.join(', ') ||
                                  issue.affectedProducts?.join(', ') ||
                                  'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Fix suggestions */}
                          {issue.fixSuggestions && issue.fixSuggestions.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-900 mb-2">
                                Fix Suggestions
                              </h5>
                              <div className="space-y-2">
                                {issue.fixSuggestions.map(fix => (
                                  <div
                                    key={fix.id}
                                    className="border border-gray-200 rounded-md p-3"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h6 className="text-sm font-medium text-gray-900">
                                          {fix.title}
                                        </h6>
                                        <p className="text-xs text-gray-600 mt-1">
                                          {fix.description}
                                        </p>
                                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                          <span>Impact: {fix.impact}</span>
                                          <span>•</span>
                                          <span>Confidence: {fix.confidence}%</span>
                                          <span>•</span>
                                          <span>Time: {fix.estimatedTime} min</span>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={fix.automatable ? 'primary' : 'outline'}
                                        onClick={() => handleFixApplication(issue.id, fix.id)}
                                        className="ml-4"
                                      >
                                        {fix.automatable ? 'Apply Fix' : 'Manual Fix'}
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleIssueExpansion(issue.id)}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4" />
                      )}
                    </Button>

                    {onIssueSelect && (
                      <Button variant="outline" size="sm" onClick={() => onIssueSelect(issue)}>
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Results summary */}
      <div className="text-sm text-gray-500 text-center">
        Showing {filteredAndSortedIssues.length} of {issues.length} issues
        {selectedIssues.size > 0 && ` (${selectedIssues.size} selected)`}
      </div>
    </div>
  );
}
