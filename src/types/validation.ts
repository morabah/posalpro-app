/**
 * Core Validation Types for PosalPro MVP2
 * Supports H8 hypothesis tracking and component traceability
 */

import { Product, ProductRelationship } from '@prisma/client';

// Core validation result interface
export interface ValidationResult {
  id: string;
  proposalId?: string;
  productId?: string;
  status: 'valid' | 'invalid' | 'warning' | 'pending';
  issues: ValidationIssue[];
  suggestions: FixSuggestion[];
  timestamp: Date;
  executionTime: number;
  userStoryMappings: string[];
  performanceMetrics?: ValidationPerformanceMetrics;
}

// Validation request interface
export interface ValidationRequest {
  proposalId: string;
  products: string[]; // Product IDs
  rules: 'all' | string[]; // Rule IDs or 'all'
  mode: 'complete' | 'incremental' | 'quick';
  options?: {
    includeWarnings?: boolean;
    autoFix?: boolean;
    skipCache?: boolean;
  };
}

// Individual validation issue
export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'compatibility' | 'license' | 'configuration' | 'dependency' | 'performance';
  message: string;
  description?: string;
  affectedProducts: string[];
  fixSuggestions: FixSuggestion[];
  ruleId?: string;
  context?: ValidationContext;
  // Additional properties for UI compatibility
  status?: 'open' | 'in_progress' | 'resolved' | 'suppressed' | 'deferred';
  proposalId?: string; // For easier access
  detectedAt?: Date;
  updatedAt?: Date;
  ruleName?: string;
}

// Fix suggestion interface
export interface FixSuggestion {
  id: string;
  type: 'automatic' | 'manual' | 'configuration' | 'replacement';
  title: string; // Display title for the fix
  description: string;
  confidence: number; // 0-1 scale
  impact: 'low' | 'medium' | 'high';
  actions: FixAction[];
  estimatedTime?: number; // in minutes
  cost?: number;
  automatable?: boolean; // Whether the fix can be applied automatically
}

// Action result types
export type ActionType = 'replace' | 'configure' | 'add' | 'remove' | 'update';
export type ActionTarget = 'product' | 'configuration' | 'relationship' | 'license' | 'custom';
export type SuggestionType = 'automatic' | 'manual' | 'configuration' | 'replacement';
export type SuggestionImpact = 'low' | 'medium' | 'high';

export interface ActionResult {
  type: 'error' | 'warning' | 'fix' | 'suggest' | 'block';
  message: string;
  data?: {
    description?: string;
    confidence?: number;
    target?: ActionTarget;
    value?: any;
  };
  automated?: boolean;
}

// Fix action definition
export interface FixAction {
  id: string;
  type: ActionType;
  target: ActionTarget;
  value: any;
  description: string;
  automated: boolean;
}

// Validation rule definition
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  userStoryMappings: string[];
  version: string;
  lastModified: Date;
  executionOrder: number;
}

// Rule condition interface
export interface RuleCondition {
  id: string;
  type: 'product' | 'relationship' | 'configuration' | 'license' | 'custom';
  operator: 'equals' | 'contains' | 'exists' | 'greater' | 'less' | 'matches';
  field: string;
  value: any;
  negated?: boolean;
}

// Rule action interface
export interface RuleAction {
  id: string;
  type: 'error' | 'warning' | 'fix' | 'suggest' | 'block';
  message: string;
  data?: any;
  automated?: boolean;
}

// Validation request interface
export interface ValidationRequest {
  proposalId: string;
  products: string[]; // Product IDs
  rules: 'all' | string[]; // Rule IDs or 'all'
  mode: 'complete' | 'incremental' | 'quick';
  options?: {
    includeWarnings?: boolean;
    autoFix?: boolean;
    skipCache?: boolean;
  };
}

// Validation context
export interface ValidationContext {
  proposalId?: string;
  proposalOwner?: string;
  proposalValue?: number;
  affectedProducts?: string[];
  customer?: string;
  userId: string;
  products: Product[];
  relationships: ProductRelationship[];
  configuration: ProductConfiguration;
  environment: 'development' | 'staging' | 'production';
  timestamp: Date;
  rules: ValidationRule[];
}

// Product configuration interface
export interface ProductConfiguration {
  id: string;
  proposalId?: string;
  products: ConfiguredProduct[];
  globalSettings: Record<string, any>;
  relationships: ProductRelationshipConfig[];
  metadata: ConfigurationMetadata;
}

// Configured product with settings
export interface ConfiguredProduct {
  productId: string;
  quantity: number;
  settings: Record<string, any>;
  customizations: Record<string, any>;
  dependencies: string[];
  conflicts: string[];
}

// Product relationship configuration
export interface ProductRelationshipConfig {
  id: string;
  productAId: string;
  productBId: string;
  type: 'requires' | 'conflicts' | 'enhances' | 'replaces';
  strength: number; // 0-1 scale
  conditions?: Record<string, any>;
}

// Configuration metadata
export interface ConfigurationMetadata {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  validatedAt?: Date;
  validationVersion?: string;
}

// Validation performance metrics for H8 tracking
export interface ValidationPerformanceMetrics {
  totalRulesExecuted: number;
  rulesExecutionTime: number;
  issuesDetected: number;
  issuesResolved: number;
  automatedFixes: number;
  manualFixes: number;
  falsePositives: number;
  falseNegatives: number;
  userEfficiencyGain: number; // percentage
  errorReductionRate: number; // percentage for H8 hypothesis
}

// Rule execution result
export interface RuleResult {
  ruleId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  issues: ValidationIssue[];
  suggestions: FixSuggestion[];
  executionTime: number;
  context: ValidationContext;
}

// Validation workflow result
export interface WorkflowResult {
  id: string;
  status: 'completed' | 'failed' | 'partial' | 'cancelled';
  results: ValidationResult[];
  summary: ValidationSummary;
  performance: ValidationPerformanceMetrics;
  recommendations: WorkflowRecommendation[];
}

// Validation summary
export interface ValidationSummary {
  totalProducts: number;
  validProducts: number;
  invalidProducts: number;
  warningProducts: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  automatedFixesApplied: number;
  manualFixesRequired: number;
  overallStatus: 'valid' | 'invalid' | 'warning';
}

// Workflow recommendation
export interface WorkflowRecommendation {
  id: string;
  type: 'optimization' | 'alternative' | 'warning' | 'enhancement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  actions: FixAction[];
}

// Analytics event for H8 hypothesis tracking
export interface ValidationAnalyticsEvent {
  eventType: 'validation_started' | 'validation_completed' | 'issue_resolved' | 'fix_applied';
  timestamp: Date;
  userId: string;
  proposalId?: string;
  productIds: string[];
  metrics: ValidationPerformanceMetrics;
  userStoryMappings: string[];
  hypotheses: string[];
}

// Component traceability mapping
export const VALIDATION_COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: [
    'AC-3.1.1', // Real-time validation
    'AC-3.1.2', // Error detection accuracy
    'AC-3.2.1', // Compatibility checking
    'AC-3.2.2', // Dependency validation
    'AC-3.3.1', // Fix suggestion generation
    'AC-3.3.2', // Performance requirements
  ],
  methods: [
    'validateProductConfiguration()',
    'checkProductCompatibility()',
    'detectCircularDependencies()',
    'generateFixSuggestions()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
} as const;

// Type guards for validation types
export const isValidationResult = (obj: unknown): obj is ValidationResult => {
  if (!obj || typeof obj !== 'object') return false;
  const result = obj as ValidationResult;
  return (
    typeof result.id === 'string' &&
    Array.isArray(result.issues) &&
    Array.isArray(result.suggestions) &&
    result.timestamp instanceof Date &&
    typeof result.executionTime === 'number' &&
    Array.isArray(result.userStoryMappings)
  );
};

export const isValidationIssue = (obj: unknown): obj is ValidationIssue => {
  if (!obj || typeof obj !== 'object') return false;
  const issue = obj as ValidationIssue;
  return (
    typeof issue.id === 'string' &&
    ['error', 'warning', 'info'].includes(issue.type) &&
    ['critical', 'high', 'medium', 'low'].includes(issue.severity) &&
    typeof issue.message === 'string' &&
    Array.isArray(issue.affectedProducts) &&
    Array.isArray(issue.fixSuggestions)
  );
};

export const isFixSuggestion = (obj: unknown): obj is FixSuggestion => {
  if (!obj || typeof obj !== 'object') return false;
  const suggestion = obj as FixSuggestion;
  return (
    typeof suggestion.id === 'string' &&
    ['automatic', 'manual', 'configuration', 'replacement'].includes(suggestion.type) &&
    typeof suggestion.title === 'string' &&
    typeof suggestion.description === 'string' &&
    typeof suggestion.confidence === 'number' &&
    ['low', 'medium', 'high'].includes(suggestion.impact) &&
    Array.isArray(suggestion.actions)
  );
};

export const isFixAction = (obj: unknown): obj is FixAction => {
  if (!obj || typeof obj !== 'object') return false;
  const action = obj as FixAction;
  return (
    typeof action.id === 'string' &&
    ['replace', 'configure', 'add', 'remove', 'update'].includes(action.type) &&
    typeof action.target === 'string' &&
    typeof action.description === 'string' &&
    typeof action.automated === 'boolean'
  );
};

export const isValidationRule = (obj: unknown): obj is ValidationRule => {
  if (!obj || typeof obj !== 'object') return false;
  const rule = obj as ValidationRule;
  return (
    typeof rule.id === 'string' &&
    typeof rule.name === 'string' &&
    typeof rule.description === 'string' &&
    typeof rule.category === 'string' &&
    ['critical', 'high', 'medium', 'low'].includes(rule.severity) &&
    Array.isArray(rule.conditions) &&
    Array.isArray(rule.actions) &&
    typeof rule.enabled === 'boolean' &&
    Array.isArray(rule.userStoryMappings) &&
    typeof rule.version === 'string' &&
    rule.lastModified instanceof Date &&
    typeof rule.executionOrder === 'number'
  );
};

export const isRuleCondition = (obj: unknown): obj is RuleCondition => {
  if (!obj || typeof obj !== 'object') return false;
  const condition = obj as RuleCondition;
  return (
    typeof condition.id === 'string' &&
    ['product', 'relationship', 'configuration', 'license', 'custom'].includes(condition.type) &&
    ['equals', 'contains', 'exists', 'greater', 'less', 'matches'].includes(condition.operator) &&
    typeof condition.field === 'string'
  );
};

export const isRuleAction = (obj: unknown): obj is RuleAction => {
  if (!obj || typeof obj !== 'object') return false;
  const action = obj as RuleAction;
  return (
    typeof action.id === 'string' &&
    ['error', 'warning', 'fix', 'suggest', 'block'].includes(action.type) &&
    typeof action.message === 'string'
  );
};
