'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 6: Review & Finalize
 * Based on PROPOSAL_CREATION_SCREEN.md Review Step wireframe specifications
 * Supports component traceability and analytics integration for H7 & H3 hypothesis validation
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Select } from '@/components/ui/Select';
import { useProposalCreationAnalytics } from '@/hooks/proposals/useProposalCreationAnalytics';
import { useResponsive } from '@/hooks/useResponsive';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { ProposalWizardStep6Data } from '@/lib/validation/schemas/proposal';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-4.1'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-4.1.1', 'AC-4.1.3'],
  methods: ['validateProposal()', 'generateInsights()', 'predictSuccess()'],
  hypotheses: ['H7', 'H3'],
  testCases: ['TC-H7-001', 'TC-H3-001'],
};

// Validation issue interface
interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  suggestions?: string[];
}

// Compliance check interface
interface ComplianceCheck {
  requirement: string;
  passed: boolean;
  details?: string;
}

// AI insights interface
interface ProposalInsights {
  complexity: 'low' | 'medium' | 'high';
  winProbability: number;
  estimatedEffort: number;
  similarProposals: Array<{
    id: string;
    title: string;
    winRate: number;
    similarity: number;
  }>;
  keyDifferentiators: string[];
  suggestedFocusAreas: string[];
  riskFactors: string[];
}

// Approval interface
interface Approval {
  reviewer: string;
  approved: boolean;
  comments?: string;
  timestamp?: Date;
}

// Validation schema for review step
const reviewStepSchema = z.object({
  finalReviewComplete: z.boolean(),
  exportFormat: z.enum(['pdf', 'docx', 'html']),
  additionalComments: z.string().optional(),
});

type ReviewStepFormData = z.infer<typeof reviewStepSchema>;

interface ReviewStepProps {
  data: Partial<ProposalWizardStep6Data>;
  onUpdate: (data: Partial<ProposalWizardStep6Data>) => void;
  onNext?: () => void;
  analytics: ReturnType<typeof useProposalCreationAnalytics>;
  allWizardData?: {
    step1?: { client?: { name?: string }; details?: { title?: string; dueDate?: string | Date } };
    step3?: { selectedContent?: Array<{ item?: { id?: string; title?: string }; section?: string }> };
    step4?: { products?: Array<{ id: string; quantity?: number; unitPrice?: number }> };
    step5?: { sections?: Array<{ title?: string; assignedTo?: string | string[]; hours?: number; priority?: unknown; status?: unknown }> };
    totalEstimatedHours?: number;
  };
  proposalMetadata?: { projectType?: string; budget?: number };
  teamData?: { teamMembers?: Array<{ id?: string; name?: string; expertise?: string }> };
  contentData?: { selectedContent?: Array<{ item?: { id?: string; title?: string }; section?: string }> };
  productData?: { products?: Array<{ id: string; quantity?: number; unitPrice?: number }> };
}

export function ReviewStep({
  data,
  onUpdate,
  onNext,
  analytics,
  allWizardData,
  proposalMetadata,
  teamData,
  contentData,
  productData,
}: ReviewStepProps) {
  // ✅ MOBILE OPTIMIZATION: Add responsive detection
  const { isMobile } = useResponsive();

  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [loadingValidation, setLoadingValidation] = useState(true);
  const [errorValidation, setErrorValidation] = useState<string | null>(null);

  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [loadingCompliance, setLoadingCompliance] = useState(true);
  const [errorCompliance, setErrorCompliance] = useState<string | null>(null);

  const [insights, setInsights] = useState<ProposalInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [errorInsights, setErrorInsights] = useState<string | null>(null);

  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [errorApprovals, setErrorApprovals] = useState<string | null>(null);

  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);
  const debouncedUpdateRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  // Fetch validation issues
  useEffect(() => {
    // Mock data instead of API call
    setValidationIssues([
      {
        severity: 'info',
        message: 'All validation checks passed',
        field: 'general',
      },
    ]);
    setLoadingValidation(false);
  }, []);

  // Fetch compliance checks
  useEffect(() => {
    // Mock data instead of API call
    setComplianceChecks([
      {
        requirement: 'Document completeness',
        passed: true,
        details: 'All required sections are complete',
      },
    ]);
    setLoadingCompliance(false);
  }, []);

  // Fetch AI insights
  useEffect(() => {
    // Mock data instead of API call
    setInsights({
      complexity: 'medium',
      winProbability: 75,
      estimatedEffort: 120,
      similarProposals: [],
      keyDifferentiators: ['Quality assurance', 'Technical expertise'],
      suggestedFocusAreas: ['Implementation timeline'],
      riskFactors: ['Resource availability'],
    });
    setLoadingInsights(false);
  }, []);

  // Fetch approvals
  useEffect(() => {
    // Mock data instead of API call
    setApprovals([
      {
        reviewer: 'Technical Lead',
        approved: true,
        timestamp: new Date(),
      },
    ]);
    setLoadingApprovals(false);
  }, []);

  const {
    register,
    setValue,
    formState: { errors, isValid },
    getValues,
  } = useForm<ReviewStepFormData>({
    resolver: zodResolver(reviewStepSchema),
    defaultValues: {
      finalReviewComplete: data.finalReviewComplete || false,
      exportFormat: data.exportOptions?.format || 'pdf',
      additionalComments: '',
    },
    // ✅ CRITICAL FIX: Mobile-optimized validation mode
    mode: isMobile ? 'onBlur' : 'onChange',
    reValidateMode: 'onBlur',
    criteriaMode: 'firstError',
  });

  // Calculate overall validity
  const calculateOverallValidity = useCallback(() => {
    const hasErrors = validationIssues.some(issue => issue.severity === 'error');
    const allPassed = complianceChecks.every(check => check.passed);
    const hasApprovals = approvals.filter(a => a.approved).length >= 0;
    const hasInsights = !!(insights && insights.winProbability > 50);

    return !hasErrors && allPassed && hasApprovals && hasInsights;
  }, [validationIssues, complianceChecks, approvals, insights]);

  // Calculate completeness score
  const calculateCompleteness = useCallback(() => {
    const validationScore = 1 - validationIssues.length / 10;
    const complianceScore =
      complianceChecks.length > 0
        ? complianceChecks.filter(c => c.passed).length / complianceChecks.length
        : 1;
    const approvalScore = approvals.length > 0 ? approvals.filter(a => a.approved).length / 5 : 1;
    const insightScore = insights ? insights.winProbability / 100 : 0;

    return Math.round(
      ((validationScore + complianceScore + approvalScore + insightScore) / 4) * 100
    );
  }, [validationIssues, complianceChecks, approvals, insights]);

  // ✅ PERFORMANCE OPTIMIZATION: Manual form data collection instead of watch()
  const collectFormData = useCallback((): ProposalWizardStep6Data => {
    const currentValues = getValues();

    // Create a default insights object if none exists
    const defaultInsights = {
      complexity: 'medium' as const,
      winProbability: 50,
      estimatedEffort: 100,
      similarProposals: [],
      keyDifferentiators: [],
      suggestedFocusAreas: [],
      riskFactors: [],
    };

    return {
      finalValidation: {
        isValid: calculateOverallValidity(),
        completeness: calculateCompleteness(),
        issues: validationIssues,
        complianceChecks: complianceChecks,
      },
      approvals: approvals,
      insights: insights || defaultInsights, // Use default if insights is null
      exportOptions: {
        format: currentValues.exportFormat || 'pdf',
        includeAppendices: true,
        includeTeamDetails: true,
        includeTimeline: true,
      },
      finalReviewComplete: currentValues.finalReviewComplete || false,
    };
  }, [
    getValues,
    calculateOverallValidity,
    calculateCompleteness,
    validationIssues,
    complianceChecks,
    approvals,
    insights,
  ]);

  // Initialize data from props
  useEffect(() => {
    if (data.approvals) {
      setApprovals(data.approvals);
    }
  }, [data]);

  // Stable update function to prevent infinite loops
  const handleUpdate = useCallback((formattedData: ProposalWizardStep6Data) => {
    const dataHash = JSON.stringify(formattedData);

    if (dataHash !== lastSentDataRef.current) {
      lastSentDataRef.current = dataHash;
      onUpdateRef.current(formattedData);
    }
  }, []);

  // Update parent component when form data changes
  useEffect(() => {
    if (!insights) return; // Don't update parent if insights are not loaded yet

    const timeoutId = setTimeout(() => {
      const formattedData: ProposalWizardStep6Data = collectFormData();

      handleUpdate(formattedData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    collectFormData,
    handleUpdate,
    calculateOverallValidity,
    calculateCompleteness,
    validationIssues,
    complianceChecks,
    approvals,
    insights,
  ]);

  // Track analytics for review step
  const trackReviewAction = useCallback(
    (action: 'start' | 'complete' | 'error') => {
      console.log('[ReviewStep] Tracking review action:', action);
      analytics?.trackWizardStep?.(6, 'review', action);
    },
    [analytics]
  );

  // Generate AI insights
  const generateAIInsights = useCallback(async () => {
    if (!allWizardData) return;
    setIsGeneratingInsights(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setInsights({
      complexity: 'medium',
      winProbability: Math.floor(Math.random() * 30) + 60,
      estimatedEffort: (allWizardData.totalEstimatedHours || 100) * (0.8 + Math.random() * 0.4),
      similarProposals: [],
      keyDifferentiators: ['New differentiator'],
      suggestedFocusAreas: ['New focus area'],
      riskFactors: ['New risk factor'],
    });
    setIsGeneratingInsights(false);
  }, [allWizardData]);

  // Handle approval toggle
  const toggleApproval = useCallback(
    (reviewerName: string) => {
      setApprovals(prev =>
        prev.map(approval =>
          approval.reviewer === reviewerName
            ? {
                ...approval,
                approved: !approval.approved,
                timestamp: !approval.approved ? new Date() : undefined,
              }
            : approval
        )
      );

      trackReviewAction('start');
    },
    [trackReviewAction]
  );

  // Export proposal
  const exportProposal = useCallback(
    (format: 'pdf' | 'docx' | 'html') => {
      trackReviewAction('complete');
      // In production, this would trigger the export process
      alert(`Exporting proposal as ${format.toUpperCase()}...`);
    },
    [trackReviewAction]
  );

  // Summary statistics
  const summaryStats = useMemo(() => {
    const totalApprovals = approvals.length;
    const completedApprovals = approvals.filter(a => a.approved).length;
    const errorCount = validationIssues.filter(i => i.severity === 'error').length;
    const warningCount = validationIssues.filter(i => i.severity === 'warning').length;
    const passedCompliance = complianceChecks.filter(c => c.passed).length;

    return {
      totalApprovals,
      completedApprovals,
      errorCount,
      warningCount,
      passedCompliance,
      totalCompliance: complianceChecks.length,
      approvalRate: (completedApprovals / totalApprovals) * 100,
      complianceRate: (passedCompliance / complianceChecks.length) * 100,
      overallValid: calculateOverallValidity(),
      completeness: calculateCompleteness(),
    };
  }, [
    approvals,
    validationIssues,
    complianceChecks,
    calculateOverallValidity,
    calculateCompleteness,
  ]);

  const handleCreateProposal = () => {
    console.log('[ReviewStep][Bottom Button] Create Proposal button clicked');
    console.log('[ReviewStep][Bottom Button] Current form values:', getValues());
    console.log('[ReviewStep][Bottom Button] Current data:', data);
    console.log('[ReviewStep][Bottom Button] All wizard data:', allWizardData);
    console.log(
      '[ReviewStep][Bottom Button] Final review complete:',
      getValues().finalReviewComplete
    );
    console.log('[ReviewStep][Bottom Button] Overall valid:', summaryStats.overallValid);

    try {
      console.log('[ReviewStep][Bottom Button] Starting proposal creation process');

      // Track the review completion
      console.log('[ReviewStep][Bottom Button] Tracking review completion');
      trackReviewAction('complete');

      // Prepare the update data
      const updateData = collectFormData();

      console.log('[ReviewStep][Bottom Button] Updating step data with:', updateData);
      onUpdate(updateData);

      // Call onNext to trigger proposal creation
      if (onNext) {
        console.log('[ReviewStep][Bottom Button] Calling onNext to trigger proposal creation');
        onNext();
      } else {
        console.warn('[ReviewStep][Bottom Button] onNext callback is not provided');
      }
    } catch (error) {
      // ✅ ENHANCED: Use proper logger instead of console.error
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        error,
        'Failed to create proposal',
        ErrorCodes.DATA.CREATE_FAILED,
        {
          component: 'ReviewStep',
          operation: 'createProposal',
          proposalData: JSON.stringify(allWizardData),
        }
      );

      logError('Error during proposal creation', error, {
        component: 'ReviewStep',
        operation: 'createProposal',
        proposalData: JSON.stringify(allWizardData),
        standardError: standardError.message,
        errorCode: standardError.code,
      });

      // setError('Failed to create proposal. Please try again.'); // This line was not in the new_code, so it's removed.
    }
  };

  return (
    <div className="space-y-8">
      {/* Proposal Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Proposal Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Title:</span>
                <span className="font-medium">
                  {allWizardData?.step1?.details?.title || 'Cloud Migration Services'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Client:</span>
                <span className="font-medium">
                  {allWizardData?.step1?.client?.name || 'Acme Corporation'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className="font-medium">June 15, 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Priority:</span>
                <span className="font-medium text-red-600">High</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Team Lead:</span>
                <span className="font-medium">Mohamed Rabah</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sales Rep:</span>
                <span className="font-medium">Sarah Johnson</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Estimated Value:</span>
                <span className="font-medium text-green-600">$250,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Effort:</span>
                <span className="font-medium">{insights?.estimatedEffort}h</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Validation Results */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Validation Results
          </h3>

          {/* Overall Status */}
          <div className="mb-6 p-4 rounded-lg border-2 border-dashed">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-medium">Overall Status</span>
              <div
                className={`flex items-center ${
                  summaryStats.overallValid ? 'text-green-600' : 'text-amber-600'
                }`}
              >
                {summaryStats.overallValid ? (
                  <CheckCircleIcon className="w-5 h-5 mr-1" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 mr-1" />
                )}
                <span className="font-medium">
                  {summaryStats.overallValid ? 'Ready to Submit' : 'Issues Need Attention'}
                </span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Completeness: {summaryStats.completeness.toFixed(0)}%</span>
              <span>
                Approvals: {summaryStats.completedApprovals}/{summaryStats.totalApprovals}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  summaryStats.completeness >= 90
                    ? 'bg-green-600'
                    : summaryStats.completeness >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${summaryStats.completeness}%` }}
              />
            </div>
          </div>

          {/* Compliance Checks */}
          <div className="space-y-3 mb-6">
            <h4 className="font-medium text-gray-900">Compliance Checks</h4>
            {loadingCompliance ? (
              <p>Loading compliance checks...</p>
            ) : errorCompliance ? (
              <p className="text-red-500">{errorCompliance}</p>
            ) : (
              <ul className="space-y-2">
                {complianceChecks.map((check, index) => (
                  <li key={index} className="flex items-center text-sm">
                    {check.passed ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-red-500 mr-2" />
                    )}
                    <span>{check.requirement}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Validation Issues */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Issues & Recommendations</h4>
            {loadingValidation ? (
              <p>Loading validation issues...</p>
            ) : errorValidation ? (
              <p className="text-red-500">{errorValidation}</p>
            ) : validationIssues.length > 0 ? (
              <ul className="space-y-3">
                {validationIssues.map((issue, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      {issue.severity === 'error' && (
                        <XCircleIcon className="w-5 h-5 text-red-500" />
                      )}
                      {issue.severity === 'warning' && (
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                      )}
                      {issue.severity === 'info' && (
                        <InformationCircleIcon className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-800">{issue.message}</p>
                      {issue.suggestions && (
                        <p className="text-xs text-gray-500 mt-1">
                          Suggestion: {issue.suggestions.join(', ')}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No validation issues found.</p>
            )}
          </div>
        </div>
      </Card>

      {/* AI-Powered Insights */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <SparklesIcon className="w-5 h-5 text-purple-500 mr-2" />
              AI-Powered Insights
            </h4>
            <Button
              variant="secondary"
              onClick={generateAIInsights}
              disabled={isGeneratingInsights}
            >
              {isGeneratingInsights ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>

          {loadingInsights ? (
            <p>Loading AI insights...</p>
          ) : errorInsights ? (
            <p className="text-red-500">{errorInsights}</p>
          ) : insights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Win Probability */}
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">{insights.winProbability}%</p>
                <p className="text-sm text-gray-600">Predicted Win Probability</p>
              </div>

              {/* Estimated Effort */}
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">{insights.estimatedEffort}h</p>
                <p className="text-sm text-gray-600">Estimated Effort</p>
              </div>

              {/* Key Differentiators */}
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Key Differentiators</h5>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {insights.keyDifferentiators.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Risk Factors */}
              <div>
                <h5 className="font-medium text-gray-800 mb-2">Risk Factors</h5>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {insights.riskFactors.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p>No AI insights available.</p>
          )}
        </div>
      </Card>

      {/* Approval Status */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Approval Status
          </h3>

          <div className="space-y-3">
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-4">Approvals</h4>
              {loadingApprovals ? (
                <p>Loading approvals...</p>
              ) : errorApprovals ? (
                <p className="text-red-500">{errorApprovals}</p>
              ) : (
                <ul className="space-y-3">
                  {approvals.map((approval, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        {approval.approved ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                        ) : (
                          <ClockIcon className="w-5 h-5 text-amber-500 mr-2" />
                        )}
                        <span className="text-sm">{approval.reviewer}</span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          approval.approved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {approval.approved ? 'Approved' : 'Pending'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Export Options */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            Export Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <Select
                value={getValues().exportFormat}
                options={[
                  { value: 'pdf', label: 'PDF Document' },
                  { value: 'docx', label: 'Word Document' },
                  { value: 'html', label: 'HTML Page' },
                ]}
                onChange={(value: string) =>
                  setValue('exportFormat', value as 'pdf' | 'docx' | 'html')
                }
              />
            </div>

            <div className="flex items-end">
              <div className="space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => exportProposal(getValues().exportFormat)}
                  className="flex items-center"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export Preview
                </Button>
                <Button
                  variant="primary"
                  onClick={() => exportProposal(getValues().exportFormat)}
                  disabled={!summaryStats.overallValid}
                  className="flex items-center"
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Export Final
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Final Review Confirmation */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Final Review</h3>
              <p className="text-sm text-gray-600 mt-1">
                Confirm that all information is accurate and complete before creating the proposal.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('finalReviewComplete')}
                  className="mr-2"
                  onChange={e => {
                    console.log(
                      '[ReviewStep][Bottom Button] Final review checkbox changed:',
                      e.target.checked
                    );
                  }}
                />
                <span className="text-sm">I have reviewed all information</span>
              </label>
              <Button
                variant="primary"
                size="lg"
                disabled={!getValues().finalReviewComplete || !summaryStats.overallValid}
                onClick={() => {
                  console.log('[ReviewStep][Bottom Button] Create Proposal button clicked');
                  handleCreateProposal();
                }}
                className="flex items-center"
              >
                <CheckIcon className="w-5 h-5 mr-2" />
                Create Proposal
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              summaryStats.overallValid ? 'bg-success-600' : 'bg-amber-500'
            }`}
          />
          <span className="text-sm text-neutral-600">
            Step 6 of 6: {summaryStats.overallValid ? 'Ready to Submit' : 'Review Required'}
          </span>
        </div>
        <div className="text-sm text-neutral-600">
          {summaryStats.completeness.toFixed(0)}% complete • {summaryStats.completedApprovals}/
          {summaryStats.totalApprovals} approvals
        </div>
      </div>
    </div>
  );
}
