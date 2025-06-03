/**
 * Customer Entity Types
 * Based on Prisma models and DATA_MODEL.md specifications
 */

// Customer Status and Tier Enums (manually defined to match Prisma schema)
export enum CustomerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PROSPECT = 'PROSPECT',
  CHURNED = 'CHURNED',
}

export enum CustomerTier {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
  VIP = 'VIP',
}

// Core Customer Types (manually defined to match Prisma schema)
export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  industry?: string | null;
  companySize?: string | null;
  revenue?: number | null;
  status: CustomerStatus;
  tier: CustomerTier;
  tags: string[];
  metadata?: any | null;
  segmentation?: any | null;
  riskScore?: number | null;
  ltv?: number | null;
  createdAt: Date;
  updatedAt: Date;
  lastContact?: Date | null;
}

export interface CustomerContact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string | null;
  department?: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Customer with relations
export interface CustomerWithContacts extends Customer {
  contacts: CustomerContact[];
}

export interface CustomerWithProposals extends Customer {
  contacts: CustomerContact[];
  proposals: Array<{
    id: string;
    title: string;
    status: string;
    value?: number | null;
    sections: Array<{
      id: string;
      title: string;
    }>;
    products: Array<{
      id: string;
      quantity: number;
    }>;
  }>;
}

// Customer Analytics and Metrics (from DATA_MODEL.md)
export interface CustomerSegmentation {
  primarySegment: string;
  secondarySegments: string[];
  confidenceScore: number;
  lastUpdated: Date;
  segmentationCriteria: Record<string, any>;
}

export interface CustomerProfileMetrics {
  clientSpecificInsights: number;
  roleBasedViewEvents: number;
  sensitiveDataAccess: number;
  coordinationImprovement: number;
  profileViewFrequency: number;
  dataUpdateFrequency: number;
  insightUtilization: number;
  recommendationAccuracy: number;
  dataAccessEvents: number;
  permissionChanges: number;
  auditTrailEntries: number;
  securityViolations: number;
  segmentationAccuracy: number;
  predictiveAccuracy: number;
  opportunityIdentification: number;
  riskAssessmentAccuracy: number;
}

// Customer Form Types
export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  companySize?: string;
  revenue?: number;
  tier?: CustomerTier;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: string;
}

// Customer Contact Types
export interface CreateCustomerContactData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  isPrimary?: boolean;
}

export interface UpdateCustomerContactData extends Partial<CreateCustomerContactData> {
  id: string;
}

// Customer Query Types
export interface CustomerFilters {
  status?: CustomerStatus[];
  tier?: CustomerTier[];
  industry?: string[];
  tags?: string[];
  revenueMin?: number;
  revenueMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
}

export interface CustomerSortOptions {
  field: 'name' | 'createdAt' | 'revenue' | 'lastContact';
  direction: 'asc' | 'desc';
}

// Customer Analytics Types
export interface CustomerInsight {
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  actions?: string[];
  metadata?: Record<string, any>;
}

export interface CustomerLifetimeValue {
  current: number;
  predicted: number;
  confidence: number;
  timeframe: string;
  factors: Array<{
    factor: string;
    impact: number;
    confidence: number;
  }>;
}

// Component Traceability Matrix for Customer entities
export interface CustomerComponentMapping {
  userStories: string[];
  acceptanceCriteria: string[];
  methods: string[];
  hypotheses: string[];
  testCases: string[];
  analyticsHooks: string[];
}

// Customer validation types
export interface CustomerValidationResult {
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
