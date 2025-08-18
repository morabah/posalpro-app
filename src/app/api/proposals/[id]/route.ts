/**
 * PosalPro MVP2 - Individual Proposal API Routes
 * Handles operations on specific proposals by ID using service functions
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 * Uses standardized error handling
 */

import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
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

// Shared interfaces for metadata shapes used in GET/PATCH handlers
interface SectionAssignmentsMap {
  [key: string]: unknown;
}

interface Step4Product {
  included?: boolean;
  totalPrice?: number;
  quantity?: number;
  unitPrice?: number;
}

export interface WizardData {
  step1?: {
    details?: {
      estimatedValue?: number;
      rfpReferenceNumber?: string;
      contactPerson?: string;
      contactEmail?: string;
      contactPhone?: string;
    };
    value?: number;
    client?: { contactPerson?: string; contactEmail?: string; contactPhone?: string };
  };
  step3?: { selectedContent?: unknown[] };
  step4?: { products?: Step4Product[] };
  step5?: { sectionAssignments?: SectionAssignmentsMap; sections?: unknown[] };
}

interface ProductRef {
  id?: string;
  name?: string;
  price?: number;
  currency?: string;
}
interface ProposalProduct {
  productId?: string | null;
  product?: ProductRef | null;
  quantity?: number | null;
  unitPrice?: number | null;
  discount?: number | null;
}
interface MetadataShape {
  wizardData?: WizardData;
  teamAssignments?: unknown;
  contentSelections?: unknown;
  validationData?: unknown;
  analyticsData?: unknown;
  crossStepValidation?: unknown;
  sectionAssignments?: SectionAssignmentsMap;
}

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

    // RBAC: proposals:read
    await validateApiPermission(request, { resource: 'proposals', action: 'read' });
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

    // Transform proposal data for frontend consumption (typed, eslint-safe)

    const md = (proposal.metadata as unknown as MetadataShape) || {};
    const wd = md.wizardData;
    const contactsFromCustomer = (
      proposal.customer as unknown as {
        contacts?: Array<{ name?: string; email?: string; phone?: string }>;
      }
    )?.contacts;
    const firstContact: { name?: string; email?: string; phone?: string } | undefined =
      Array.isArray(contactsFromCustomer) ? contactsFromCustomer[0] : undefined;
    const productsFromRelation: ProposalProduct[] =
      (proposal as unknown as { products?: ProposalProduct[] }).products || [];

    const proposalDetail = {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      // Expose raw metadata for clients that expect it
      metadata: proposal.metadata ?? null,
      status: proposal.status,
      priority: proposal.priority,
      projectType: proposal.projectType,
      value: proposal.value ?? 0,
      currency: proposal.currency ?? 'USD',
      dueDate: proposal.dueDate ? proposal.dueDate.toISOString() : undefined,
      validUntil: proposal.validUntil ? proposal.validUntil.toISOString() : undefined,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      submittedAt: proposal.submittedAt ? proposal.submittedAt.toISOString() : undefined,
      approvedAt: proposal.approvedAt ? proposal.approvedAt.toISOString() : undefined,

      // Convenience: expose RFP reference number if stored in metadata
      rfpReferenceNumber: wd?.step1?.details?.rfpReferenceNumber ?? null,

      // Customer information
      customerId: proposal.customerId,
      customerName: proposal.customer?.name ?? 'Unknown Customer',
      customerIndustry: proposal.customer?.industry,
      customerTier: proposal.customer?.tier,
      customerEmail: proposal.customer?.email,
      // Contact information: prefer metadata, then primary contact, then customer
      contactPerson: wd?.step1?.client?.contactPerson ?? firstContact?.name ?? '',
      contactEmail:
        wd?.step1?.client?.contactEmail ?? proposal.customer?.email ?? firstContact?.email ?? '',
      contactPhone:
        wd?.step1?.client?.contactPhone ??
        (proposal.customer as unknown as { phone?: string })?.phone ??
        firstContact?.phone ??
        '',

      // Creator information
      createdBy: proposal.creator?.name ?? 'Unknown Creator',
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
      products: productsFromRelation.map(pp => ({
        id: pp.product?.id,
        productId: pp.productId ?? pp.product?.id,
        name: pp.product?.name,
        quantity: pp.quantity ?? 0,
        unitPrice: pp.unitPrice ?? pp.product?.price ?? 0,
        currency: pp.product?.currency ?? 'USD',
        discount: pp.discount ?? 0,
      })),

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
        completedAt: approval.completedAt ? approval.completedAt.toISOString() : undefined,
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
      wizardData: wd ?? null,
      teamAssignments: md.teamAssignments ?? null,
      contentSelections: md.contentSelections ?? null,
      validationData: md.validationData ?? null,
      analyticsData: md.analyticsData ?? null,
      crossStepValidation: md.crossStepValidation ?? null,
    };

    // DEBUG: Log wizardData and sectionAssignments snapshot before returning
    if (process.env.NODE_ENV !== 'production') {
      const sa = wd?.step5?.sectionAssignments || md.sectionAssignments || null;
      console.log('[ProposalDetailAPI][DEBUG] GET payload snapshot', {
        proposalId,
        wizardDataStep3Count: Array.isArray(wd?.step3?.selectedContent)
          ? (wd!.step3!.selectedContent as unknown[]).length
          : 0,
        wizardDataStep5Sections: Array.isArray(wd?.step5?.sections)
          ? (wd!.step5!.sections as unknown[]).length
          : 0,
        sectionAssignmentsKeys: sa ? Object.keys(sa) : [],
        sectionAssignmentsType: sa ? typeof sa : 'null',
      });
    }

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
  let session: Awaited<ReturnType<typeof getServerSession>> | undefined;
  let proposalId: string | undefined;
  try {
    // Await params
    const params = await context.params;

    // RBAC: proposals:update
    await validateApiPermission(request, { resource: 'proposals', action: 'update' });
    // Validate authentication
    session = (await getServerSession(authOptions)) as any;
    if (!session || !(session as any).user || !(session as any).user.id) {
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

    proposalId = String(params.id);
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

    // Reconcile product links if provided (add/update/remove in a single transaction)
    const productsPayload:
      | Array<{
          productId: string;
          quantity: number;
          unitPrice: number;
          discount?: number;
        }>
      | undefined = Array.isArray((body as any)?.products)
      ? (body as any).products
      : Array.isArray((body as any)?.wizardData?.step4?.products)
        ? (body as any).wizardData.step4.products.map((p: any) => ({
            productId: p.productId ?? p.id,
            quantity: Number(p.quantity ?? 1),
            unitPrice: Number(p.unitPrice ?? p.totalPrice ?? 0),
            discount: Number(p.discount ?? 0),
          }))
        : undefined;

    const { products: _omitProducts, ...proposalUpdateData } = body as Record<string, unknown>;

    let changedProducts = false;
    const affectedProductIds: string[] = [];

    const updatedProposal = await prisma.$transaction(async tx => {
      // Update proposal basic fields first
      const updated = await tx.proposal.update({
        where: { id: proposalId as string },
        data: {
          ...(proposalUpdateData as object),
          updatedAt: new Date(),
        },
      });

      if (productsPayload && productsPayload.length >= 0) {
        // Load existing links
        const existing = await tx.proposalProduct.findMany({
          where: { proposalId: proposalId as string },
          select: { id: true, productId: true, quantity: true, unitPrice: true, discount: true },
        });

        const desiredByProductId = new Map<
          string,
          { quantity: number; unitPrice: number; discount: number }
        >();
        for (const p of productsPayload) {
          if (!p?.productId) continue;
          desiredByProductId.set(String(p.productId), {
            quantity: Math.max(1, Number(p.quantity ?? 1)),
            unitPrice: Math.max(0, Number(p.unitPrice ?? 0)),
            discount: Math.max(0, Number(p.discount ?? 0)),
          });
        }

        const existingByProductId = new Map(existing.map(e => [e.productId, e]));

        const toDelete: string[] = [];
        const toCreate: Array<{
          proposalId: string;
          productId: string;
          quantity: number;
          unitPrice: number;
          discount: number;
          total: number;
        }> = [];
        const toUpdate: Array<{
          id: string;
          quantity: number;
          unitPrice: number;
          discount: number;
          total: number;
        }> = [];

        // Determine deletions
        for (const e of existing) {
          if (!desiredByProductId.has(e.productId)) {
            toDelete.push(e.id);
            affectedProductIds.push(e.productId);
          }
        }

        // Determine creates/updates
        for (const [productId, desired] of desiredByProductId.entries()) {
          const found = existingByProductId.get(productId);
          const total = desired.quantity * desired.unitPrice * (1 - desired.discount / 100);
          if (!found) {
            toCreate.push({
              proposalId: proposalId as string,
              productId,
              quantity: desired.quantity,
              unitPrice: desired.unitPrice,
              discount: desired.discount,
              total,
            });
            affectedProductIds.push(productId);
          } else {
            if (
              found.quantity !== desired.quantity ||
              found.unitPrice !== desired.unitPrice ||
              (found.discount ?? 0) !== (desired.discount ?? 0)
            ) {
              toUpdate.push({
                id: found.id,
                quantity: desired.quantity,
                unitPrice: desired.unitPrice,
                discount: desired.discount,
                total,
              });
              affectedProductIds.push(productId);
            }
          }
        }

        if (toDelete.length > 0) {
          changedProducts = true;
          await tx.proposalProduct.deleteMany({ where: { id: { in: toDelete } } });
        }
        if (toCreate.length > 0) {
          changedProducts = true;
          await tx.proposalProduct.createMany({ data: toCreate });
        }
        for (const u of toUpdate) {
          changedProducts = true;
          await tx.proposalProduct.update({
            where: { id: u.id },
            data: {
              quantity: u.quantity,
              unitPrice: u.unitPrice,
              discount: u.discount,
              total: u.total,
            },
          });
        }

        if (changedProducts) {
          // Recalculate proposal total value when products changed
          const agg = await tx.proposalProduct.aggregate({
            where: { proposalId: proposalId as string },
            _sum: { total: true },
          });
          await tx.proposal.update({
            where: { id: proposalId as string },
            data: { value: agg._sum.total || 0, totalValue: agg._sum.total || 0 },
          });
        }
      }

      return updated;
    });

    // Background snapshot (non-blocking) – direct DB write for reliability
    setTimeout(async () => {
      try {
        const id = proposalId as string;
        const proposal = await prisma.proposal.findUnique({
          where: { id },
          include: {
            products: {
              select: {
                productId: true,
                quantity: true,
                unitPrice: true,
                total: true,
                updatedAt: true,
              },
            },
            sections: { select: { id: true, title: true, order: true, updatedAt: true } },
          },
        });
        if (!proposal) return;

        const PrismaLocal = (require('@prisma/client') as any).Prisma;
        const last = (await prisma.$queryRaw(
          PrismaLocal.sql`SELECT COALESCE(MAX(version), 0) as v FROM proposal_versions WHERE "proposalId" = ${id}`
        )) as Array<{ v: number }>;
        const nextVersion = (last[0]?.v ?? 0) + 1;

        const snapshot = {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          priority: proposal.priority,
          value: proposal.value,
          currency: proposal.currency,
          customerId: proposal.customerId,
          metadata: proposal.metadata,
          products: proposal.products,
          sections: proposal.sections,
          updatedAt: proposal.updatedAt,
        } as const;

        const ids = new Set<string>(affectedProductIds);
        try {
          const md: any = (snapshot as any).metadata || {};
          const step4 = md?.wizardData?.step4;
          if (Array.isArray(step4?.products)) {
            for (const p of step4.products) {
              if (p?.productId && typeof p.productId === 'string') ids.add(p.productId);
            }
          }
          if (Array.isArray((snapshot as any).products)) {
            for (const link of (snapshot as any).products) {
              if (link?.productId && typeof link.productId === 'string') ids.add(link.productId);
            }
          }
        } catch {}

        await prisma.$queryRaw(
          PrismaLocal.sql`INSERT INTO proposal_versions (id, "proposalId", version, "createdBy", "changeType", "changesSummary", snapshot, "productIds")
                           VALUES (gen_random_uuid()::text, ${id}, ${nextVersion}, ${(session as any)?.user?.id ?? null}, ${changedProducts ? 'product_change' : 'update'}, ${changedProducts ? 'Products reconciled (add/update/remove)' : 'Proposal updated'}, ${snapshot as any}, ${Array.from(ids)})`
        );
      } catch {
        // swallow background errors
      }
    }, 0);

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
        userId: (session && (session as any).user && (session as any).user.id) || 'unknown',
      }
    );

    logError('Error updating proposal', error, {
      component: 'ProposalDetailAPI',
      operation: 'PUT',
      proposalId: proposalId || 'unknown',
      userId: (session && (session as any).user && (session as any).user.id) || 'unknown',
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
          userId: (session && (session as any).user && (session as any).user.id) || 'unknown',
        },
      }),
      'Failed to update proposal',
      ErrorCodes.DATA.UPDATE_FAILED,
      500,
      { userFriendlyMessage: 'Unable to update proposal. Please try again later.' }
    );
  }
}

// (Removed duplicate PATCH alias to avoid redeclaration error)
/**
 * DELETE /api/proposals/[id] - Delete specific proposal
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  let session;
  let proposalId;
  try {
    // Await params
    const params = await context.params;

    // RBAC: proposals:delete
    await validateApiPermission(request, { resource: 'proposals', action: 'delete' });
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
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  console.log('🚀 [ProposalAPI] PATCH endpoint called!');
  console.log('🚀 [ProposalAPI] Request URL:', request.url);
  console.log('🚀 [ProposalAPI] Request method:', request.method);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        null,
        'Authentication required',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401,
        { userFriendlyMessage: 'Please log in to continue.' }
      );
    }

    const params = await context.params;
    const { id } = params;

    console.log(`[ProposalAPI] 🚀 PATCH request received for proposal ${id}`);

    // Parse and validate request body
    const body = await request.json();
    console.log(`[ProposalAPI] Request body keys:`, Object.keys(body));
    console.log(`[ProposalAPI] Has products in request:`, !!body.products);
    console.log(`[ProposalAPI] Has wizardData in request:`, !!body.metadata?.wizardData);
    console.log(`[ProposalAPI] Has step4 products:`, !!body.metadata?.wizardData?.step4?.products);

    if (body.products) {
      console.log(`[ProposalAPI] Direct products array:`, JSON.stringify(body.products, null, 2));
    }
    if (body.metadata?.wizardData?.step4?.products) {
      console.log(
        `[ProposalAPI] Step4 products array:`,
        JSON.stringify(body.metadata.wizardData.step4.products, null, 2)
      );
    }

    if (body.products) {
      console.log(`[ProposalAPI] Products count:`, body.products.length);
    }
    if (body.wizardData?.step4?.products) {
      console.log(
        `[ProposalAPI] WizardData step4 products count:`,
        body.wizardData.step4.products.length
      );
    }
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
      type SectionAssignments = Record<string, unknown>;
      interface Step4Product {
        included?: boolean;
        totalPrice?: number;
        quantity?: number;
        unitPrice?: number;
      }
      interface WizardData {
        step1?: {
          details?: { estimatedValue?: number; rfpReferenceNumber?: string };
          value?: number;
        };
        step4?: { products?: Step4Product[] };
        step5?: { sectionAssignments?: SectionAssignments; sections?: unknown[] };
        step3?: { selectedContent?: unknown[] };
      }

      const incomingWDFromTop: WizardData | undefined = wizardData as unknown as
        | WizardData
        | undefined;
      const incomingWDFromMeta: WizardData | undefined =
        incomingMetadata && typeof incomingMetadata === 'object'
          ? (incomingMetadata as { wizardData?: WizardData }).wizardData
          : undefined;
      const effectiveIncomingWD: WizardData | undefined = incomingWDFromTop ?? incomingWDFromMeta;
      if (effectiveIncomingWD !== undefined) {
        const existingWD: WizardData = (existingMeta.wizardData || {}) as WizardData;
        const incomingWD: WizardData = effectiveIncomingWD;

        // Start with a shallow merge of top-level wizardData
        const mergedWD: WizardData = { ...existingWD, ...incomingWD };

        // Deep-merge step5 to avoid dropping persisted fields
        const existingStep5 = (existingWD.step5 || {}) as NonNullable<WizardData['step5']>;
        const incomingStep5 = (incomingWD.step5 || {}) as NonNullable<WizardData['step5']>;
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

        // Deep-merge step4 with product name resolution to fix "Unknown Product" issue
        const existingStep4 = (existingWD.step4 || {}) as NonNullable<WizardData['step4']>;
        const incomingStep4 = (incomingWD.step4 || {}) as NonNullable<WizardData['step4']>;
        if (incomingStep4.products && Array.isArray(incomingStep4.products)) {
          // Resolve product names from database
          const productIds = incomingStep4.products
            .map((p: any) => p.productId || p.id)
            .filter((id: string) => id);

          if (productIds.length > 0) {
            const productDetails = await prisma.product.findMany({
              where: { id: { in: productIds } },
              select: { id: true, name: true, category: true },
            });
            const productMap = new Map(productDetails.map(p => [p.id, p]));

            // Update products with resolved names
            const resolvedProducts = incomingStep4.products.map((p: any) => {
              const productId = p.productId || p.id;
              const productDetail = productMap.get(productId);
              return {
                ...p,
                name: productDetail?.name || 'Unknown Product',
                category: productDetail?.category?.[0] || 'General',
              };
            });

            mergedWD.step4 = {
              ...existingStep4,
              ...incomingStep4,
              products: resolvedProducts,
            };
          } else {
            mergedWD.step4 = {
              ...existingStep4,
              ...incomingStep4,
            };
          }
        } else {
          mergedWD.step4 = {
            ...existingStep4,
            ...incomingStep4,
          };
        }

        mergedMeta.wizardData = mergedWD as unknown as Record<string, unknown>;
      }
      // Merge RFP reference number into step1.details when provided explicitly (even if empty string)
      if (
        Object.prototype.hasOwnProperty.call(
          validatedData as Record<string, unknown>,
          'rfpReferenceNumber'
        )
      ) {
        const wd: WizardData = (mergedMeta.wizardData || {}) as WizardData;
        const step1 = wd.step1 || {};
        const details = step1.details || {};
        mergedMeta.wizardData = {
          ...(wd as Record<string, unknown>),
          step1: {
            ...step1,
            details: {
              ...details,
              rfpReferenceNumber: (validatedData as { rfpReferenceNumber?: string })
                .rfpReferenceNumber,
            },
          },
        } as unknown as Record<string, unknown>;
        // DEBUG
        if (process.env.NODE_ENV !== 'production') {
          console.log(
            '[ProposalPatchRoute][DEBUG] Applied rfpReferenceNumber to metadata.step1.details'
          );
        }
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
      if (process.env.NODE_ENV !== 'production') {
        const saKeys = ((): string[] => {
          const sa = (mergedMeta as { wizardData?: WizardData })?.wizardData?.step5
            ?.sectionAssignments;
          return sa ? Object.keys(sa) : [];
        })();
        console.log('[ProposalPatchRoute][DEBUG] Merged metadata snapshot', {
          proposalId: id,
          step3Count: Array.isArray(
            (mergedMeta as { wizardData?: WizardData })?.wizardData?.step3?.selectedContent
          )
            ? (
                (mergedMeta as { wizardData?: WizardData }).wizardData!.step3!
                  .selectedContent as unknown[]
              ).length
            : 0,
          step5Sections: Array.isArray(
            (mergedMeta as { wizardData?: WizardData })?.wizardData?.step5?.sections
          )
            ? ((mergedMeta as { wizardData?: WizardData }).wizardData!.step5!.sections as unknown[])
                .length
            : 0,
          step5SectionAssignmentsKeys: saKeys,
          rfpReferenceNumber:
            (mergedMeta as { wizardData?: WizardData })?.wizardData?.step1?.details
              ?.rfpReferenceNumber ?? null,
        });
      }
      updateData.metadata = mergedMeta;
    }

    // Keep metadata.step4.products synchronized with incoming top-level products array
    if (Array.isArray((validatedData as any)?.products)) {
      // Resolve product names from database to fix "Unknown Product" issue
      const productIds = (validatedData as any).products.map((p: any) => p.productId);
      const productDetails = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, category: true },
      });
      const productMap = new Map(productDetails.map(p => [p.id, p]));

      const normalizedProducts = (
        (validatedData as any).products as Array<{
          productId: string;
          quantity: number;
          unitPrice: number;
          discount?: number;
        }>
      ).map(p => {
        const productDetail = productMap.get(p.productId);
        return {
          id: p.productId,
          productId: p.productId,
          name: productDetail?.name || 'Unknown Product',
          category: productDetail?.category?.[0] || 'General',
          included: true,
          quantity: Number(p.quantity ?? 1),
          unitPrice: Number(p.unitPrice ?? 0),
          totalPrice: Number(
            ((p.quantity ?? 1) * (p.unitPrice ?? 0) * (1 - (p.discount ?? 0) / 100)).toFixed(2)
          ),
          discount: Number(p.discount ?? 0),
        };
      });

      // Update metadata with normalized products (flat structure)
      const currentWD = (mergedMeta.wizardData || {}) as any;
      mergedMeta = {
        ...mergedMeta,
        wizardData: {
          ...currentWD,
          step4: {
            ...(currentWD.step4 || {}),
            products: normalizedProducts,
          },
        },
      };
      updateData.metadata = mergedMeta;
    }

    // Convert datetime strings to Date objects
    if (validatedData.dueDate) {
      updateData.dueDate = new Date(validatedData.dueDate);
    }
    if (validatedData.validUntil) {
      updateData.validUntil = new Date(validatedData.validUntil);
    }

    // 🚀 VALUE CALCULATION & GUARD: Recalculate proposal value based on step 4 products or step 1 estimate
    const mdForCalc: { wizardData?: WizardData } = mergedMeta as { wizardData?: WizardData };
    const wdCalc = mdForCalc.wizardData;
    if (wdCalc) {
      const products: Step4Product[] = Array.isArray(wdCalc.step4?.products)
        ? (wdCalc.step4!.products as Step4Product[])
        : [];

      const includedProducts = products.filter(p => p && p.included !== false);
      const hasProducts = includedProducts.length > 0;

      const step4TotalValue = includedProducts.reduce((sum, product) => {
        const line =
          typeof product.totalPrice === 'number'
            ? product.totalPrice
            : (product.quantity ?? 1) * (product.unitPrice ?? 0);
        return sum + line;
      }, 0);

      const step1EstimatedValue = wdCalc.step1?.details?.estimatedValue ?? wdCalc.step1?.value ?? 0;

      const shouldUseEstimated = !hasProducts && step4TotalValue === 0 && step1EstimatedValue > 0;
      let finalProposalValue = shouldUseEstimated ? step1EstimatedValue : step4TotalValue;

      // Reconciliation guard: prefer computed total when products are present
      const incomingManualTotal: boolean | undefined = (validatedData as any)?.manualTotal;
      const incomingValue: number | undefined = (validatedData as any)?.value;

      if (hasProducts) {
        // Always use computed sum of products to avoid 400s due to UI race conditions
        finalProposalValue = step4TotalValue;
      } else {
        // No products present: only allow setting value if manualTotal flag is true
        if (typeof incomingValue === 'number' && Number.isFinite(incomingValue)) {
          if (incomingManualTotal === true) {
            finalProposalValue = incomingValue;
          } else {
            return createApiErrorResponse(
              new StandardError({
                message: 'Manual total requires manualTotal flag when no products are selected',
                code: ErrorCodes.VALIDATION.INVALID_INPUT,
                metadata: { component: 'ProposalPatchRoute', reason: 'manual_total_requires_flag' },
              }),
              'Manual total not allowed without flag',
              ErrorCodes.VALIDATION.INVALID_INPUT,
              400,
              { userFriendlyMessage: 'Enable manual total to set value without products.' }
            );
          }
        }
      }

      if (finalProposalValue > 0) {
        updateData.value = finalProposalValue;
        updateData.totalValue = finalProposalValue; // Keep denormalized field in sync
      }

      // DEBUG: Log value calculation
      if (process.env.NODE_ENV !== 'production') {
        console.log('[ProposalPatchRoute][DEBUG] Value calculation', {
          proposalId: id,
          hasProducts,
          step4TotalValue,
          step1EstimatedValue,
          shouldUseEstimated,
          finalProposalValue,
          updatedValue: updateData.value,
        });
      }
    }

    // 🚀 DENORMALIZATION UPDATE: Update calculated fields if needed
    if (validatedData.status === 'SUBMITTED' && !updateData.submittedAt) {
      updateData.submittedAt = new Date();
    }
    if (validatedData.status === 'APPROVED' && !updateData.approvedAt) {
      updateData.approvedAt = new Date();
    }

    // 🚀 CAPTURE CURRENT STATE BEFORE UPDATE FOR VERSION HISTORY
    const currentProposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            productId: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            total: true,
            updatedAt: true,
          },
        },
        sections: { select: { id: true, title: true, order: true, updatedAt: true } },
      },
    });

    if (!currentProposal) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Proposal not found',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
        }),
        'Proposal not found',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        404
      );
    }

    // 🚀 CREATE VERSION BEFORE UPDATE - Capture current state for version history
    let changedProducts = false;
    const affectedProductIds: string[] = [];

    // Check if products will change by comparing incoming vs current
    const incomingProducts = Array.isArray((validatedData as any)?.products)
      ? ((validatedData as any).products as Array<{
          productId: string;
          quantity: number;
          unitPrice: number;
          discount?: number;
        }>)
      : Array.isArray((mergedMeta as any)?.wizardData?.step4?.products)
        ? (
            (mergedMeta as any).wizardData.step4.products as Array<{
              id?: string;
              productId?: string;
              quantity?: number;
              unitPrice?: number;
              totalPrice?: number;
              discount?: number;
            }>
          ).map(p => ({
            productId: (p.productId ?? p.id) as string,
            quantity: Number(p.quantity ?? 1),
            unitPrice: Number(p.unitPrice ?? p.totalPrice ?? 0),
            discount: Number(p.discount ?? 0),
          }))
        : undefined;

    console.log(`[ProposalAPI] 🔍 Product change detection:`);
    console.log(`[ProposalAPI] - Current products count:`, currentProposal.products.length);
    console.log(
      `[ProposalAPI] - Current products:`,
      JSON.stringify(
        currentProposal.products.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          discount: p.discount,
        })),
        null,
        2
      )
    );
    console.log(
      `[ProposalAPI] - Incoming products:`,
      incomingProducts ? incomingProducts.length : 'none'
    );
    if (incomingProducts) {
      console.log(
        `[ProposalAPI] - Incoming products data:`,
        JSON.stringify(incomingProducts, null, 2)
      );
    }
    console.log(`[ProposalAPI] - validatedData.products:`, !!(validatedData as any)?.products);
    console.log(
      `[ProposalAPI] - mergedMeta.wizardData.step4.products:`,
      !!(mergedMeta as any)?.wizardData?.step4?.products
    );
    if ((mergedMeta as any)?.wizardData?.step4?.products) {
      console.log(
        `[ProposalAPI] - Raw step4 products:`,
        JSON.stringify((mergedMeta as any).wizardData.step4.products, null, 2)
      );
    }

    // Detect product changes BEFORE the transaction
    if (incomingProducts) {
      const currentProducts = currentProposal.products;
      const currentByProductId = new Map(currentProducts.map(p => [p.productId, p]));
      const incomingByProductId = new Map<
        string,
        { quantity: number; unitPrice: number; discount: number }
      >();

      for (const p of incomingProducts) {
        if (!p?.productId) continue;
        incomingByProductId.set(String(p.productId), {
          quantity: Math.max(1, Number(p.quantity ?? 1)),
          unitPrice: Math.max(0, Number(p.unitPrice ?? 0)),
          discount: Math.max(0, Number(p.discount ?? 0)),
        });
        affectedProductIds.push(String(p.productId));
      }

      // Check for changes
      for (const current of currentProducts) {
        if (!incomingByProductId.has(current.productId)) {
          changedProducts = true; // Product removed
          affectedProductIds.push(current.productId);
        }
      }

      for (const [productId, incoming] of incomingByProductId.entries()) {
        const current = currentByProductId.get(productId);
        if (!current) {
          changedProducts = true; // Product added
        } else if (
          current.quantity !== incoming.quantity ||
          current.unitPrice !== incoming.unitPrice ||
          (current.discount ?? 0) !== (incoming.discount ?? 0)
        ) {
          changedProducts = true; // Product modified
        }
      }
    }

    console.log(
      `[ProposalAPI] 🔍 Product change detection result: changedProducts = ${changedProducts}`
    );
    console.log(`[ProposalAPI] 🔍 Affected product IDs:`, affectedProductIds);

    // Create version BEFORE update if products changed
    if (changedProducts) {
      console.log(`[ProposalAPI] 🚀 Creating version snapshot BEFORE update...`);
      try {
        const PrismaLocal = (require('@prisma/client') as any).Prisma;
        const lastVersionResult = (await prisma.$queryRaw(
          PrismaLocal.sql`SELECT COALESCE(MAX(version), 0) as v FROM proposal_versions WHERE "proposalId" = ${id}`
        )) as Array<{ v: number }>;
        const nextVersion = (lastVersionResult[0]?.v ?? 0) + 1;

        // Create snapshot of CURRENT state (before update)
        const snapshot = {
          id: currentProposal.id,
          title: currentProposal.title,
          status: currentProposal.status,
          priority: currentProposal.priority,
          value: currentProposal.value,
          currency: currentProposal.currency,
          customerId: currentProposal.customerId,
          metadata: currentProposal.metadata,
          products: currentProposal.products,
          sections: currentProposal.sections,
          updatedAt: currentProposal.updatedAt,
        };

        // Collect all product IDs for indexing
        const allProductIds = new Set<string>(affectedProductIds);
        try {
          const md: any = (snapshot as any).metadata || {};
          const step4 = md?.wizardData?.step4;
          if (Array.isArray(step4?.products)) {
            for (const p of step4.products) {
              if (p?.productId && typeof p.productId === 'string') allProductIds.add(p.productId);
            }
          }
          if (Array.isArray((snapshot as any).products)) {
            for (const link of (snapshot as any).products) {
              if (link?.productId && typeof link.productId === 'string')
                allProductIds.add(link.productId);
            }
          }
        } catch {
          // Ignore metadata parsing errors
        }

        // Insert version record
        await prisma.$queryRaw(
          PrismaLocal.sql`INSERT INTO proposal_versions (id, "proposalId", version, "createdBy", "changeType", "changesSummary", snapshot, "productIds")
                           VALUES (gen_random_uuid()::text, ${id}, ${nextVersion}, ${session.user.id}, 'product_change', 'Products modified (add/update/remove)', ${snapshot as any}, ${Array.from(allProductIds)})`
        );

        console.log(
          `[ProposalAPI] Created version ${nextVersion} for proposal ${id} - product changes detected`
        );
      } catch (versionError) {
        console.error('[ProposalAPI] Failed to create version:', versionError);
        // Continue with update even if version creation fails
      }
    }

    // Perform partial update with product reconciliation in a single transaction
    const updatedProposal = await prisma.$transaction(async tx => {
      const updated = await tx.proposal.update({
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

      // Reconcile products if provided in payload (validatedData.products or mergedMeta wizardData)
      const incomingProducts = Array.isArray((validatedData as any)?.products)
        ? ((validatedData as any).products as Array<{
            productId: string;
            quantity: number;
            unitPrice: number;
            discount?: number;
          }>)
        : Array.isArray((mergedMeta as any)?.wizardData?.step4?.products)
          ? (
              (mergedMeta as any).wizardData.step4.products as Array<{
                id?: string;
                productId?: string;
                quantity?: number;
                unitPrice?: number;
                totalPrice?: number;
                discount?: number;
              }>
            ).map(p => ({
              productId: (p.productId ?? p.id) as string,
              quantity: Number(p.quantity ?? 1),
              unitPrice: Number(p.unitPrice ?? p.totalPrice ?? 0),
              discount: Number(p.discount ?? 0),
            }))
          : undefined;

      if (incomingProducts) {
        const existing = await tx.proposalProduct.findMany({
          where: { proposalId: id },
          select: { id: true, productId: true, quantity: true, unitPrice: true, discount: true },
        });
        const desiredByProductId = new Map<
          string,
          { quantity: number; unitPrice: number; discount: number }
        >();
        for (const p of incomingProducts) {
          if (!p?.productId) continue;
          desiredByProductId.set(String(p.productId), {
            quantity: Math.max(1, Number(p.quantity ?? 1)),
            unitPrice: Math.max(0, Number(p.unitPrice ?? 0)),
            discount: Math.max(0, Number(p.discount ?? 0)),
          });
        }
        const existingByProductId = new Map(existing.map(e => [e.productId, e]));
        const toDelete: string[] = [];
        const toCreate: Array<{
          proposalId: string;
          productId: string;
          quantity: number;
          unitPrice: number;
          discount: number;
          total: number;
        }> = [];
        const toUpdate: Array<{
          id: string;
          quantity: number;
          unitPrice: number;
          discount: number;
          total: number;
        }> = [];
        for (const e of existing) {
          if (!desiredByProductId.has(e.productId)) {
            toDelete.push(e.id);
            affectedProductIds.push(e.productId);
          }
        }
        for (const [productId, desired] of desiredByProductId.entries()) {
          const found = existingByProductId.get(productId);
          const total = desired.quantity * desired.unitPrice * (1 - desired.discount / 100);
          if (!found) {
            toCreate.push({
              proposalId: id,
              productId,
              quantity: desired.quantity,
              unitPrice: desired.unitPrice,
              discount: desired.discount,
              total,
            });
            affectedProductIds.push(productId);
          } else if (
            found.quantity !== desired.quantity ||
            found.unitPrice !== desired.unitPrice ||
            (found.discount ?? 0) !== (desired.discount ?? 0)
          ) {
            toUpdate.push({
              id: found.id,
              quantity: desired.quantity,
              unitPrice: desired.unitPrice,
              discount: desired.discount,
              total,
            });
            affectedProductIds.push(productId);
          }
        }
        if (toDelete.length > 0) {
          changedProducts = true;
          await tx.proposalProduct.deleteMany({ where: { id: { in: toDelete } } });
        }
        if (toCreate.length > 0) {
          changedProducts = true;
          await tx.proposalProduct.createMany({ data: toCreate });
        }
        for (const u of toUpdate) {
          changedProducts = true;
          await tx.proposalProduct.update({
            where: { id: u.id },
            data: {
              quantity: u.quantity,
              unitPrice: u.unitPrice,
              discount: u.discount,
              total: u.total,
            },
          });
        }
        if (changedProducts) {
          const agg = await tx.proposalProduct.aggregate({
            where: { proposalId: id },
            _sum: { total: true },
          });
          await tx.proposal.update({
            where: { id },
            data: { value: agg._sum.total || 0, totalValue: agg._sum.total || 0 },
          });
        }
      }

      return updated;
    });

    // Version creation now happens BEFORE the update (see above)

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
  // Guard control: allow setting value without products when true
  manualTotal: z.boolean().optional(),

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

  // Products (Step 4) - allow direct PATCH with products array
  products: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().default(1),
        unitPrice: z.number().nonnegative().default(0),
        discount: z.number().min(0).max(100).default(0),
      })
    )
    .optional(),
});
