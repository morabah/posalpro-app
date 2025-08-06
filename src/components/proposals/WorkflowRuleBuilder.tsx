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
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
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
  // ✅ FIXED: Replace any with proper type
  value: string | number | boolean | Date | string[] | Record<string, unknown>;
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
  // ✅ FIXED: Replace any with proper type
  parameters: Record<string, string | number | boolean | string[]>;
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
  delay?: number; // Minutes
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
  // ✅ FIXED: Replace any with proper type
  input: Record<string, string | number | boolean | string[]>;
  // ✅ FIXED: Replace any with proper type
  expectedOutput: string | number | boolean | string[] | Record<string, unknown>;
  // ✅ FIXED: Replace any with proper type
  actualOutput: string | number | boolean | string[] | Record<string, unknown>;
  passed: boolean;
  executionTime: number;
  timestamp: Date;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: Array<Partial<WorkflowRule>>;
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
  // ✅ FIXED: Remove unused templates parameter
  availableFields: string[];
  onRuleSave: (rule: WorkflowRule) => void;
  onRuleDelete: (ruleId: string) => void;
  // ✅ FIXED: Replace any with proper type
  onRuleTest: (
    rule: WorkflowRule,
    testData: Record<string, string | number | boolean | string[]>
  ) => Promise<RuleTestResult>;
  onTemplateApply: (template: RuleTemplate) => void;
}

export function WorkflowRuleBuilder({
  rules,
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
  const [isEditing, setIsEditing] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResults, setTestResults] = useState<RuleTestResult[]>([]);
  // ✅ FIXED: Remove unused setTestData
  const [testData] = useState<Record<string, string | number | boolean | string[]>>({});
  const [validationResults, setValidationResults] = useState<RuleValidationResult | null>(null);

  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // ✅ FIXED: Remove unused isComplex variable
  const ruleCategories = useMemo(() => {
    const categories = new Set(rules.map(rule => rule.category));
    return Array.from(categories);
  }, [rules]);

  const activeRules = useMemo(() => {
    return rules.filter(rule => rule.isActive);
  }, [rules]);

  const inactiveRules = useMemo(() => {
    return rules.filter(rule => !rule.isActive);
  }, [rules]);

  const handleRuleSave = useCallback(
    async (rule: WorkflowRule) => {
      try {
        await onRuleSave(rule);
        analytics('workflow_rule_saved', {
          ruleId: rule.id,
          category: rule.category,
          priority: rule.priority,
        });
      } catch (error) {
        analytics('workflow_rule_save_error', {
          ruleId: rule.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [onRuleSave, analytics]
  );

  const handleRuleDelete = useCallback(
    async (ruleId: string) => {
      try {
        await onRuleDelete(ruleId);
        analytics('workflow_rule_deleted', {
          ruleId,
        });
      } catch (error) {
        analytics('workflow_rule_delete_error', {
          ruleId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [onRuleDelete, analytics]
  );

  const handleRuleTest = useCallback(
    async (rule: WorkflowRule) => {
      try {
        const result = await onRuleTest(rule, testData);
        setTestResults(prev => [...prev, result]);
        analytics('workflow_rule_tested', {
          ruleId: rule.id,
          passed: result.passed,
          executionTime: result.executionTime,
        });
      } catch (error) {
        analytics('workflow_rule_test_error', {
          ruleId: rule.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [onRuleTest, testData, analytics]
  );

  const validateRule = useCallback((rule: WorkflowRule): RuleValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Basic validation
    if (!rule.name.trim()) {
      errors.push('Rule name is required');
    }

    if (!rule.description.trim()) {
      warnings.push('Rule description is recommended');
    }

    if (rule.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    if (rule.actions.length === 0) {
      errors.push('At least one action is required');
    }

    // ✅ FIXED: Remove unnecessary conditionals
    if (rule.priority < 1) {
      errors.push('Priority must be at least 1');
    }

    if (rule.priority > 10) {
      errors.push('Priority must be at most 10');
    }

    // Complexity assessment
    const complexity =
      rule.conditions.length > 5 || rule.actions.length > 3
        ? 'high'
        : rule.conditions.length > 2 || rule.actions.length > 1
          ? 'medium'
          : 'low';

    // Performance assessment
    const performance =
      complexity === 'high' ? 'slow' : complexity === 'medium' ? 'moderate' : 'fast';

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      complexity,
      performance,
    };
  }, []);

  const handleTabChange = useCallback(
    (tab: 'rules' | 'builder' | 'templates' | 'testing') => {
      // ✅ FIXED: Use proper type instead of any
      setActiveTab(tab);
      analytics('workflow_rule_builder_tab_changed', {
        tab,
      });
    },
    [analytics]
  );

  const handleRuleEdit = useCallback(
    (rule: WorkflowRule) => {
      setSelectedRule(rule);
      setIsEditing(true);
      setValidationResults(validateRule(rule));
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

    setSelectedRule(newRule as WorkflowRule);
    setIsEditing(true);
    setValidationResults(validateRule(newRule as WorkflowRule));
  }, [validateRule]);

  const handleRuleSaveClick = useCallback(async () => {
    if (!selectedRule) return;

    const validation = validateRule(selectedRule);
    setValidationResults(validation);

    if (!validation.isValid) {
      return;
    }

    const completeRule: WorkflowRule = {
      ...selectedRule,
      id: selectedRule.id || `rule-${Date.now()}`,
      name: selectedRule.name || '',
      description: selectedRule.description || '',
      isActive: selectedRule.isActive ?? true,
      priority: selectedRule.priority || 1,
      category: selectedRule.category || 'routing',
      conditions: selectedRule.conditions || [],
      actions: selectedRule.actions || [],
      triggers: selectedRule.triggers || [],
      exceptions: selectedRule.exceptions || [],
      lastModified: new Date(),
      modifiedBy: 'Current User',
      isValid: true,
      validationErrors: [],
    };

    await handleRuleSave(completeRule);
    setIsEditing(false);
    setSelectedRule(null);
  }, [selectedRule, validateRule, handleRuleSave]);

  const handleTemplateApply = useCallback(
    (template: RuleTemplate) => {
      // ✅ FIXED: Use proper analytics call
      analytics('workflow_template_applied', {
        templateId: template.id,
        templateName: template.name,
        category: template.category,
      });
      onTemplateApply(template);
    },
    [onTemplateApply, analytics]
  );

  const addCondition = useCallback(() => {
    if (!selectedRule) return;

    const newCondition: RuleCondition = {
      id: `condition-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      dataType: 'string',
    };

    // ✅ FIXED: Fix state update logic
    setSelectedRule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        conditions: [...prev.conditions, newCondition],
      };
    });
  }, [selectedRule]);

  const addAction = useCallback(() => {
    if (!selectedRule) return;

    const newAction: RuleAction = {
      id: `action-${Date.now()}`,
      type: 'route_to_stage',
      parameters: {},
    };

    // ✅ FIXED: Fix state update logic
    setSelectedRule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actions: [...prev.actions, newAction],
      };
    });
  }, [selectedRule]);

  const removeCondition = useCallback((conditionId: string) => {
    // ✅ FIXED: Fix state update logic
    setSelectedRule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        conditions: prev.conditions.filter(c => c.id !== conditionId),
      };
    });
  }, []);

  const removeAction = useCallback((actionId: string) => {
    // ✅ FIXED: Fix state update logic
    setSelectedRule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actions: prev.actions.filter(a => a.id !== actionId),
      };
    });
  }, []);

  const updateCondition = useCallback((conditionId: string, updates: Partial<RuleCondition>) => {
    // ✅ FIXED: Fix state update logic
    setSelectedRule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        conditions: prev.conditions.map(c => (c.id === conditionId ? { ...c, ...updates } : c)),
      };
    });
  }, []);

  const updateAction = useCallback((actionId: string, updates: Partial<RuleAction>) => {
    // ✅ FIXED: Fix state update logic
    setSelectedRule(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actions: prev.actions.map(a => (a.id === actionId ? { ...a, ...updates } : a)),
      };
    });
  }, []);

  // Update validation when editing rule changes
  useEffect(() => {
    if (selectedRule) {
      const validation = validateRule(selectedRule);
      setValidationResults(validation);
    }
  }, [selectedRule, validateRule]);

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
            <Badge variant="default">{activeRules.length} Active Rules</Badge>
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
            <div className="text-2xl font-bold text-green-600">{activeRules.length}</div>
            <div className="text-sm text-gray-600">Active Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {rules.filter(r => r.isValid).length}
            </div>
            <div className="text-sm text-gray-600">Valid Rules</div>
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
              onClick={() =>
                handleTabChange(tab.id as 'rules' | 'builder' | 'templates' | 'testing')
              }
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
            <h3 className="font-medium text-gray-900">Active Rules ({activeRules.length})</h3>
            <div className="flex items-center gap-2">
              <select
                value={
                  ruleCategories.find(cat => activeRules.every(r => r.category !== cat)) || 'all'
                }
                onChange={e =>
                  handleTabChange(e.target.value as 'rules' | 'builder' | 'templates' | 'testing')
                }
                className="px-3 py-1 border border-gray-200 rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                {ruleCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search rules..."
                value={''} // Search is not implemented in this component
                onChange={e => {}}
                className="px-3 py-1 border border-gray-200 rounded-md text-sm w-48"
              />
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {activeRules.map(rule => (
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
                        <Badge size="sm" variant="destructive">
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
                        handleRuleDelete(rule.id);
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

          {activeRules.length === 0 && (
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
            <Badge variant="default">{rules.length} Available</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map(rule => (
              <div
                key={rule.id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <Badge
                      size="sm"
                      className={`mt-1 border ${getRuleCategoryColor(rule.category)}`}
                    >
                      {rule.category}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">100%</div>
                    <div className="text-xs text-gray-500">popularity</div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{rule.description}</p>

                <div className="text-xs text-gray-500 mb-3">
                  <div>Use case: {rule.category}</div>
                  <div>Rules: 1</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleTemplateApply(rule as unknown as RuleTemplate)}
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
      {isEditing && selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedRule ? 'Edit Rule' : 'Create New Rule'}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
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
                      value={selectedRule.name || ''}
                      onChange={e =>
                        setSelectedRule(prev => (prev ? { ...prev, name: e.target.value } : null))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={selectedRule.category || 'routing'}
                      onChange={e =>
                        setSelectedRule(prev =>
                          prev
                            ? {
                                ...prev,
                                category: e.target.value as
                                  | 'routing'
                                  | 'approval'
                                  | 'escalation'
                                  | 'notification'
                                  | 'validation',
                              }
                            : null
                        )
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
                    value={selectedRule.description || ''}
                    onChange={e =>
                      setSelectedRule(prev =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
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
                      checked={selectedRule.isActive ?? true}
                      onChange={e =>
                        setSelectedRule(prev =>
                          prev ? { ...prev, isActive: e.target.checked } : null
                        )
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
                      value={selectedRule.priority || 1}
                      onChange={e =>
                        setSelectedRule(prev =>
                          prev ? { ...prev, priority: parseInt(e.target.value) } : null
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                  {selectedRule.conditions?.map((condition, index) => (
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
                            value={String(condition.value)}
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
                            disabled={index === selectedRule.conditions.length - 1}
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
                  {selectedRule.actions?.map(action => (
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
              {validationResults && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Validation Results</h4>
                  <div className="space-y-2">
                    {validationResults.errors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-800">Errors</span>
                        </div>
                        <ul className="text-sm text-red-700 list-disc list-inside">
                          {validationResults.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationResults.warnings.length > 0 && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-yellow-800">Warnings</span>
                        </div>
                        <ul className="text-sm text-yellow-700 list-disc list-inside">
                          {validationResults.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationResults.isValid && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <span className="font-medium text-green-800">Rule is Valid</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span
                              className={`font-medium ${getComplexityColor(validationResults.complexity)}`}
                            >
                              Complexity: {validationResults.complexity}
                            </span>
                            <span className="text-gray-600">
                              Performance: {validationResults.performance}
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
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRuleSaveClick} disabled={!validationResults?.isValid}>
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
