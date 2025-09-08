/**
 * PosalPro MVP2 - Consolidated Customer Schemas
 * User Story: US-2.1 (Customer Management)
 * Hypothesis: H3 (Customer relationship management improves proposal success)
 *
 * ✅ CONSOLIDATED: All customer schemas in one location
 * ✅ ALIGNS: API route schemas for consistent frontend-backend integration
 * ✅ FOLLOWS: Feature-based organization pattern
 */

import { z } from 'zod';

// ====================
// Base Schemas (Reusable)
// ====================

export const CustomerStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT']);

export const CustomerTierSchema = z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE']);

export const CustomerIndustrySchema = z.preprocess(
  val => {
    if (typeof val === 'string') {
      const normalized = val.toUpperCase();
      switch (normalized) {
        case 'TECHNOLOGY':
        case 'HEALTHCARE':
        case 'FINANCE':
        case 'RETAIL':
        case 'MANUFACTURING':
        case 'EDUCATION':
        case 'GOVERNMENT':
          return normalized;
        case 'FINANCIAL SERVICES':
          return 'FINANCE';
        default:
          return 'OTHER';
      }
    }
    return val;
  },
  z.enum([
    'TECHNOLOGY',
    'HEALTHCARE',
    'FINANCE',
    'RETAIL',
    'MANUFACTURING',
    'EDUCATION',
    'GOVERNMENT',
    'OTHER',
  ])
);

export const CompanySizeSchema = z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']);

// ====================
// Core Customer Schemas
// ====================

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  industry: CustomerIndustrySchema.optional().nullable(),
  companySize: z.string().nullable().optional(),
  revenue: z.number().nullable().optional(),
  status: CustomerStatusSchema,
  tier: CustomerTierSchema.optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
  segmentation: z.record(z.unknown()).nullable().optional(),
  riskScore: z.number().nullable().optional(),
  ltv: z.number().nullable().optional(),
  lastContact: z.string().nullable().optional(),
  cloudId: z.string().nullable().optional(),
  lastSyncedAt: z.string().nullable().optional(),
  syncStatus: z.string().nullable().optional(),
  createdAt: z
    .union([z.string(), z.date()])
    .transform(val => (val instanceof Date ? val.toISOString() : val)),
  updatedAt: z
    .union([z.string(), z.date()])
    .transform(val => (val instanceof Date ? val.toISOString() : val)),
});

export const CustomerCreateSchema = CustomerSchema.extend({
  // Override with more specific validation for create
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  // Remove fields that shouldn't be set during creation
  metadata: true,
  segmentation: true,
  riskScore: true,
  ltv: true,
  lastContact: true,
  cloudId: true,
  lastSyncedAt: true,
  syncStatus: true,
});

// Email validation schema for uniqueness checking
export const EmailValidationSchema = z.object({
  email: z.string().email('Invalid email format'),
  excludeId: z.string().optional(),
});

export const CustomerUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().optional(),
  country: z.string().optional(),
  industry: CustomerIndustrySchema.optional(),
  tier: CustomerTierSchema.optional(),
  status: CustomerStatusSchema.optional(),
  tags: z.array(z.string()).optional(),
  segmentation: z.any().optional(),
  riskScore: z.number().min(0).max(100).optional().nullable(),
  ltv: z.number().min(0).optional().nullable(),
  companySize: z.string().optional(),
  revenue: z.number().optional().nullable(),
});

// ====================
// Customer Contact Schemas
// ====================

export const CustomerContactSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  name: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  role: z.string().optional(),
  isPrimary: z.boolean().default(false),
  department: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CustomerContactCreateSchema = CustomerContactSchema.omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
});

export const CustomerContactUpdateSchema = CustomerContactCreateSchema.partial();

// ====================
// Customer Health Metrics Schemas
// ====================

export const CustomerHealthMetricsSchema = z.object({
  customerId: z.string(),
  satisfactionScore: z.number().min(0).max(10).optional(),
  engagementLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  churnRisk: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  lastInteraction: z.string().datetime().optional(),
  interactionFrequency: z.number().optional(),
  supportTickets: z.number().optional(),
  revenueGrowth: z.number().optional(),
  healthScore: z.number().min(0).max(100).optional(),
  updatedAt: z.string().datetime(),
});

// ====================
// Customer Business Metrics Schemas
// ====================

export const CustomerBusinessMetricsSchema = z.object({
  customerId: z.string(),
  annualRevenue: z.number().optional(),
  employeeCount: z.number().optional(),
  marketCap: z.number().optional(),
  growthRate: z.number().optional(),
  industryPosition: z.enum(['LEADER', 'CHALLENGER', 'NICHE', 'FOLLOWER']).optional(),
  technologyAdoption: z.enum(['EARLY_ADOPTER', 'MAINSTREAM', 'LAGGARD']).optional(),
  budgetCycle: z.enum(['QUARTERLY', 'ANNUAL', 'AD_HOC']).optional(),
  decisionMakingProcess: z.enum(['CENTRALIZED', 'DECENTRALIZED', 'COMMITTEE']).optional(),
  updatedAt: z.string().datetime(),
});

// ====================
// Customer Opportunity Schemas
// ====================

export const CustomerOpportunitySchema = z.object({
  id: z.string(),
  customerId: z.string(),
  title: z.string().min(1, 'Opportunity title is required'),
  description: z.string().optional(),
  value: z.number().positive().optional(),
  probability: z.number().min(0).max(100).optional(),
  stage: z.enum([
    'PROSPECTING',
    'QUALIFICATION',
    'PROPOSAL',
    'NEGOTIATION',
    'CLOSED_WON',
    'CLOSED_LOST',
  ]),
  expectedCloseDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CustomerOpportunityCreateSchema = CustomerOpportunitySchema.omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
});

// ====================
// Customer Interaction Schemas
// ====================

export const CustomerInteractionSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  type: z.enum(['CALL', 'EMAIL', 'MEETING', 'DEMO', 'SUPPORT', 'SALES']),
  subject: z.string().min(1, 'Interaction subject is required'),
  description: z.string().optional(),
  outcome: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  participants: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CustomerInteractionCreateSchema = CustomerInteractionSchema.omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
});

// ====================
// Customer Analytics Schemas
// ====================

export const CustomerAnalyticsSchema = z.object({
  customerId: z.string(),
  totalProposals: z.number().default(0),
  successfulProposals: z.number().default(0),
  totalRevenue: z.number().default(0),
  averageProposalValue: z.number().default(0),
  proposalSuccessRate: z.number().min(0).max(100).default(0),
  lastProposalDate: z.string().datetime().optional(),
  averageResponseTime: z.number().optional(),
  engagementScore: z.number().min(0).max(100).default(0),
  lifetimeValue: z.number().default(0),
  updatedAt: z.string().datetime(),
});

// ====================
// Customer Segmentation Schemas
// ====================

export const CustomerSegmentationSchema = z.object({
  customerId: z.string(),
  segment: z.enum(['ENTERPRISE', 'MID_MARKET', 'SMB', 'STARTUP']),
  subSegment: z.string().optional(),
  buyingBehavior: z.enum(['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE']).optional(),
  technologyMaturity: z.enum(['BASIC', 'INTERMEDIATE', 'ADVANCED']).optional(),
  budgetRange: z.enum(['LOW', 'MEDIUM', 'HIGH', 'ENTERPRISE']).optional(),
  decisionSpeed: z.enum(['SLOW', 'MODERATE', 'FAST']).optional(),
  riskTolerance: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  updatedAt: z.string().datetime(),
});

// ====================
// Customer Query and Search Schemas
// ====================

export const CustomerQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z.enum(['createdAt', 'name', 'status', 'revenue']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: CustomerStatusSchema.optional(),
  tier: CustomerTierSchema.optional(),
  industry: CustomerIndustrySchema.optional(),
  companySize: z.string().optional(),
});

export const CustomerSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(100).default(20),
  filters: z
    .object({
      status: CustomerStatusSchema.optional(),
      tier: CustomerTierSchema.optional(),
      industry: CustomerIndustrySchema.optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

// ====================
// Customer List and Response Schemas
// ====================

export const CustomerListSchema = z.object({
  items: z.array(CustomerSchema),
  nextCursor: z.string().nullable(),
});

export const CustomerSearchResponseSchema = z.object({
  items: z.array(CustomerSchema),
  total: z.number(),
  nextCursor: z.string().nullable(),
});

// ====================
// Customer Bulk Operation Schemas
// ====================

export const CustomerBulkOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'archive', 'delete', 'update_tier']),
  customerIds: z.array(z.string()).min(1),
  options: z.record(z.unknown()).optional(),
});

export const CustomerBulkUpdateSchema = z.object({
  customerIds: z.array(z.string()).min(1),
  updates: z.object({
    status: CustomerStatusSchema.optional(),
    tier: CustomerTierSchema.optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// ====================
// Customer Coordination Schemas
// ====================

export const CustomerCoordinationSchema = z.object({
  customerId: z.string(),
  teamMembers: z.array(z.string()),
  primaryContact: z.string().optional(),
  salesRepresentative: z.string().optional(),
  accountManager: z.string().optional(),
  technicalContact: z.string().optional(),
  coordinationNotes: z.string().optional(),
  updatedAt: z.string().datetime(),
});

// ====================
// API‑Specific Schemas
// ====================

// Search schema used by /api/customers/search (keeps route param names/values)
export const CustomerSearchApiSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().min(1).max(50).default(20),
  industry: z.string().optional(),
  tier: z.enum(['STANDARD', 'PREMIUM', 'ENTERPRISE', 'VIP']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED']).optional(),
});

// Bulk delete body schema for customers
export const CustomerBulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one customer ID is required'),
});

// Query schema for /api/customers/[id]/proposals
export const CustomerProposalsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum([
      'DRAFT',
      'IN_REVIEW',
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED',
      'SUBMITTED',
      'ACCEPTED',
      'DECLINED',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z
    .enum(['title', 'createdAt', 'updatedAt', 'dueDate', 'value', 'status'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeProducts: z.coerce.boolean().default(false),
  includeStatistics: z.coerce.boolean().default(true),
});

// ====================
// Type Exports
// ====================

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;
export type CustomerContact = z.infer<typeof CustomerContactSchema>;
export type CustomerContactCreate = z.infer<typeof CustomerContactCreateSchema>;
export type CustomerContactUpdate = z.infer<typeof CustomerContactUpdateSchema>;
export type CustomerHealthMetrics = z.infer<typeof CustomerHealthMetricsSchema>;
export type CustomerBusinessMetrics = z.infer<typeof CustomerBusinessMetricsSchema>;
export type CustomerOpportunity = z.infer<typeof CustomerOpportunitySchema>;
export type CustomerOpportunityCreate = z.infer<typeof CustomerOpportunityCreateSchema>;
export type CustomerInteraction = z.infer<typeof CustomerInteractionSchema>;
export type CustomerInteractionCreate = z.infer<typeof CustomerInteractionCreateSchema>;
export type CustomerAnalytics = z.infer<typeof CustomerAnalyticsSchema>;
export type CustomerSegmentation = z.infer<typeof CustomerSegmentationSchema>;
export type CustomerQuery = z.infer<typeof CustomerQuerySchema>;
export type CustomerSearch = z.infer<typeof CustomerSearchSchema>;
export type CustomerList = z.infer<typeof CustomerListSchema>;
export type CustomerSearchResponse = z.infer<typeof CustomerSearchResponseSchema>;
export type CustomerBulkOperation = z.infer<typeof CustomerBulkOperationSchema>;
export type CustomerBulkUpdate = z.infer<typeof CustomerBulkUpdateSchema>;
export type CustomerCoordination = z.infer<typeof CustomerCoordinationSchema>;
export type CustomerStatus = z.infer<typeof CustomerStatusSchema>;
export type CustomerTier = z.infer<typeof CustomerTierSchema>;
export type CustomerIndustry = z.infer<typeof CustomerIndustrySchema>;
export type CompanySize = z.infer<typeof CompanySizeSchema>;
export type CustomerSearchApi = z.infer<typeof CustomerSearchApiSchema>;
export type CustomerBulkDelete = z.infer<typeof CustomerBulkDeleteSchema>;
export type CustomerProposalsQuery = z.infer<typeof CustomerProposalsQuerySchema>;
