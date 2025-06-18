/**
 * PosalPro MVP2 - Validation Dashboard Component
 * Main validation dashboard integrating all validation components
 * Based on VALIDATION_DASHBOARD_SCREEN.md wireframe specifications
 * Component Traceability: US-3.1, US-3.2, US-3.3, H8 hypothesis tracking
 */

'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useValidation } from '@/hooks/validation/useValidation';
import { useValidationAnalytics } from '@/hooks/validation/useValidationAnalytics';
import { ValidationIssue, ValidationRequest } from '@/types/validation';
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PlayIcon,
  PlusIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useState } from 'react';
import { ValidationIssueList } from './ValidationIssueList';
import { ValidationProgressMonitor } from './ValidationProgressMonitor';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: [
    'AC-3.1.1', // Real-time validation
    'AC-3.1.2', // Fix suggestions
    'AC-3.1.3', // Error reduction tracking
    'AC-3.1.4', // Visual indicators
    'AC-3.2.1', // License validation
    'AC-3.2.2', // Component warnings
    'AC-3.2.3', // Pricing impact
    'AC-3.2.4', // Speed improvements
    'AC-3.3.1', // Standards compliance
    'AC-3.3.2', // Version compatibility
    'AC-3.3.3', // Exportable reports
  ],
  methods: [
    'validateConfiguration()',
    'trackValidationMetrics()',
    'generateReports()',
    'manageValidationRules()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

interface ValidationDashboardProps {
  proposalId?: string;
  showMonitor?: boolean;
  showAnalytics?: boolean;
  onIssueSelect?: (issue: ValidationIssue) => void;
  onNavigateToProposal?: (proposalId: string) => void;
}

export function ValidationDashboard({
  proposalId,
  showMonitor = true,
  showAnalytics = true,
  onIssueSelect,
  onNavigateToProposal,
}: ValidationDashboardProps) {
  const [activeTab, setActiveTab] = useState('issues');
  const [selectedProposal, setSelectedProposal] = useState<string | undefined>(proposalId);

  const {
    issues,
    isValidating,
    activeIssueCount,
    criticalIssueCount,
    lastValidated,
    validateConfiguration,
    applyFixSuggestion,
    batchApplyFix,
    getValidationSummary,
    startRealTimeValidation,
  } = useValidation();

  const { currentMetrics, getH8Status, generateH8ProgressReport, exportAnalyticsData } =
    useValidationAnalytics();

  // Start a new validation
  const handleStartValidation = useCallback(async () => {
    if (!selectedProposal) return;

    const request: ValidationRequest = {
      proposalId: selectedProposal,
      products: [], // Would be populated from proposal data
      rules: 'all',
      mode: 'complete',
    };

    try {
      await validateConfiguration(request);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [selectedProposal, validateConfiguration]);

  // Handle issue detail view
  const handleIssueSelect = useCallback(
    (issue: ValidationIssue) => {
      if (onIssueSelect) {
        onIssueSelect(issue);
      } else {
        // Default behavior - navigate to proposal
        if (onNavigateToProposal && issue.proposalId) {
          onNavigateToProposal(issue.proposalId);
        }
      }
    },
    [onIssueSelect, onNavigateToProposal]
  );

  // Handle fix application
  const handleFixApplication = useCallback(
    async (issueId: string, fixId: string) => {
      const success = await applyFixSuggestion(issueId, fixId);
      if (success) {
        // Optionally trigger re-validation or refresh
        console.log('Fix applied successfully');
      }
      return success;
    },
    [applyFixSuggestion]
  );

  // Handle batch operations
  const handleBatchOperation = useCallback(
    async (issueIds: string[], operation: string) => {
      switch (operation) {
        case 'auto_fix':
          await batchApplyFix(issueIds, 'automatic');
          break;
        case 'suppress':
          // Handle suppression logic
          console.log('Suppressing issues:', issueIds);
          break;
        case 'defer':
          // Handle deferral logic
          console.log('Deferring issues:', issueIds);
          break;
        default:
          console.warn('Unknown batch operation:', operation);
      }
    },
    [batchApplyFix]
  );

  // Export validation report
  const handleExportReport = useCallback(async () => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    try {
      const data = await exportAnalyticsData(startDate, endDate);

      // Create and download report
      const reportData = {
        summary: getValidationSummary(),
        h8Progress: getH8Status(),
        performanceComparison: generateH8ProgressReport(),
        issues: issues,
        metrics: currentMetrics,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation-report-${selectedProposal || 'all'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  }, [
    exportAnalyticsData,
    getValidationSummary,
    getH8Status,
    generateH8ProgressReport,
    issues,
    currentMetrics,
    selectedProposal,
  ]);

  const validationSummary = getValidationSummary();
  const h8Status = getH8Status();

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage validation issues across all proposals
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportReport}
            className="flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Report
          </Button>

          <Button
            onClick={handleStartValidation}
            disabled={isValidating || !selectedProposal}
            className="flex items-center gap-2"
          >
            <PlayIcon className="h-4 w-4" />
            {isValidating ? 'Validating...' : 'Start Validation'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <p className="text-2xl font-bold text-gray-900">{criticalIssueCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Issues</p>
              <p className="text-2xl font-bold text-gray-900">{activeIssueCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">H8 Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {h8Status.currentReduction.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Efficiency Gain</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentMetrics.userEfficiencyGain.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Validation Issues - Takes 2/3 of the space */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="issues" className="flex items-center gap-2">
                <ExclamationCircleIcon className="h-4 w-4" />
                Active Issues
                {activeIssueCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {activeIssueCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                Rules
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="issues" className="mt-4">
              <ValidationIssueList
                issues={issues}
                onIssueSelect={handleIssueSelect}
                onFixApply={handleFixApplication}
                onBatchOperation={handleBatchOperation}
                showFilters={true}
                showBatchActions={true}
                maxHeight="calc(100vh - 400px)"
              />
            </TabsContent>

            <TabsContent value="rules" className="mt-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Validation Rules</h3>
                  <Button size="sm" className="flex items-center gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add Rule
                  </Button>
                </div>

                <div className="text-center py-8 text-gray-500">
                  <WrenchScrewdriverIcon className="h-12 w-12 mx-auto mb-4" />
                  <p>Validation rules management interface coming soon</p>
                  <p className="text-sm mt-2">
                    This will include the visual rule builder from the wireframe
                  </p>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation History</h3>

                <div className="space-y-3">
                  {lastValidated ? (
                    <div className="border border-gray-200 rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Last Validation</h4>
                          <p className="text-sm text-gray-500">{lastValidated.toLocaleString()}</p>
                        </div>
                        <Badge variant="success">Complete</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        Found {validationSummary.total} issues, resolved{' '}
                        {validationSummary.resolved}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ClockIcon className="h-12 w-12 mx-auto mb-4" />
                      <p>No validation history available</p>
                      <p className="text-sm mt-2">Run your first validation to see history here</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Progress Monitor - Takes 1/3 of the space */}
        {showMonitor && (
          <div className="lg:col-span-1">
            <ValidationProgressMonitor
              proposalId={selectedProposal}
              showH8Progress={showAnalytics}
              showPerformanceMetrics={showAnalytics}
              autoRefresh={true}
              refreshInterval={5000}
            />
          </div>
        )}
      </div>

      {/* H8 Hypothesis Status Banner */}
      {showAnalytics && (
        <Card
          className={`p-4 border-l-4 ${
            h8Status.isOnTrack
              ? 'border-l-green-500 bg-green-50'
              : 'border-l-yellow-500 bg-yellow-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-full ${
                  h8Status.isOnTrack ? 'bg-green-100' : 'bg-yellow-100'
                }`}
              >
                <ShieldCheckIcon
                  className={`h-5 w-5 ${h8Status.isOnTrack ? 'text-green-600' : 'text-yellow-600'}`}
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  H8 Hypothesis: 50% Error Reduction Target
                </h3>
                <p className="text-sm text-gray-600">
                  Current progress: {h8Status.currentReduction.toFixed(1)}% error reduction (
                  {h8Status.progressPercentage.toFixed(0)}% of target)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {h8Status.confidenceLevel.toFixed(0)}% confidence
              </div>
              <div className="text-xs text-gray-500">
                Est. {h8Status.daysToTarget} days to target
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
