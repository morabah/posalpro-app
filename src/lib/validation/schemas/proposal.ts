/**
 * PosalPro MVP2 - Proposal Entity Validation Schemas
 * Proposal creation, management, and workflow validation
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 */

import { ProposalStatus } from '@/types/entities/proposal';
import { z } from 'zod';
import {
  databaseIdArraySchema,
  databaseIdSchema,
  optionalDatabaseIdSchema,
  optionalUserIdSchema,
  prioritySchema,
  userIdSchema,
} from './common';
import { baseEntitySchema, fileUploadSchema, validationUtils } from './shared';

/**
 * Proposal metadata validation schema
 * Based on PROPOSAL_CREATION_SCREEN.md Step 1: Basic Information
 */
export const proposalMetadataSchema = z.object({
  title: validationUtils.stringWithLength(1, 200, 'Proposal title'),

  description: validationUtils.stringWithLength(10, 2000, 'Proposal description'),

  // Customer information - references existing Customer entity (flexible ID format)
  customerId: z
    .string()
    .min(1, 'Customer ID is required')
    .refine(id => {
      // Accept UUID format, positive numbers, or any non-empty string (not 'undefined')
      return id !== 'undefined' && id.trim().length > 0;
    }, 'Invalid customer ID format')
    .optional(),

  customerName: validationUtils.stringWithLength(1, 100, 'Customer name'),

  customerContact: z.object({
    name: validationUtils.stringWithLength(1, 100, 'Contact name'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
  }),

  projectType: z.enum([
    'consulting',
    'development',
    'design',
    'strategy',
    'implementation',
    'maintenance',
  ]),

  estimatedValue: z.number().min(0, 'Estimated value must be positive').optional(),

  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('USD'),

  deadline: z.date().refine(date => date > new Date(), 'Deadline must be in the future'),

  priority: prioritySchema,

  tags: validationUtils.arrayWithLength(z.string().min(1), 0, 20, 'Tags'),
});

export type ProposalMetadata = z.infer<typeof proposalMetadataSchema>;

/**
 * Status history entry validation schema
 */
export const statusHistoryEntrySchema = z.object({
  from: z.nativeEnum(ProposalStatus),
  to: z.nativeEnum(ProposalStatus),
  notes: z.string().optional(),
  changedAt: z.string(),
  changedBy: z.string(),
  reason: z.string().optional(),
});

/**
 * Status update payload validation schema
 */
export const statusUpdatePayloadSchema = z.object({
  status: z.nativeEnum(ProposalStatus),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

/**
 * Enhanced proposal metadata schema with status history
 */
export const enhancedProposalMetadataSchema = z.object({
  statusHistory: z.array(statusHistoryEntrySchema).default([]),
  notes: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  lastModifiedAt: z.string().optional(),
  version: z.number().optional(),
});

export type StatusHistoryEntry = z.infer<typeof statusHistoryEntrySchema>;
export type StatusUpdatePayload = z.infer<typeof statusUpdatePayloadSchema>;
export type EnhancedProposalMetadata = z.infer<typeof enhancedProposalMetadataSchema>;

/**
 * RFP document validation schema
 * Based on PROPOSAL_CREATION_SCREEN.md Step 2: RFP Analysis
 */
export const rfpDocumentSchema = z.object({
  id: databaseIdSchema,

  fileName: validationUtils.stringWithLength(1, 255, 'File name'),

  fileSize: z.number().int().min(1, 'File size must be greater than 0'),

  fileType: z.enum(['pdf', 'doc', 'docx', 'txt', 'rtf']),

  uploadedAt: z.date(),

  // Parsed content from RFP
  parsedContent: z
    .object({
      requirements: z.array(
        z.object({
          id: databaseIdSchema,
          text: z.string().min(1, 'Requirement text is required'),
          category: z.string().min(1, 'Category is required'),
          priority: prioritySchema,
          compliance: z
            .enum(['compliant', 'partial', 'non_compliant', 'not_applicable'])
            .optional(),
          notes: z.string().optional(),
        })
      ),

      sections: z.array(
        z.object({
          title: z.string().min(1, 'Section title is required'),
          content: z.string().min(1, 'Section content is required'),
          pageNumbers: z.array(z.number().int().min(1)),
        })
      ),

      keyDates: z.array(
        z.object({
          event: z.string().min(1, 'Event description is required'),
          date: z.date(),
          importance: prioritySchema,
        })
      ),

      evaluationCriteria: z.array(
        z.object({
          criterion: z.string().min(1, 'Criterion is required'),
          weight: z.number().min(0).max(100),
          description: z.string().optional(),
        })
      ),
    })
    .optional(),

  // AI analysis results
  aiAnalysis: z
    .object({
      summaryGenerated: z.boolean().default(false),
      requirementsExtracted: z.boolean().default(false),
      complianceAnalyzed: z.boolean().default(false),
      confidenceScore: z.number().min(0).max(1),
      processingTime: z.number().min(0), // milliseconds
    })
    .optional(),
});

export type RFPDocument = z.infer<typeof rfpDocumentSchema>;

/**
 * Content section validation schema
 * Based on PROPOSAL_CREATION_SCREEN.md Step 3: Content Selection
 */
export const contentSectionSchema = z.object({
  id: databaseIdSchema,

  title: validationUtils.stringWithLength(1, 200, 'Section title'),

  type: z.enum([
    'introduction',
    'approach',
    'methodology',
    'timeline',
    'team',
    'pricing',
    'appendix',
    'custom',
  ]),

  order: z.number().int().min(1),

  content: z.string().min(1, 'Section content is required'),

  isRequired: z.boolean().default(false),

  wordCount: z.number().int().min(0),

  // AI assistance
  aiGenerated: z.boolean().default(false),

  aiConfidence: z.number().min(0).max(1).optional(),

  // Version control
  version: z.number().int().min(1).default(1),

  lastModified: z.date(),

  modifiedBy: userIdSchema,

  // Content metadata
  sources: z.array(z.string()).optional(),

  attachments: z.array(fileUploadSchema).optional(),
});

export type ContentSection = z.infer<typeof contentSectionSchema>;

/**
 * Product selection validation schema
 * Based on PROPOSAL_CREATION_SCREEN.md Step 4: Product Selection
 */
export const proposalProductSchema = z.object({
  productId: databaseIdSchema,

  productName: validationUtils.stringWithLength(1, 200, 'Product name'),

  productCategory: z.string().min(1, 'Product category is required'),

  quantity: z.number().int().min(1, 'Quantity must be at least 1'),

  unitPrice: z.number().min(0, 'Unit price must be non-negative'),

  totalPrice: z.number().min(0, 'Total price must be non-negative'),

  currency: z.string().length(3, 'Currency must be a 3-letter ISO code').default('USD'),

  // Customization options
  customizations: z
    .array(
      z.object({
        option: z.string().min(1, 'Customization option is required'),
        value: z.string().min(1, 'Customization value is required'),
        additionalCost: z.number().min(0).default(0),
      })
    )
    .optional(),

  // Delivery and timeline
  deliveryTimeline: z.string().optional(),

  deliverables: z.array(z.string()).optional(),

  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

export type ProposalProduct = z.infer<typeof proposalProductSchema>;

/**
 * Proposal team assignment validation schema
 */
export const teamAssignmentSchema = z.object({
  userId: z
    .string()
    .min(1, 'User ID is required')
    .refine(id => {
      return id !== 'undefined' && id.trim().length > 0;
    }, 'Invalid user ID format'),

  userName: validationUtils.stringWithLength(1, 100, 'User name'),

  role: z.enum(['lead', 'contributor', 'reviewer', 'approver']),

  responsibilities: z.array(z.string()).optional(),

  estimatedHours: z.number().min(0).optional(),

  hourlyRate: z.number().min(0).optional(),

  assignedAt: z.date(),

  assignedBy: z
    .string()
    .min(1, 'Assigned by ID is required')
    .refine(id => {
      return id !== 'undefined' && id.trim().length > 0;
    }, 'Invalid assignedBy ID format'),

  status: z.enum(['assigned', 'accepted', 'declined', 'completed']).default('assigned'),
});

export type TeamAssignment = z.infer<typeof teamAssignmentSchema>;

/**
 * Proposal Wizard Step 2 validation schema
 */
export const proposalWizardStep2Schema = z.object({
  teamLead: validationUtils.stringWithLength(1, 100, 'Team lead'),

  salesRepresentative: validationUtils.stringWithLength(1, 100, 'Sales representative'),

  subjectMatterExperts: z
    .record(z.string(), z.string())
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one subject matter expert is required',
    }),

  executiveReviewers: z.array(z.string()).min(0, 'Executive reviewers must be an array'),
});

export type ProposalWizardStep2Data = z.infer<typeof proposalWizardStep2Schema>;

/**
 * Proposal Wizard Step 3 validation schema (Content Selection)
 */
export const proposalWizardStep3Schema = z.object({
  selectedContent: z
    .array(
      z.object({
        item: z.object({
          id: databaseIdSchema,
          title: validationUtils.stringWithLength(1, 200, 'Content title'),
          type: z.string().min(1, 'Content type is required'),
          relevanceScore: z.number().min(0).max(100),
          section: z.string().min(1, 'Section is required'),
          tags: z.array(z.string()).max(20, 'Maximum 20 tags allowed'),
          content: z.string().min(1, 'Content is required'),
          successRate: z.number().min(0).max(100).optional(),
          lastUsed: z.date().optional(),
        }),
        section: validationUtils.stringWithLength(1, 100, 'Section assignment'),
        customizations: z.array(z.string()).max(10, 'Maximum 10 customizations allowed'),
      })
    )
    .min(1, 'At least one content item must be selected'),

  searchHistory: z.array(z.string()).max(20, 'Search history limited to 20 items'),

  // Cross-step validation results
  crossStepValidation: z
    .object({
      teamAlignment: z.boolean().default(true),
      productCompatibility: z.boolean().default(true),
      rfpCompliance: z.boolean().default(true),
      sectionCoverage: z.boolean().default(true),
    })
    .optional(),
});

export type ProposalWizardStep3Data = z.infer<typeof proposalWizardStep3Schema>;

/**
 * Proposal Wizard Step 4 validation schema (Product Selection)
 */
export const proposalWizardStep4Schema = z.object({
  products: z
    .array(
      z.object({
        id: databaseIdSchema,
        name: validationUtils.stringWithLength(1, 200, 'Product name'),
        included: z.boolean(),
        quantity: z.number().int().min(1, 'Quantity must be at least 1'),
        unitPrice: z.number().min(0, 'Unit price must be non-negative'),
        totalPrice: z.number().min(0, 'Total price must be non-negative'),
        category: z.string().min(1, 'Product category is required'),
        configuration: z.record(z.string(), z.any()).optional(),
        customizations: z.array(z.string()).optional(),
        notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
      })
    )
    .min(1, 'At least one product must be selected'),

  totalValue: z.number().min(0, 'Total value must be non-negative'),
  aiRecommendationsUsed: z.number().int().min(0).optional(),
  searchHistory: z.array(z.string()).max(20, 'Search history limited to 20 items'),

  // Cross-step validation results
  crossStepValidation: z
    .object({
      teamCompatibility: z.boolean().default(true),
      contentAlignment: z.boolean().default(true),
      budgetCompliance: z.boolean().default(true),
      timelineRealistic: z.boolean().default(true),
    })
    .optional(),
});

export type ProposalWizardStep4Data = z.infer<typeof proposalWizardStep4Schema>;

/**
 * Proposal Wizard Step 5 validation schema (Section Assignment)
 */
export const proposalWizardStep5Schema = z.object({
  sections: z
    .array(
      z.object({
        id: databaseIdSchema,
        title: validationUtils.stringWithLength(1, 200, 'Section title'),
        required: z.boolean(),
        order: z.number().int().min(1),
        estimatedHours: z.number().min(0, 'Estimated hours must be non-negative'),
        dueDate: z.date().optional(),
        assignedTo: z.string().optional(),
        status: z
          .enum(['not_started', 'in_progress', 'completed', 'reviewed'])
          .default('not_started'),
        description: z.string().optional(),
        dependencies: databaseIdArraySchema.optional(),
        priority: z.enum(['high', 'medium', 'low']).default('medium'),
      })
    )
    .min(1, 'At least one section is required'),

  sectionAssignments: z.record(z.string(), z.string()),

  totalEstimatedHours: z.number().min(0).optional(),

  criticalPath: databaseIdArraySchema.optional(),

  timelineEstimate: z
    .object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      complexity: z.enum(['low', 'medium', 'high']).default('medium'),
      riskFactors: z.array(z.string()).optional(),
    })
    .optional(),
});

export type ProposalWizardStep5Data = z.infer<typeof proposalWizardStep5Schema>;

/**
 * Proposal Wizard Step 6 validation schema (Review & Finalization)
 */
export const proposalWizardStep6Schema = z.object({
  finalValidation: z.object({
    isValid: z.boolean(),
    completeness: z.number().min(0).max(100),
    issues: z.array(
      z.object({
        severity: z.enum(['error', 'warning', 'info']),
        message: validationUtils.stringWithLength(1, 500, 'Issue message'),
        field: z.string().optional(),
        suggestions: z.array(z.string()).optional(),
      })
    ),
    complianceChecks: z.array(
      z.object({
        requirement: validationUtils.stringWithLength(1, 200, 'Requirement'),
        passed: z.boolean(),
        details: z.string().optional(),
      })
    ),
  }),

  approvals: z.array(
    z.object({
      reviewer: validationUtils.stringWithLength(1, 100, 'Reviewer name'),
      approved: z.boolean(),
      comments: z.string().max(1000, 'Comments must be less than 1000 characters').optional(),
      timestamp: z.date().optional(),
    })
  ),

  insights: z.object({
    complexity: z.enum(['low', 'medium', 'high']),
    winProbability: z.number().min(0).max(100),
    estimatedEffort: z.number().min(0),
    similarProposals: z
      .array(
        z.object({
          id: databaseIdSchema,
          title: validationUtils.stringWithLength(1, 200, 'Proposal title'),
          winRate: z.number().min(0).max(100),
          similarity: z.number().min(0).max(100),
        })
      )
      .max(5, 'Maximum 5 similar proposals'),
    keyDifferentiators: z.array(z.string()).max(10, 'Maximum 10 differentiators'),
    suggestedFocusAreas: z.array(z.string()).max(10, 'Maximum 10 focus areas'),
    riskFactors: z.array(z.string()).max(10, 'Maximum 10 risk factors'),
  }),

  exportOptions: z
    .object({
      format: z.enum(['pdf', 'docx', 'html']).default('pdf'),
      includeAppendices: z.boolean().default(true),
      includeTeamDetails: z.boolean().default(true),
      includeTimeline: z.boolean().default(true),
    })
    .optional(),

  finalReviewComplete: z.boolean().default(false),
});

export type ProposalWizardStep6Data = z.infer<typeof proposalWizardStep6Schema>;

/**
 * Complete proposal entity validation schema
 */
export const proposalEntitySchema = baseEntitySchema.extend({
  // Basic Information
  metadata: proposalMetadataSchema,

  // RFP Information
  rfpDocument: rfpDocumentSchema.optional(),

  // Content
  sections: validationUtils.arrayWithLength(contentSectionSchema, 1, 50, 'Proposal sections'),

  // Products
  products: z.array(proposalProductSchema).optional(),

  // Team
  teamAssignments: z.array(teamAssignmentSchema).optional(),

  // Workflow
  status: z.nativeEnum(ProposalStatus),

  currentStage: z.enum([
    'draft',
    'content_development',
    'review',
    'approval',
    'finalization',
    'submitted',
  ]),

  // Approval workflow
  approvalWorkflow: z
    .object({
      steps: z.array(
        z.object({
          id: databaseIdSchema,
          name: z.string().min(1, 'Step name is required'),
          order: z.number().int().min(1),
          assignedTo: userIdSchema,
          status: z.enum(['pending', 'approved', 'rejected', 'skipped']).default('pending'),
          comments: z.string().optional(),
          completedAt: z.date().optional(),
        })
      ),
      currentStep: z.number().int().min(0).default(0),
    })
    .optional(),

  // Compliance and validation
  complianceChecks: z
    .object({
      rfpCompliance: z.number().min(0).max(100).optional(),
      contentCompleteness: z.number().min(0).max(100).optional(),
      teamAssignmentComplete: z.boolean().default(false),
      budgetValidated: z.boolean().default(false),
      legalReviewed: z.boolean().default(false),
    })
    .optional(),

  // Timeline
  milestones: z
    .array(
      z.object({
        id: databaseIdSchema,
        title: z.string().min(1, 'Milestone title is required'),
        description: z.string().optional(),
        dueDate: z.date(),
        completed: z.boolean().default(false),
        completedAt: z.date().optional(),
      })
    )
    .optional(),

  // Analytics and tracking
  analytics: z
    .object({
      viewCount: z.number().int().min(0).default(0),
      editCount: z.number().int().min(0).default(0),
      collaboratorCount: z.number().int().min(0).default(0),
      timeSpent: z.number().min(0).default(0), // minutes
      lastViewedAt: z.date().optional(),
      lastEditedAt: z.date().optional(),
    })
    .optional(),

  // Export and sharing
  exportHistory: z
    .array(
      z.object({
        format: z.enum(['pdf', 'docx', 'html']),
        exportedAt: z.date(),
        exportedBy: userIdSchema,
        version: z.string().min(1, 'Version is required'),
      })
    )
    .optional(),
});

export type ProposalEntity = z.infer<typeof proposalEntitySchema>;

/**
 * Proposal creation schema (initial proposal data)
 */
export const createProposalSchema = z.object({
  metadata: proposalMetadataSchema,
  rfpDocument: rfpDocumentSchema.optional(),
  teamAssignments: z.array(teamAssignmentSchema).optional(),
});

export type CreateProposalData = z.infer<typeof createProposalSchema>;

/**
 * Proposal update schema
 */
export const updateProposalSchema = z.object({
  id: databaseIdSchema,
  metadata: proposalMetadataSchema.partial().optional(),
  sections: z.array(contentSectionSchema).optional(),
  products: z.array(proposalProductSchema).optional(),
  teamAssignments: z.array(teamAssignmentSchema).optional(),
  status: z.nativeEnum(ProposalStatus).optional(),
});

export type UpdateProposalData = z.infer<typeof updateProposalSchema>;

/**
 * Proposal search and filtering schema
 */
export const proposalSearchSchema = z.object({
  query: z.string().optional(),
  status: z.array(z.nativeEnum(ProposalStatus)).optional(),
  priority: z.array(prioritySchema).optional(),
  clientName: z.string().optional(),
  assignedTo: z.array(userIdSchema).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  deadlineAfter: z.date().optional(),
  deadlineBefore: z.date().optional(),
  estimatedValueMin: z.number().min(0).optional(),
  estimatedValueMax: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export type ProposalSearchCriteria = z.infer<typeof proposalSearchSchema>;

/**
 * Proposal comment/feedback schema
 */
export const proposalCommentSchema = z.object({
  id: databaseIdSchema,
  proposalId: databaseIdSchema,
  sectionId: optionalDatabaseIdSchema,
  parentCommentId: optionalDatabaseIdSchema,
  content: validationUtils.stringWithLength(1, 2000, 'Comment content'),
  type: z.enum(['general', 'suggestion', 'issue', 'approval', 'rejection']),
  isResolved: z.boolean().default(false),
  resolvedBy: optionalUserIdSchema,
  resolvedAt: z.date().optional(),
  createdBy: userIdSchema,
  createdAt: z.date(),
  mentions: z.array(userIdSchema).optional(),
});

export type ProposalComment = z.infer<typeof proposalCommentSchema>;
