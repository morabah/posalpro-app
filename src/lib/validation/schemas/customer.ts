/**
 * PosalPro MVP2 - Customer Entity Validation Schemas
 * Customer management, profiles, and business intelligence
 * Based on CUSTOMER_PROFILE_SCREEN.md wireframe specifications
 * Supports hypothesis H4 (Cross-Department Coordination)
 */

import { z } from 'zod';
import {
  addressSchema,
  baseEntitySchema,
  emailSchema,
  phoneSchema,
  validationUtils,
} from './shared';

/**
 * Customer tier validation schema
 */
export const customerTierSchema = z.enum(['bronze', 'silver', 'gold', 'platinum', 'enterprise']);

/**
 * Customer status validation schema
 */
export const customerStatusSchema = z.enum([
  'active',
  'inactive',
  'prospective',
  'onboarding',
  'churned',
  'blacklisted',
]);

/**
 * Customer industry validation schema
 */
export const customerIndustrySchema = z.enum([
  'technology',
  'healthcare',
  'finance',
  'manufacturing',
  'retail',
  'education',
  'government',
  'nonprofit',
  'real_estate',
  'transportation',
  'energy',
  'telecommunications',
  'media',
  'consulting',
  'agriculture',
  'automotive',
  'aerospace',
  'construction',
  'other',
]);

/**
 * Engagement level validation schema
 */
export const engagementLevelSchema = z.enum(['low', 'medium', 'high', 'strategic']);

/**
 * Company size validation schema
 */
export const companySizeSchema = z.enum([
  'startup', // 1-10 employees
  'small', // 11-50 employees
  'medium', // 51-250 employees
  'large', // 251-1000 employees
  'enterprise', // 1000+ employees
]);

/**
 * Customer contact validation schema
 */
export const customerContactSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  firstName: validationUtils.stringWithLength(1, 50, 'First name'),
  lastName: validationUtils.stringWithLength(1, 50, 'Last name'),
  jobTitle: z.string().max(100, 'Job title must be less than 100 characters').optional(),
  department: z.string().max(100, 'Department must be less than 100 characters').optional(),
  email: emailSchema,
  phone: phoneSchema,
  mobile: phoneSchema,
  isPrimary: z.boolean().default(false),
  isDecisionMaker: z.boolean().default(false),
  role: z
    .enum([
      'primary_contact',
      'technical_contact',
      'financial_contact',
      'executive_sponsor',
      'end_user',
      'procurement',
      'legal',
      'other',
    ])
    .default('other'),
  preferredContactMethod: z.enum(['email', 'phone', 'mobile', 'in_person']).default('email'),
  timezone: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  lastContactDate: z.date().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Customer health metrics validation schema
 */
export const customerHealthMetricsSchema = z.object({
  customerId: z.string().uuid(),
  healthScore: z.number().min(0).max(100),
  engagementScore: z.number().min(0).max(100),
  satisfactionScore: z.number().min(0).max(100),
  growthPotential: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  churnProbability: z.number().min(0).max(1),
  lifetimeValue: z.number().min(0),
  lastUpdated: z.date(),
  factors: z
    .array(
      z.object({
        name: z.string(),
        value: z.number(),
        weight: z.number(),
        trend: z.enum(['improving', 'stable', 'declining']),
      })
    )
    .optional(),
});

/**
 * Customer business metrics validation schema
 */
export const customerBusinessMetricsSchema = z.object({
  customerId: z.string().uuid(),
  annualRevenue: z.number().min(0).optional(),
  employeeCount: z.number().int().min(1).optional(),
  marketCap: z.number().min(0).optional(),
  yearFounded: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  fiscalYearEnd: z
    .string()
    .regex(/^\d{2}-\d{2}$/, 'Fiscal year end must be in MM-DD format')
    .optional(),
  budgetCycle: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  decisionMakingProcess: z
    .enum(['centralized', 'departmental', 'committee', 'individual'])
    .optional(),
  purchasingAuthority: z.number().min(0).optional(),
  preferredVendors: z.array(z.string()).optional(),
  competitorRelationships: z.array(z.string()).optional(),
  lastUpdated: z.date(),
});

/**
 * Customer opportunity validation schema
 */
export const customerOpportunitySchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  title: validationUtils.stringWithLength(1, 200, 'Opportunity title'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  value: z.number().min(0),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('USD'),
  probability: z.number().min(0).max(100),
  stage: z.enum([
    'qualification',
    'discovery',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
  ]),
  expectedCloseDate: z.date(),
  products: z.array(z.string().uuid()).optional(),
  assignedTo: z.string().uuid(),
  source: z.enum(['inbound', 'outbound', 'referral', 'existing_customer', 'partner']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  lastActivityDate: z.date().optional(),
});

/**
 * Customer interaction validation schema
 */
export const customerInteractionSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  type: z.enum([
    'meeting',
    'call',
    'email',
    'demo',
    'proposal',
    'contract',
    'support',
    'training',
    'event',
    'other',
  ]),
  title: validationUtils.stringWithLength(1, 200, 'Interaction title'),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
  date: z.date(),
  duration: z.number().int().min(0).optional(), // in minutes
  outcome: z.enum(['positive', 'neutral', 'negative', 'follow_up_required']).optional(),
  nextSteps: z.string().max(1000, 'Next steps must be less than 1000 characters').optional(),
  participants: z.array(z.string().uuid()).optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(true),
  recordedBy: z.string().uuid(),
});

/**
 * Customer analytics validation schema (supporting H4 hypothesis)
 */
export const customerAnalyticsSchema = z.object({
  customerId: z.string().uuid(),
  // H4 Cross-Department Coordination Metrics
  coordinationEvents: z.number().int().min(0),
  departmentInteractions: z.record(z.string(), z.number()),
  collaborationEfficiency: z.number().min(0).max(100),
  informationSharingScore: z.number().min(0).max(100),

  // General Customer Analytics
  totalInteractions: z.number().int().min(0),
  averageResponseTime: z.number().min(0), // hours
  proposalCount: z.number().int().min(0),
  winRate: z.number().min(0).max(100),
  averageDealSize: z.number().min(0),
  salesCycleLength: z.number().min(0), // days
  supportTickets: z.number().int().min(0),
  npsScore: z.number().min(-100).max(100).optional(),

  // Predictive Analytics
  churnRisk: z.number().min(0).max(100),
  upsellPotential: z.number().min(0).max(100),
  referralProbability: z.number().min(0).max(100),

  // Performance Metrics
  hypothesesSupported: z.array(z.string()),
  performanceMetrics: z.record(z.string(), z.number()),
  lastUpdated: z.date(),
});

/**
 * Customer segmentation validation schema
 */
export const customerSegmentationSchema = z.object({
  customerId: z.string().uuid(),
  primarySegment: z.enum([
    'strategic',
    'key_account',
    'growth',
    'maintenance',
    'new_prospect',
    'at_risk',
    'low_value',
  ]),
  subSegments: z.array(z.string()).optional(),
  segmentationDate: z.date(),
  segmentationScore: z.number().min(0).max(100),
  criteria: z.array(
    z.object({
      name: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
      weight: z.number(),
    })
  ),
  autoGenerated: z.boolean().default(false),
  lastReviewDate: z.date().optional(),
  nextReviewDate: z.date().optional(),
});

/**
 * Core customer validation schema
 * Based on CUSTOMER_PROFILE_SCREEN.md and existing customer components
 */
export const customerSchema = baseEntitySchema.extend({
  // Basic Information
  name: validationUtils.stringWithLength(1, 200, 'Company name'),
  displayName: z.string().max(200, 'Display name must be less than 200 characters').optional(),
  legalName: z.string().max(200, 'Legal name must be less than 200 characters').optional(),

  // Business Information
  industry: customerIndustrySchema,
  subIndustry: z.string().max(100, 'Sub-industry must be less than 100 characters').optional(),
  companySize: companySizeSchema,
  employeeCount: z.number().int().min(1).optional(),
  annualRevenue: z.number().min(0).optional(),

  // Contact Information
  website: z.string().url('Please enter a valid website URL').optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,

  // Address
  address: addressSchema,
  billingAddress: addressSchema.optional(),

  // Status and Classification
  status: customerStatusSchema,
  tier: customerTierSchema,
  engagementLevel: engagementLevelSchema,

  // Business Metrics
  healthScore: z.number().min(0).max(100).default(50),
  lifetimeValue: z.number().min(0).default(0),
  totalContracts: z.number().int().min(0).default(0),
  totalRevenue: z.number().min(0).default(0),

  // Relationship Management
  accountManager: z.string().uuid().optional(),
  salesRep: z.string().uuid().optional(),
  technicalContact: z.string().uuid().optional(),

  // Preferences and Configuration
  preferredContactMethod: z.enum(['email', 'phone', 'in_person', 'portal']).default('email'),
  preferredCommunicationFrequency: z
    .enum(['daily', 'weekly', 'monthly', 'quarterly'])
    .default('monthly'),
  timezone: z.string().optional(),
  language: z.string().length(2, 'Language must be a 2-letter ISO code').default('en'),

  // Business Rules
  paymentTerms: z
    .enum(['net_15', 'net_30', 'net_45', 'net_60', 'prepaid', 'custom'])
    .default('net_30'),
  creditLimit: z.number().min(0).optional(),
  discountEligibility: z.number().min(0).max(100).default(0),

  // Compliance and Security
  isSecurityCleared: z.boolean().default(false),
  securityLevel: z.enum(['public', 'confidential', 'secret', 'top_secret']).default('public'),
  complianceRequirements: z.array(z.string()).optional(),
  dataRetentionPolicy: z.enum(['standard', 'extended', 'custom']).default('standard'),

  // Analytics and Tracking (supporting H4 hypothesis)
  lastContactDate: z.date().optional(),
  nextActionDue: z.date().optional(),
  lastOrderDate: z.date().optional(),
  lastSupportTicket: z.date().optional(),

  // Categorization
  tags: validationUtils.arrayWithLength(z.string().min(1), 0, 50, 'Customer tags'),
  categories: z.array(z.string()).optional(),

  // Notes and Additional Information
  notes: z.string().max(5000, 'Notes must be less than 5000 characters').optional(),
  internalNotes: z
    .string()
    .max(5000, 'Internal notes must be less than 5000 characters')
    .optional(),

  // Integration and External Systems
  externalIds: z.record(z.string(), z.string()).optional(),
  crmId: z.string().optional(),
  erpId: z.string().optional(),

  // Visibility and Access Control
  isVisible: z.boolean().default(true),
  restrictedDepartments: z.array(z.string()).optional(),
  accessLevel: z.enum(['public', 'internal', 'restricted', 'confidential']).default('internal'),
});

/**
 * Customer with relationships validation schema
 */
export const customerWithRelationshipsSchema = customerSchema.extend({
  contacts: z.array(customerContactSchema).optional(),
  opportunities: z.array(customerOpportunitySchema).optional(),
  interactions: z.array(customerInteractionSchema).optional(),
  healthMetrics: customerHealthMetricsSchema.optional(),
  businessMetrics: customerBusinessMetricsSchema.optional(),
  analytics: customerAnalyticsSchema.optional(),
  segmentation: customerSegmentationSchema.optional(),
});

/**
 * Customer creation validation schema
 */
export const createCustomerSchema = customerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  healthScore: true,
  lifetimeValue: true,
  totalContracts: true,
  totalRevenue: true,
});

/**
 * Customer update validation schema
 */
export const updateCustomerSchema = customerSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Customer search and filtering validation schema
 */
export const customerSearchSchema = z.object({
  query: z.string().optional(),
  industry: z.array(customerIndustrySchema).optional(),
  tier: z.array(customerTierSchema).optional(),
  status: z.array(customerStatusSchema).optional(),
  companySize: z.array(companySizeSchema).optional(),
  engagementLevel: z.array(engagementLevelSchema).optional(),
  accountManager: z.string().uuid().optional(),
  healthScoreMin: z.number().min(0).max(100).optional(),
  healthScoreMax: z.number().min(0).max(100).optional(),
  revenueMin: z.number().min(0).optional(),
  revenueMax: z.number().min(0).optional(),
  lastContactBefore: z.date().optional(),
  lastContactAfter: z.date().optional(),
  tags: z.array(z.string()).optional(),
  hasOpportunities: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum([
      'name',
      'industry',
      'tier',
      'healthScore',
      'lifetimeValue',
      'lastContactDate',
      'createdAt',
      'updatedAt',
    ])
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Customer bulk operations validation schema
 */
export const customerBulkOperationSchema = z.object({
  operation: z.enum(['update', 'delete', 'activate', 'deactivate', 'segment', 'tag']),
  customerIds: z.array(z.string().uuid()).min(1, 'At least one customer ID is required'),
  data: z.record(z.string(), z.any()).optional(),
  validateFirst: z.boolean().default(true),
  continueOnError: z.boolean().default(false),
});

/**
 * Customer coordination validation schema (supporting H4 hypothesis)
 */
export const customerCoordinationSchema = z.object({
  customerId: z.string().uuid(),
  departments: z.array(z.string()).min(1, 'At least one department is required'),
  coordinationType: z.enum(['proposal', 'support', 'project', 'review', 'planning']),
  participants: z.array(z.string().uuid()),
  coordinationDate: z.date(),
  outcome: z.enum(['successful', 'partial', 'failed', 'pending']).optional(),
  efficiency: z.number().min(0).max(100).optional(),
  issues: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
});

/**
 * Type exports
 */
export type Customer = z.infer<typeof customerSchema>;
export type CustomerWithRelationships = z.infer<typeof customerWithRelationshipsSchema>;
export type CustomerTier = z.infer<typeof customerTierSchema>;
export type CustomerStatus = z.infer<typeof customerStatusSchema>;
export type CustomerIndustry = z.infer<typeof customerIndustrySchema>;
export type EngagementLevel = z.infer<typeof engagementLevelSchema>;
export type CompanySize = z.infer<typeof companySizeSchema>;
export type CustomerContact = z.infer<typeof customerContactSchema>;
export type CustomerHealthMetrics = z.infer<typeof customerHealthMetricsSchema>;
export type CustomerBusinessMetrics = z.infer<typeof customerBusinessMetricsSchema>;
export type CustomerOpportunity = z.infer<typeof customerOpportunitySchema>;
export type CustomerInteraction = z.infer<typeof customerInteractionSchema>;
export type CustomerAnalytics = z.infer<typeof customerAnalyticsSchema>;
export type CustomerSegmentation = z.infer<typeof customerSegmentationSchema>;
export type CreateCustomerData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerData = z.infer<typeof updateCustomerSchema>;
export type CustomerSearchOptions = z.infer<typeof customerSearchSchema>;
export type CustomerBulkOperation = z.infer<typeof customerBulkOperationSchema>;
export type CustomerCoordination = z.infer<typeof customerCoordinationSchema>;

/**
 * Component Traceability Matrix for H4 hypothesis validation
 */
export const CUSTOMER_COMPONENT_MAPPING = {
  userStories: ['US-2.3', 'US-1.3', 'US-4.1'],
  acceptanceCriteria: ['AC-2.3.1', 'AC-2.3.2', 'AC-2.3.3', 'AC-1.3.3', 'AC-4.1.1'],
  methods: [
    'configureAccess()',
    'generateRecommendations()',
    'secureAccess()',
    'trackHistory()',
    'logActivity()',
    'classifyCustomer()',
    'manageContacts()',
  ],
  hypotheses: ['H4'],
  testCases: ['TC-H4-002', 'TC-H1-003', 'TC-H7-001'],
} as const;
