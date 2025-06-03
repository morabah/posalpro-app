/**
 * PosalPro MVP2 - Advanced Analytics Type Definitions
 * Supporting hypothesis validation and user story tracking
 * Based on DATA_MODEL.md analytics requirements
 */

import { BaseEntity } from './shared';

/**
 * User story performance metrics
 */
export interface UserStoryMetrics extends BaseEntity {
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

/**
 * Performance baseline tracking
 */
export interface PerformanceBaseline extends BaseEntity {
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

/**
 * Test execution results
 */
export interface TestExecutionResult extends BaseEntity {
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

/**
 * Component traceability matrix
 */
export interface ComponentTraceability extends BaseEntity {
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

/**
 * Content search analytics (H1 hypothesis)
 */
export interface ContentSearchAnalytics extends BaseEntity {
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

/**
 * SME contribution analytics (H3 hypothesis)
 */
export interface SMEContributionAnalytics extends BaseEntity {
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

/**
 * Cross-department coordination analytics (H4 hypothesis)
 */
export interface CoordinationAnalytics extends BaseEntity {
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

/**
 * Technical validation analytics (H8 hypothesis)
 */
export interface ValidationAnalytics extends BaseEntity {
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

/**
 * RFP requirement extraction analytics (H6 hypothesis)
 */
export interface RequirementExtractionAnalytics extends BaseEntity {
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

/**
 * Component performance tracking
 */
export interface ComponentPerformance extends BaseEntity {
  componentName: string;
  renderTime: number;
  reRenderCount: number;
  errorRate: number;
  userSatisfaction: number;
  usageFrequency: number;
  performanceScore: number;
  optimizationSuggestions: string[];
}

/**
 * Hypothesis validation status
 */
export type HypothesisStatus =
  | 'not_started'
  | 'in_progress'
  | 'data_collection'
  | 'analysis'
  | 'validated'
  | 'failed'
  | 'needs_revision';

/**
 * Analytics event types for consistent tracking
 */
export type AnalyticsEventType =
  | 'hypothesis_validation'
  | 'user_story_completion'
  | 'component_performance'
  | 'test_execution'
  | 'search_operation'
  | 'contribution_tracking'
  | 'coordination_event'
  | 'validation_check'
  | 'requirement_extraction';

/**
 * Centralized analytics configuration
 */
export interface AnalyticsConfig {
  enableTracking: boolean;
  batchSize: number;
  flushInterval: number;
  retentionDays: number;
  enableDebugLogging: boolean;
  enablePerformanceTracking: boolean;
  enableHypothesisValidation: boolean;
  samplingRate: number;
}
