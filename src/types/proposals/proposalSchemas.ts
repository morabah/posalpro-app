/**
 * Shared Proposal Schemas - Database-First Field Alignment
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

import { z } from 'zod';

// ====================
// Database-First Field Alignment
// ====================

// Based on Prisma schema: model Proposal { metadata Json? }
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

// Based on Prisma schema: model Proposal fields
export const ProposalBaseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerId: z.string(),
  status: z.enum([
    'DRAFT',
    'SUBMITTED',
    'IN_REVIEW',
    'PENDING_APPROVAL',
    'APPROVED',
    'REJECTED',
    'ACCEPTED',
    'DECLINED',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueDate: z.union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional(),
  value: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  projectType: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: ProposalMetadataSchema.optional(),
});

// Update schema - all fields optional
export const ProposalUpdateSchema = ProposalBaseSchema.partial();

// Wizard payload schema - accepts flat structure with wizard fields
export const WizardProposalUpdateSchema = z
  .object({
    // Basic proposal fields
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    customerId: z.string().optional(),
    status: z
      .enum([
        'DRAFT',
        'SUBMITTED',
        'IN_REVIEW',
        'PENDING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'ACCEPTED',
        'DECLINED',
      ])
      .optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
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

// Customer object schema
export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
});

// Type exports
export type ProposalMetadata = z.infer<typeof ProposalMetadataSchema>;
export type ProposalBase = z.infer<typeof ProposalBaseSchema>;
export type ProposalUpdate = z.infer<typeof ProposalUpdateSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
