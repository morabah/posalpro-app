'use client';

/**
 * PosalPro MVP2 - Workflow Rule Builder Component
 * Based on APPROVAL_WORKFLOW_SCREEN.md wireframe specifications
 * Implements custom business rule configuration with conditional logic
 *
 * User Stories: US-4.1, US-4.2
 * Hypotheses: H7 (40% on-time improvement)
 * Component Traceability: WorkflowRuleBuilder, buildRules(), validateRules()
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
// import { useAnalytics } from '@/hooks/analytics/useAnalytics';
import {
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.2'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.2.1', 'AC-4.2.2'],
  methods: ['buildRules()', 'validateRules()', 'testRule()'],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-004'],
};

// Types for rule builder
interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  category: 'routing' | 'approval' | 'escalation' | 'notification' | 'validation';
  conditions: RuleCondition[];
  actions: RuleAction[];
  triggers: RuleTrigger[];
  exceptions: RuleException[];
  lastModified: Date;
  modifiedBy: string;
  testResults?: RuleTestResult[];
  isValid: boolean;
  validationErrors: string[];
}

interface RuleCondition {
  id: string;
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'in'
    | 'not_in'
    | 'regex';
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  logicalOperator?: 'AND' | 'OR';
  parentGroup?: string;
}

interface RuleAction {
  id: string;
  type:
    | 'route_to_stage'
    | 'assign_user'
    | 'send_notification'
    | 'set_priority'
    | 'escalate'
    | 'add_comment'
    | 'require_approval';
  parameters: Record<string, any>;
  delay?: number; // Minutes
  conditions?: string[]; // Condition IDs that must be met
}

interface RuleTrigger {
  id: string;
  event:
    | 'proposal_created'
    | 'stage_completed'
    | 'deadline_approaching'
    | 'value_threshold'
    | 'manual_trigger';
  timing: 'immediate' | 'delayed' | 'scheduled';
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    time?: string;
    days?: number[];
  };
}

interface RuleException {
  id: string;
  condition: string;
  action: 'skip_rule' | 'override_action' | 'escalate' | 'require_manual_review';
  reason: string;
}

interface RuleTestResult {
  id: string;
  testCase: string;
  input: Record<string, any>;
  expectedOutput: any;
  actualOutput: any;
  passed: boolean;
  executionTime: number;
  timestamp: Date;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: Partial<WorkflowRule>[];
  useCase: string;
  popularity: number;
}

interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  complexity: 'low' | 'medium' | 'high';
  performance: 'fast' | 'moderate' | 'slow';
}

interface WorkflowRuleBuilderProps {
  rules: WorkflowRule[];
  templates: RuleTemplate[];
  availableFields: string[];
  onRuleSave: (rule: WorkflowRule) => void;
  onRuleDelete: (ruleId: string) => void;
  onRuleTest: (rule: WorkflowRule, testData: any) => Promise<RuleTestResult>;
  onTemplateApply: (template: RuleTemplate) => void;
}

export function WorkflowRuleBuilder({
  rules,
  templates,
  availableFields,
  onRuleSave,
  onRuleDelete,
  onRuleTest,
  onTemplateApply,
}: WorkflowRuleBuilderProps) {
  const [activeTab, setActiveTab] = useState<'rules' | 'builder' | 'templates' | 'testing'>(
    'rules'
  );
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null);
  const [editingRule, setEditingRule] = useState<Partial<WorkflowRule> | null>(null);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [ruleValidation, setRuleValidation] = useState<RuleValidationResult | null>(null);
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<RuleTestResult[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // const analytics = useAnalytics();
  const analytics = {
    track: (event: string, data: any) => {
      console.log(`Analytics: ${event}`, data);
    },
  };

  // Mock templates for demonstration
  const MOCK_TEMPLATES: RuleTemplate[] = useMemo(
    () => [
      {
        id: 'tmpl-001',
        name: 'High-Value Proposal Escalation',
        description: 'Automatically escalate proposals over $500K to executive review',
        category: 'escalation',
        useCase: 'Enterprise deals requiring C-level approval',
        popularity: 95,
        rules: [
          {
            name: 'High-Value Escalation',
            category: 'escalation',
            conditions: [
              {
                id: 'c1',
                field: 'proposalValue',
                operator: 'greater_than',
                value: 500000,
                dataType: 'number',
              },
            ],
            actions: [
              {
                id: 'a1',
                type: 'escalate',
                parameters: { level: 'executive', reason: 'high_value' },
              },
            ],
          },
        ],
      },
      {
        id: 'tmpl-002',
        name: 'Rush Approval Workflow',
        description: 'Fast-track urgent proposals with priority routing',
        category: 'routing',
        useCase: 'Time-sensitive opportunities',
        popularity: 87,
        rules: [
          {
            name: 'Rush Priority Routing',
            category: 'routing',
            conditions: [
              {
                id: 'c1',
                field: 'priority',
                operator: 'equals',
                value: 'urgent',
                dataType: 'string',
              },
            ],
            actions: [
              {
                id: 'a1',
                type: 'set_priority',
                parameters: { priority: 'critical' },
              },
              {
                id: 'a2',
                type: 'route_to_stage',
                parameters: { stage: 'fast_track_review' },
              },
            ],
          },
        ],
      },
      {
        id: 'tmpl-003',
        name: 'SLA Deadline Monitoring',
        description: 'Monitor and alert on approaching SLA deadlines',
        category: 'notification',
        useCase: 'Proactive deadline management',
        popularity: 92,
        rules: [
          {
            name: 'SLA Alert',
            category: 'notification',
            conditions: [
              {
                id: 'c1',
                field: 'slaRemaining',
                operator: 'less_than',
                value: 2,
                dataType: 'number',
              },
            ],
            actions: [
              {
                id: 'a1',
                type: 'send_notification',
                parameters: {
                  type: 'sla_warning',
                  recipients: ['assignee', 'manager'],
                  message: 'SLA deadline approaching',
                },
              },
            ],
          },
        ],
      },
    ],
    []
  );

  // Filter and search rules
  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
      const matchesSearch =
        searchQuery === '' ||
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [rules, filterCategory, searchQuery]);

  // Rule validation function
  const validateRule = useCallback((rule: Partial<WorkflowRule>): RuleValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!rule.name?.trim()) errors.push('Rule name is required');
    if (!rule.conditions?.length) errors.push('At least one condition is required');
    if (!rule.actions?.length) errors.push('At least one action is required');

    // Condition validation
    rule.conditions?.forEach((condition, index) => {
      if (!condition.field) errors.push(`Condition ${index + 1}: Field is required`);
      if (!condition.operator) errors.push(`Condition ${index + 1}: Operator is required`);
      if (condition.value === undefined || condition.value === '') {
        errors.push(`Condition ${index + 1}: Value is required`);
      }
    });

    // Action validation
    rule.actions?.forEach((action, index) => {
      if (!action.type) errors.push(`Action ${index + 1}: Type is required`);
      if (!action.parameters || Object.keys(action.parameters).length === 0) {
        warnings.push(`Action ${index + 1}: No parameters specified`);
      }
    });

    // Performance analysis
    const complexity =
      rule.conditions?.length > 5 ? 'high' : rule.conditions?.length > 2 ? 'medium' : 'low';

    const performance = rule.conditions?.some(c => c.operator === 'regex')
      ? 'slow'
      : rule.conditions?.length > 10
        ? 'moderate'
        : 'fast';

    // Suggestions
    if (rule.conditions?.length > 3) {
      suggestions.push('Consider grouping conditions for better readability');
    }
    if (rule.actions?.length > 5) {
      suggestions.push('Consider splitting into multiple rules for maintainability');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      complexity,
      performance,
    };
  }, []);

  // Track rule builder analytics for H7 hypothesis validation
  useEffect(() => {
    analytics.track('rule_builder_viewed', {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.isActive).length,
      ruleCategories: [...new Set(rules.map(r => r.category))],
      timestamp: Date.now(),
    });
  }, [rules, analytics]);

  const handleRuleEdit = useCallback(
    (rule: WorkflowRule) => {
      setEditingRule({ ...rule });
      setSelectedRule(rule);
      setShowRuleForm(true);

      // Validate the rule
      const validation = validateRule(rule);
      setRuleValidation(validation);
    },
    [validateRule]
  );

  const handleRuleCreate = useCallback(() => {
    const newRule: Partial<WorkflowRule> = {
      id: `rule-${Date.now()}`,
      name: '',
      description: '',
      isActive: true,
      priority: 1,
      category: 'routing',
      conditions: [],
      actions: [],
      triggers: [],
      exceptions: [],
      lastModified: new Date(),
      modifiedBy: 'Current User',
      isValid: false,
      validationErrors: [],
    };

    setEditingRule(newRule);
    setSelectedRule(null);
    setShowRuleForm(true);
    setRuleValidation(validateRule(newRule));
  }, [validateRule]);

  const handleRuleSave = useCallback(() => {
    if (!editingRule) return;

    const validation = validateRule(editingRule);
    if (!validation.isValid) {
      setRuleValidation(validation);
      return;
    }

    const completeRule: WorkflowRule = {
      ...editingRule,
      id: editingRule.id || `rule-${Date.now()}`,
      name: editingRule.name || '',
      description: editingRule.description || '',
      isActive: editingRule.isActive ?? true,
      priority: editingRule.priority || 1,
      category: editingRule.category || 'routing',
      conditions: editingRule.conditions || [],
      actions: editingRule.actions || [],
      triggers: editingRule.triggers || [],
      exceptions: editingRule.exceptions || [],
      lastModified: new Date(),
      modifiedBy: 'Current User',
      isValid: true,
      validationErrors: [],
    };

    onRuleSave(completeRule);

    // Track rule creation/update analytics
    analytics.track('workflow_rule_saved', {
      ruleId: completeRule.id,
      category: completeRule.category,
      conditionCount: completeRule.conditions.length,
      actionCount: completeRule.actions.length,
      complexity: validation.complexity,
      timestamp: Date.now(),
    });

    setShowRuleForm(false);
    setEditingRule(null);
    setRuleValidation(null);
  }, [editingRule, validateRule, onRuleSave, analytics]);

  const handleRuleTest = useCallback(
    async (rule: WorkflowRule) => {
      try {
        const result = await onRuleTest(rule, testData);
        setTestResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results

        // Track rule testing analytics
        analytics.track('workflow_rule_tested', {
          ruleId: rule.id,
          testPassed: result.passed,
          executionTime: result.executionTime,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Rule test failed:', error);
      }
    },
    [testData, onRuleTest, analytics]
  );

  const handleTemplateApply = useCallback(
    (template: RuleTemplate) => {
      onTemplateApply(template);

      // Track template usage analytics
      analytics.track('rule_template_applied', {
        templateId: template.id,
        templateName: template.name,
        ruleCount: template.rules.length,
        timestamp: Date.now(),
      });
    },
    [onTemplateApply, analytics]
  );

  const addCondition = useCallback(() => {
    if (!editingRule) return;

    const newCondition: RuleCondition = {
      id: `condition-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      dataType: 'string',
    };

    setEditingRule(prev => ({
      ...prev,
      conditions: [...(prev?.conditions || []), newCondition],
    }));
  }, [editingRule]);

  const addAction = useCallback(() => {
    if (!editingRule) return;

    const newAction: RuleAction = {
      id: `action-${Date.now()}`,
      type: 'route_to_stage',
      parameters: {},
    };

    setEditingRule(prev => ({
      ...prev,
      actions: [...(prev?.actions || []), newAction],
    }));
  }, [editingRule]);

  const removeCondition = useCallback((conditionId: string) => {
    setEditingRule(prev => ({
      ...prev,
      conditions: prev?.conditions?.filter(c => c.id !== conditionId) || [],
    }));
  }, []);

  const removeAction = useCallback((actionId: string) => {
    setEditingRule(prev => ({
      ...prev,
      actions: prev?.actions?.filter(a => a.id !== actionId) || [],
    }));
  }, []);

  const updateCondition = useCallback((conditionId: string, updates: Partial<RuleCondition>) => {
    setEditingRule(prev => ({
      ...prev,
      conditions:
        prev?.conditions?.map(c => (c.id === conditionId ? { ...c, ...updates } : c)) || [],
    }));
  }, []);

  const updateAction = useCallback((actionId: string, updates: Partial<RuleAction>) => {
    setEditingRule(prev => ({
      ...prev,
      actions: prev?.actions?.map(a => (a.id === actionId ? { ...a, ...updates } : a)) || [],
    }));
  }, []);

  // Update validation when editing rule changes
  useEffect(() => {
    if (editingRule) {
      const validation = validateRule(editingRule);
      setRuleValidation(validation);
    }
  }, [editingRule, validateRule]);

  const getRuleCategoryColor = (category: string) => {
    switch (category) {
      case 'routing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approval':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'escalation':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'notification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'validation':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Rule Builder Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Workflow Rule Builder</h2>
            <p className="text-sm text-gray-600">
              Configure custom business rules for intelligent workflow automation
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">{rules.filter(r => r.isActive).length} Active Rules</Badge>
            <Button onClick={handleRuleCreate} className="flex items-center gap-2">
              <PlusIcon className="h-4 w-4" />
              New Rule
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{rules.length}</div>
            <div className="text-sm text-gray-600">Total Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {rules.filter(r => r.isValid).length}
            </div>
            <div className="text-sm text-gray-600">Valid Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{MOCK_TEMPLATES.length}</div>
            <div className="text-sm text-gray-600">Templates</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {testResults.filter(r => r.passed).length}
            </div>
            <div className="text-sm text-gray-600">Tests Passed</div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'rules', label: 'Rules', icon: AdjustmentsHorizontalIcon },
            { id: 'builder', label: 'Rule Builder', icon: CodeBracketIcon },
            { id: 'templates', label: 'Templates', icon: ClipboardDocumentIcon },
            { id: 'testing', label: 'Testing', icon: BeakerIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && (
        <Card className="p-6">
          {/* Rules List Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Active Rules ({filteredRules.length})</h3>
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="routing">Routing</option>
                <option value="approval">Approval</option>
                <option value="escalation">Escalation</option>
                <option value="notification">Notification</option>
                <option value="validation">Validation</option>
              </select>
              <input
                type="text"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3 py-1 border border-gray-200 rounded-md text-sm w-48"
              />
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {filteredRules.map(rule => (
              <div
                key={rule.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRuleEdit(rule)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <Badge size="sm" className={`border ${getRuleCategoryColor(rule.category)}`}>
                        {rule.category}
                      </Badge>
                      {!rule.isActive && (
                        <Badge size="sm" variant="outline">
                          Inactive
                        </Badge>
                      )}
                      {!rule.isValid && (
                        <Badge size="sm" variant="error">
                          Invalid
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{rule.conditions.length} conditions</span>
                      <span>{rule.actions.length} actions</span>
                      <span>Priority: {rule.priority}</span>
                      <span>Modified: {rule.lastModified.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleRuleTest(rule);
                      }}
                    >
                      <BeakerIcon className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        onRuleDelete(rule.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRules.length === 0 && (
            <div className="text-center py-12">
              <AdjustmentsHorizontalIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No rules found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create your first workflow rule or adjust your filters.
              </p>
              <Button onClick={handleRuleCreate} className="mt-4">
                Create Rule
              </Button>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'templates' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Rule Templates</h3>
            <Badge variant="primary">{MOCK_TEMPLATES.length} Available</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_TEMPLATES.map(template => (
              <div
                key={template.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <Badge
                      size="sm"
                      className={`mt-1 border ${getRuleCategoryColor(template.category)}`}
                    >
                      {template.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">{template.popularity}%</div>
                    <div className="text-xs text-gray-500">popularity</div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                <div className="text-xs text-gray-500 mb-3">
                  <div>Use case: {template.useCase}</div>
                  <div>Rules: {template.rules.length}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTemplateApply(template)}
                    className="flex-1"
                  >
                    Apply Template
                  </Button>
                  <Button variant="outline" size="sm">
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rule Builder Form Modal */}
      {showRuleForm && editingRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRule ? 'Edit Rule' : 'Create New Rule'}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowRuleForm(false)}>
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Basic Information */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rule Name *
                    </label>
                    <input
                      type="text"
                      value={editingRule.name || ''}
                      onChange={e => setEditingRule(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={editingRule.category || 'routing'}
                      onChange={e =>
                        setEditingRule(prev => ({ ...prev, category: e.target.value as any }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="routing">Routing</option>
                      <option value="approval">Approval</option>
                      <option value="escalation">Escalation</option>
                      <option value="notification">Notification</option>
                      <option value="validation">Validation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingRule.description || ''}
                    onChange={e =>
                      setEditingRule(prev => ({ ...prev, description: e.target.value }))
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Describe what this rule does"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingRule.isActive ?? true}
                      onChange={e =>
                        setEditingRule(prev => ({ ...prev, isActive: e.target.checked }))
                      }
                      className="mr-2"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editingRule.priority || 1}
                      onChange={e =>
                        setEditingRule(prev => ({ ...prev, priority: parseInt(e.target.value) }))
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Conditions Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Conditions</h4>
                  <Button size="sm" onClick={addCondition}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Condition
                  </Button>
                </div>

                <div className="space-y-3">
                  {editingRule.conditions?.map((condition, index) => (
                    <div key={condition.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <select
                            value={condition.field}
                            onChange={e => updateCondition(condition.id, { field: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select field</option>
                            {availableFields.map(field => (
                              <option key={field} value={field}>
                                {field}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            value={condition.operator}
                            onChange={e =>
                              updateCondition(condition.id, { operator: e.target.value as any })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="equals">Equals</option>
                            <option value="not_equals">Not Equals</option>
                            <option value="greater_than">Greater Than</option>
                            <option value="less_than">Less Than</option>
                            <option value="contains">Contains</option>
                            <option value="in">In</option>
                            <option value="not_in">Not In</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={condition.value}
                            onChange={e => updateCondition(condition.id, { value: e.target.value })}
                            placeholder="Value"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={condition.logicalOperator || 'AND'}
                            onChange={e =>
                              updateCondition(condition.id, {
                                logicalOperator: e.target.value as any,
                              })
                            }
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            disabled={index === editingRule.conditions!.length - 1}
                          >
                            <option value="AND">AND</option>
                            <option value="OR">OR</option>
                          </select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCondition(condition.id)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Actions</h4>
                  <Button size="sm" onClick={addAction}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Action
                  </Button>
                </div>

                <div className="space-y-3">
                  {editingRule.actions?.map(action => (
                    <div key={action.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <select
                            value={action.type}
                            onChange={e => updateAction(action.id, { type: e.target.value as any })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="route_to_stage">Route to Stage</option>
                            <option value="assign_user">Assign User</option>
                            <option value="send_notification">Send Notification</option>
                            <option value="set_priority">Set Priority</option>
                            <option value="escalate">Escalate</option>
                            <option value="add_comment">Add Comment</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={JSON.stringify(action.parameters)}
                            onChange={e => {
                              try {
                                const params = JSON.parse(e.target.value);
                                updateAction(action.id, { parameters: params });
                              } catch {}
                            }}
                            placeholder='{"key": "value"}'
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={action.delay || 0}
                            onChange={e =>
                              updateAction(action.id, { delay: parseInt(e.target.value) })
                            }
                            placeholder="Delay (min)"
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAction(action.id)}
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Results */}
              {ruleValidation && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Validation Results</h4>
                  <div className="space-y-2">
                    {ruleValidation.errors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-800">Errors</span>
                        </div>
                        <ul className="text-sm text-red-700 list-disc list-inside">
                          {ruleValidation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ruleValidation.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-yellow-800">Warnings</span>
                        </div>
                        <ul className="text-sm text-yellow-700 list-disc list-inside">
                          {ruleValidation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ruleValidation.isValid && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-green-800">Rule is Valid</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span
                              className={`font-medium ${getComplexityColor(ruleValidation.complexity)}`}
                            >
                              Complexity: {ruleValidation.complexity}
                            </span>
                            <span className="text-gray-600">
                              Performance: {ruleValidation.performance}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRuleForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRuleSave} disabled={!ruleValidation?.isValid}>
                  {selectedRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
