/**
 * PosalPro MVP2 - Deadline Management Type Definitions (H.7)
 * Based on PROMPT_H7_DEADLINE_MANAGEMENT.md specifications
 * Supports ≥40% on-time completion improvement target
 */

// Component Traceability Matrix for Deadline Management Types
export const H7_COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.1.3', 'AC-4.3.1', 'AC-4.3.2', 'AC-4.3.3'],
  methods: [
    'complexityEstimation()',
    'criticalPath()',
    'calculatePriority()',
    'mapDependencies()',
    'trackProgress()',
    'trackDeadlinePerformance()',
  ],
  hypotheses: ['H7'],
  testCases: ['TC-H7-001', 'TC-H7-002'],
};

// Core enums
export enum DeadlineStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum DeadlinePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  URGENT = 'urgent',
}

export enum DeadlineType {
  PROPOSAL_SUBMISSION = 'proposal_submission',
  TECHNICAL_REVIEW = 'technical_review',
  CLIENT_MEETING = 'client_meeting',
  INTERNAL_MILESTONE = 'internal_milestone',
  APPROVAL_DEADLINE = 'approval_deadline',
  COMPLIANCE_REVIEW = 'compliance_review',
  FINAL_DELIVERY = 'final_delivery',
}

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VERY_COMPLEX = 'very_complex',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Core interfaces
export interface Deadline {
  id: string;
  title: string;
  description: string;
  type: DeadlineType;
  status: DeadlineStatus;
  priority: DeadlinePriority;
  dueDate: Date;
  startDate?: Date;
  estimatedDuration: number; // in hours
  actualDuration?: number; // in hours
  completionDate?: Date;
  assignedTo: string[];
  createdBy: string;
  proposalId?: string;
  projectId?: string;
  parentDeadlineId?: string; // for sub-deadlines
  dependencies: string[]; // deadline IDs this depends on
  blockers: string[]; // deadline IDs that block this
  tags: string[];
  complexity: ComplexityLevel;
  riskLevel: RiskLevel;
  progress: number; // 0-100
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    estimationSource: 'ai' | 'manual' | 'historical';
    confidenceScore?: number; // 0-100 for AI estimates
    similarDeadlines?: string[]; // IDs of similar past deadlines
    escalationRules?: EscalationRule[];
    notifications?: NotificationRule[];
  };
}

export interface TimelineEstimate {
  deadlineId: string;
  estimatedStartDate: Date;
  estimatedEndDate: Date;
  estimatedDuration: number; // in hours
  confidence: number; // 0-100
  complexity: ComplexityLevel;
  factors: EstimationFactor[];
  risks: RiskFactor[];
  assumptions: string[];
  basedOnSimilar: string[]; // IDs of similar deadlines used for estimation
  aiGenerated: boolean;
  lastUpdated: Date;
  estimatedBy: string;
}

export interface EstimationFactor {
  id: string;
  name: string;
  type: 'team_size' | 'complexity' | 'dependencies' | 'resources' | 'experience' | 'external';
  impact: number; // multiplier (0.5 = 50% faster, 1.5 = 50% slower)
  confidence: number; // 0-100
  description?: string;
}

export interface RiskFactor {
  id: string;
  name: string;
  type: 'technical' | 'resource' | 'external' | 'compliance' | 'client';
  probability: number; // 0-100
  impact: number; // days of potential delay
  mitigation?: string;
  contingencyPlan?: string;
}

export interface CriticalPath {
  deadlineId: string;
  path: CriticalPathNode[];
  totalDuration: number; // in hours
  bottlenecks: Bottleneck[];
  flexibility: number; // hours of slack time
  riskScore: number; // 0-100
  lastCalculated: Date;
  calculatedBy: string;
}

export interface CriticalPathNode {
  deadlineId: string;
  position: number; // order in critical path
  earliestStart: Date;
  latestStart: Date;
  slack: number; // hours
  isCritical: boolean;
  successors: string[];
  predecessors: string[];
}

export interface Bottleneck {
  deadlineId: string;
  type: 'resource' | 'dependency' | 'approval' | 'external' | 'skill';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // hours of potential delay
  description: string;
  suggestions: string[];
  resolvedAt?: Date;
}

export interface EscalationRule {
  id: string;
  trigger: 'overdue' | 'at_risk' | 'blocked' | 'progress_low';
  condition: {
    daysBeforeDue?: number;
    progressThreshold?: number;
    riskThreshold?: number;
  };
  actions: EscalationAction[];
  escalateTo: string[]; // user IDs
  isActive: boolean;
}

export interface EscalationAction {
  type: 'email' | 'notification' | 'meeting' | 'reassign' | 'priority_boost';
  parameters: Record<string, any>;
  delay: number; // minutes to wait before executing
}

export interface NotificationRule {
  id: string;
  type: 'reminder' | 'status_change' | 'milestone' | 'risk_alert';
  timing: {
    daysBeforeDue?: number;
    hoursBeforeDue?: number;
    onStatusChange?: DeadlineStatus[];
    onProgressChange?: number; // percentage threshold
  };
  recipients: string[]; // user IDs
  channels: ('email' | 'push' | 'in_app')[];
  template: string;
  isActive: boolean;
}

export interface DeadlineDependency {
  fromDeadlineId: string;
  toDeadlineId: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag: number; // hours between completion of predecessor and start of successor
  isRequired: boolean;
  description?: string;
}

// Analytics interfaces for H7 validation
export interface DeadlineManagementMetrics {
  // H7 Core Metrics
  onTimeCompletionRate: number; // Target: ≥40% improvement
  timelineAccuracy: number; // Predicted vs actual completion
  criticalPathEffectiveness: number; // Bottleneck prediction accuracy

  // Supporting Metrics
  averageCompletionTime: number;
  deadlineAdjustmentFrequency: number;
  notificationEngagementRate: number;
  taskReprioritizationRate: number;
  userProductivityScore: number;

  // Performance Metrics
  systemResponseTime: number;
  dataProcessingLatency: number;
  uiInteractionSpeed: number;

  // User Story Metrics
  complexityEstimationAccuracy: number; // AC-4.1.1
  criticalPathIdentificationSuccess: number; // AC-4.1.2
  priorityAlgorithmEffectiveness: number; // AC-4.3.1
  dependencyMappingAccuracy: number; // AC-4.3.2
  progressTrackingEngagement: number; // AC-4.3.3

  // Baseline Comparison
  baselineCompletionRate: number;
  improvementPercentage: number;
  timeToCompletionImprovement: number;
}

export interface DeadlinePerformanceData {
  deadlineId: string;
  estimatedDuration: number;
  actualDuration: number;
  estimationAccuracy: number; // percentage
  onTime: boolean;
  daysEarlyOrLate: number;
  complexityActual: ComplexityLevel;
  riskRealized: RiskFactor[];
  bottlenecksEncountered: Bottleneck[];
  escalationsTriggered: EscalationRule[];
  userSatisfactionScore?: number; // 1-5
  lessonsLearned: string[];
  timestamp: Date;
}

// Search and filter interfaces
export interface DeadlineFilters {
  status?: DeadlineStatus[];
  priority?: DeadlinePriority[];
  type?: DeadlineType[];
  assignedTo?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  complexity?: ComplexityLevel[];
  riskLevel?: RiskLevel[];
  tags?: string[];
  proposalId?: string;
  projectId?: string;
  isOverdue?: boolean;
  progressRange?: {
    min: number;
    max: number;
  };
}

export interface DeadlineSearchResult {
  deadlines: Deadline[];
  totalCount: number;
  filters: DeadlineFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  aggregations: {
    statusCounts: Record<DeadlineStatus, number>;
    priorityCounts: Record<DeadlinePriority, number>;
    onTimeRate: number;
    avgCompletionTime: number;
  };
}

// Form interfaces for deadline management
export interface CreateDeadlineData {
  title: string;
  description: string;
  type: DeadlineType;
  priority: DeadlinePriority;
  dueDate: Date;
  startDate?: Date;
  assignedTo: string[];
  proposalId?: string;
  projectId?: string;
  dependencies?: string[];
  complexity?: ComplexityLevel;
  tags?: string[];
  notes?: string;
  useAIEstimation?: boolean;
}

export interface UpdateDeadlineData extends Partial<CreateDeadlineData> {
  status?: DeadlineStatus;
  progress?: number;
  actualDuration?: number;
  completionDate?: Date;
  escalationRules?: EscalationRule[];
  notificationRules?: NotificationRule[];
}

// Error handling
export interface DeadlineError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export type DeadlineResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: DeadlineError;
    };

// AI-powered estimation interfaces
export interface AIEstimationRequest {
  title: string;
  description: string;
  type: DeadlineType;
  assignedTo: string[];
  complexity?: ComplexityLevel;
  similarDeadlines?: string[];
  projectContext?: string;
}

export interface AIEstimationResponse {
  estimatedDuration: number; // hours
  confidence: number; // 0-100
  complexity: ComplexityLevel;
  factors: EstimationFactor[];
  risks: RiskFactor[];
  suggestions: string[];
  basedOnPatterns: string[];
  alternativeEstimates: {
    optimistic: number;
    pessimistic: number;
    mostLikely: number;
  };
}

// Integration interfaces
export interface ProposalDeadlineIntegration {
  proposalId: string;
  milestones: Deadline[];
  criticalPath: CriticalPath;
  overallTimeline: TimelineEstimate;
  riskAssessment: RiskFactor[];
  recommendedActions: string[];
}

export interface TeamMemberWorkload {
  userId: string;
  currentDeadlines: Deadline[];
  upcomingDeadlines: Deadline[];
  workloadScore: number; // 0-100
  availabilityWindows: {
    start: Date;
    end: Date;
    capacity: number; // hours
  }[];
  skillMatch: Record<string, number>; // skill -> proficiency (0-100)
  historicalPerformance: {
    avgCompletionTime: number;
    onTimeRate: number;
    qualityScore: number;
  };
}

// Dashboard integration
export interface DeadlineDashboardData {
  upcomingDeadlines: Deadline[];
  overdueDeadlines: Deadline[];
  completedToday: Deadline[];
  criticalPathItems: CriticalPathNode[];
  performanceMetrics: DeadlineManagementMetrics;
  riskAlerts: RiskFactor[];
  recommendations: string[];
  userWorkload: TeamMemberWorkload;
}
