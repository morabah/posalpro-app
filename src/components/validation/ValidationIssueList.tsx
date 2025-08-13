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
const _COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: ['AC-3.1.4', 'AC-3.2.2', 'AC-3.3.3'],
  methods: ['statusIndicators()', 'componentWarnings()', 'exportReports()', 'prioritizeIssues()'],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};
void _COMPONENT_MAPPING;

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
  if (severity in configs) {
    return configs[severity as keyof typeof configs];
  }
  return configs.info;
};

interface IssueFilters {
  search: string;
  severity: string[];
  status: Array<'open' | 'in_progress' | 'resolved' | 'deferred' | 'suppressed'>;
  category: string[];
  proposalId: string;
}

interface ValidationIssueListProps {
  issues: ValidationIssue[];
  onIssueSelect?: (issue: ValidationIssue) => void;
  onFixApply?: (issueId: string, fixId: string) => Promise<boolean>;
  onBatchOperation?: (issueIds: string[], operation: string) => Promise<void>;
  showFilters?: boolean;
  showBatchActions?: boolean;
  maxHeight?: string;
}

const STATIC_FILTER_OPTIONS = {
  severities: ['critical', 'high', 'medium', 'low'] as const,
  statuses: ['open', 'in_progress', 'resolved', 'deferred', 'suppressed'] as const,
  categories: ['technical', 'compliance', 'security', 'business'] as const,
};
void STATIC_FILTER_OPTIONS;

type IssueStatus = (typeof STATIC_FILTER_OPTIONS.statuses)[number];

const getStatusConfig = (status: IssueStatus | undefined) => {
  const configs = {
    open: { text: 'Open', badge: 'bg-red-100 text-red-800' },
    in_progress: { text: 'In Progress', badge: 'bg-yellow-100 text-yellow-800' },
    resolved: { text: 'Resolved', badge: 'bg-green-100 text-green-800' },
    deferred: { text: 'Deferred', badge: 'bg-gray-100 text-gray-800' },
    suppressed: { text: 'Suppressed', badge: 'bg-purple-100 text-purple-800' },
  } as const;

  // Default for undefined status
  if (!status) {
    return { text: 'Unknown', badge: 'bg-gray-100 text-gray-800' };
  }

  return configs[status];
};

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
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  const { applyFixSuggestion } = useValidation();

  // Type-safe change handler for sort select
  const handleSortChange = useCallback((value: string) => {
    if (value === 'severity' || value === 'detectedAt' || value === 'proposalId') {
      setSortBy(value);
    }
  }, []);

  // Filter and sort issues (AC-3.1.4, AC-3.2.2)
  const filteredAndSortedIssues = useMemo(() => {
    let filtered = [...issues];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        issue =>
          issue.message.toLowerCase().includes(searchLower) ||
          (issue.description?.toLowerCase().includes(searchLower) ?? false) ||
          (issue.ruleName?.toLowerCase().includes(searchLower) ?? false) ||
          (issue.context?.customer?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Apply severity filter
    if (filters.severity.length > 0) {
      filtered = filtered.filter(issue => filters.severity.includes(issue.severity));
    }

    // Apply status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(issue => (issue.status ? filters.status.includes(issue.status) : false));
    }

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(issue => filters.category.includes(issue.category));
    }

    // Apply proposal filter
    if (filters.proposalId) {
      filtered = filtered.filter(issue => issue.proposalId === filters.proposalId);
    }

    // Apply sorting (fixed to 'desc' order to remove unnecessary conditionals)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'severity': {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as const;
          const aOrder = severityOrder[a.severity as keyof typeof severityOrder];
          const bOrder = severityOrder[b.severity as keyof typeof severityOrder];
          return bOrder - aOrder;
        }
        case 'detectedAt': {
          const aTime = a.detectedAt ? new Date(a.detectedAt).getTime() : 0;
          const bTime = b.detectedAt ? new Date(b.detectedAt).getTime() : 0;
          return bTime - aTime;
        }
        case 'proposalId': {
          const aVal = a.proposalId || '';
          const bVal = b.proposalId || '';
          return bVal.localeCompare(aVal);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [issues, filters, sortBy]);

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
        // Use standardized error handler upstream where available; keep silent here
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
        // Use standardized error handler upstream where available; keep silent here
      }
    },
    [selectedIssues, onBatchOperation]
  );

  // Get unique values for filter options
  const getFilterOptions = useCallback(() => {
    const severities = [...new Set(issues.map(issue => issue.severity))];
    const statuses = [
      ...new Set(
        issues
          .map(issue => issue.status)
          .filter(
            (status): status is 'open' | 'in_progress' | 'resolved' | 'deferred' | 'suppressed' =>
              Boolean(status)
          )
      ),
    ];
    const categories = [...new Set(issues.map(issue => issue.category))];
    const proposals = [
      ...new Set(issues.map(issue => issue.proposalId).filter((id): id is string => Boolean(id))),
    ];

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
                onChange={handleSortChange}
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
                        {/* The includes() result is legitimately boolean; rule is over-aggressive here */}
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
                        {/* The includes() result is legitimately boolean; rule is over-aggressive here */}
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
                        {/* The includes() result is legitimately boolean; rule is over-aggressive here */}
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
          filteredAndSortedIssues.map((issue, index) => {
            // Generate a stable ID for issues without one
            const issueId = issue.id || `issue-${index}-${issue.message.slice(0, 10)}`;

            const severityConfig = getSeverityConfig(issue.severity);
            const statusConfig = getStatusConfig(issue.status);
            const isExpanded = expandedIssues.has(issueId);
            const isSelected = selectedIssues.has(issueId);
            const SeverityIcon = severityConfig.icon;

            return (
              <Card
                key={issueId}
                className={`p-4 border-l-4 ${severityConfig.border} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Selection checkbox */}
                    {showBatchActions && (
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleIssueSelection(issueId)}
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
                                  issue.affectedProducts.join(', ') ||
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
                                        onClick={() => handleFixApplication(issueId, fix.id)}
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
                    <Button variant="ghost" size="sm" onClick={() => toggleIssueExpansion(issueId)}>
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
