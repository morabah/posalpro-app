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

// Fix action definition
export interface FixAction {
  id: string;
  type: 'replace' | 'configure' | 'add' | 'remove' | 'update';
  target: string; // product ID or configuration key
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

// Type guards
export const isValidationResult = (obj: any): obj is ValidationResult => {
  return obj && typeof obj === 'object' && 'id' in obj && 'status' in obj;
};

export const isValidationIssue = (obj: any): obj is ValidationIssue => {
  return obj && typeof obj === 'object' && 'id' in obj && 'type' in obj && 'severity' in obj;
};

export const isFixSuggestion = (obj: any): obj is FixSuggestion => {
  return obj && typeof obj === 'object' && 'id' in obj && 'type' in obj && 'confidence' in obj;
};
