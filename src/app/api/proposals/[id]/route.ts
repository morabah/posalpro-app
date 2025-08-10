/**
 * PosalPro MVP2 - Individual Proposal API Routes
 * Handles operations on specific proposals by ID using service functions
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 * Uses standardized error handling
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { createApiErrorResponse, ErrorCodes, StandardError } from '@/lib/errors';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';
import { getRequestMeta, logger } from '@/lib/logging/structuredLogger';
import { recordError, recordLatency } from '@/lib/observability/metricsStore';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const errorHandlingService = ErrorHandlingService.getInstance();

/**
 * Standard API response wrapper
 */
function createApiResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * GET /api/proposals/[id] - Get specific proposal
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let session;
  let proposalId;
  const start = Date.now();
  const { requestId } = getRequestMeta(request.headers);
  try {
    // Await params
    const params = await context.params;

    // Validate authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Authentication required to access proposal details',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProposalDetailAPI',
            operation: 'GET',
          },
        }),
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    proposalId = params.id;

    // Validate proposal ID format
    if (!proposalId || typeof proposalId !== 'string' || proposalId.trim().length === 0) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Invalid proposal ID provided',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'ProposalDetailAPI',
            operation: 'GET',
            proposalId,
          },
        }),
        'Invalid proposal ID',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
    }

    console.log('[ProposalDetailAPI] Fetching proposal:', proposalId);

    // Fetch proposal with related data
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            industry: true,
            tier: true,
            email: true,
            phone: true,
            contacts: {
              where: { isPrimary: true, isActive: true },
              orderBy: { updatedAt: 'desc' },
              take: 1,
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sections: {
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        // ✅ INCLUDE: Products joined through ProposalProduct with embedded product details
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                currency: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvals: {
          select: {
            id: true,
            currentStage: true,
            status: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    if (!proposal) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Proposal not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalDetailAPI',
            operation: 'GET',
            proposalId,
            userId: session.user.id,
          },
        }),
        'Proposal not found',
        ErrorCodes.DATA.NOT_FOUND,
        404
      );
    }

    // Transform proposal data for frontend consumption
    const proposalDetail = {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      // Expose raw metadata for clients that expect it
      metadata: (proposal as any).metadata || null,
      status: proposal.status,
      priority: proposal.priority,
      projectType: proposal.projectType,
      value: proposal.value || 0,
      currency: proposal.currency || 'USD',
      dueDate: proposal.dueDate?.toISOString(),
      validUntil: proposal.validUntil?.toISOString(),
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      submittedAt: proposal.submittedAt?.toISOString(),
      approvedAt: proposal.approvedAt?.toISOString(),

      // Convenience: expose RFP reference number if stored in metadata
      rfpReferenceNumber: (proposal.metadata as any)?.wizardData?.step1?.details?.rfpReferenceNumber || null,

      // Customer information
      customerId: proposal.customerId,
      customerName: proposal.customer?.name || 'Unknown Customer',
      customerIndustry: proposal.customer?.industry,
      customerTier: proposal.customer?.tier,
      customerEmail: proposal.customer?.email,
      // Contact information: prefer metadata, then primary contact, then customer
      contactPerson:
        (proposal.metadata as any)?.wizardData?.step1?.client?.contactPerson ||
        (proposal.customer as any)?.contacts?.[0]?.name ||
        '',
      contactEmail:
        (proposal.metadata as any)?.wizardData?.step1?.client?.contactEmail ||
        (proposal.customer as any)?.contacts?.[0]?.email ||
        proposal.customer?.email ||
        '',
      contactPhone:
        (proposal.metadata as any)?.wizardData?.step1?.client?.contactPhone ||
        (proposal.customer as any)?.contacts?.[0]?.phone ||
        (proposal.customer as any)?.phone ||
        '',

      // Creator information
      createdBy: proposal.creator?.name || 'Unknown Creator',
      createdByEmail: proposal.creator?.email,

      // Sections
      sections: proposal.sections.map(section => ({
        id: section.id,
        title: section.title,
        content: section.content,
        type: section.type,
        order: section.order,
      })),

      // Products
      products:
        (proposal as any).products?.map((pp: any) => ({
          id: pp.product?.id,
          productId: pp.productId || pp.product?.id,
          name: pp.product?.name,
          quantity: pp.quantity,
          unitPrice: pp.unitPrice ?? pp.product?.price,
          currency: pp.product?.currency || 'USD',
          discount: pp.discount ?? 0,
        })) || [],

      // Assigned team members
      assignedTo: proposal.assignedTo.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
      })),

      // Approval executions
      approvals: proposal.approvals.map(approval => ({
        id: approval.id,
        currentStage: approval.currentStage,
        status: approval.status,
        startedAt: approval.startedAt.toISOString(),
        completedAt: approval.completedAt?.toISOString(),
      })),

      // Computed fields
      totalSections: proposal.sections.length,
      teamSize: proposal.assignedTo.length,
      approvalStages: proposal.approvals.length,
      isOverdue: proposal.dueDate ? new Date(proposal.dueDate) < new Date() : false,
      daysUntilDeadline: proposal.dueDate
        ? Math.ceil(
            (new Date(proposal.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,

      // ✅ ENHANCED: Wizard data from metadata for comprehensive summary
      wizardData: (proposal.metadata as any)?.wizardData || null,
      teamAssignments: (proposal.metadata as any)?.teamAssignments || null,
      contentSelections: (proposal.metadata as any)?.contentSelections || null,
      validationData: (proposal.metadata as any)?.validationData || null,
      analyticsData: (proposal.metadata as any)?.analyticsData || null,
      crossStepValidation: (proposal.metadata as any)?.crossStepValidation || null,
    };

    // DEBUG: Log wizardData and sectionAssignments snapshot before returning
    try {
      const wd = (proposal.metadata as any)?.wizardData || null;
      const sa =
        wd?.step5?.sectionAssignments || (proposal.metadata as any)?.sectionAssignments || null;
      console.log('[ProposalDetailAPI][DEBUG] GET payload snapshot', {
        proposalId,
        wizardDataStep3Count: Array.isArray(wd?.step3?.selectedContent)
          ? wd.step3.selectedContent.length
          : 0,
        wizardDataStep5Sections: Array.isArray(wd?.step5?.sections) ? wd.step5.sections.length : 0,
        sectionAssignmentsKeys: sa ? Object.keys(sa) : [],
        sectionAssignmentsType: sa ? typeof sa : 'null',
      });
    } catch {}

    const duration = Date.now() - start;
    logger.info('ProposalDetailAPI GET success', {
      requestId,
      duration,
      code: 'OK',
      route: '/api/proposals/[id]',
      method: 'GET',
      proposalId,
      userId: session.user.id,
    });
    recordLatency(duration);

    const res = NextResponse.json(
      {
        success: true,
        data: proposalDetail,
        message: 'Proposal details retrieved successfully',
      },
      { status: 200 }
    );
    res.headers.set('Server-Timing', `app;dur=${duration}`);
    if (requestId) res.headers.set('x-request-id', String(requestId));
    return res;
  } catch (error) {
    // ✅ ENHANCED: Use proper logger instead of console.error
    const standardError = errorHandlingService.processError(
      error,
      'Failed to fetch proposal details',
      ErrorCodes.DATA.QUERY_FAILED,
      {
        component: 'ProposalDetailAPI',
        operation: 'GET',
        proposalId,
        userId: session?.user?.id || 'unknown',
      }
    );

    const duration = Date.now() - start;
    logger.error('ProposalDetailAPI GET error', {
      requestId,
      duration,
      code: standardError.code,
      route: '/api/proposals/[id]',
      method: 'GET',
      proposalId: proposalId || 'unknown',
      userId: session?.user?.id || 'unknown',
      message: standardError.message,
    });
    recordError(standardError.code);

    const res = createApiErrorResponse(
      new StandardError({
        message: 'Failed to retrieve proposal',
        code: ErrorCodes.DATA.QUERY_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalDetailAPI',
          operation: 'GET',
          proposalId: 'unknown',
          userId: 'unknown',
        },
      }),
      'Failed to retrieve proposal',
      ErrorCodes.DATA.QUERY_FAILED,
      500,
      { userFriendlyMessage: 'Unable to load proposal details. Please try again later.' }
    );
    res.headers.set('Server-Timing', `app;dur=${duration}`);
    if (requestId) res.headers.set('x-request-id', String(requestId));
    return res;
  }
}

/**
 * PUT /api/proposals/[id] - Update specific proposal
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let session;
  let proposalId;
  try {
    // Await params
    const params = await context.params;

    // Validate authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Authentication required to update proposal',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProposalDetailAPI',
            operation: 'PUT',
          },
        }),
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    proposalId = params.id;
    const body = await request.json();

    // Validate proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!existingProposal) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Proposal not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalDetailAPI',
            operation: 'PUT',
            proposalId,
          },
        }),
        'Proposal not found',
        ErrorCodes.DATA.NOT_FOUND,
        404
      );
    }

    // Update proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        ...body,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedProposal,
        message: 'Proposal updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    // ✅ ENHANCED: Use proper logger instead of console.error
    const standardError = errorHandlingService.processError(
      error,
      'Failed to update proposal',
      ErrorCodes.DATA.UPDATE_FAILED,
      {
        component: 'ProposalDetailAPI',
        operation: 'PUT',
        proposalId: proposalId || 'unknown',
        userId: session?.user?.id || 'unknown',
      }
    );

    logError('Error updating proposal', error, {
      component: 'ProposalDetailAPI',
      operation: 'PUT',
      proposalId: proposalId || 'unknown',
      userId: session?.user?.id || 'unknown',
      standardError: standardError.message,
      errorCode: standardError.code,
    });

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to update proposal',
        code: ErrorCodes.DATA.UPDATE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalDetailAPI',
          operation: 'PUT',
          proposalId: proposalId || 'unknown',
          userId: session?.user?.id || 'unknown',
        },
      }),
      'Failed to update proposal',
      ErrorCodes.DATA.UPDATE_FAILED,
      500,
      { userFriendlyMessage: 'Unable to update proposal. Please try again later.' }
    );
  }
}

/**
 * DELETE /api/proposals/[id] - Delete specific proposal
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let session;
  let proposalId;
  try {
    // Await params
    const params = await context.params;

    // Validate authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Authentication required to delete proposal',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'ProposalDetailAPI',
            operation: 'DELETE',
          },
        }),
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    proposalId = params.id;

    // Validate proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });

    if (!existingProposal) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Proposal not found',
          code: ErrorCodes.DATA.NOT_FOUND,
          metadata: {
            component: 'ProposalDetailAPI',
            operation: 'DELETE',
            proposalId,
          },
        }),
        'Proposal not found',
        ErrorCodes.DATA.NOT_FOUND,
        404
      );
    }

    // Delete proposal (cascade will handle related records)
    await prisma.proposal.delete({
      where: { id: proposalId },
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: proposalId },
        message: 'Proposal deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    // ✅ ENHANCED: Use proper logger instead of console.error
    const standardError = errorHandlingService.processError(
      error,
      'Failed to delete proposal',
      ErrorCodes.DATA.DELETE_FAILED,
      {
        component: 'ProposalDetailAPI',
        operation: 'DELETE',
        proposalId: proposalId || 'unknown',
        userId: session?.user?.id || 'unknown',
      }
    );

    logError('Error deleting proposal', error, {
      component: 'ProposalDetailAPI',
      operation: 'DELETE',
      proposalId: proposalId || 'unknown',
      userId: session?.user?.id || 'unknown',
      standardError: standardError.message,
      errorCode: standardError.code,
    });

    return createApiErrorResponse(
      new StandardError({
        message: 'Failed to delete proposal',
        code: ErrorCodes.DATA.DELETE_FAILED,
        cause: error instanceof Error ? error : undefined,
        metadata: {
          component: 'ProposalDetailAPI',
          operation: 'DELETE',
          proposalId: proposalId || 'unknown',
          userId: session?.user?.id || 'unknown',
        },
      }),
      'Failed to delete proposal',
      ErrorCodes.DATA.DELETE_FAILED,
      500,
      { userFriendlyMessage: 'Unable to delete proposal. Please try again later.' }
    );
  }
}

/**
 * PATCH /api/proposals/[id] - Partial proposal update for better performance
 * 🚀 PERFORMANCE OPTIMIZATION: Updates only specified fields instead of entire record
 * This addresses the immediate priority for partial data updates identified in optimization evaluation
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const { id } = params;

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        StandardError.unauthorized('Authentication required', {
          component: 'ProposalPatchRoute',
          operation: 'authenticate',
        }),
        'Authentication required',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ProposalPatchSchema.parse(body);

    // Check if proposal exists and user has permission
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
      select: {
        id: true,
        createdBy: true,
        status: true,
        metadata: true,
        assignedTo: {
          select: { id: true },
        },
      },
    });

    if (!existingProposal) {
      return createApiErrorResponse(
        StandardError.notFound('Proposal not found', {
          component: 'ProposalPatchRoute',
          proposalId: id,
        }),
        'Proposal not found',
        ErrorCodes.DATA.NOT_FOUND,
        404
      );
    }

    // Authorization check: user must be creator or assigned to proposal (skipped in dev)
    const skipAuth = process.env.NODE_ENV !== 'production';
    if (!skipAuth) {
      const isCreator = existingProposal.createdBy === session.user.id;
      const isAssigned = existingProposal.assignedTo.some(user => user.id === session.user.id);
      if (!isCreator && !isAssigned) {
        return createApiErrorResponse(
          StandardError.forbidden('Permission denied', {
            component: 'ProposalPatchRoute',
            proposalId: id,
            userId: session.user.id,
          }),
          'Permission denied',
          ErrorCodes.AUTH.PERMISSION_DENIED,
          403
        );
      }
    }

    // 🚀 PERFORMANCE: Prepare update data - only scalar fields that belong to Proposal
    // IMPORTANT: Explicitly exclude relation/unknown fields so they don't leak into Prisma update
    const {
      // metadata-bound fields (handled below)
      teamAssignments,
      contentSelections,
      wizardData,
      validationData,
      analyticsData,
      crossStepValidation,
      sectionAssignments,
      metadata: incomingMetadata,
      // Exclude fields that are not scalar columns on Proposal
      rfpReferenceNumber,
      sections, // relation payload from wizard step 5
      products, // relation payload from step 4
      assignedTo, // relation payload
      metadata, // raw JSON should only be set via mergedMeta below
      contactPerson, // UI convenience fields stored in metadata.step1.client
      contactEmail,
      contactPhone,
      // scalar fields
      ...scalarFields
    } = validatedData as any;

    // DEBUG: Log incoming PATCH wizard fields summary
    try {
      console.log('[ProposalPatchRoute][DEBUG] Incoming fields', {
        proposalId: id,
        hasTeamAssignments: !!teamAssignments,
        contentSelectionsCount: Array.isArray(contentSelections) ? contentSelections.length : 0,
        hasWizardData: !!wizardData,
        hasValidationData: !!validationData,
        hasAnalyticsData: !!analyticsData,
        hasCrossStepValidation: !!crossStepValidation,
        sectionAssignmentsKeys: sectionAssignments ? Object.keys(sectionAssignments) : [],
      });
    } catch {}

    const normalizeSMEKeys = (ta: any) => {
      if (!ta || !ta.subjectMatterExperts || typeof ta.subjectMatterExperts !== 'object') return ta;
      const normalized: Record<string, string> = {};
      for (const [key, val] of Object.entries(ta.subjectMatterExperts)) {
        if (typeof val === 'string' && val) normalized[String(key).toUpperCase()] = val;
      }
      return { ...ta, subjectMatterExperts: normalized };
    };

    const updateData: any = {
      ...scalarFields,
      updatedAt: new Date(),
      lastActivityAt: new Date(), // Always update activity timestamp
      statsUpdatedAt: new Date(), // Mark denormalized data as updated
    };

    // Merge metadata updates safely
    const existingMeta =
      (existingProposal as any).metadata && typeof (existingProposal as any).metadata === 'object'
        ? (existingProposal as any).metadata
        : {};
    let mergedMeta = existingMeta;
    if (
      teamAssignments !== undefined ||
      contentSelections !== undefined ||
      wizardData !== undefined ||
      validationData !== undefined ||
      analyticsData !== undefined ||
      crossStepValidation !== undefined ||
      sectionAssignments !== undefined ||
      (validatedData as any).rfpReferenceNumber !== undefined
    ) {
      mergedMeta = {
        ...existingMeta,
        ...(teamAssignments !== undefined
          ? { teamAssignments: normalizeSMEKeys(teamAssignments) }
          : {}),
        ...(contentSelections !== undefined ? { contentSelections } : {}),
        ...(sectionAssignments !== undefined ? { sectionAssignments } : {}),
        ...(validationData !== undefined ? { validationData } : {}),
        ...(analyticsData !== undefined ? { analyticsData } : {}),
        ...(crossStepValidation !== undefined ? { crossStepValidation } : {}),
      } as any;
      // Merge in metadata from body if present (non-destructive)
      if (incomingMetadata && typeof incomingMetadata === 'object') {
        // Fallback contentSelections if not provided top-level
        if (
          mergedMeta.contentSelections === undefined &&
          Array.isArray(incomingMetadata.contentSelections)
        ) {
          mergedMeta.contentSelections = incomingMetadata.contentSelections;
        }
        // Fallback sectionAssignments if not provided top-level
        if (
          mergedMeta.sectionAssignments === undefined &&
          incomingMetadata.sectionAssignments &&
          typeof incomingMetadata.sectionAssignments === 'object'
        ) {
          mergedMeta.sectionAssignments = incomingMetadata.sectionAssignments;
        }
      }
      // Merge wizardData granularly across steps
      const incomingWDFromTop = wizardData as any | undefined;
      const incomingWDFromMeta =
        incomingMetadata && typeof incomingMetadata === 'object'
          ? (incomingMetadata as any).wizardData
          : undefined;
      const effectiveIncomingWD = incomingWDFromTop ?? incomingWDFromMeta;
      if (effectiveIncomingWD !== undefined) {
        const existingWD = (existingMeta.wizardData || {}) as any;
        const incomingWD = effectiveIncomingWD as any;

        // Start with a shallow merge of top-level wizardData
        const mergedWD: any = { ...existingWD, ...incomingWD };

        // Deep-merge step5 to avoid dropping persisted fields
        const existingStep5 = (existingWD.step5 || {}) as any;
        const incomingStep5 = (incomingWD.step5 || {}) as any;
        if (existingWD.step5 || incomingWD.step5) {
          mergedWD.step5 = {
            ...existingStep5,
            ...incomingStep5,
            // Merge sectionAssignments maps non-destructively
            sectionAssignments: {
              ...(existingStep5.sectionAssignments || {}),
              ...(incomingStep5.sectionAssignments || {}),
            },
          };
        }

        mergedMeta.wizardData = mergedWD;
      }
      // Merge RFP reference number into step1.details when provided explicitly (even if empty string)
      if ('rfpReferenceNumber' in (validatedData as any)) {
        const wd = (mergedMeta.wizardData || {}) as any;
        const step1 = (wd.step1 || {}) as any;
        const details = (step1.details || {}) as any;
        mergedMeta.wizardData = {
          ...wd,
          step1: {
            ...step1,
            details: {
              ...details,
              rfpReferenceNumber: (validatedData as any).rfpReferenceNumber,
            },
          },
        };
        // DEBUG
        try {
          console.log('[ProposalPatchRoute][DEBUG] Applied rfpReferenceNumber to metadata.step1.details');
        } catch {}
      }
      const effectiveSectionAssignments =
        sectionAssignments !== undefined
          ? sectionAssignments
          : incomingMetadata?.sectionAssignments &&
            typeof incomingMetadata.sectionAssignments === 'object'
          ? incomingMetadata.sectionAssignments
          : undefined;
      if (effectiveSectionAssignments !== undefined) {
        mergedMeta.wizardData = {
          ...(mergedMeta.wizardData || {}),
          step5: {
            ...((mergedMeta.wizardData || {}).step5 || {}),
            sectionAssignments: effectiveSectionAssignments,
          },
        } as any;
      }
      // DEBUG: Log merged metadata snapshot before saving
      try {
        const saKeys = mergedMeta?.wizardData?.step5?.sectionAssignments
          ? Object.keys(mergedMeta.wizardData.step5.sectionAssignments)
          : [];
        console.log('[ProposalPatchRoute][DEBUG] Merged metadata snapshot', {
          proposalId: id,
          step3Count: Array.isArray(mergedMeta?.wizardData?.step3?.selectedContent)
            ? mergedMeta.wizardData.step3.selectedContent.length
            : 0,
          step5Sections: Array.isArray(mergedMeta?.wizardData?.step5?.sections)
            ? mergedMeta.wizardData.step5.sections.length
            : 0,
          step5SectionAssignmentsKeys: saKeys,
          rfpReferenceNumber:
            mergedMeta?.wizardData?.step1?.details?.rfpReferenceNumber ?? null,
        });
      } catch {}
      updateData.metadata = { set: mergedMeta };
    }

    // Convert datetime strings to Date objects
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil);
    }

    // 🚀 DENORMALIZATION UPDATE: Update calculated fields if needed
    if (validatedData.status === 'SUBMITTED' && !updateData.submittedAt) {
      updateData.submittedAt = new Date();
    }
    if (validatedData.status === 'APPROVED' && !updateData.approvedAt) {
      updateData.approvedAt = new Date();
    }

    // Perform partial update with denormalized field updates
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        value: true,
        currency: true,
        dueDate: true,
        validUntil: true,
        tags: true,
        projectType: true,
        riskScore: true,
        completionRate: true,
        totalValue: true,
        lastActivityAt: true,
        updatedAt: true,
        statsUpdatedAt: true,
        metadata: true,
        // Include denormalized creator/customer data
        creatorName: true,
        creatorEmail: true,
        customerName: true,
        customerTier: true,
        productCount: true,
        sectionCount: true,
        approvalCount: true,
        // Include relations if needed for response
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            tier: true,
          },
        },
      },
    });

    return createApiResponse(updatedProposal, 'Proposal updated successfully');
  } catch (error) {
    const params = await context.params;

    const processedError = errorHandlingService.processError(
      error,
      'Failed to update proposal',
      ErrorCodes.API.REQUEST_FAILED,
      {
        component: 'ProposalPatchRoute',
        operation: 'patchProposal',
        userStories: ['US-3.1', 'US-4.1'],
        hypotheses: ['H7', 'H3'],
        metadata: {
          proposalId: params.id,
          optimization: 'partial_update_performance',
        },
      }
    );

    if (error instanceof z.ZodError) {
      return createApiErrorResponse(
        processedError,
        'Validation failed',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400,
        {
          userFriendlyMessage: 'Please check your input and try again.',
          validationErrors: error.errors,
        }
      );
    }

    return createApiErrorResponse(
      processedError,
      'Failed to update proposal',
      ErrorCodes.API.REQUEST_FAILED,
      500,
      {
        userFriendlyMessage: 'Unable to update proposal. Please try again later.',
      }
    );
  }
}

// 🚀 PATCH endpoint validation schema for partial updates
const ProposalPatchSchema = z.object({
  // Basic fields
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().max(5000, 'Description too long').optional(),

  // Status and workflow
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

  // Financial
  value: z.number().positive().optional(),
  currency: z.string().length(3).optional(),

  // Dates
  dueDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),

  // Metadata
  tags: z.array(z.string()).optional(),
  projectType: z.string().optional(),

  // Advanced fields
  riskScore: z.number().min(0).max(100).optional(),

  // 🚀 DENORMALIZED UPDATES: Update calculated fields efficiently
  completionRate: z.number().min(0).max(100).optional(),
  totalValue: z.number().positive().optional(),

  // Wizard-related metadata updates (will be merged into metadata JSON)
  teamAssignments: z
    .object({
      teamLead: z.string().optional(),
      salesRepresentative: z.string().optional(),
      subjectMatterExperts: z.record(z.string()).optional(),
      executiveReviewers: z.array(z.string()).optional(),
    })
    .optional(),

  contentSelections: z
    .array(
      z.object({
        contentId: z.string(),
        section: z.string(),
        customizations: z.array(z.string()).optional(),
        assignedTo: z.string().optional(),
      })
    )
    .optional(),

  rfpReferenceNumber: z.string().optional(),
  wizardData: z.any().optional(),
  validationData: z.any().optional(),
  analyticsData: z.any().optional(),
  crossStepValidation: z.any().optional(),
  sectionAssignments: z.record(z.string()).optional(),
});
