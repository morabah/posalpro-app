/**
 * Product Compatibility Types for PosalPro MVP2
 * Supports advanced compatibility checking and dependency management
 */

import { Product } from '@prisma/client';
import { FixSuggestion, ValidationIssue } from './validation';

// Overall compatibility result
export interface CompatibilityResult {
  id: string;
  overall: 'compatible' | 'incompatible' | 'warning';
  products: Product[];
  compatibility: ProductCompatibility[];
  circularDependencies: CircularDependency[];
  licenseConflicts: LicenseConflict[];
  recommendations: CompatibilityRecommendation[];
  performance: CompatibilityPerformance;
  timestamp: Date;
}

// Product-to-product compatibility
export interface ProductCompatibility {
  id: string;
  productA: string;
  productB: string;
  status: 'compatible' | 'incompatible' | 'conditional' | 'unknown';
  issues: string[];
  requirements: string[];
  conflicts: CompatibilityConflict[];
  conditions: CompatibilityCondition[];
  confidence: number; // 0-1 scale
}

// Compatibility conflict definition
export interface CompatibilityConflict {
  id: string;
  type: 'resource' | 'license' | 'version' | 'configuration' | 'dependency';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedComponents: string[];
  resolution: ConflictResolution[];
}

// Conflict resolution options
export interface ConflictResolution {
  id: string;
  type: 'replace' | 'configure' | 'upgrade' | 'downgrade' | 'remove';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  cost: number;
  automated: boolean;
  steps: ResolutionStep[];
}

// Resolution step
export interface ResolutionStep {
  id: string;
  order: number;
  description: string;
  action: string;
  parameters: Record<string, any>;
  validation: string;
  automated: boolean;
}

// Compatibility condition
export interface CompatibilityCondition {
  id: string;
  type: 'version' | 'configuration' | 'license' | 'resource' | 'environment';
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'exists';
  value: any;
  required: boolean;
  description: string;
}

// Circular dependency detection
export interface CircularDependency {
  id: string;
  path: string[];
  severity: 'error' | 'warning';
  description: string;
  type: 'hard' | 'soft' | 'conditional';
  resolution: string[];
  impact: DependencyImpact;
  detectionMethod: string;
}

// Dependency impact analysis
export interface DependencyImpact {
  affectedProducts: string[];
  performanceImpact: 'none' | 'low' | 'medium' | 'high';
  stabilityRisk: 'none' | 'low' | 'medium' | 'high';
  maintenanceComplexity: 'none' | 'low' | 'medium' | 'high';
  businessImpact: 'none' | 'low' | 'medium' | 'high';
}

// License conflict detection
export interface LicenseConflict {
  id: string;
  type: 'incompatible' | 'restrictive' | 'missing' | 'expired' | 'exceeded';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedProducts: string[];
  licenses: LicenseInfo[];
  resolution: LicenseResolution[];
  compliance: ComplianceInfo;
}

// License information
export interface LicenseInfo {
  id: string;
  productId: string;
  type: 'commercial' | 'open_source' | 'proprietary' | 'subscription';
  name: string;
  version?: string;
  terms: string[];
  restrictions: string[];
  expiration?: Date;
  quantity?: number;
  cost?: number;
}

// License resolution options
export interface LicenseResolution {
  id: string;
  type: 'acquire' | 'upgrade' | 'replace' | 'remove' | 'negotiate';
  description: string;
  cost: number;
  timeframe: string;
  impact: 'low' | 'medium' | 'high';
  automated: boolean;
  steps: string[];
}

// Compliance information
export interface ComplianceInfo {
  status: 'compliant' | 'non_compliant' | 'at_risk' | 'unknown';
  issues: string[];
  requirements: string[];
  recommendations: string[];
  auditTrail: AuditEntry[];
}

// Audit entry
export interface AuditEntry {
  timestamp: Date;
  action: string;
  user: string;
  details: string;
  impact: string;
}

// Compatibility recommendation
export interface CompatibilityRecommendation {
  id: string;
  type: 'optimization' | 'alternative' | 'warning' | 'enhancement' | 'cost_reduction';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  savings: number; // cost savings
  risks: RecommendationRisk[];
  actions: FixSuggestion[];
}

// Recommendation risk
export interface RecommendationRisk {
  type: 'performance' | 'stability' | 'security' | 'compliance' | 'cost';
  severity: 'low' | 'medium' | 'high';
  description: string;
  mitigation: string[];
  probability: number; // 0-1 scale
}

// Compatibility performance metrics
export interface CompatibilityPerformance {
  totalChecks: number;
  executionTime: number;
  rulesEvaluated: number;
  cacheHits: number;
  cacheMisses: number;
  errorRate: number;
  accuracy: number;
}

// Compatibility matrix
export interface CompatibilityMatrix {
  id: string;
  products: Product[];
  matrix: CompatibilityMatrixEntry[][];
  metadata: CompatibilityMatrixMetadata;
  generated: Date;
  validUntil: Date;
}

// Compatibility matrix entry
export interface CompatibilityMatrixEntry {
  productA: string;
  productB: string;
  compatible: boolean;
  score: number; // 0-1 compatibility score
  issues: string[];
  warnings: string[];
  conditions: string[];
  lastChecked: Date;
}

// Compatibility matrix metadata
export interface CompatibilityMatrixMetadata {
  version: string;
  algorithm: string;
  confidence: number;
  coverage: number; // percentage of product pairs tested
  assumptions: string[];
  limitations: string[];
}

// Configuration validation result
export interface ConfigurationValidationResult {
  id: string;
  configurationId: string;
  valid: boolean;
  issues: ValidationIssue[];
  performance: ConfigurationPerformance;
  recommendations: ConfigurationRecommendation[];
  alternatives: ConfigurationAlternative[];
}

// Configuration performance metrics
export interface ConfigurationPerformance {
  estimatedCost: number;
  performanceScore: number; // 0-100
  reliabilityScore: number; // 0-100
  maintainabilityScore: number; // 0-100
  scalabilityScore: number; // 0-100
  complianceScore: number; // 0-100
}

// Configuration recommendation
export interface ConfigurationRecommendation {
  id: string;
  type:
    | 'cost_optimization'
    | 'performance_improvement'
    | 'reliability_enhancement'
    | 'compliance_fix';
  title: string;
  description: string;
  impact: PerformanceImpact;
  implementation: ImplementationPlan;
}

// Performance impact
export interface PerformanceImpact {
  costChange: number; // positive = increase, negative = decrease
  performanceChange: number; // -100 to 100
  reliabilityChange: number; // -100 to 100
  complexityChange: number; // -100 to 100
  timeToImplement: number; // hours
}

// Implementation plan
export interface ImplementationPlan {
  steps: ImplementationStep[];
  totalTime: number; // hours
  totalCost: number;
  risks: string[];
  dependencies: string[];
  validation: string[];
}

// Implementation step
export interface ImplementationStep {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedTime: number; // hours
  estimatedCost: number;
  prerequisites: string[];
  deliverables: string[];
  validation: string[];
}

// Configuration alternative
export interface ConfigurationAlternative {
  id: string;
  name: string;
  description: string;
  products: string[];
  performance: ConfigurationPerformance;
  tradeoffs: Tradeoff[];
  suitability: SuitabilityScore[];
}

// Tradeoff analysis
export interface Tradeoff {
  aspect: 'cost' | 'performance' | 'reliability' | 'complexity' | 'features';
  change: number; // -100 to 100, relative to original
  description: string;
  significance: 'low' | 'medium' | 'high';
}

// Suitability score
export interface SuitabilityScore {
  criteria: string;
  score: number; // 0-100
  weight: number; // 0-1
  explanation: string;
}

// Type guards
export const isCompatibilityResult = (obj: any): obj is CompatibilityResult => {
  return obj && typeof obj === 'object' && 'overall' in obj && 'compatibility' in obj;
};

export const isCircularDependency = (obj: any): obj is CircularDependency => {
  return obj && typeof obj === 'object' && 'path' in obj && Array.isArray(obj.path);
};

export const isLicenseConflict = (obj: any): obj is LicenseConflict => {
  return obj && typeof obj === 'object' && 'type' in obj && 'licenses' in obj;
};
