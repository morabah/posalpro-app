/**
 * Proposal Entity Types
 * Based on Prisma models and DATA_MODEL.md specifications
 */

import { Customer, CustomerContact } from './customer';
import { Product } from './product';

// Proposal Enums (manually defined to match Prisma schema)
export enum ProposalStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum SectionType {
  TEXT = 'TEXT',
  PRODUCTS = 'PRODUCTS',
  TERMS = 'TERMS',
  PRICING = 'PRICING',
  CUSTOM = 'CUSTOM',
}

export enum ValidationStatus {
  VALID = 'VALID',
  INVALID = 'INVALID',
  WARNING = 'WARNING',
  NOT_VALIDATED = 'NOT_VALIDATED',
}

// Core Proposal Types (manually defined to match Prisma schema)
export interface Proposal {
  id: string;
  title: string;
  description?: string | null;
  customerId: string;
  createdBy: string;
  status: ProposalStatus;
  version: number;
  priority: Priority;
  value?: number | null;
  currency: string;
  validUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date | null;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  performanceData?: any | null;
  userStoryTracking?: any | null;
  riskScore?: number | null;
  tags: string[];
  metadata?: any | null;
}

export interface ProposalSection {
  id: string;
  proposalId: string;
  title: string;
  content: string;
  order: number;
  type: SectionType;
  validationStatus: ValidationStatus;
  analyticsData?: any | null;
  metadata?: any | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProposalProduct {
  id: string;
  proposalId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  configuration?: any | null;
  selectionAnalytics?: any | null;
  createdAt: Date;
  updatedAt: Date;
}

// Proposal with relations
export interface ProposalWithDetails extends Proposal {
  customer: Customer & {
    contacts: CustomerContact[];
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  sections: ProposalSection[];
  products: Array<
    ProposalProduct & {
      product: Product;
    }
  >;
  approvals: Array<{
    id: string;
    status: string;
  }>;
  validationIssues: Array<{
    id: string;
    severity: string;
    message: string;
    status: string;
  }>;
}

export interface ProposalWithCustomer extends Proposal {
  customer: Customer;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

// Analytics Types (from DATA_MODEL.md)
export interface ProposalPerformanceMetrics {
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

export interface UserStoryTracking {
  userStoryId: string;
  componentUsage: ComponentUsage[];
  performanceData: Record<string, any>;
  criteriaStatus: Record<string, boolean>;
  testResults: TestResult[];
}

export interface ComponentUsage {
  componentName: string;
  usageCount: number;
  totalTime: number;
  averageTime: number;
  errorCount: number;
  successRate: number;
}

export interface TestResult {
  testId: string;
  passed: boolean;
  executionTime: number;
  errors: string[];
  timestamp: Date;
}

export interface SectionAnalytics {
  sectionId: string;
  editTime: number;
  revisionCount: number;
  collaboratorCount: number;
  aiAssistanceUsed: boolean;
  qualityScore: number;
  userStoryContributions: string[];
}

export interface ProductSelectionAnalytics {
  selectionTime: number;
  alternativesConsidered: number;
  validationChecks: number;
  configurationChanges: number;
  aiRecommendationsUsed: boolean;
  userStory: string[];
}

// Form Types
export interface CreateProposalData {
  title: string;
  description?: string;
  customerId: string;
  createdBy: string;
  assignedTo?: string[];
  priority?: Priority;
  value?: number;
  currency?: string;
  validUntil?: Date;
  dueDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateProposalData {
  id: string;
  title?: string;
  description?: string;
  status?: ProposalStatus;
  priority?: Priority;
  value?: number;
  currency?: string;
  validUntil?: Date;
  dueDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateProposalSectionData {
  title: string;
  content: string;
  order: number;
  type?: SectionType;
  metadata?: Record<string, any>;
}

export interface CreateProposalProductData {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  configuration?: Record<string, any>;
}

// Query Types
export interface ProposalFilters {
  status?: ProposalStatus[];
  priority?: Priority[];
  customerId?: string;
  createdBy?: string;
  assignedTo?: string;
  tags?: string[];
  valueMin?: number;
  valueMax?: number;
  dueBefore?: Date;
  dueAfter?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
}

export interface ProposalSortOptions {
  field: 'title' | 'createdAt' | 'dueDate' | 'value' | 'status';
  direction: 'asc' | 'desc';
}

// Component Traceability Matrix
export interface ProposalComponentMapping {
  userStories: string[];
  acceptanceCriteria: string[];
  methods: string[];
  hypotheses: string[];
  testCases: string[];
  analyticsHooks: string[];
}

// Validation Types
export interface ProposalValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}
