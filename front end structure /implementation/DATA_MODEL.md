# PosalPro MVP2 - Data Model Schema

## Overview

This document defines the data model schema for PosalPro MVP2, detailing entity
relationships, attributes, and validation rules. The schema supports all
features defined in the enhanced wireframes with comprehensive user story
traceability, with special attention to analytics instrumentation for hypothesis
validation and the complex logic requirements of the Product Relationships,
Approval Workflow, and Predictive Validation modules.

## User Story Traceability Schema

### Analytics and Measurement Entities

```typescript
interface HypothesisValidationEvent {
  id: string;
  hypothesis: 'H1' | 'H3' | 'H4' | 'H6' | 'H7' | 'H8';
  userStoryId: string;
  componentId: string;
  action: string;
  measurementData: Record<string, any>;
  targetValue: number;
  actualValue: number;
  performanceImprovement: number;
  timestamp: Date;
  userId: string;
  userRole: string;
  sessionId: string;
  testCaseId?: string;
}

interface UserStoryMetrics {
  id: string;
  userStoryId: string;
  hypothesis: string[];
  acceptanceCriteria: string[];
  performanceTargets: Record<string, number>;
  actualPerformance: Record<string, number>;
  completionRate: number;
  passedCriteria: string[];
  failedCriteria: string[];
  testResults: TestExecutionResult[];
  baselineMetrics: Record<string, number>;
  lastUpdated: Date;
}

interface PerformanceBaseline {
  id: string;
  hypothesis: string;
  metricName: string;
  baselineValue: number;
  targetImprovement: number;
  currentValue: number;
  improvementPercentage: number;
  measurementUnit: string;
  collectionDate: Date;
  validUntil: Date;
  sampleSize: number;
  confidence: number;
}

interface TestExecutionResult {
  id: string;
  testCaseId: string;
  userStoryId: string;
  hypothesis: string;
  executed: boolean;
  passed: boolean;
  executionTime: number;
  metrics: Record<string, any>;
  errors: string[];
  timestamp: Date;
  environment: string;
}

interface ComponentTraceability {
  id: string;
  componentName: string;
  userStories: string[];
  acceptanceCriteria: string[];
  methods: string[];
  hypotheses: string[];
  testCases: string[];
  analyticsHooks: string[];
  lastValidated: Date;
  validationStatus: 'valid' | 'invalid' | 'pending';
}
```

### Analytics Event Types

```typescript
interface ContentSearchAnalytics {
  searchQuery: string;
  searchDuration: number;
  resultsCount: number;
  selectedResultRank: number;
  relevanceScore: number;
  userSatisfaction: number;
  filterUsage: string[];
  aiRecommendationsShown: number;
  aiRecommendationsClicked: number;
  saveActions: number;
  userStory: 'US-1.1' | 'US-1.2' | 'US-1.3';
  hypothesis: 'H1';
  targetReduction: 0.45;
}

interface SMEContributionAnalytics {
  assignmentId: string;
  totalContributionTime: number;
  activeEditingTime: number;
  aiDraftGenerated: boolean;
  aiDraftAccepted: boolean;
  templateUsed: boolean;
  templateId?: string;
  contributionQuality: number;
  iterationCount: number;
  resourcesAccessed: string[];
  userStory: 'US-2.1';
  hypothesis: 'H3';
  targetReduction: 0.5;
}

interface CoordinationAnalytics {
  proposalId: string;
  coordinationTime: number;
  teamSize: number;
  assignmentCount: number;
  communicationVolume: number;
  followUpMessages: number;
  bottlenecksDetected: number;
  timelineAccuracy: number;
  estimatedTime: number;
  actualTime: number;
  userStory: 'US-2.2' | 'US-2.3' | 'US-4.1' | 'US-4.3';
  hypothesis: 'H4' | 'H7';
  targetImprovement: 0.4;
}

interface ValidationAnalytics {
  configurationId: string;
  validationType: string;
  validationTime: number;
  errorsDetected: number;
  errorsFixed: number;
  fixSuggestionsGenerated: number;
  fixSuggestionsAccepted: number;
  falsePositives: number;
  manualReviewTime: number;
  automationSavings: number;
  userStory: 'US-3.1' | 'US-3.2' | 'US-3.3';
  hypothesis: 'H8';
  targetReduction: 0.5;
}

interface RequirementExtractionAnalytics {
  documentId: string;
  documentSize: number;
  extractionTime: number;
  requirementsExtracted: number;
  manualRequirements: number;
  extractionAccuracy: number;
  categorizationAccuracy: number;
  complianceScore: number;
  reviewTime: number;
  userStory: 'US-4.2';
  hypothesis: 'H6';
  targetImprovement: 0.3;
}
```

## Core Entities

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  roles: Role[];
  department: string;
  permissions: Permission[];
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  status: 'active' | 'inactive' | 'pending';
  temporaryAccess?: TemporaryAccess[];
  analyticsProfile: UserAnalyticsProfile;
}

interface UserAnalyticsProfile {
  userId: string;
  performanceMetrics: Record<string, number>;
  hypothesisContributions: Record<string, number>;
  skillAssessments: Record<string, number>;
  efficiencyRatings: Record<string, number>;
  lastAssessment: Date;
  improvementTrends: PerformanceTrend[];
}

interface PerformanceTrend {
  metric: string;
  values: Array<{ date: Date; value: number }>;
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  dashboardLayout: LayoutConfiguration;
  language: string;
  analyticsConsent: boolean;
  performanceTracking: boolean;
}

interface TemporaryAccess {
  roleId: string;
  grantedBy: string;
  reason: string;
  expiresAt: Date;
  status: 'active' | 'expired' | 'revoked';
}
```

### Role

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  parent?: string; // Parent role ID for inheritance
  level: number; // Hierarchy level
  isSystem: boolean; // System roles cannot be modified
  createdAt: Date;
  updatedAt: Date;
  contextRules?: ContextRule[]; // For ABAC extension
  performanceExpectations: Record<string, number>;
}

interface ContextRule {
  attribute: string; // e.g., 'time', 'location', 'customerTier'
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
  effect: 'grant' | 'deny';
}

interface Permission {
  id: string;
  resource: string; // e.g., 'proposals', 'products'
  action: string; // e.g., 'create', 'read', 'update', 'delete'
  constraints?: Record<string, any>; // Additional constraints
  scope?: 'all' | 'team' | 'own';
}
```

### Proposal

```typescript
interface Proposal {
  id: string;
  title: string;
  description: string;
  customer: Customer;
  createdBy: string; // User ID
  assignedTo: string[]; // User IDs
  status: ProposalStatus;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  submittedDate?: Date;
  approvalStatus: ApprovalStatus;
  sections: ProposalSection[];
  products: ProposalProduct[];
  value: number;
  currency: string;
  validUntil: Date;
  metadata: Record<string, any>;
  lifecycle: ProposalLifecycleEvent[];
  tags: string[];
  riskScore?: number; // From predictive validation
  performanceMetrics: ProposalPerformanceMetrics;
  userStoryTracking: UserStoryTracking[];
}

interface ProposalPerformanceMetrics {
  proposalId: string;
  creationTime: number;
  coordinationEffort: number;
  validationTime: number;
  approvalTime: number;
  timelineAccuracy: number;
  stakeholderEngagement: number;
  hypothesesValidated: string[];
  performanceScores: Record<string, number>;
}

interface UserStoryTracking {
  userStoryId: string;
  componentUsage: ComponentUsage[];
  performanceData: Record<string, any>;
  criteriaStatus: Record<string, boolean>;
  testResults: TestResult[];
}

interface ComponentUsage {
  componentName: string;
  usageCount: number;
  totalTime: number;
  averageTime: number;
  errorCount: number;
  successRate: number;
}

type ProposalStatus =
  | 'draft'
  | 'in_review'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'submitted'
  | 'accepted'
  | 'declined';

interface ProposalSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'products' | 'terms' | 'pricing' | 'custom';
  metadata: Record<string, any>;
  validationStatus: 'valid' | 'invalid' | 'warning' | 'not_validated';
  analyticsData: SectionAnalytics;
}

interface SectionAnalytics {
  sectionId: string;
  editTime: number;
  revisionCount: number;
  collaboratorCount: number;
  aiAssistanceUsed: boolean;
  qualityScore: number;
  userStoryContributions: string[];
}

interface ProposalProduct {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  configuration: Record<string, any>;
  validationIssues: ValidationIssue[];
  selectionAnalytics: ProductSelectionAnalytics;
}

interface ProductSelectionAnalytics {
  selectionTime: number;
  alternativesConsidered: number;
  validationChecks: number;
  configurationChanges: number;
  aiRecommendationsUsed: boolean;
  userStory: string[];
}

interface ProposalLifecycleEvent {
  id: string;
  stage: string;
  timestamp: Date;
  userId: string;
  notes?: string;
  metadata: Record<string, any>;
  performanceImpact: Record<string, number>;
  hypothesesAffected: string[];
}
```

### Product

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  currency: string;
  category: string[];
  attributes: Record<string, any>;
  images: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  relationships: ProductRelationship[];
  validationRules: ValidationRule[];
  usageAnalytics: ProductUsageAnalytics;
  userStoryMappings: string[];
}

interface ProductUsageAnalytics {
  productId: string;
  totalUsage: number;
  successRate: number;
  averageConfigurationTime: number;
  validationFailures: number;
  relationshipIssues: number;
  hypothesesSupported: string[];
  performanceMetrics: Record<string, number>;
}

interface ProductRelationship {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  type: 'requires' | 'recommends' | 'incompatible' | 'alternative' | 'optional';
  quantity?: number;
  condition?: RelationshipCondition;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // User ID
  validationHistory: RelationshipValidationHistory[];
  performanceImpact: RelationshipPerformanceImpact;
}

interface RelationshipValidationHistory {
  timestamp: Date;
  validationResult: boolean;
  performance: number;
  userStory: string;
  hypothesis: string;
  testCase: string;
}

interface RelationshipPerformanceImpact {
  validationSpeedImprovement: number;
  errorReduction: number;
  configurationEfficiency: number;
  userSatisfaction: number;
}

interface RelationshipCondition {
  rules: ConditionRule[];
  operator: 'and' | 'or';
}

interface ConditionRule {
  attribute: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}
```

### Validation

```typescript
interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: string;
  ruleType:
    | 'compatibility'
    | 'license'
    | 'configuration'
    | 'compliance'
    | 'custom';
  conditions: ValidationCondition[];
  actions: ValidationAction[];
  severity: 'error' | 'warning' | 'info';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  executionStats: RuleExecutionStats;
  userStoryMappings: string[];
  hypothesesSupported: string[];
}

interface RuleExecutionStats {
  ruleId: string;
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  errorCount: number;
  performanceImprovement: number;
  hypothesisValidation: Record<string, number>;
  userStoryImpact: Record<string, number>;
}

interface ValidationCondition {
  id: string;
  attribute: string;
  operator:
    | 'equals'
    | 'notEquals'
    | 'contains'
    | 'greaterThan'
    | 'lessThan'
    | 'exists'
    | 'notExists';
  value: any;
  logicalOperator?: 'and' | 'or';
}

interface ValidationAction {
  id: string;
  type: 'block' | 'warn' | 'fix' | 'notify';
  message: string;
  fixSuggestion?: string;
  autoFix?: boolean;
  notificationTargets?: string[];
}

interface ValidationIssue {
  id: string;
  entityId: string;
  entityType: 'proposal' | 'product' | 'configuration';
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fixSuggestion?: string;
  status: 'open' | 'resolved' | 'ignored' | 'false_positive';
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionMethod?: 'auto' | 'manual' | 'suggestion';
  performanceMetrics: IssuePerformanceMetrics;
  userStoryContext: string[];
}

interface IssuePerformanceMetrics {
  detectionTime: number;
  resolutionTime: number;
  accuracyScore: number;
  userSatisfaction: number;
  hypothesisContribution: Record<string, number>;
}

interface ValidationExecution {
  id: string;
  entityId: string;
  entityType: string;
  rulesExecuted: string[];
  executionTime: number;
  issuesFound: number;
  issuesResolved: number;
  performanceScore: number;
  timestamp: Date;
  triggeredBy: string;
  userStoryContext: string[];
  hypothesesValidated: string[];
}
```

### Content Management

```typescript
interface Content {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'template' | 'image' | 'document' | 'media';
  content: string;
  tags: string[];
  category: string[];
  quality: ContentQuality;
  usage: ContentUsage;
  access: ContentAccess;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
  searchOptimization: ContentSearchOptimization;
  userStoryTracking: ContentUserStoryTracking;
}

interface ContentQuality {
  score: number;
  winRate: number;
  usageFrequency: number;
  userRating: number;
  aiQualityScore: number;
  performanceMetrics: Record<string, number>;
  hypothesesSupported: string[];
}

interface ContentUsage {
  totalViews: number;
  totalUses: number;
  avgUsageTime: number;
  searchRanking: number;
  clickThroughRate: number;
  conversionRate: number;
  userStoryContributions: Record<string, number>;
}

interface ContentAccess {
  isPublic: boolean;
  allowedRoles: string[];
  restrictedUsers: string[];
  accessLog: ContentAccessLog[];
}

interface ContentAccessLog {
  userId: string;
  accessType: 'view' | 'edit' | 'use' | 'download';
  timestamp: Date;
  userStory?: string;
  performanceImpact?: number;
}

interface ContentSearchOptimization {
  searchableText: string;
  keywords: string[];
  semanticTags: string[];
  relevanceScore: number;
  aiCategorization: string[];
  searchPerformance: SearchPerformanceMetrics;
}

interface SearchPerformanceMetrics {
  averageSearchTime: number;
  clickThroughRate: number;
  relevanceScore: number;
  userSatisfaction: number;
  hypothesisContribution: Record<string, number>;
}

interface ContentUserStoryTracking {
  contentId: string;
  searchEfficiency: number;
  discoveryTime: number;
  usagePatterns: Record<string, any>;
  qualityImpact: number;
  userStories: string[];
  hypothesesSupported: string[];
}
```

### Approval Workflow

```typescript
interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  entityType: 'proposal' | 'product' | 'content' | 'configuration';
  stages: WorkflowStage[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  executionStats: WorkflowExecutionStats;
  performanceMetrics: WorkflowPerformanceMetrics;
  userStoryMappings: string[];
}

interface WorkflowExecutionStats {
  workflowId: string;
  totalExecutions: number;
  averageCompletionTime: number;
  successRate: number;
  bottleneckStages: string[];
  slaCompliance: number;
  hypothesesValidated: string[];
  performanceImprovements: Record<string, number>;
}

interface WorkflowPerformanceMetrics {
  timelineAccuracy: number;
  resourceUtilization: number;
  stakeholderSatisfaction: number;
  errorRate: number;
  automationEfficiency: number;
  userStoryImpact: Record<string, number>;
}

interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  order: number;
  approvers: string[];
  conditions: StageCondition[];
  actions: StageAction[];
  slaHours: number;
  isParallel: boolean;
  isOptional: boolean;
  escalationRules: EscalationRule[];
  performanceTracking: StagePerformanceTracking;
}

interface StagePerformanceTracking {
  stageId: string;
  averageTime: number;
  completionRate: number;
  escalationRate: number;
  userSatisfaction: number;
  hypothesesSupported: string[];
  efficiencyMetrics: Record<string, number>;
}

interface StageCondition {
  attribute: string;
  operator: string;
  value: any;
  logicalOperator?: 'and' | 'or';
}

interface StageAction {
  type: 'approve' | 'reject' | 'delegate' | 'escalate' | 'notify';
  automaticExecution: boolean;
  notificationTemplate?: string;
  escalationTarget?: string;
}

interface EscalationRule {
  triggerAfterHours: number;
  escalateTo: string[];
  notificationMessage: string;
  autoApprove: boolean;
  performanceImpact: number;
}

interface ApprovalExecution {
  id: string;
  workflowId: string;
  entityId: string;
  currentStage: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'escalated';
  startedAt: Date;
  completedAt?: Date;
  decisions: ApprovalDecision[];
  slaCompliance: boolean;
  performanceMetrics: ExecutionPerformanceMetrics;
  userStoryContext: string[];
}

interface ExecutionPerformanceMetrics {
  totalTime: number;
  stageEfficiency: Record<string, number>;
  resourceUtilization: number;
  qualityScore: number;
  hypothesesValidated: string[];
  userStoryContributions: Record<string, number>;
}

interface ApprovalDecision {
  id: string;
  stageId: string;
  approverId: string;
  decision: 'approve' | 'reject' | 'delegate' | 'request_changes';
  comments?: string;
  timestamp: Date;
  timeToDecision: number;
  qualityScore: number;
  performanceImpact: number;
}
```

### System Analytics

```typescript
interface SystemAnalytics {
  id: string;
  date: Date;
  userMetrics: SystemUserMetrics;
  performanceMetrics: SystemPerformanceMetrics;
  hypothesisMetrics: HypothesisMetrics;
  userStoryMetrics: UserStoryMetrics[];
  systemHealth: SystemHealthMetrics;
}

interface SystemUserMetrics {
  activeUsers: number;
  newUsers: number;
  userSessions: number;
  averageSessionDuration: number;
  featureUsage: Record<string, number>;
  userSatisfaction: number;
  rolewiseMetrics: Record<string, UserRoleMetrics>;
}

interface UserRoleMetrics {
  role: string;
  userCount: number;
  avgPerformance: Record<string, number>;
  hypothesesContributed: string[];
  efficiencyScore: number;
}

interface SystemPerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  availability: number;
  dataProcessingTime: number;
  analyticsLatency: number;
  hypothesisValidationSpeed: number;
}

interface HypothesisMetrics {
  hypotheses: Record<string, HypothesisStatus>;
  overallProgress: number;
  targetsMet: number;
  totalTargets: number;
  confidenceScore: number;
}

interface HypothesisStatus {
  hypothesis: string;
  targetValue: number;
  currentValue: number;
  progress: number;
  confidence: number;
  lastUpdated: Date;
  contributingUserStories: string[];
  status: 'on_track' | 'at_risk' | 'met' | 'failed';
}

interface SystemHealthMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  databasePerformance: number;
  analyticsProcessingHealth: number;
  userExperienceScore: number;
}
```

### Testing and Quality Assurance

```typescript
interface TestCase {
  id: string; // TC-HX-XXX format
  userStory: string; // US-X.X format
  hypothesis: string; // HX format with description
  actor: string; // Primary user role
  preconditions: string[]; // Setup requirements
  testSteps: string[]; // Execution steps
  acceptanceCriteria: string[]; // Success conditions
  measurementPoints: MetricDefinition[];
  successThresholds: Thresholds;
  instrumentationRequirements: string[];
  status: 'draft' | 'active' | 'executed' | 'passed' | 'failed';
  executionHistory: TestExecution[];
  lastExecuted?: Date;
  passRate: number;
}

interface MetricDefinition {
  metric: string;
  formula: string;
  target: string;
  critical: boolean;
  currentValue?: number;
  baselineValue?: number;
}

interface Thresholds {
  primary: string;
  secondary: string;
  minimum: string;
}

interface TestExecution {
  id: string;
  testCaseId: string;
  executedBy: string;
  executedAt: Date;
  duration: number;
  passed: boolean;
  results: TestResult[];
  metrics: Record<string, any>;
  environment: string;
  notes?: string;
}

interface TestResult {
  stepId: string;
  stepDescription: string;
  expected: string;
  actual: string;
  passed: boolean;
  metrics?: Record<string, any>;
  screenshot?: string;
  errorDetails?: string;
}

interface BaselineMetrics {
  id: string;
  hypothesis: string;
  metric: string;
  value: number;
  unit: string;
  collectedAt: Date;
  validUntil: Date;
  sampleSize: number;
  environment: string;
  methodology: string;
}
```

### Predictive Validation

```typescript
interface PredictiveValidationModel {
  id: string;
  name: string;
  description: string;
  type:
    | 'risk_assessment'
    | 'error_prediction'
    | 'bottleneck_detection'
    | 'timeline_forecasting';
  algorithm: string;
  version: string;
  trainingData: TrainingDataset[];
  accuracy: number;
  confidenceThreshold: number;
  isActive: boolean;
  lastUpdated: Date;
  predictionHistory: PredictionResult[];
  performanceMetrics: ModelPerformanceMetrics;
}

interface TrainingDataset {
  id: string;
  name: string;
  size: number;
  features: string[];
  labels: string[];
  createdAt: Date;
  validationScore: number;
  source: 'historical_data' | 'synthetic' | 'manual_labels';
}

interface PredictionResult {
  id: string;
  modelId: string;
  entityId: string;
  entityType: string;
  prediction: any;
  confidence: number;
  timestamp: Date;
  actualOutcome?: any;
  accuracy?: number;
  feedback?: 'correct' | 'incorrect' | 'partially_correct';
}

interface ModelPerformanceMetrics {
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  predictionSpeed: number;
  lastEvaluated: Date;
  improvementTrend: 'improving' | 'declining' | 'stable';
}

interface RiskAssessment {
  id: string;
  entityId: string;
  entityType: 'proposal' | 'product' | 'customer' | 'timeline';
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigation: MitigationStrategy[];
  confidence: number;
  assessedAt: Date;
  validUntil: Date;
  assessedBy: 'ai_model' | 'human' | 'hybrid';
}

interface RiskFactor {
  id: string;
  factor: string;
  impact: number; // 0-10
  probability: number; // 0-1
  description: string;
  category: 'technical' | 'business' | 'timeline' | 'resource' | 'compliance';
  evidence: string[];
}

interface MitigationStrategy {
  id: string;
  strategy: string;
  effectiveness: number; // 0-1
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  responsibility: string;
  status: 'proposed' | 'approved' | 'implemented' | 'verified';
}
```

### Administrative and Audit

```typescript
interface AuditLog {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  changes: AuditChange[];
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'data' | 'access' | 'configuration' | 'security' | 'system';
}

interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'create' | 'update' | 'delete';
}

interface SystemConfiguration {
  id: string;
  category: string;
  key: string;
  value: any;
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'array';
  description: string;
  isSecret: boolean;
  lastModified: Date;
  modifiedBy: string;
  validationRules?: ConfigValidationRule[];
  environment: 'development' | 'staging' | 'production';
}

interface ConfigValidationRule {
  rule: string;
  errorMessage: string;
  severity: 'error' | 'warning';
}

interface SecurityEvent {
  id: string;
  type:
    | 'login_attempt'
    | 'permission_denied'
    | 'data_access'
    | 'config_change'
    | 'suspicious_activity';
  userId?: string;
  ipAddress: string;
  timestamp: Date;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'investigating' | 'resolved' | 'false_positive';
  response: SecurityResponse[];
}

interface SecurityResponse {
  action: string;
  timestamp: Date;
  performedBy: string;
  result: string;
  notes?: string;
}

interface BackupRecord {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  size: number;
  location: string;
  checksum: string;
  retentionPolicy: string;
  errorMessage?: string;
  restoredAt?: Date;
  restoredBy?: string;
}
```

### Accessibility and User Experience

```typescript
interface AccessibilityConfiguration {
  userId: string;
  preferences: AccessibilityPreferences;
  assistiveTechnology: AssistiveTechInfo[];
  customizations: UICustomization[];
  lastUpdated: Date;
  complianceLevel: 'AA' | 'AAA';
  testResults: AccessibilityTestResult[];
}

interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigation: boolean;
  colorBlindnessType?:
    | 'protanopia'
    | 'deuteranopia'
    | 'tritanopia'
    | 'achromatopsia';
  textScaling: number; // 1.0 to 3.0
  focusIndicatorStyle: 'default' | 'enhanced' | 'custom';
  audioDescriptions: boolean;
  captions: boolean;
}

interface AssistiveTechInfo {
  type:
    | 'screen_reader'
    | 'voice_control'
    | 'eye_tracking'
    | 'switch_control'
    | 'magnifier';
  name: string;
  version: string;
  compatibility: 'full' | 'partial' | 'limited' | 'unknown';
  optimizations: string[];
}

interface UICustomization {
  component: string;
  property: string;
  value: any;
  reason: string;
  appliedAt: Date;
}

interface AccessibilityTestResult {
  id: string;
  testType: 'automated' | 'manual' | 'user_testing';
  standard: 'WCAG_2_1_AA' | 'WCAG_2_1_AAA' | 'Section_508' | 'EN_301_549';
  component: string;
  passed: boolean;
  violations: AccessibilityViolation[];
  testedAt: Date;
  testedBy: string;
  environment: string;
}

interface AccessibilityViolation {
  rule: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  element: string;
  suggestion: string;
  impact: string;
  helpUrl: string;
}
```

### Communication and Notifications

```typescript
interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  category: 'system' | 'workflow' | 'security' | 'reminder' | 'alert';
  subject: string;
  body: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
  usageCount: number;
  deliverySettings: DeliverySettings;
}

interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
}

interface DeliverySettings {
  priority: 'low' | 'normal' | 'high' | 'urgent';
  retryAttempts: number;
  batchSize: number;
  throttleLimit: number;
  deliveryWindow?: TimeWindow;
}

interface TimeWindow {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  timezone: string;
  days: string[]; // ['monday', 'tuesday', etc.]
}

interface NotificationDelivery {
  id: string;
  templateId: string;
  recipientId: string;
  recipientType: 'user' | 'role' | 'group' | 'external';
  channel: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'read';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  attempts: number;
  errorMessage?: string;
  metadata: Record<string, any>;
}

interface CommunicationPreferences {
  userId: string;
  channels: ChannelPreference[];
  frequency: FrequencySettings;
  quietHours: TimeWindow;
  categories: CategoryPreference[];
  language: string;
  timezone: string;
}

interface ChannelPreference {
  channel: 'email' | 'sms' | 'push' | 'in_app';
  enabled: boolean;
  address?: string; // email address or phone number
  verified: boolean;
  primary: boolean;
}

interface FrequencySettings {
  immediate: string[]; // categories for immediate delivery
  daily: string[]; // categories for daily digest
  weekly: string[]; // categories for weekly digest
  disabled: string[]; // disabled categories
}

interface CategoryPreference {
  category: string;
  enabled: boolean;
  channels: string[];
  frequency: 'immediate' | 'daily' | 'weekly' | 'disabled';
}
```

## Enhanced Database Relationships

```typescript
// Key relationships for analytics and traceability
interface DatabaseRelationships {
  // User Story to Component mapping
  userStoryComponents: {
    userStoryId: string;
    componentId: string;
    relationship: 'primary' | 'supporting';
  };

  // Hypothesis to User Story mapping
  hypothesisUserStories: {
    hypothesis: string;
    userStoryId: string;
    targetValue: number;
    weight: number;
  };

  // Component to Analytics mapping
  componentAnalytics: {
    componentId: string;
    analyticsEventId: string;
    measurementType: string;
  };

  // Test Case to Hypothesis mapping
  testHypothesis: {
    testCaseId: string;
    hypothesis: string;
    validationType: 'functional' | 'performance' | 'integration';
  };

  // Performance Baseline relationships
  baselineComparisons: {
    baselineId: string;
    currentMeasurementId: string;
    improvementPercentage: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

// Additional relationships for new entities
interface EnhancedDatabaseRelationships extends DatabaseRelationships {
  // Testing relationships
  testHypothesisMapping: {
    testCaseId: string;
    hypothesis: string;
    userStoryId: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
  };

  // Predictive model relationships
  modelPredictionAccuracy: {
    modelId: string;
    predictionId: string;
    actualOutcome: any;
    accuracyScore: number;
    feedbackDate: Date;
  };

  // Accessibility relationships
  userAccessibilityProfile: {
    userId: string;
    configurationId: string;
    lastUsed: Date;
    effectiveness: number;
  };

  // Audit trail relationships
  auditEntityRelation: {
    auditLogId: string;
    entityType: string;
    entityId: string;
    changeImpact: 'minor' | 'major' | 'critical';
  };

  // Communication relationships
  notificationUserPreference: {
    notificationTemplateId: string;
    userId: string;
    personalizedSettings: Record<string, any>;
  };

  // Risk assessment relationships
  riskMitigationTracking: {
    riskAssessmentId: string;
    mitigationStrategyId: string;
    implementationProgress: number;
    effectiveness: number;
  };
}
```

## Enhanced Indexes and Constraints

```sql
-- Performance-critical indexes for analytics queries
CREATE INDEX idx_hypothesis_events_timestamp ON hypothesis_validation_events(timestamp, hypothesis);
CREATE INDEX idx_user_story_metrics_completion ON user_story_metrics(completion_rate, user_story_id);
CREATE INDEX idx_performance_baselines_hypothesis ON performance_baselines(hypothesis, metric_name);
CREATE INDEX idx_component_traceability_user_stories ON component_traceability(user_stories);
CREATE INDEX idx_analytics_events_user_session ON content_search_analytics(user_id, session_id, timestamp);

-- Unique constraints for data integrity
ALTER TABLE component_traceability ADD CONSTRAINT unique_component_name UNIQUE (component_name);
ALTER TABLE hypothesis_validation_events ADD CONSTRAINT unique_event_per_session UNIQUE (session_id, component_id, action, timestamp);
ALTER TABLE performance_baselines ADD CONSTRAINT unique_baseline_metric UNIQUE (hypothesis, metric_name, collection_date);

-- Testing and quality assurance indexes
CREATE INDEX idx_test_cases_hypothesis ON test_cases(hypothesis, status);
CREATE INDEX idx_test_execution_results ON test_executions(test_case_id, passed, executed_at);
CREATE INDEX idx_baseline_metrics_hypothesis ON baseline_metrics(hypothesis, metric, collected_at);

-- Predictive validation indexes
CREATE INDEX idx_predictions_confidence ON prediction_results(model_id, confidence, timestamp);
CREATE INDEX idx_risk_assessments_score ON risk_assessments(entity_type, risk_score, assessed_at);
CREATE INDEX idx_model_performance ON model_performance_metrics(model_id, accuracy, last_evaluated);

-- Administrative and audit indexes
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, timestamp);
CREATE INDEX idx_security_events_risk ON security_events(risk_level, timestamp, status);
CREATE INDEX idx_system_config_category ON system_configuration(category, environment);

-- Accessibility indexes
CREATE INDEX idx_accessibility_user ON accessibility_configuration(user_id, compliance_level);
CREATE INDEX idx_accessibility_tests ON accessibility_test_results(component, standard, passed);

-- Communication indexes
CREATE INDEX idx_notification_delivery_status ON notification_delivery(status, sent_at);
CREATE INDEX idx_notification_templates_category ON notification_templates(category, is_active);
```

This enhanced data model provides comprehensive support for all wireframe
requirements while maintaining system integrity and performance through proper
indexing and relationship management.
