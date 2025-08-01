'use client';

/**
 * PosalPro MVP2 - Workflow Orchestrator Component
 * Based on APPROVAL_WORKFLOW_SCREEN.md wireframe specifications
 * Implements intelligent workflow orchestration with timeline optimization
 *
 * User Stories: US-4.1, US-4.3
 * Hypotheses: H7 (40% on-time improvement)
 * Component Traceability: WorkflowOrchestrator, complexityEstimation(), calculatePriority(), routeApproval()
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Progress } from '@/components/ui/Progress';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import {
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState } from 'react';

// Types for workflow orchestration
interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals';
    value: string | number | boolean;
  }>;
  actions: Array<{
    type: 'add_stage' | 'remove_stage' | 'set_priority' | 'auto_approve' | 'escalate';
    target: string;
    value?: string | number;
  }>;
  priority: number;
  isActive: boolean;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  proposalType: string;
  stages: WorkflowStage[];
  rules: WorkflowRule[];
  averageDuration: number;
  successRate: number;
  usageCount: number;
}

interface WorkflowStage {
  id: string;
  name: string;
  type: 'Technical' | 'Legal' | 'Finance' | 'Executive' | 'Security' | 'Compliance';
  isRequired: boolean;
  canRunInParallel: boolean;
  estimatedDuration: number;
  slaHours: number;
  dependencies: string[];
  approverRoles: string[];
  escalationRules: {
    at80Percent: boolean;
    at120Percent: boolean;
    bypasAfterSLA: boolean;
  };
}

interface ComplexityFactors {
  proposalValue: number;
  customTerms: boolean;
  internationalCustomer: boolean;
  regulatedData: boolean;
  customPricing: boolean;
  strategicAccount: boolean;
  renewalType: boolean;
  discountPercentage: number;
  productComplexity: number;
  teamSize: number;
}

// Original single-proposal interface
interface SingleProposalOrchestratorProps {
  proposalId: string;
  proposalValue: number;
  proposalType: string;
  complexityFactors: ComplexityFactors;
  onWorkflowGenerated: (workflow: GeneratedWorkflow) => void;
}

// Multi-proposal interface for approval page
interface MultiProposalOrchestratorProps {
  proposals: Array<{
    id: string;
    title: string;
    value: number;
    priority: string;
    currentStage: string;
    assignee: string;
    dueDate: Date;
    riskLevel: string;
    metadata: Record<string, string | number | boolean | Date>;
  }>;
  templates: Array<{
    id: string;
    name: string;
    description: string;
    stages: string[];
    category: string;
    estimatedDuration: number;
    complexity: string;
    successRate: number;
    isActive: boolean;
  }>;
  onWorkflowGenerate: (proposalId: string, workflow: GeneratedWorkflow) => void;
  onTemplateSelect: (template: WorkflowTemplate) => void;
}

type WorkflowOrchestratorProps = SingleProposalOrchestratorProps | MultiProposalOrchestratorProps;

interface GeneratedWorkflow {
  id: string;
  proposalId: string;
  template: WorkflowTemplate;
  stages: WorkflowStage[];
  estimatedDuration: number;
  criticalPath: string[];
  parallelStages: string[][];
  complexityScore: number;
  priority: 'High' | 'Medium' | 'Low';
  slaCompliance: number;
  riskFactors: string[];
}

export function WorkflowOrchestrator(props: WorkflowOrchestratorProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const isMultiProposal = 'proposals' in props;

  // Hooks must be called unconditionally at the top level.
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const workflowTemplates = useMemo<WorkflowTemplate[]>(() => [
    {
      id: 'template-standard-enterprise',
      name: 'Standard Enterprise Deal',
      description: 'For typical enterprise-level proposals with standard terms.',
      proposalType: 'Enterprise',
      stages: [
        { id: 'tech-review', name: 'Technical Review', type: 'Technical', isRequired: true, canRunInParallel: false, estimatedDuration: 16, slaHours: 48, dependencies: [], approverRoles: ['Solutions Architect'], escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false } },
        { id: 'legal-review', name: 'Legal Review', type: 'Legal', isRequired: true, canRunInParallel: true, estimatedDuration: 24, slaHours: 72, dependencies: ['tech-review'], approverRoles: ['Legal Counsel'], escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false } },
        { id: 'finance-review', name: 'Finance Review', type: 'Finance', isRequired: true, canRunInParallel: true, estimatedDuration: 8, slaHours: 24, dependencies: ['tech-review'], approverRoles: ['Financial Analyst'], escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false } },
        { id: 'exec-approval', name: 'Executive Approval', type: 'Executive', isRequired: true, canRunInParallel: false, estimatedDuration: 4, slaHours: 24, dependencies: ['legal-review', 'finance-review'], approverRoles: ['VP of Sales'], escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false } },
      ],
      rules: [],
      averageDuration: 52,
      successRate: 85,
      usageCount: 120,
    },
    {
      id: 'template-smb-fast-track',
      name: 'SMB Fast-Track',
      description: 'An accelerated workflow for small to medium-sized businesses.',
      proposalType: 'SMB',
      stages: [
        { id: 'manager-approval', name: 'Manager Approval', type: 'Executive', isRequired: true, canRunInParallel: false, estimatedDuration: 2, slaHours: 8, dependencies: [], approverRoles: ['Sales Manager'], escalationRules: { at80Percent: false, at120Percent: true, bypasAfterSLA: true } },
        { id: 'finance-check', name: 'Finance Check', type: 'Finance', isRequired: true, canRunInParallel: false, estimatedDuration: 1, slaHours: 4, dependencies: ['manager-approval'], approverRoles: ['Finance Clerk'], escalationRules: { at80Percent: false, at120Percent: false, bypasAfterSLA: true } },
      ],
      rules: [],
      averageDuration: 3,
      successRate: 95,
      usageCount: 450,
    },
  ], []);

  const complexityEstimation = useCallback((factors: ComplexityFactors | undefined): number => {
    if (!factors) return 0;
    let score = 0;
    if (factors.proposalValue > 100000) score += 2;
    if (factors.customTerms) score += 3;
    if (factors.internationalCustomer) score += 1.5;
    if (factors.regulatedData) score += 2.5;
    if (factors.discountPercentage > 20) score += 1;
    return Math.min(score, 10);
  }, []);

  const calculatePriority = useCallback((value: number, complexity: number): 'High' | 'Medium' | 'Low' => {
    if (value > 250000 || complexity > 7) return 'High';
    if (value > 50000 || complexity > 4) return 'Medium';
    return 'Low';
  }, []);

  const analyzeCriticalPath = useCallback((stages: WorkflowStage[]): string[] => {
    // Simplified critical path analysis: assumes a linear dependency chain for non-parallel stages.
    return stages
      .filter(stage => !stage.canRunInParallel)
      .map(stage => stage.id);
  }, []);

  const { complexityFactors, proposalValue } = useMemo(() => {
    if (!isMultiProposal) {
      return { complexityFactors: props.complexityFactors, proposalValue: props.proposalValue };
    }
    return { complexityFactors: undefined, proposalValue: 0 };
  }, [isMultiProposal, props]);

  const complexityScore = useMemo(
    () => complexityEstimation(complexityFactors),
    [complexityFactors, complexityEstimation]
  );

  const priority = useMemo(
    () => calculatePriority(proposalValue, complexityScore),
    [proposalValue, complexityScore, calculatePriority]
  );

  const riskScore = useMemo(() => {
    let score = complexityScore * 0.4;
    if (priority === 'High') score += 3;
    if (priority === 'Medium') score += 1.5;
    return Math.min(score, 10);
  }, [complexityScore, priority]);

  const slaCompliance = useMemo(() => {
    const baseCompliance = 98;
    const riskPenalty = riskScore * 0.5;
    return Math.max(baseCompliance - riskPenalty, 75);
  }, [riskScore]);

  const generateWorkflow = useCallback(() => {
    if (isMultiProposal || !complexityFactors) return;

    const { proposalId, proposalType, onWorkflowGenerated } = props;

    setIsGenerating(true);
    analytics(
      'workflow_generation_started',
      { proposalId, proposalType, proposalValue },
      'high'
    );

    setTimeout(() => {
      try {
        const currentComplexityScore = complexityEstimation(complexityFactors);
        const currentPriority = calculatePriority(proposalValue, currentComplexityScore);

        const template =
          workflowTemplates.find((t) => t.proposalType === proposalType) || workflowTemplates[0];
        const finalStages = [...template.stages];

        if (currentComplexityScore > 8) {
          if (!finalStages.find((s) => s.type === 'Security')) {
            finalStages.push({
              id: 'security-review',
              name: 'Security Review',
              type: 'Security',
              isRequired: true,
              canRunInParallel: true,
              estimatedDuration: 8,
              slaHours: 24,
              dependencies: ['tech-review'],
              approverRoles: ['Security Architect'],
              escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false },
            });
          }
        }

        if (complexityFactors.customTerms && !finalStages.find((s) => s.type === 'Legal')) {
          finalStages.push({
            id: 'legal-review-custom',
            name: 'Legal Review (Custom Terms)',
            type: 'Legal',
            isRequired: true,
            canRunInParallel: true,
            estimatedDuration: 12,
            slaHours: 36,
            dependencies: ['tech-review'],
            approverRoles: ['Senior Legal Counsel'],
            escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false },
          });
        }

        const criticalPath = analyzeCriticalPath(finalStages);
        const parallelStages = finalStages.filter(s => s.canRunInParallel).map(s => [s.id]);
        const estimatedDuration = finalStages.reduce((acc, s) => acc + s.estimatedDuration, 0);
        const riskFactors = finalStages.filter(s => !s.isRequired).map(s => `Optional stage: ${s.name}`);

        const generated: GeneratedWorkflow = {
          id: `wf-${Date.now()}`,
          proposalId,
          template,
          stages: finalStages,
          estimatedDuration,
          criticalPath,
          parallelStages,
          complexityScore: currentComplexityScore,
          priority: currentPriority,
          slaCompliance: 95, // Placeholder
          riskFactors,
        };

        analytics('workflow_generated', { proposalId, complexityScore: currentComplexityScore, stagesTotal: finalStages.length, criticalPathLength: criticalPath.length, parallelStagesCount: parallelStages.length, estimatedDuration, priority: currentPriority, riskFactors: riskFactors.length }, 'high');
        onWorkflowGenerated(generated);
        setSelectedTemplate(template);

      } catch (error) {
        console.error('Workflow generation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        analytics('workflow_generation_error', { proposalId, error: errorMessage }, 'high');
      } finally {
        setIsGenerating(false);
      }
    }, 500); // Simulate network delay

  }, [isMultiProposal, props, analytics, analyzeCriticalPath, calculatePriority, complexityEstimation, workflowTemplates, complexityFactors, proposalValue]);

  // Early return for multi-proposal mode, after all hooks have been called.
  if (isMultiProposal) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Multi-Proposal Workflow Orchestrator</h2>
        <p className="text-sm text-gray-500">This interface is under development. Please select a single proposal to configure its workflow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Workflow Intelligence</h3>
          <p className="text-sm text-gray-500">
            Real-time analysis of your proposal's complexity, priority, and risk.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Complexity Score */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Complexity Score</div>
              <div className="text-2xl font-bold text-gray-900">{complexityScore.toFixed(1)} / 10</div>
              <Progress value={complexityScore * 10} className="mt-1" />
            </div>
          </div>

          {/* Priority Level */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Priority Level</div>
              <div className="text-2xl font-bold text-gray-900">{priority}</div>
            </div>
          </div>

          {/* Risk Score */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Risk Score</div>
              <div className="text-2xl font-bold text-gray-900">{riskScore.toFixed(1)} / 10</div>
              <Progress value={riskScore * 10} className="mt-1" />
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">SLA Compliance</div>
              <div className="text-2xl font-bold text-gray-900">{slaCompliance.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Workflow Generation</h3>
          <p className="text-sm text-gray-500">
            Select a template and generate an optimized approval workflow.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {workflowTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                {selectedTemplate?.id === template.id && (
                  <CheckCircleIcon className="h-6 w-6 text-blue-500" />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">Powered by Intelligent Workflow Engine</p>
          <Button onClick={generateWorkflow} disabled={isGenerating || !selectedTemplate}>
            {isGenerating ? (
              <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <PlayIcon className="h-5 w-5 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Workflow'}
          </Button>
        </div>
      </Card>


      {/* Selected Template Preview */}
      {selectedTemplate && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Template: {selectedTemplate.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <ChartBarIcon className="h-3 w-3 mr-1" />
                {selectedTemplate.successRate}% Success Rate
              </Badge>
              <Badge variant="outline">
                <ClockIcon className="h-3 w-3 mr-1" />
                {selectedTemplate.averageDuration}h Avg.
              </Badge>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-4">{selectedTemplate.description}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedTemplate.stages.map((stage) => (
              <div key={stage.id} className="p-3 border rounded-lg bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">{stage.name}</div>
                  {stage.isRequired ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Type: {stage.type}</div>
                  <div>SLA: {stage.slaHours}h</div>
                  <div>Est: {stage.estimatedDuration}h</div>
                  {stage.canRunInParallel && (
                    <Badge size="sm" variant="default">
                      Parallel
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
