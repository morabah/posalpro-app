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

export enum CustomerType {
  MIDDLEMAN = 'MIDDLEMAN',
  ENDUSER = 'ENDUSER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  VENDOR = 'VENDOR',
  CONTRACTOR = 'CONTRACTOR',
  GOVERNMENTAL = 'GOVERNMENTAL',
  NGO = 'NGO',
  SYSTEM_INTEGRATOR = 'SYSTEM_INTEGRATOR',
  BRAND = 'BRAND',
}

// Core Customer Types (manually defined to match Prisma schema)
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  country?: string | null;
  industry?: string | null;
  companySize?: string | null;
  revenue?: number | null;
  status: CustomerStatus;
  tier: CustomerTier;
  customerType?: CustomerType | null;
  tags: string[];
  metadata?: Record<string, unknown> | null;
  segmentation?: Record<string, unknown> | null;
  riskScore?: number | null;
  ltv?: number | null;
  brandName?: string | null;
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
  segmentationCriteria: Record<string, unknown>;
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
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  country?: string;
  industry?: string;
  companySize?: string;
  revenue?: number;
  tier?: CustomerTier;
  customerType?: CustomerType;
  brandName?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
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
  customerType?: CustomerType[];
  industry?: string[];
  tags?: string[];
  revenueMin?: number;
  revenueMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
  // Cursor pagination properties (following CORE_REQUIREMENTS.md)
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  metadata?: Record<string, unknown>;
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

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  tier: CustomerTier;
  metadata: Record<string, unknown> | null;
  tags: string[] | null;
  totalProposals: number;
  totalValue: number;
}

export type CustomerSortBy =
  | 'name'
  | 'status'
  | 'tier'
  | 'totalProposals'
  | 'totalValue'
  | 'createdAt';
