'use client';

/**
 * PosalPro MVP2 - Proposal Creation Step 6: Review & Finalize
 * Based on PROPOSAL_CREATION_SCREEN.md Review Step wireframe specifications
 * Supports component traceability and analytics integration for H7 & H3 hypothesis validation
 */

import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/forms/Button';
import { ProposalWizardStep6Data } from '@/lib/validation/schemas/proposal';
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { zodResolver } from '@hookform/resolvers/zod';
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
  similarProposals: {
    id: string;
    title: string;
    winRate: number;
    similarity: number;
  }[];
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

// Mock data for demonstration
const MOCK_VALIDATION_ISSUES: ValidationIssue[] = [
  {
    severity: 'error',
    message: 'Executive approval pending from Maria Rodriguez (CFO)',
    field: 'approvals',
    suggestions: ['Request immediate review', 'Schedule approval meeting'],
  },
  {
    severity: 'warning',
    message: 'Security section assigned but not yet started',
    field: 'sections',
    suggestions: ['Follow up with Alex Peterson', 'Adjust timeline if needed'],
  },
  {
    severity: 'info',
    message: 'Consider adding implementation timeline details',
    field: 'content',
    suggestions: ['Add milestone dates', 'Include resource allocation timeline'],
  },
];

const MOCK_COMPLIANCE_CHECKS: ComplianceCheck[] = [
  { requirement: 'Basic information complete', passed: true },
  { requirement: 'All required SMEs assigned', passed: true },
  { requirement: 'Executive approval obtained', passed: false, details: 'CFO approval pending' },
  { requirement: 'Content selected for all required sections', passed: true },
  { requirement: 'No compliance issues detected', passed: true },
  { requirement: 'Timeline validates against requirements', passed: true },
  { requirement: 'Budget within approved limits', passed: true },
];

const MOCK_AI_INSIGHTS: ProposalInsights = {
  complexity: 'medium',
  winProbability: 72,
  estimatedEffort: 120,
  similarProposals: [
    { id: '1', title: 'Enterprise Cloud Migration - TechCorp', winRate: 85, similarity: 92 },
    { id: '2', title: 'Security Infrastructure Upgrade - SecureTech', winRate: 78, similarity: 87 },
    { id: '3', title: 'Digital Transformation - InnovateCorp', winRate: 65, similarity: 84 },
  ],
  keyDifferentiators: [
    'Comprehensive security framework',
    'Proven implementation methodology',
    'Dedicated 24/7 support team',
    'Cost-effective timeline',
  ],
  suggestedFocusAreas: [
    'Cost savings through automation',
    'Implementation timeline advantages',
    'Security and compliance expertise',
    'Post-implementation support',
  ],
  riskFactors: [
    'Complex dependency chain in technical sections',
    'Tight timeline requirements',
    'Multiple stakeholder approvals needed',
  ],
};

const MOCK_APPROVALS: Approval[] = [
  {
    reviewer: 'Mohamed Rabah (Team Lead)',
    approved: true,
    timestamp: new Date('2024-12-19T10:30:00'),
  },
  {
    reviewer: 'Sarah Johnson (Sales Rep)',
    approved: true,
    timestamp: new Date('2024-12-19T11:15:00'),
  },
  { reviewer: 'David Chen (CTO)', approved: true, timestamp: new Date('2024-12-19T14:20:00') },
  { reviewer: 'Maria Rodriguez (CFO)', approved: false },
  { reviewer: 'Robert Kim (CEO)', approved: false },
];

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
  analytics: any;
  allWizardData?: any; // Complete wizard data from all steps
}

export function ReviewStep({ data, onUpdate, analytics, allWizardData }: ReviewStepProps) {
  const [validationIssues, setValidationIssues] =
    useState<ValidationIssue[]>(MOCK_VALIDATION_ISSUES);
  const [complianceChecks, setComplianceChecks] =
    useState<ComplianceCheck[]>(MOCK_COMPLIANCE_CHECKS);
  const [insights, setInsights] = useState<ProposalInsights>(MOCK_AI_INSIGHTS);
  const [approvals, setApprovals] = useState<Approval[]>(MOCK_APPROVALS);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const lastSentDataRef = useRef<string>('');
  const onUpdateRef = useRef(onUpdate);

  // Keep onUpdate ref current
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
    getValues,
  } = useForm<ReviewStepFormData>({
    resolver: zodResolver(reviewStepSchema),
    defaultValues: {
      finalReviewComplete: false,
      exportFormat: 'pdf',
      additionalComments: '',
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Initialize data from props
  useEffect(() => {
    if (data.finalValidation) {
      setValidationIssues(data.finalValidation.issues || []);
      setComplianceChecks(data.finalValidation.complianceChecks || []);
    }
    if (data.insights) {
      setInsights(data.insights);
    }
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
    const timeoutId = setTimeout(() => {
      const formattedData: ProposalWizardStep6Data = {
        finalValidation: {
          isValid: calculateOverallValidity(),
          completeness: calculateCompleteness(),
          issues: validationIssues,
          complianceChecks: complianceChecks,
        },
        approvals: approvals,
        insights: insights,
        exportOptions: {
          format: watchedValues.exportFormat || 'pdf',
          includeAppendices: true,
          includeTeamDetails: true,
          includeTimeline: true,
        },
        finalReviewComplete: watchedValues.finalReviewComplete || false,
      };

      handleUpdate(formattedData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [validationIssues, complianceChecks, insights, approvals, watchedValues, handleUpdate]);

  // Calculate overall validity
  const calculateOverallValidity = useCallback((): boolean => {
    const hasErrors = validationIssues.some(issue => issue.severity === 'error');
    const compliancePassed = complianceChecks.every(check => check.passed);
    return !hasErrors && compliancePassed;
  }, [validationIssues, complianceChecks]);

  // Calculate completeness percentage
  const calculateCompleteness = useCallback((): number => {
    const totalChecks = complianceChecks.length;
    const passedChecks = complianceChecks.filter(check => check.passed).length;
    const errorCount = validationIssues.filter(issue => issue.severity === 'error').length;

    const baseScore = (passedChecks / totalChecks) * 100;
    const errorPenalty = errorCount * 10; // 10% penalty per error

    return Math.max(0, Math.min(100, baseScore - errorPenalty));
  }, [complianceChecks, validationIssues]);

  // Track analytics for review step
  const trackReviewAction = useCallback(
    (action: string, metadata: any = {}) => {
      analytics.trackWizardStep(6, 'Review & Finalize', action, {
        validationStatus: calculateOverallValidity(),
        completeness: calculateCompleteness(),
        issueCount: validationIssues.length,
        approvalCount: approvals.filter(a => a.approved).length,
        winProbability: insights.winProbability,
        ...metadata,
      });
    },
    [
      analytics,
      calculateOverallValidity,
      calculateCompleteness,
      validationIssues.length,
      approvals,
      insights.winProbability,
    ]
  );

  // Generate AI insights
  const generateAIInsights = useCallback(async () => {
    setIsGeneratingInsights(true);
    trackReviewAction('ai_insights_requested');

    // Simulate AI insight generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    // In production, this would call the AI service with all wizard data
    const enhancedInsights = {
      ...insights,
      winProbability: Math.min(100, insights.winProbability + Math.floor(Math.random() * 10)),
      keyDifferentiators: [...insights.keyDifferentiators, 'Advanced analytics capabilities'],
    };

    setInsights(enhancedInsights);
    setIsGeneratingInsights(false);

    trackReviewAction('ai_insights_generated', {
      newWinProbability: enhancedInsights.winProbability,
      insightsCount: enhancedInsights.keyDifferentiators.length,
    });
  }, [insights, trackReviewAction]);

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

      trackReviewAction('approval_toggled', { reviewer: reviewerName });
    },
    [trackReviewAction]
  );

  // Export proposal
  const exportProposal = useCallback(
    (format: 'pdf' | 'docx' | 'html') => {
      trackReviewAction('proposal_exported', { format });
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
                <span className="font-medium">{insights.estimatedEffort}h</span>
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
            {complianceChecks.map((check, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  {check.passed ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-600 mr-2" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 text-red-600 mr-2" />
                  )}
                  <span className="text-sm">{check.requirement}</span>
                </div>
                {check.details && <span className="text-xs text-gray-500">{check.details}</span>}
              </div>
            ))}
          </div>

          {/* Validation Issues */}
          {validationIssues.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Issues & Recommendations</h4>
              {validationIssues.map((issue, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-l-4 ${
                    issue.severity === 'error'
                      ? 'border-red-500 bg-red-50'
                      : issue.severity === 'warning'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start">
                    {issue.severity === 'error' && (
                      <XCircleIcon className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                    )}
                    {issue.severity === 'warning' && (
                      <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 mr-2 mt-0.5" />
                    )}
                    {issue.severity === 'info' && (
                      <InformationCircleIcon className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{issue.message}</p>
                      {issue.suggestions && issue.suggestions.length > 0 && (
                        <ul className="mt-1 text-xs text-gray-600">
                          {issue.suggestions.map((suggestion, i) => (
                            <li key={i}>• {suggestion}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* AI-Generated Insights */}
      <Card>
        <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 flex items-center">
              <SparklesIcon className="w-5 h-5 mr-2" />
              AI-Generated Insights
            </h3>
            <Button
              variant="secondary"
              onClick={generateAIInsights}
              disabled={isGeneratingInsights}
              loading={isGeneratingInsights}
              className="flex items-center"
            >
              Refresh Insights
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success Metrics */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4">Success Prediction</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Win Probability</span>
                    <span className="text-lg font-bold text-green-600">
                      {insights.winProbability}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${insights.winProbability}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Complexity:</span>
                  <span
                    className={`font-medium ${
                      insights.complexity === 'high'
                        ? 'text-red-600'
                        : insights.complexity === 'medium'
                        ? 'text-amber-600'
                        : 'text-green-600'
                    }`}
                  >
                    {insights.complexity.charAt(0).toUpperCase() + insights.complexity.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Est. Effort:</span>
                  <span className="font-medium">{insights.estimatedEffort} hours</span>
                </div>
              </div>
            </div>

            {/* Similar Proposals */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4">Similar Proposals</h4>
              <div className="space-y-3">
                {insights.similarProposals.slice(0, 3).map((proposal, index) => (
                  <div key={proposal.id} className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">{proposal.title}</p>
                      <p className="text-xs text-gray-500">Similarity: {proposal.similarity}%</p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        proposal.winRate >= 80
                          ? 'text-green-600'
                          : proposal.winRate >= 60
                          ? 'text-amber-600'
                          : 'text-red-600'
                      }`}
                    >
                      {proposal.winRate}% win
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Differentiators */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4">Key Differentiators</h4>
              <ul className="space-y-2">
                {insights.keyDifferentiators.map((differentiator, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <CheckIcon className="w-3 h-3 text-green-600 mr-2" />
                    {differentiator}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Focus Areas */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4">Suggested Focus Areas</h4>
              <ul className="space-y-2">
                {insights.suggestedFocusAreas.map((area, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <ChartBarIcon className="w-3 h-3 text-blue-600 mr-2" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Factors */}
          {insights.riskFactors.length > 0 && (
            <div className="mt-6 bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-4">Risk Factors</h4>
              <ul className="space-y-2">
                {insights.riskFactors.map((risk, index) => (
                  <li key={index} className="flex items-center text-sm text-amber-700">
                    <ExclamationTriangleIcon className="w-3 h-3 mr-2" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
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
            {approvals.map((approval, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  approval.approved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {approval.approved ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600 mr-3" />
                    ) : (
                      <ClockIcon className="w-5 h-5 text-gray-400 mr-3" />
                    )}
                    <div>
                      <p className="font-medium">{approval.reviewer}</p>
                      {approval.timestamp && (
                        <p className="text-xs text-gray-500">
                          Approved {approval.timestamp.toLocaleDateString()} at{' '}
                          {approval.timestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {approval.approved ? (
                      <span className="text-sm text-green-600 font-medium">Approved</span>
                    ) : (
                      <span className="text-sm text-amber-600 font-medium">Pending</span>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleApproval(approval.reviewer)}
                      className="ml-2"
                    >
                      {approval.approved ? 'Revoke' : 'Approve'}
                    </Button>
                  </div>
                </div>
                {approval.comments && (
                  <p className="mt-2 text-sm text-gray-600 italic">"{approval.comments}"</p>
                )}
              </div>
            ))}
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
                value={watchedValues.exportFormat}
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
                  onClick={() => exportProposal(watchedValues.exportFormat)}
                  className="flex items-center"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Export Preview
                </Button>
                <Button
                  variant="primary"
                  onClick={() => exportProposal(watchedValues.exportFormat)}
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
                <input type="checkbox" {...register('finalReviewComplete')} className="mr-2" />
                <span className="text-sm">I have reviewed all information</span>
              </label>
              <Button
                variant="primary"
                size="lg"
                disabled={!watchedValues.finalReviewComplete || !summaryStats.overallValid}
                onClick={() => trackReviewAction('proposal_created')}
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
