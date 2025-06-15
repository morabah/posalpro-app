/**
 * PosalPro MVP2 - Proposal Type Definitions
 * Based on PROPOSAL_CREATION_SCREEN.md and PROPOSAL_MANAGEMENT_DASHBOARD.md
 * Supports Component Traceability Matrix and Analytics Integration
 */

// Component Traceability Matrix for Proposal Types
export const PROPOSAL_COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.3', 'US-2.2', 'US-1.2'],
  acceptanceCriteria: ['AC-4.1.1', 'AC-4.1.2', 'AC-4.1.3', 'AC-4.3.1', 'AC-2.2.1'],
  methods: [
    'createProposal()',
    'estimateTimeline()',
    'assignTeam()',
    'trackProgress()',
    'validateProposal()',
  ],
  hypotheses: ['H7', 'H4'],
  testCases: ['TC-H7-001', 'TC-H4-001'],
};

// Base enums for proposal system
export enum ProposalStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  APPROVED = 'approved',
  SUBMITTED = 'submitted',
  WON = 'won',
  LOST = 'lost',
  CANCELLED = 'cancelled',
}

export enum ProposalPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ProposalStage {
  PLANNING = 'planning',
  CONTENT_CREATION = 'content_creation',
  REVIEW = 'review',
  APPROVAL = 'approval',
  SUBMISSION = 'submission',
  FOLLOW_UP = 'follow_up',
}

export enum TeamMemberRole {
  TEAM_LEAD = 'team_lead',
  SALES_REP = 'sales_rep',
  TECHNICAL_SME = 'technical_sme',
  SECURITY_SME = 'security_sme',
  LEGAL_SME = 'legal_sme',
  PRICING_SME = 'pricing_sme',
  EXECUTIVE_REVIEWER = 'executive_reviewer',
}

export enum ExpertiseArea {
  TECHNICAL = 'technical',
  SECURITY = 'security',
  LEGAL = 'legal',
  PRICING = 'pricing',
  COMPLIANCE = 'compliance',
  BUSINESS_ANALYSIS = 'business_analysis',
}

// Core interfaces
export interface ClientInformation {
  id?: string;
  name: string;
  industry: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  requirements?: string[];
  previousEngagements?: string[];
}

export interface ProposalDetails {
  title: string;
  rfpReferenceNumber?: string;
  dueDate: Date;
  estimatedValue: number;
  priority: ProposalPriority;
  description?: string;
  requirements?: string[];
  objectives?: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  expertiseAreas: ExpertiseArea[];
  availability: number; // percentage available
  previousProposalCount: number;
  successRate: number;
}

export interface ProposalTeam {
  teamLead: TeamMember;
  salesRepresentative: TeamMember;
  subjectMatterExperts: Record<ExpertiseArea, TeamMember>;
  executiveReviewers: TeamMember[];
  additionalMembers?: TeamMember[];
}

export interface ContentItem {
  id: string;
  title: string;
  type: 'case_study' | 'template' | 'reference' | 'methodology' | 'compliance';
  relevanceScore: number;
  section: string;
  lastUsed?: Date;
  successRate?: number;
  tags: string[];
  content: string;
  metadata?: Record<string, any>;
}

export interface SelectedContent {
  item: ContentItem;
  section: string;
  customizations?: string[];
  assignedTo?: string;
}

export interface ProposalSection {
  id: string;
  title: string;
  required: boolean;
  content: SelectedContent[];
  assignedTo?: TeamMember;
  status: 'not_started' | 'in_progress' | 'completed' | 'reviewed';
  dueDate?: Date;
  estimatedHours: number;
  actualHours?: number;
}

export interface TimelineEstimate {
  totalDuration: number; // days
  complexity: 'low' | 'medium' | 'high';
  criticalPath: string[];
  milestones: {
    name: string;
    date: Date;
    dependencies: string[];
  }[];
  riskFactors: string[];
  confidence: number; // percentage
}

export interface ValidationResult {
  isValid: boolean;
  completeness: number; // percentage
  issues: {
    severity: 'error' | 'warning' | 'info';
    message: string;
    field?: string;
    suggestions?: string[];
  }[];
  complianceChecks: {
    requirement: string;
    passed: boolean;
    details?: string;
  }[];
}

export interface ProposalInsights {
  complexity: 'low' | 'medium' | 'high';
  similarProposals: {
    id: string;
    title: string;
    winRate: number;
    similarity: number;
  }[];
  keyDifferentiators: string[];
  suggestedFocusAreas: string[];
  riskFactors: string[];
  winProbability: number;
  estimatedEffort: number; // hours
}

// Main Proposal interface
export interface Proposal {
  id: string;
  client: ClientInformation;
  details: ProposalDetails;
  team: ProposalTeam;
  content: SelectedContent[];
  sections: ProposalSection[];
  timeline: TimelineEstimate;
  validation: ValidationResult;
  insights: ProposalInsights;
  status: ProposalStatus;
  stage: ProposalStage;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
  tags: string[];
  metadata: {
    sourceRfp?: string;
    budget?: number;
    expectedCloseDate?: Date;
    competitors?: string[];
    notes?: string;
  };
}

// Form interfaces for wizard steps
export interface ProposalWizardStep1Data {
  client: ClientInformation;
  details: ProposalDetails;
}

export interface ProposalWizardStep2Data {
  teamLead: string;
  salesRepresentative: string;
  subjectMatterExperts: Record<ExpertiseArea, string>;
  executiveReviewers: string[];
}

export interface ProposalWizardStep3Data {
  selectedContent: SelectedContent[];
  searchHistory: string[];
  crossStepValidation?: {
    teamAlignment: boolean;
    productCompatibility: boolean;
    rfpCompliance: boolean;
    sectionCoverage: boolean;
  };
}

export interface ProposalWizardStep4Data {
  products: {
    id: string;
    name: string;
    included: boolean;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
    category?: string;
    configuration?: Record<string, any>;
    customizations?: string[];
    notes?: string;
  }[];
  totalValue?: number;
  aiRecommendationsUsed?: number;
  searchHistory?: string[];
  crossStepValidation?: {
    teamCompatibility: boolean;
    contentAlignment: boolean;
    budgetCompliance: boolean;
    timelineRealistic: boolean;
  };
}

export interface ProposalWizardStep5Data {
  sections: ProposalSection[];
  sectionAssignments: Record<string, string>;
}

export interface ProposalWizardStep6Data {
  finalValidation: ValidationResult;
  approvals: {
    reviewer: string;
    approved: boolean;
    comments?: string;
    timestamp?: Date;
  }[];
}

// Complete wizard data
export interface ProposalWizardData {
  step1: ProposalWizardStep1Data;
  step2: ProposalWizardStep2Data;
  step3: ProposalWizardStep3Data;
  step4: ProposalWizardStep4Data;
  step5: ProposalWizardStep5Data;
  step6: ProposalWizardStep6Data;
  currentStep: number;
  isValid: boolean[];
  isDirty: boolean;
  lastSaved?: Date;
}

// Analytics interfaces for hypothesis validation
export interface ProposalCreationMetrics {
  proposalId: string;
  creationTime: number; // milliseconds - for H7 validation
  complexityScore: number;
  estimatedTimeline: number;
  teamAssignmentTime: number; // for H4 validation
  coordinationSetupTime: number;
  teamSize: number;
  aiSuggestionsAccepted: number;
  manualAssignments: number;
  assignmentAccuracy: number;
  contentSuggestionsUsed: number;
  validationIssuesFound: number;
  wizardCompletionRate: number;
  stepCompletionTimes: number[];
  userStory: string[];
  hypotheses: string[];
}

export interface ProposalManagementMetrics {
  proposalCreationTime: number;
  criticalPathAccuracy: number;
  onTimeCompletionRate: number; // target: ≥40% improvement for H7
  timelineEstimationAccuracy: number;
  taskPrioritizationEfficiency: number;
  dependencyMappingAccuracy: number;
  progressTrackingFrequency: number;
  workflowBottleneckIdentification: number;
  proposalStageDistribution: Record<string, number>;
  averageStageCompletionTime: Record<string, number>;
  proposalSuccessRate: number;
  stakeholderEngagementLevel: number;
  dashboardLoadTime: number;
  dataRefreshFrequency: number;
  reportGenerationTime: number;
  userInteractionRate: number;
}

// Filter and search interfaces
export interface ProposalFilters {
  status?: ProposalStatus[];
  priority?: ProposalPriority[];
  stage?: ProposalStage[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  teamMember?: string;
  client?: string;
  estimatedValue?: {
    min: number;
    max: number;
  };
  tags?: string[];
}

export interface ProposalSearchResult {
  proposals: Proposal[];
  totalCount: number;
  filters: ProposalFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  pagination: {
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Error handling
export interface ProposalError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export type ProposalResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ProposalError;
    };
