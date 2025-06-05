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
// import { useAnalytics } from '@/hooks/analytics/useAnalytics';
import {
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.2'],
  methods: ['complexityEstimation()', 'calculatePriority()', 'routeApproval()'],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-002'],
};

// Types for workflow orchestration
interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'not_equals';
    value: string | number | boolean;
  }[];
  actions: {
    type: 'add_stage' | 'remove_stage' | 'set_priority' | 'auto_approve' | 'escalate';
    target: string;
    value?: string | number;
  }[];
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
    metadata: Record<string, any>;
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
  onWorkflowGenerate: (proposalId: string, workflow: any) => void;
  onTemplateSelect: (template: any) => void;
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
  // Type guard to determine which interface is being used
  const isMultiProposal = 'proposals' in props;

  // Handle multi-proposal interface temporarily with placeholder
  if (isMultiProposal) {
    const { proposals, templates, onWorkflowGenerate, onTemplateSelect } = props;
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Proposal Orchestrator</h3>
        <p className="text-gray-600 mb-4">
          Managing {proposals.length} proposals across {templates.length} templates
        </p>
        <p className="text-sm text-gray-500">This interface is under development</p>
      </div>
    );
  }

  // Handle single proposal interface
  const { proposalId, proposalValue, proposalType, complexityFactors, onWorkflowGenerated } = props;
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [customRules, setCustomRules] = useState<WorkflowRule[]>([]);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  // const analytics = useAnalytics();
  const analytics = {
    track: (event: string, data: any) => {
      console.log(`Analytics: ${event}`, data);
    },
  };

  // Mock workflow templates - in production, fetch from API
  const workflowTemplates: WorkflowTemplate[] = useMemo(
    () => [
      {
        id: 'template-enterprise',
        name: 'Enterprise Approval',
        description: 'For high-value enterprise proposals',
        proposalType: 'enterprise',
        averageDuration: 72,
        successRate: 94,
        usageCount: 156,
        stages: [
          {
            id: 'tech-review',
            name: 'Technical Review',
            type: 'Technical',
            isRequired: true,
            canRunInParallel: false,
            estimatedDuration: 8,
            slaHours: 24,
            dependencies: [],
            approverRoles: ['Technical Lead', 'Solution Architect'],
            escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false },
          },
          {
            id: 'finance-review',
            name: 'Financial Review',
            type: 'Finance',
            isRequired: true,
            canRunInParallel: true,
            estimatedDuration: 4,
            slaHours: 12,
            dependencies: ['tech-review'],
            approverRoles: ['Finance Manager', 'Finance Director'],
            escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: true },
          },
          {
            id: 'legal-review',
            name: 'Legal Review',
            type: 'Legal',
            isRequired: false,
            canRunInParallel: true,
            estimatedDuration: 6,
            slaHours: 24,
            dependencies: ['tech-review'],
            approverRoles: ['Legal Counsel', 'Compliance Officer'],
            escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false },
          },
          {
            id: 'exec-approval',
            name: 'Executive Approval',
            type: 'Executive',
            isRequired: false,
            canRunInParallel: false,
            estimatedDuration: 2,
            slaHours: 8,
            dependencies: ['finance-review', 'legal-review'],
            approverRoles: ['Vice President', 'C-Level Executive'],
            escalationRules: { at80Percent: true, at120Percent: false, bypasAfterSLA: false },
          },
        ],
        rules: [],
      },
      {
        id: 'template-standard',
        name: 'Standard Approval',
        description: 'For mid-tier proposals',
        proposalType: 'standard',
        averageDuration: 24,
        successRate: 98,
        usageCount: 487,
        stages: [
          {
            id: 'manager-review',
            name: 'Manager Review',
            type: 'Executive',
            isRequired: true,
            canRunInParallel: false,
            estimatedDuration: 2,
            slaHours: 8,
            dependencies: [],
            approverRoles: ['Sales Manager', 'Regional Manager'],
            escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: true },
          },
          {
            id: 'finance-check',
            name: 'Finance Check',
            type: 'Finance',
            isRequired: false,
            canRunInParallel: false,
            estimatedDuration: 1,
            slaHours: 4,
            dependencies: ['manager-review'],
            approverRoles: ['Finance Manager'],
            escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: true },
          },
        ],
        rules: [],
      },
    ],
    []
  );

  // AC-4.1.1: Complexity-based estimation
  const complexityEstimation = useCallback((factors: ComplexityFactors): number => {
    let score = 0;

    // Value-based complexity - with null safety
    const proposalValue = factors.proposalValue || 0;
    if (proposalValue > 1000000) score += 3;
    else if (proposalValue > 500000) score += 2;
    else if (proposalValue > 100000) score += 1;

    // Feature-based complexity
    if (factors.customTerms) score += 2;
    if (factors.internationalCustomer) score += 2;
    if (factors.regulatedData) score += 3;
    if (factors.customPricing) score += 2;
    if (factors.strategicAccount) score += 1;
    if (factors.discountPercentage > 15) score += 2;

    // Simplification factors
    if (factors.renewalType) score -= 2;

    // Product and team complexity
    score += Math.floor(factors.productComplexity / 2);
    score += Math.floor(factors.teamSize / 3);

    // Normalize to 0-10 scale
    return Math.max(0, Math.min(10, score));
  }, []);

  // AC-4.3.1: Priority calculation algorithm
  const calculatePriority = useCallback(
    (complexity: number, value: number, dueDate?: Date): 'High' | 'Medium' | 'Low' => {
      let priorityScore = 0;

      // Complexity weight (0-4 points)
      priorityScore += complexity * 0.4;

      // Value weight (0-3 points)
      if (value > 1000000) priorityScore += 3;
      else if (value > 500000) priorityScore += 2;
      else if (value > 100000) priorityScore += 1;

      // Urgency weight (0-3 points)
      if (dueDate) {
        const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 1) priorityScore += 3;
        else if (daysUntilDue <= 3) priorityScore += 2;
        else if (daysUntilDue <= 7) priorityScore += 1;
      }

      // Categorize priority
      if (priorityScore >= 7) return 'High';
      if (priorityScore >= 4) return 'Medium';
      return 'Low';
    },
    []
  );

  // AC-4.1.2: Critical path identification
  const identifyCriticalPath = useCallback((stages: WorkflowStage[]): string[] => {
    const stageMap = new Map(stages.map(stage => [stage.id, stage]));
    const visited = new Set<string>();
    const criticalPath: string[] = [];

    // Find stages with no dependencies first
    const rootStages = stages.filter(stage => stage.dependencies.length === 0);

    const dfs = (
      stageId: string,
      currentPath: string[],
      totalDuration: number
    ): { path: string[]; duration: number } => {
      if (visited.has(stageId)) return { path: currentPath, duration: totalDuration };

      visited.add(stageId);
      const stage = stageMap.get(stageId);
      if (!stage) return { path: currentPath, duration: totalDuration };

      const newPath = [...currentPath, stageId];
      const newDuration = totalDuration + stage.estimatedDuration;

      // Find dependent stages
      const dependentStages = stages.filter(s => s.dependencies.includes(stageId));

      if (dependentStages.length === 0) {
        return { path: newPath, duration: newDuration };
      }

      // Find the longest path through dependencies
      let longestPath = { path: newPath, duration: newDuration };
      for (const dependent of dependentStages) {
        const result = dfs(dependent.id, newPath, newDuration);
        if (result.duration > longestPath.duration) {
          longestPath = result;
        }
      }

      return longestPath;
    };

    // Find the longest critical path
    let longestCriticalPath = { path: [], duration: 0 };
    for (const rootStage of rootStages) {
      visited.clear();
      const result = dfs(rootStage.id, [], 0);
      if (result.duration > longestCriticalPath.duration) {
        longestCriticalPath = result;
      }
    }

    return longestCriticalPath.path;
  }, []);

  // Generate workflow based on complexity and rules
  const generateWorkflow = useCallback(async () => {
    setIsGenerating(true);

    try {
      // AC-4.1.1: Calculate complexity
      const complexityScore = complexityEstimation(complexityFactors);

      // Select appropriate template
      const template = complexityScore >= 7 ? workflowTemplates[0] : workflowTemplates[1];
      setSelectedTemplate(template);

      // Apply conditional rules to modify stages
      let finalStages = [...template.stages];

      // Enterprise-specific rules
      if (complexityFactors.proposalValue > 500000) {
        const execStage = finalStages.find(s => s.id === 'exec-approval');
        if (execStage) execStage.isRequired = true;
      }

      if (complexityFactors.customTerms || complexityFactors.internationalCustomer) {
        const legalStage = finalStages.find(s => s.id === 'legal-review');
        if (legalStage) legalStage.isRequired = true;
      }

      if (complexityFactors.regulatedData) {
        // Add security review stage
        finalStages.push({
          id: 'security-review',
          name: 'Security Review',
          type: 'Security',
          isRequired: true,
          canRunInParallel: true,
          estimatedDuration: 4,
          slaHours: 16,
          dependencies: ['tech-review'],
          approverRoles: ['Security Officer', 'CISO'],
          escalationRules: { at80Percent: true, at120Percent: true, bypasAfterSLA: false },
        });
      }

      // Filter to required stages only
      finalStages = finalStages.filter(stage => stage.isRequired);

      // AC-4.1.2: Identify critical path
      const criticalPath = identifyCriticalPath(finalStages);

      // Calculate parallel stages
      const parallelStages: string[][] = [];
      const processedStages = new Set<string>();

      for (const stage of finalStages) {
        if (processedStages.has(stage.id)) continue;

        if (stage.canRunInParallel) {
          const parallelGroup = finalStages
            .filter(
              s =>
                s.canRunInParallel &&
                !processedStages.has(s.id) &&
                JSON.stringify(s.dependencies) === JSON.stringify(stage.dependencies)
            )
            .map(s => s.id);

          if (parallelGroup.length > 1) {
            parallelStages.push(parallelGroup);
            parallelGroup.forEach(id => processedStages.add(id));
          }
        }
      }

      // Calculate total estimated duration
      const estimatedDuration = Math.max(
        ...criticalPath.map(stageId => {
          const stage = finalStages.find(s => s.id === stageId);
          return stage ? stage.estimatedDuration : 0;
        })
      );

      // AC-4.3.1: Calculate priority
      const priority = calculatePriority(complexityScore, complexityFactors.proposalValue);

      // Generate risk factors
      const riskFactors: string[] = [];
      if (complexityScore >= 8) riskFactors.push('High complexity proposal');
      if (complexityFactors.customTerms) riskFactors.push('Custom terms require legal review');
      if (complexityFactors.discountPercentage > 15)
        riskFactors.push('High discount may require executive approval');
      if (complexityFactors.internationalCustomer)
        riskFactors.push('International regulations apply');

      const generatedWorkflow: GeneratedWorkflow = {
        id: `workflow-${proposalId}-${Date.now()}`,
        proposalId,
        template,
        stages: finalStages,
        estimatedDuration,
        criticalPath,
        parallelStages,
        complexityScore,
        priority,
        slaCompliance: 95, // Calculate based on historical data
        riskFactors,
      };

      // Track analytics for H7 hypothesis validation
      analytics.track('workflow_generated', {
        proposalId,
        complexityScore,
        stagesTotal: finalStages.length,
        criticalPathLength: criticalPath.length,
        parallelStagesCount: parallelStages.length,
        estimatedDuration,
        priority,
        riskFactors: riskFactors.length,
        timestamp: Date.now(),
      });

      onWorkflowGenerated(generatedWorkflow);
    } catch (error) {
      console.error('Workflow generation failed:', error);
      analytics.track('workflow_generation_error', {
        proposalId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    complexityFactors,
    proposalId,
    workflowTemplates,
    complexityEstimation,
    calculatePriority,
    identifyCriticalPath,
    analytics,
    onWorkflowGenerated,
  ]);

  const complexityScore = useMemo(
    () => complexityEstimation(complexityFactors),
    [complexityFactors, complexityEstimation]
  );
  const priority = useMemo(
    () => calculatePriority(complexityScore, complexityFactors.proposalValue || 0),
    [complexityScore, complexityFactors.proposalValue, calculatePriority]
  );

  return (
    <div className="space-y-6">
      {/* Complexity Analysis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Workflow Intelligence</h3>
          <Badge
            variant={
              complexityScore >= 7 ? 'warning' : complexityScore >= 4 ? 'primary' : 'success'
            }
          >
            Complexity: {complexityScore}/10
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Complexity Factors</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Proposal Value</span>
                <span className="font-medium">
                  ${((complexityFactors.proposalValue || 0) / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="flex justify-between">
                <span>Custom Terms</span>
                <Badge variant={complexityFactors.customTerms ? 'warning' : 'success'} size="sm">
                  {complexityFactors.customTerms ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>International</span>
                <Badge
                  variant={complexityFactors.internationalCustomer ? 'warning' : 'success'}
                  size="sm"
                >
                  {complexityFactors.internationalCustomer ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Regulated Data</span>
                <Badge variant={complexityFactors.regulatedData ? 'error' : 'success'} size="sm">
                  {complexityFactors.regulatedData ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Recommended Template</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium">
                {complexityScore >= 7 ? 'Enterprise Approval' : 'Standard Approval'}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {complexityScore >= 7
                  ? 'Multi-stage approval with parallel processing'
                  : 'Streamlined approval for standard proposals'}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Avg. Duration: {complexityScore >= 7 ? '72' : '24'} hours
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Priority & Risk</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Priority Level</span>
                <Badge
                  variant={
                    priority === 'High' ? 'error' : priority === 'Medium' ? 'warning' : 'success'
                  }
                >
                  {priority}
                </Badge>
              </div>
              <Progress
                value={complexityScore * 10}
                className="h-2"
                variant={
                  complexityScore >= 7 ? 'error' : complexityScore >= 4 ? 'warning' : 'success'
                }
              />
              <div className="text-xs text-gray-500">
                Risk factors identified: {Object.values(complexityFactors).filter(Boolean).length}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Workflow Generation */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate Approval Workflow</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRuleBuilder(!showRuleBuilder)}
              className="flex items-center gap-2"
            >
              <CogIcon className="h-4 w-4" />
              Custom Rules
            </Button>
            <Button
              onClick={generateWorkflow}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Workflow'}
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Generate an intelligent approval workflow based on proposal complexity, value, and
          business rules. The system will automatically determine required stages, parallel
          processing opportunities, and critical path optimization.
        </div>

        {showRuleBuilder && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-3">Custom Workflow Rules</h4>
            <div className="text-sm text-gray-600">
              Configure custom business rules for workflow generation. Rules will be applied based
              on proposal characteristics and organizational policies.
            </div>
            <Button variant="outline" size="sm" className="mt-3 flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              Add Custom Rule
            </Button>
          </div>
        )}
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
            {selectedTemplate.stages.map((stage, index) => (
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
                    <Badge size="sm" variant="primary">
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
