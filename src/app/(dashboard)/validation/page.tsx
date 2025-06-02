/**
 * PosalPro MVP2 - Validation Dashboard Interface
 * Based on VALIDATION_DASHBOARD_SCREEN.md wireframe specifications
 * Supports component traceability and analytics integration for H8 hypothesis validation
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import {
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.3', 'AC-3.2.1', 'AC-3.2.4', 'AC-3.3.1', 'AC-3.3.3'],
  methods: [
    'compatibilityCheck()',
    'generateSolutions()',
    'trackErrorReduction()',
    'licenseCheck()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

// Issue severity enumeration
enum IssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

// Issue status enumeration
enum IssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
  DEFERRED = 'deferred',
}

// Rule category enumeration
enum RuleCategory {
  PRODUCT_CONFIG = 'product_config',
  PRICING = 'pricing',
  COMPLIANCE = 'compliance',
  LICENSING = 'licensing',
  TECHNICAL = 'technical',
  BUSINESS_RULES = 'business_rules',
}

// Fix action types
enum FixActionType {
  ADD_PRODUCT = 'add_product',
  REMOVE_PRODUCT = 'remove_product',
  MODIFY_CONFIG = 'modify_config',
  DOCUMENT_EXCEPTION = 'document_exception',
  UPDATE_PRICING = 'update_pricing',
  ADD_LICENSE = 'add_license',
}

// Validation issue interface
interface ValidationIssue {
  id: string;
  proposalId: string;
  proposalTitle: string;
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  message: string;
  description: string;
  detectedAt: Date;
  updatedAt: Date;
  section: string;
  context: {
    proposalOwner: string;
    customer: string;
    proposalValue: number;
    affectedProducts: string[];
  };
  fixSuggestions: FixSuggestion[];
  resolution?: ResolutionAction;
}

// Fix suggestion interface
interface FixSuggestion {
  id: string;
  type: FixActionType;
  title: string;
  description: string;
  impact: string;
  confidence: number; // 0-100
  automatable: boolean;
  estimatedTime: number; // minutes
}

// Resolution action interface
interface ResolutionAction {
  id: string;
  appliedBy: string;
  appliedAt: Date;
  action: FixActionType;
  details: string;
  verified: boolean;
}

// Filter state interface
interface FilterState {
  search: string;
  severity: string;
  status: string;
  category: string;
  proposal: string;
  timeframe: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Mock validation issues data
const MOCK_VALIDATION_ISSUES: ValidationIssue[] = [
  {
    id: 'vld-1',
    proposalId: '1',
    proposalTitle: 'Cloud Migration Services - Acme Corporation',
    ruleId: 'rule-001',
    ruleName: 'Product Dependency Check',
    category: RuleCategory.PRODUCT_CONFIG,
    severity: IssueSeverity.CRITICAL,
    status: IssueStatus.OPEN,
    message: 'Required dependency Product B missing for Product A Enterprise',
    description:
      'Product A Enterprise edition requires Product B for security compliance when deployed in enterprise environments.',
    detectedAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(Date.now() - 3600000),
    section: 'Product Configuration',
    context: {
      proposalOwner: 'Mohamed Rabah',
      customer: 'Acme Corporation',
      proposalValue: 250000,
      affectedProducts: ['Product A Enterprise'],
    },
    fixSuggestions: [
      {
        id: 'fix-1',
        type: FixActionType.ADD_PRODUCT,
        title: 'Add Product B Security Module',
        description:
          'Add the required Product B Security Module to meet enterprise compliance requirements.',
        impact: 'Increases proposal value by $15,000',
        confidence: 95,
        automatable: true,
        estimatedTime: 5,
      },
      {
        id: 'fix-2',
        type: FixActionType.MODIFY_CONFIG,
        title: 'Downgrade to Standard Edition',
        description:
          'Change Product A from Enterprise to Standard edition to remove dependency requirement.',
        impact: 'Reduces proposal value by $25,000',
        confidence: 85,
        automatable: true,
        estimatedTime: 3,
      },
    ],
  },
  {
    id: 'vld-2',
    proposalId: '2',
    proposalTitle: 'Security Audit - TechStart Inc',
    ruleId: 'rule-002',
    ruleName: 'Pricing Policy Violation',
    category: RuleCategory.PRICING,
    severity: IssueSeverity.HIGH,
    status: IssueStatus.OPEN,
    message: 'Discount exceeds maximum allowed policy of 15%',
    description:
      'Applied discount of 18% exceeds the standard policy maximum of 15% for this customer tier.',
    detectedAt: new Date(Date.now() - 7200000), // 2 hours ago
    updatedAt: new Date(Date.now() - 3600000),
    section: 'Pricing Structure',
    context: {
      proposalOwner: 'Alex Peterson',
      customer: 'TechStart Inc',
      proposalValue: 85000,
      affectedProducts: ['Security Audit Service'],
    },
    fixSuggestions: [
      {
        id: 'fix-3',
        type: FixActionType.UPDATE_PRICING,
        title: 'Reduce discount to 15%',
        description: 'Adjust discount to comply with standard pricing policy.',
        impact: 'Increases proposal value by $2,550',
        confidence: 100,
        automatable: true,
        estimatedTime: 2,
      },
      {
        id: 'fix-4',
        type: FixActionType.DOCUMENT_EXCEPTION,
        title: 'Request discount exception approval',
        description:
          'Document business justification and request exception approval from pricing committee.',
        impact: 'Requires additional approval workflow',
        confidence: 70,
        automatable: false,
        estimatedTime: 30,
      },
    ],
  },
  {
    id: 'vld-3',
    proposalId: '3',
    proposalTitle: 'Digital Transformation - GlobalCorp',
    ruleId: 'rule-003',
    ruleName: 'Compliance Requirement Missing',
    category: RuleCategory.COMPLIANCE,
    severity: IssueSeverity.CRITICAL,
    status: IssueStatus.IN_PROGRESS,
    message: 'GDPR compliance certification required for EU customer',
    description:
      'Customer operates in EU jurisdiction and requires GDPR compliance certification for data processing services.',
    detectedAt: new Date(Date.now() - 14400000), // 4 hours ago
    updatedAt: new Date(Date.now() - 1800000), // 30 minutes ago
    section: 'Compliance Requirements',
    context: {
      proposalOwner: 'Sarah Johnson',
      customer: 'GlobalCorp',
      proposalValue: 500000,
      affectedProducts: ['Data Analytics Platform', 'Customer Data Hub'],
    },
    fixSuggestions: [
      {
        id: 'fix-5',
        type: FixActionType.ADD_PRODUCT,
        title: 'Add GDPR Compliance Module',
        description: 'Include GDPR compliance certification and data protection controls.',
        impact: 'Increases proposal value by $35,000',
        confidence: 90,
        automatable: false,
        estimatedTime: 45,
      },
    ],
  },
  {
    id: 'vld-4',
    proposalId: '4',
    proposalTitle: 'DevOps Implementation - InnovateTech',
    ruleId: 'rule-004',
    ruleName: 'License Compatibility Check',
    category: RuleCategory.LICENSING,
    severity: IssueSeverity.MEDIUM,
    status: IssueStatus.RESOLVED,
    message: 'Software license incompatibility detected',
    description:
      'Selected software components have conflicting license terms that may create legal issues.',
    detectedAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000),
    section: 'Software Licensing',
    context: {
      proposalOwner: 'John Smith',
      customer: 'InnovateTech',
      proposalValue: 150000,
      affectedProducts: ['DevOps Toolkit', 'Monitoring Suite'],
    },
    fixSuggestions: [
      {
        id: 'fix-6',
        type: FixActionType.MODIFY_CONFIG,
        title: 'Update license configuration',
        description: 'Replace conflicting components with compatible alternatives.',
        impact: 'No price impact, improved license compliance',
        confidence: 85,
        automatable: true,
        estimatedTime: 15,
      },
    ],
    resolution: {
      id: 'res-1',
      appliedBy: 'John Smith',
      appliedAt: new Date(Date.now() - 3600000),
      action: FixActionType.MODIFY_CONFIG,
      details: 'Replaced conflicting components with Apache 2.0 licensed alternatives',
      verified: true,
    },
  },
  {
    id: 'vld-5',
    proposalId: '5',
    proposalTitle: 'Data Analytics Platform - DataCorp',
    ruleId: 'rule-005',
    ruleName: 'Technical Architecture Review',
    category: RuleCategory.TECHNICAL,
    severity: IssueSeverity.LOW,
    status: IssueStatus.SUPPRESSED,
    message: 'Performance optimization recommendation',
    description: 'Current configuration may experience performance limitations at projected scale.',
    detectedAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000),
    section: 'Technical Architecture',
    context: {
      proposalOwner: 'Lisa Kim',
      customer: 'DataCorp',
      proposalValue: 320000,
      affectedProducts: ['Analytics Engine', 'Data Processing Pipeline'],
    },
    fixSuggestions: [
      {
        id: 'fix-7',
        type: FixActionType.MODIFY_CONFIG,
        title: 'Upgrade to high-performance configuration',
        description: 'Enhance configuration with performance optimization components.',
        impact: 'Increases proposal value by $45,000',
        confidence: 75,
        automatable: false,
        estimatedTime: 60,
      },
    ],
  },
];

export default function ValidationDashboard() {
  const router = useRouter();
  const [issues, setIssues] = useState<ValidationIssue[]>(MOCK_VALIDATION_ISSUES);
  const [filteredIssues, setFilteredIssues] = useState<ValidationIssue[]>(MOCK_VALIDATION_ISSUES);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    severity: 'all',
    status: 'all',
    category: 'all',
    proposal: 'all',
    timeframe: 'all',
    sortBy: 'severity',
    sortOrder: 'desc',
  });

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...issues];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        issue =>
          issue.message.toLowerCase().includes(filters.search.toLowerCase()) ||
          issue.proposalTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
          issue.ruleName.toLowerCase().includes(filters.search.toLowerCase()) ||
          issue.context.customer.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(issue => issue.severity === filters.severity);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(issue => issue.status === filters.status);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(issue => issue.category === filters.category);
    }

    // Proposal filter
    if (filters.proposal !== 'all') {
      filtered = filtered.filter(issue => issue.proposalId === filters.proposal);
    }

    // Timeframe filter
    if (filters.timeframe !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();

      switch (filters.timeframe) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      if (filters.timeframe !== 'all') {
        filtered = filtered.filter(issue => issue.detectedAt >= cutoffDate);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case 'severity':
          const severityOrder = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
          aValue = severityOrder[a.severity];
          bValue = severityOrder[b.severity];
          break;
        case 'detectedAt':
          aValue = a.detectedAt;
          bValue = b.detectedAt;
          break;
        case 'proposal':
          aValue = a.proposalTitle;
          bValue = b.proposalTitle;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        default:
          aValue = a.updatedAt;
          bValue = b.updatedAt;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredIssues(filtered);
  }, [issues, filters]);

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      severity: 'all',
      status: 'all',
      category: 'all',
      proposal: 'all',
      timeframe: 'all',
      sortBy: 'severity',
      sortOrder: 'desc',
    });
  }, []);

  // Analytics tracking
  const trackAction = useCallback(
    (action: string, metadata: any = {}) => {
      console.log('Validation Analytics:', {
        action,
        metadata,
        timestamp: Date.now(),
        filters: filters,
        issueCount: filteredIssues.length,
      });
    },
    [filters, filteredIssues.length]
  );

  // Severity badge component
  const SeverityBadge = ({ severity }: { severity: IssueSeverity }) => {
    const getSeverityStyle = (severity: IssueSeverity) => {
      switch (severity) {
        case IssueSeverity.CRITICAL:
          return 'bg-red-100 text-red-800';
        case IssueSeverity.HIGH:
          return 'bg-orange-100 text-orange-800';
        case IssueSeverity.MEDIUM:
          return 'bg-yellow-100 text-yellow-800';
        case IssueSeverity.LOW:
          return 'bg-blue-100 text-blue-800';
        case IssueSeverity.INFO:
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getSeverityStyle(
          severity
        )}`}
      >
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </span>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: IssueStatus }) => {
    const getStatusStyle = (status: IssueStatus) => {
      switch (status) {
        case IssueStatus.OPEN:
          return 'bg-red-100 text-red-800';
        case IssueStatus.IN_PROGRESS:
          return 'bg-blue-100 text-blue-800';
        case IssueStatus.RESOLVED:
          return 'bg-green-100 text-green-800';
        case IssueStatus.SUPPRESSED:
          return 'bg-gray-100 text-gray-800';
        case IssueStatus.DEFERRED:
          return 'bg-purple-100 text-purple-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(
          status
        )}`}
      >
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const total = issues.length;
    const critical = issues.filter(i => i.severity === IssueSeverity.CRITICAL).length;
    const open = issues.filter(i => i.status === IssueStatus.OPEN).length;
    const resolved = issues.filter(i => i.status === IssueStatus.RESOLVED).length;
    const avgResolutionTime = 4.2; // Mock data - hours

    return {
      total,
      critical,
      open,
      resolved,
      avgResolutionTime,
    };
  }, [issues]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Validation Dashboard</h1>
              <p className="text-gray-600">
                Monitor proposal validation and manage configuration issues
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => {
                  trackAction('view_validation_rules');
                  // Navigate to rules management
                }}
                className="flex items-center"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
                Manage Rules
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  trackAction('run_validation_scan');
                  // Trigger validation scan
                }}
                className="flex items-center"
              >
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                Run Validation
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.total}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ExclamationCircleIcon className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.critical}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <XCircleIcon className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.open}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.resolved}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardMetrics.avgResolutionTime}h
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-5xl">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search issues, proposals, rules, or customers..."
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Severity Filter */}
                <Select
                  value={filters.severity}
                  options={[
                    { value: 'all', label: 'All Severity' },
                    { value: 'critical', label: 'Critical' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                    { value: 'info', label: 'Info' },
                  ]}
                  onChange={(value: string) => handleFilterChange('severity', value)}
                />

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'open', label: 'Open' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'resolved', label: 'Resolved' },
                    { value: 'suppressed', label: 'Suppressed' },
                    { value: 'deferred', label: 'Deferred' },
                  ]}
                  onChange={(value: string) => handleFilterChange('status', value)}
                />

                {/* Category Filter */}
                <Select
                  value={filters.category}
                  options={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'product_config', label: 'Product Config' },
                    { value: 'pricing', label: 'Pricing' },
                    { value: 'compliance', label: 'Compliance' },
                    { value: 'licensing', label: 'Licensing' },
                    { value: 'technical', label: 'Technical' },
                    { value: 'business_rules', label: 'Business Rules' },
                  ]}
                  onChange={(value: string) => handleFilterChange('category', value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="secondary" onClick={clearFilters} size="sm">
                  <FunnelIcon className="w-4 h-4 mr-1" />
                  Clear
                </Button>
                <span className="text-sm text-gray-600">
                  {filteredIssues.length} of {issues.length} issues
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Issues List */}
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <div className="p-6 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </Card>
            ))
          ) : filteredIssues.length === 0 ? (
            // Empty state
            <Card>
              <div className="p-12 text-center">
                <ShieldCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No validation issues found
                </h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.severity !== 'all' || filters.status !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'All proposals are passing validation rules.'}
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    if (filters.search || filters.severity !== 'all' || filters.status !== 'all') {
                      clearFilters();
                    } else {
                      trackAction('run_validation_scan');
                    }
                  }}
                >
                  {filters.search || filters.severity !== 'all' || filters.status !== 'all'
                    ? 'Clear Filters'
                    : 'Run Validation Scan'}
                </Button>
              </div>
            </Card>
          ) : (
            // Issue cards
            filteredIssues.map(issue => (
              <Card
                key={issue.id}
                className={`hover:shadow-lg transition-shadow duration-200 ${
                  selectedIssue === issue.id ? 'ring-2 ring-blue-500' : ''
                } ${issue.severity === IssueSeverity.CRITICAL ? 'border-l-4 border-red-500' : ''}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{issue.message}</h3>
                        <SeverityBadge severity={issue.severity} />
                        <StatusBadge status={issue.status} />
                      </div>
                      <p className="text-gray-600 mb-2">{issue.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Rule: {issue.ruleName}</span>
                        <span>•</span>
                        <span>Proposal: {issue.proposalTitle}</span>
                        <span>•</span>
                        <span>Customer: {issue.context.customer}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          trackAction('view_issue_details', { issueId: issue.id });
                          setSelectedIssue(issue.id);
                        }}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      {issue.status === IssueStatus.OPEN && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            trackAction('fix_issue', { issueId: issue.id });
                            // Navigate to fix interface
                          }}
                        >
                          <WrenchScrewdriverIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="w-4 h-4 mr-2 text-green-600">$</span>
                      Value: ${issue.context.proposalValue.toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      Detected: {issue.detectedAt.toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DocumentTextIcon className="w-4 h-4 mr-2" />
                      Section: {issue.section}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          issue.category === RuleCategory.PRODUCT_CONFIG
                            ? 'bg-blue-500'
                            : issue.category === RuleCategory.PRICING
                            ? 'bg-green-500'
                            : issue.category === RuleCategory.COMPLIANCE
                            ? 'bg-red-500'
                            : issue.category === RuleCategory.LICENSING
                            ? 'bg-purple-500'
                            : issue.category === RuleCategory.TECHNICAL
                            ? 'bg-orange-500'
                            : 'bg-gray-500'
                        }`}
                      />
                      {issue.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>

                  {/* Fix Suggestions */}
                  {issue.fixSuggestions.length > 0 && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">
                        Suggested Fixes ({issue.fixSuggestions.length}):
                      </span>
                      <div className="space-y-2">
                        {issue.fixSuggestions.slice(0, 2).map(suggestion => (
                          <div
                            key={suggestion.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {suggestion.title}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    suggestion.confidence >= 90
                                      ? 'bg-green-100 text-green-800'
                                      : suggestion.confidence >= 75
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {suggestion.confidence}% confidence
                                </span>
                                {suggestion.automatable && (
                                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                    Auto-fix
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{suggestion.impact}</p>
                            </div>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                trackAction('apply_fix_suggestion', {
                                  issueId: issue.id,
                                  suggestionId: suggestion.id,
                                });
                                // Apply fix logic
                              }}
                              disabled={issue.status !== IssueStatus.OPEN}
                            >
                              Apply Fix
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolution Info */}
                  {issue.resolution && (
                    <div className="pt-4 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-700 mb-2 block">
                        Resolution:
                      </span>
                      <div className="flex items-start space-x-3 text-sm">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{issue.resolution.appliedBy}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">
                              {issue.resolution.appliedAt.toLocaleDateString()}
                            </span>
                            {issue.resolution.verified && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">{issue.resolution.details}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
