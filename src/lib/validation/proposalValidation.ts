/**
 * Proposal Validation Schemas - Modern Architecture with Frontend-Backend Integration
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 *
 * ✅ FOLLOWS: MIGRATION_LESSONS.md - Database-first field alignment
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md - Database-agnostic validation patterns
 * ✅ ALIGNS: API route schemas for consistent frontend-backend integration
 */

import { z } from 'zod';
import { databaseIdSchema } from './schemas/common';

// ====================
// API-Aligned Schemas (Matches src/app/api/proposals/route.ts)
// ====================

// Step 1: Basic Information (Aligned with ProposalBasicInfoSchema)
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
  // Align with backend enum (LOW | MEDIUM | HIGH | URGENT)
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  value: z.number().min(0, 'Value must be non-negative').optional().default(0),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  projectType: z.string().optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').default([]),
});

// Step 2: Team Assignment (Aligned with ProposalTeamDataSchema)
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

// Step 3: Content Selection (Aligned with ProposalContentDataSchema)
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

// Step 4: Product Selection (Aligned with ProposalProductDataSchema)
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

// Step 5: Section Assignment (Aligned with ProposalSectionDataSchema)
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

// Step 6: Review (Enhanced with API alignment)
export const ReviewSchema = z.object({
  confirmAccuracy: z
    .boolean()
    .refine(val => val === true, 'You must confirm the accuracy of the proposal'),
  confirmTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  specialInstructions: z
    .string()
    .max(500, 'Special instructions must be less than 500 characters')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
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
    .default('DRAFT'),
});

// ====================
// API Route Query Schema (Aligned with ProposalQuerySchema)
// ====================

export const ProposalQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'status', 'priority', 'value', 'dueDate'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
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
  // Align with backend enum (include URGENT)
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  customerId: z.string().optional(),
  assignedTo: z.string().optional(),
});

// ====================
// Complete Proposal Creation Schema (Aligned with ProposalCreateSchema)
// ====================

export const ProposalCreateSchema = z.object({
  basicInfo: BasicInformationSchema,
  teamData: TeamAssignmentSchema,
  contentData: ContentSelectionSchema,
  productData: ProductSelectionSchema,
  sectionData: SectionAssignmentSchema,
});

// ====================
// Complete Proposal Wizard Schema (Frontend Wizard)
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
// Cross-step validation function (Enhanced)
// ====================

export function validateProposalWizard(data: z.infer<typeof ProposalWizardSchema>): string[] {
  const errors: string[] = [];

  // Validate each step
  const stepValidationSchemas = {
    step1: BasicInformationSchema,
    step2: TeamAssignmentSchema,
    step3: ContentSelectionSchema,
    step4: ProductSelectionSchema,
    step5: SectionAssignmentSchema,
    step6: ReviewSchema,
  };

  Object.entries(stepValidationSchemas).forEach(([step, schema]) => {
    const stepData = data[step as keyof typeof data];
    const stepErrors = schema.safeParse(stepData);
    if (!stepErrors.success) {
      errors.push(...stepErrors.error.errors.map(e => `${step}: ${e.message}`));
    }
  });

  // Cross-step validation rules (Enhanced)
  if (data.step4?.products?.length === 0 && data.step5?.sections?.length > 0) {
    errors.push('Cannot assign sections without selected products');
  }

  if (data.step3?.selectedTemplates?.length === 0 && data.step3?.customContent?.length === 0) {
    errors.push('Either templates or custom content must be selected');
  }

  // Validate due dates (Enhanced date handling)
  if (data.step1?.dueDate && data.step5?.sections) {
    const proposalDueDate = new Date(data.step1.dueDate);
    const now = new Date();

    if (proposalDueDate <= now) {
      errors.push('Proposal due date must be in the future');
    }
  }

  // Validate team member assignments
  if (data.step2?.teamLead && data.step2?.salesRepresentative) {
    if (data.step2.teamLead === data.step2.salesRepresentative) {
      errors.push('Team lead and sales representative must be different people');
    }
  }

  // Validate product totals
  if (data.step4?.products) {
    data.step4.products.forEach((product, index) => {
      const calculatedTotal = product.quantity * product.unitPrice * (1 - product.discount / 100);
      if (Math.abs(calculatedTotal - product.total) > 0.01) {
        errors.push(`Product ${index + 1} total calculation mismatch`);
      }
    });
  }

  return errors;
}

// ====================
// Individual step validation functions (Enhanced)
// ====================

export function validateStep1(data: z.infer<typeof BasicInformationSchema>): string[] {
  const result = BasicInformationSchema.safeParse(data);
  return result.success ? [] : result.error.errors.map(e => e.message);
}

export function validateStep2(data: z.infer<typeof TeamAssignmentSchema>): string[] {
  const result = TeamAssignmentSchema.safeParse(data);
  return result.success ? [] : result.error.errors.map(e => e.message);
}

export function validateStep3(data: z.infer<typeof ContentSelectionSchema>): string[] {
  const result = ContentSelectionSchema.safeParse(data);
  return result.success ? [] : result.error.errors.map(e => e.message);
}

export function validateStep4(data: z.infer<typeof ProductSelectionSchema>): string[] {
  const result = ProductSelectionSchema.safeParse(data);
  return result.success ? [] : result.error.errors.map(e => e.message);
}

export function validateStep5(data: z.infer<typeof SectionAssignmentSchema>): string[] {
  const result = SectionAssignmentSchema.safeParse(data);
  return result.success ? [] : result.error.errors.map(e => e.message);
}

export function validateStep6(data: z.infer<typeof ReviewSchema>): string[] {
  const result = ReviewSchema.safeParse(data);
  return result.success ? [] : result.error.errors.map(e => e.message);
}

// ====================
// Type exports (Enhanced)
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

// ====================
// Validation helper functions (Enhanced)
// ====================

export function canProceedToStep(
  currentStep: number,
  wizardData: Partial<ProposalWizardData>
): boolean {
  const stepValidationFunctions = [
    () => validateStep1(wizardData.step1!),
    () => validateStep2(wizardData.step2!),
    () => validateStep3(wizardData.step3!),
    () => validateStep4(wizardData.step4!),
    () => validateStep5(wizardData.step5!),
    () => validateStep6(wizardData.step6!),
  ];

  // Check if current step data exists and is valid
  if (currentStep > 0 && currentStep <= stepValidationFunctions.length) {
    const stepData = wizardData[`step${currentStep}` as keyof ProposalWizardData];
    if (!stepData) return false;

    const errors = stepValidationFunctions[currentStep - 1]();
    return errors.length === 0;
  }

  return false;
}

export function canGoBackToStep(targetStep: number, currentStep: number): boolean {
  return targetStep >= 1 && targetStep < currentStep;
}

export function getStepValidationErrors(
  step: number,
  wizardData: Partial<ProposalWizardData>
): string[] {
  const stepValidationFunctions = [
    () => validateStep1(wizardData.step1!),
    () => validateStep2(wizardData.step2!),
    () => validateStep3(wizardData.step3!),
    () => validateStep4(wizardData.step4!),
    () => validateStep5(wizardData.step5!),
    () => validateStep6(wizardData.step6!),
  ];

  if (step >= 1 && step <= stepValidationFunctions.length) {
    const stepData = wizardData[`step${step}` as keyof ProposalWizardData];
    if (!stepData) return ['Step data not found'];

    return stepValidationFunctions[step - 1]();
  }

  return ['Invalid step number'];
}

// ====================
// API Integration Helper Functions
// ====================

/**
 * Transform wizard data to API format
 */
export function transformWizardToApiFormat(wizardData: ProposalWizardData): ProposalCreateData {
  return {
    basicInfo: wizardData.step1,
    teamData: wizardData.step2,
    contentData: wizardData.step3,
    productData: wizardData.step4,
    sectionData: wizardData.step5,
  };
}

/**
 * Transform API data to wizard format
 */
export function transformApiToWizardFormat(apiData: any): Partial<ProposalWizardData> {
  return {
    step1: apiData.basicInfo,
    step2: apiData.teamData,
    step3: apiData.contentData,
    step4: apiData.productData,
    step5: apiData.sectionData,
    step6: {
      confirmAccuracy: true,
      confirmTerms: true,
      priority: apiData.basicInfo?.priority || 'MEDIUM',
      status: apiData.status || 'DRAFT',
    },
  };
}

/**
 * Validate API response format
 */
export function validateApiResponse(response: any): boolean {
  return response && typeof response === 'object' && ('ok' in response || 'success' in response);
}

/**
 * Extract data from API response
 */
export function extractApiData(response: any): any {
  if (response?.ok && response?.data) {
    return response.data;
  }
  if (response?.success && response?.data) {
    return response.data;
  }
  return response;
}
