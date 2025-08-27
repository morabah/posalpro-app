/**
 * PosalPro MVP2 - Consolidated Proposal Schemas
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 *
 * ✅ CONSOLIDATED: All proposal schemas in one location
 * ✅ ALIGNS: API route schemas for consistent frontend-backend integration
 * ✅ FOLLOWS: Feature-based organization pattern
 */

import { databaseIdSchema } from '@/lib/validation/schemas/common';
import { z } from 'zod';

// ====================
// Base Schemas (Reusable)
// ====================

export const ProposalStatusSchema = z.enum([
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'ACCEPTED',
  'DECLINED',
]);

export const ProposalPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const ProposalRiskLevelSchema = z.enum(['low', 'medium', 'high']);

// ====================
// Wizard Step Schemas
// ====================

export const BasicInformationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  customerId: databaseIdSchema,
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
      industry: z.string().optional(),
    })
    .optional(),
  dueDate: z.string().optional(), // API expects string, converts to Date
  priority: ProposalPrioritySchema.default('MEDIUM'),
  value: z.number().min(0, 'Value must be non-negative').optional().default(0),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  projectType: z.string().nullable().optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').default([]),
});

export const TeamAssignmentSchema = z.object({
  teamLead: z.string().min(1, 'Team lead is required'),
  salesRepresentative: z.string().min(1, 'Sales representative is required'),
  subjectMatterExperts: z.record(z.string()).default({}),
  executiveReviewers: z.array(z.string()).default([]),
  teamMembers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        role: z.string(),
        email: z.string().optional(),
      })
    )
    .optional(),
});

export const ContentSelectionSchema = z.object({
  selectedTemplates: z.array(z.string()).default([]),
  customContent: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        type: z.enum(['text', 'image', 'table']).default('text'),
      })
    )
    .default([]),
  contentLibrary: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.string(),
        isSelected: z.boolean(),
      })
    )
    .default([]),
});

export const ProductSelectionSchema = z.object({
  products: z
    .array(
      z.object({
        id: z.string(),
        productId: z.string(),
        name: z.string(),
        quantity: z.number().int().positive('Quantity must be positive'),
        unitPrice: z.number().positive('Unit price must be positive'),
        total: z.number().positive('Total must be positive'),
        discount: z
          .number()
          .min(0, 'Discount cannot be negative')
          .max(100, 'Discount cannot exceed 100%')
          .default(0),
        category: z.string(),
        configuration: z.record(z.unknown()).optional(),
      })
    )
    .default([]),
  totalValue: z.number().default(0),
  searchQuery: z.string().optional(),
  selectedCategory: z.string().optional(),
});

export const SectionAssignmentSchema = z.object({
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z
          .string()
          .min(1, 'Section title is required')
          .max(100, 'Section title must be less than 100 characters'),
        content: z
          .string()
          .min(1, 'Section content is required')
          .max(2000, 'Section content must be less than 2000 characters'),
        order: z.number().int().positive('Order must be positive'),
        type: z.enum(['TEXT', 'IMAGE', 'TABLE', 'CHART']).default('TEXT'),
        isRequired: z.boolean().default(false),
      })
    )
    .default([]),
  sectionTemplates: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        category: z.string(),
      })
    )
    .default([]),
});

export const ReviewSchema = z.object({
  confirmAccuracy: z
    .boolean()
    .refine(val => val === true, 'You must confirm the accuracy of the proposal'),
  confirmTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  specialInstructions: z
    .string()
    .max(500, 'Special instructions must be less than 500 characters')
    .optional(),
  priority: ProposalPrioritySchema.default('MEDIUM'),
  status: ProposalStatusSchema.default('DRAFT'),
});

// ====================
// Metadata Schema
// ====================

export const ProposalMetadataSchema = z.object({
  teamData: z
    .object({
      teamLead: z.string().optional(),
      salesRepresentative: z.string().optional(),
      subjectMatterExperts: z.record(z.string()).optional(),
      executiveReviewers: z.array(z.string()).optional(),
    })
    .optional(),
  contentData: z
    .object({
      selectedTemplates: z.array(z.string()).optional(),
      customContent: z.array(z.any()).optional(),
      contentLibrary: z.array(z.any()).optional(),
    })
    .optional(),
  productData: z
    .object({
      products: z.array(z.any()).optional(),
      totalValue: z.number().optional(),
    })
    .optional(),
  sectionData: z
    .object({
      sections: z.array(z.any()).optional(),
      sectionTemplates: z.array(z.any()).optional(),
    })
    .optional(),
  reviewData: z
    .object({
      finalChecklist: z.array(z.any()).optional(),
    })
    .optional(),
  submittedAt: z.string().optional(),
  wizardVersion: z.string().optional(),
});

// ====================
// API Schemas
// ====================

export const ProposalQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'status', 'priority', 'value'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: ProposalStatusSchema.optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  customerId: z.string().optional(),
  assignedTo: z.string().optional(),
});

export const ProposalCreateSchema = z.object({
  basicInfo: BasicInformationSchema,
  teamData: TeamAssignmentSchema,
  contentData: ContentSelectionSchema,
  productData: ProductSelectionSchema,
  sectionData: SectionAssignmentSchema,
});

export const ProposalUpdateSchema = z
  .object({
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    customerId: z.string().optional(),
    status: ProposalStatusSchema.optional(),
    priority: ProposalPrioritySchema.optional(),
    dueDate: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
    value: z.number().positive().optional(),
    currency: z.string().length(3).default('USD').optional(),
    projectType: z.string().nullable().optional(),
    tags: z.array(z.string()).default([]).optional(),
    metadata: ProposalMetadataSchema.optional(),
  })
  .partial();

// Wizard payload schema - accepts flat structure with wizard fields
export const WizardProposalUpdateSchema = z
  .object({
    // Basic proposal fields
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    customerId: z.string().optional(),
    status: ProposalStatusSchema.optional(),
    priority: ProposalPrioritySchema.optional(),
    dueDate: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
    value: z.number().positive().optional(),
    currency: z.string().length(3).default('USD').optional(),
    projectType: z.string().nullable().optional(),
    tags: z.array(z.string()).default([]).optional(),
    // Wizard-specific fields (flat structure)
    teamData: z.any().optional(),
    contentData: z.any().optional(),
    productData: z.any().optional(),
    sectionData: z.any().optional(),
    reviewData: z.any().optional(),
    // Customer object
    customer: z.any().optional(),
  })
  .partial();

// ====================
// Complete Proposal Schema
// ====================

export const ProposalSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerId: z.string(),
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
      industry: z.string().optional(),
    })
    .optional(),
  status: ProposalStatusSchema,
  priority: ProposalPrioritySchema,
  dueDate: z.date().optional(),
  value: z.number().min(0).optional(),
  currency: z.string().length(3).default('USD'),
  projectType: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
  assignedTo: z.string().optional(),
  teamMembers: z.array(z.string()).default([]),
  progress: z.number().min(0).max(100).default(0),
  stage: z.string().default('draft'),
  riskLevel: ProposalRiskLevelSchema.default('low'),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        type: z.enum(['TEXT', 'IMAGE', 'TABLE', 'CHART']),
        order: z.number(),
        isRequired: z.boolean().default(false),
        assignedTo: z.string().optional(),
        estimatedHours: z.number().min(0).optional(),
        dueDate: z.date().optional(),
      })
    )
    .optional(),
  products: z
    .array(
      z.object({
        id: z.string(),
        productId: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).max(100),
        total: z.number().positive(),
        category: z.string(),
        configuration: z.record(z.unknown()).optional(),
      })
    )
    .optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  version: z.number().default(1),
  userStoryMappings: z.array(z.string()).default([]),
});

export const ProposalListSchema = z.object({
  items: z.array(ProposalSchema),
  nextCursor: z.string().nullable(),
});

// ====================
// Wizard Schema
// ====================

export const ProposalWizardSchema = z.object({
  step1: BasicInformationSchema,
  step2: TeamAssignmentSchema,
  step3: ContentSelectionSchema,
  step4: ProductSelectionSchema,
  step5: SectionAssignmentSchema,
  step6: ReviewSchema,
});

// ====================
// Type Exports
// ====================

export type BasicInformation = z.infer<typeof BasicInformationSchema>;
export type TeamAssignment = z.infer<typeof TeamAssignmentSchema>;
export type ContentSelection = z.infer<typeof ContentSelectionSchema>;
export type ProductSelection = z.infer<typeof ProductSelectionSchema>;
export type SectionAssignment = z.infer<typeof SectionAssignmentSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ProposalWizardData = z.infer<typeof ProposalWizardSchema>;
export type ProposalCreateData = z.infer<typeof ProposalCreateSchema>;
export type ProposalQueryData = z.infer<typeof ProposalQuerySchema>;
export type ProposalUpdateData = z.infer<typeof ProposalUpdateSchema>;
export type WizardProposalUpdateData = z.infer<typeof WizardProposalUpdateSchema>;
export type ProposalMetadata = z.infer<typeof ProposalMetadataSchema>;
export type Proposal = z.infer<typeof ProposalSchema>;
