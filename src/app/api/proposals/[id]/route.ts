/**
 * Individual Proposal API Routes - Modern Architecture
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { ProposalSchema, WizardProposalUpdateSchema } from '@/features/proposals/schemas';
import { fail } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { ErrorCodes, errorHandlingService } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { ProposalService } from '@/lib/services/proposalService';
import { Prisma, SectionType } from '@prisma/client';

// Type definitions for proposal data
type ProposalProductWithRelations = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product?: {
    id: string;
    name: string;
    category: string[];
    description: string | null;
  } | null;
  configuration?: Record<string, unknown>;
};

interface ProposalUpdateData {
  title?: string;
  description?: string;
  value?: number;
  dueDate?: Date;
  status?: string;
  priority?: string;
  customer?: {
    connect: { id: string };
  };
  userStoryTracking?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ProposalRequestBody {
  teamData?: unknown;
  contentData?: unknown;
  productData?: unknown;
  sectionData?: unknown;
  reviewData?: unknown;
  planType?: string;
  customer?: { id: string };
  customerId?: string;
  changesSummary?: string;
  [key: string]: unknown;
}

// ====================
// GET /api/proposals/[id] - Get individual proposal
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const id = req.url.split('/').pop()?.split('?')[0];

    if (!id) {
      return Response.json(fail('VALIDATION_ERROR', 'Proposal ID is required'), { status: 400 });
    }

    try {
      // Reduced logging - only in development
      if (process.env.NODE_ENV === 'development') {
        logInfo('API: Fetching proposal', {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'GET',
        });
      }

      // 🚀 PERFORMANCE OPTIMIZATION: Load basic proposal data first
      const proposal = await prisma.proposal.findUnique({
        where: { id },
        select: {
          // Core proposal fields only - exclude heavy fields initially
          id: true,
          tenantId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          value: true,
          currency: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          customerId: true,
          createdBy: true,
          userStoryTracking: true, // Include wizard data for edit mode
        },
      });

      if (!proposal) {
        logError('Proposal not found', null, {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'GET',
          userId: user.id,
        });
        return Response.json(
          { code: ErrorCodes.DATA.NOT_FOUND, message: 'Proposal not found' },
          { status: 404 }
        );
      }

      // 🚀 PERFORMANCE OPTIMIZATION: Load related data separately and in parallel
      const [customer, sections, products, assignedUsers] = await Promise.all([
        // Customer data (lightweight)
        proposal.customerId
          ? prisma.customer.findUnique({
              where: { id: proposal.customerId },
              select: { id: true, name: true, email: true, industry: true },
            })
          : Promise.resolve(null),

        // Sections data (can be heavy - limit to essential fields)
        prisma.proposalSection.findMany({
          where: { proposalId: id },
          select: { id: true, title: true, order: true }, // Exclude content initially
          orderBy: { order: 'asc' },
        }),

        // Products data (optimized - batch load product details)
        prisma.proposalProduct.findMany({
          where: { proposalId: id },
          select: {
            id: true,
            productId: true,
            sectionId: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        }),

        // Assigned users (lightweight)
        prisma.user.findMany({
          where: {
            assignedProposals: { some: { id } },
          },
          select: { id: true, name: true, email: true },
        }),
      ]);

      // 🚀 PERFORMANCE OPTIMIZATION: Load product details separately if needed
      let productsWithDetails: any[] = [];
      if (products.length > 0) {
        const productIds = products.map(p => p.productId);
        const productDetails = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, category: true },
        });

        // Merge product details efficiently
        const productMap = productDetails.reduce(
          (map, product) => {
            map[product.id] = product;
            return map;
          },
          {} as Record<string, any>
        );

        productsWithDetails = products.map(pp => ({
          ...pp,
          product: productMap[pp.productId] || null,
        }));
      }

      // 🚀 PERFORMANCE OPTIMIZATION: Construct response with optimized data
      const optimizedProposal = {
        ...proposal,
        value:
          proposal.value !== null && proposal.value !== undefined
            ? Number(proposal.value)
            : undefined,
        customer,
        sections,
        products: productsWithDetails,
        assignedTo: assignedUsers,
        metadata: proposal.userStoryTracking || {}, // Include wizard data as metadata
      };

      // Transform for frontend compatibility
      const transformedProposal = {
        ...optimizedProposal,
        title: optimizedProposal.title || 'Untitled Proposal',
        assignedTo:
          optimizedProposal.assignedTo && optimizedProposal.assignedTo.length > 0
            ? optimizedProposal.assignedTo[0].id
            : undefined,
        // Transform products for frontend compatibility
        products: optimizedProposal.products.map(pp => ({
          ...pp,
          unitPrice: pp.unitPrice !== null && pp.unitPrice !== undefined ? Number(pp.unitPrice) : 0,
          discount: pp.discount !== null && pp.discount !== undefined ? Number(pp.discount) : 0,
          total: pp.total !== null && pp.total !== undefined ? Number(pp.total) : 0,
          sectionId: (pp as any).sectionId || null,
          name: pp.product?.name || `Product ${pp.productId}`,
          category: Array.isArray(pp.product?.category)
            ? pp.product.category[0] || 'General'
            : pp.product?.category || 'General',
          configuration: pp.configuration || {},
        })),
      };

      // Reduced logging - only in development
      if (process.env.NODE_ENV === 'development') {
        logInfo('API: Proposal fetched successfully', {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'GET',
          userId: user.id,
        });
      }

      // Validate response against schema
      const validationResult = ProposalSchema.safeParse(transformedProposal);
      if (!validationResult.success) {
        logError('Proposal schema validation failed', validationResult.error, {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'GET',
        });
        const responsePayload = { ok: true, data: transformedProposal };
        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const responsePayload = { ok: true, data: validationResult.data };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to fetch proposal',
        undefined,
        {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'GET',
          userId: user.id,
        }
      );
      throw processedError;
    }
  }
);

// ====================
// PUT /api/proposals/[id] - Update proposal
// ====================

export const PUT = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
    body: WizardProposalUpdateSchema,
  },
  async ({ req, body, user }) => {
    const id = req.url.split('/').pop()?.split('?')[0];

    if (!id) {
      return Response.json(fail('VALIDATION_ERROR', 'Proposal ID is required'), { status: 400 });
    }

    try {
      // Reduced logging - only in development
      if (process.env.NODE_ENV === 'development') {
        logInfo('API: Updating proposal', {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'PUT',
          userId: user.id,
        });
      }

      // Extract wizard-specific fields from the flat payload structure
      const {
        teamData,
        contentData,
        productData,
        sectionData,
        reviewData,
        planType,
        customer,
        customerId,
        changesSummary,
        ...basicFields
      } = body as ProposalRequestBody;

      // Process basic fields with proper type conversion
      const processedBasicFields = {
        ...basicFields,
        value: basicFields.value !== undefined ? Number(basicFields.value) : undefined,
      };

      const updateData: Prisma.ProposalUpdateInput = {
        ...processedBasicFields,
      };

      // Handle customer relationship
      if (customer && customer.id) {
        updateData.customer = {
          connect: { id: customer.id },
        };
      }

      // Convert dueDate string to Date if provided
      if (basicFields.dueDate && typeof basicFields.dueDate === 'string') {
        updateData.dueDate = new Date(basicFields.dueDate);
      }

      // Save complex nested data to userStoryTracking field
      if (teamData || contentData || productData || sectionData || reviewData || planType) {
        updateData.userStoryTracking = {
          teamData: teamData as Prisma.InputJsonValue,
          contentData: contentData as Prisma.InputJsonValue,
          productData: productData as Prisma.InputJsonValue,
          sectionData: sectionData as Prisma.InputJsonValue,
          reviewData: reviewData as Prisma.InputJsonValue,
          planType: planType as Prisma.InputJsonValue,
          changesSummary: changesSummary as Prisma.InputJsonValue,
        };
      }

      // Use ProposalService for basic proposal updates (includes version history)
      const proposalService = new ProposalService();

      // Use transaction for data consistency
      const proposal = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const currentUserId = user.id;

          // 1. Update the proposal using ProposalService (includes version history)
          // Extract only basic fields for ProposalService
          const basicUpdateFields = {
            id,
            title: typeof updateData.title === 'string' ? updateData.title : undefined,
            description:
              typeof updateData.description === 'string' ? updateData.description : undefined,
            priority: typeof updateData.priority === 'string' ? updateData.priority : undefined,
            status: typeof updateData.status === 'string' ? updateData.status : undefined,
            value: typeof updateData.value === 'number' ? updateData.value : undefined,
            dueDate: updateData.dueDate instanceof Date ? updateData.dueDate : undefined,
          };

          // Remove undefined fields but keep id
          const cleanUpdateFields = Object.fromEntries(
            Object.entries(basicUpdateFields).filter(
              ([key, value]) => key === 'id' || value !== undefined
            )
          );

          await proposalService.updateProposal(cleanUpdateFields as any);

          // 2. Update userStoryTracking field if wizard data is provided
          if (updateData.userStoryTracking) {
            await tx.proposal.update({
              where: { id },
              data: {
                userStoryTracking: updateData.userStoryTracking,
              },
            });
          }

          // 3. 🚀 PERFORMANCE OPTIMIZATION: Return lightweight proposal data
          // Avoid heavy JOIN queries that can cause timeouts
          const updatedProposal = await tx.proposal.findUnique({
            where: { id },
            select: {
              id: true,
              tenantId: true,
              title: true,
              description: true,
              status: true,
              priority: true,
              value: true,
              currency: true,
              dueDate: true,
              createdAt: true,
              updatedAt: true,
              customerId: true,
              createdBy: true,
            },
          });

          // 4. Handle product data updates (diff, do not destroy section assignments)
          if (
            productData &&
            typeof productData === 'object' &&
            'products' in productData &&
            Array.isArray((productData as any).products)
          ) {
            const payloadProducts = (productData as any).products as Array<any>;
            const existing = await tx.proposalProduct.findMany({
              where: { proposalId: id },
              select: { id: true },
            });
            const existingIds = new Set(existing.map(e => e.id));

            const toUpdate = payloadProducts.filter(
              p => p.id && !String(p.id).startsWith('temp-') && existingIds.has(p.id)
            );
            const toCreate = payloadProducts.filter(p => !p.id || String(p.id).startsWith('temp-'));
            const keepIds = new Set(toUpdate.map(p => p.id));
            const toDeleteIds = existing.filter(e => !keepIds.has(e.id)).map(e => e.id);

            if (toDeleteIds.length > 0) {
              await tx.proposalProduct.deleteMany({ where: { id: { in: toDeleteIds } } });
            }

            for (const p of toUpdate) {
              const quantity = Math.max(1, Number(p.quantity) || 1);
              const unitPrice = Number(p.unitPrice) || 0;
              const discount = Number(p.discount) || 0;
              const total = Number.isFinite(p.total)
                ? Number(p.total)
                : quantity * unitPrice * (1 - discount / 100);
              await tx.proposalProduct.update({
                where: { id: p.id },
                data: { quantity, unitPrice, discount, total },
              });
            }

            for (const p of toCreate) {
              const productId = p.productId as string;
              const quantity = Math.max(1, Number(p.quantity) || 1);
              const unitPrice = Number(p.unitPrice) || 0;
              const discount = Number(p.discount) || 0;
              const sectionId = p.sectionId || null;
              if (!productId) continue;
              const total = Number.isFinite(p.total)
                ? Number(p.total)
                : quantity * unitPrice * (1 - discount / 100);
              await tx.proposalProduct.create({
                data: {
                  proposalId: id,
                  productId,
                  quantity,
                  unitPrice,
                  discount,
                  total,
                  sectionId,
                },
              });
            }

            // Recalculate proposal total value
            const totalValueResult = (await prisma.$queryRaw(
              Prisma.sql`
                SELECT COALESCE(SUM(total), 0) as totalValue
                FROM proposal_products
                WHERE "proposalId" = ${id}
              `
            )) as Array<{ totalvalue: number }>;

            const newTotalValue = Number(totalValueResult[0]?.totalvalue || 0);

            await tx.proposal.update({
              where: { id },
              data: {
                value: newTotalValue,
              },
            });
          }

          // 5. Handle content section data updates (do not affect PRODUCTS sections from Step 4)
          if (
            sectionData &&
            typeof sectionData === 'object' &&
            'sections' in sectionData &&
            Array.isArray((sectionData as any).sections)
          ) {
            // Delete only non-PRODUCTS sections to preserve Step 4 headers
            await tx.proposalSection.deleteMany({
              where: { proposalId: id, NOT: { type: SectionType.PRODUCTS } },
            });

            // Create new proposal sections
            for (const section of (sectionData as any).sections) {
              if (section.title && section.content) {
                await tx.proposalSection.create({
                  data: {
                    proposalId: id,
                    title: section.title,
                    content: section.content,
                    order: section.order || 0,
                    type: SectionType.TEXT,
                  },
                });
              }
            }
          }

          if (!updatedProposal) {
            throw new Error('Failed to retrieve updated proposal');
          }

          return updatedProposal;
        },
        {
          timeout: 15000,
        }
      );

      // 🚀 PERFORMANCE OPTIMIZATION: Return lightweight response
      // Avoid complex data transformation that can cause timeouts
      const transformedProposal = {
        ...proposal,
        value:
          proposal.value !== null && proposal.value !== undefined
            ? Number(proposal.value)
            : undefined,
        title: proposal.title || 'Untitled Proposal',
        // Note: Full customer, products, sections data available via separate GET request
        customer: null, // Lightweight response - fetch separately if needed
        assignedTo: undefined, // Lightweight response - fetch separately if needed
        products: [], // Lightweight response - fetch separately if needed
        sections: [], // Lightweight response - fetch separately if needed
      };

      // Reduced logging - only in development
      if (process.env.NODE_ENV === 'development') {
        logInfo('API: Proposal updated successfully', {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'PUT',
          userId: user.id,
        });
      }

      const responsePayload = { ok: true, data: transformedProposal };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to update proposal',
        undefined,
        {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'PUT',
          userId: user.id,
        }
      );
      throw processedError;
    }
  }
);

// ====================
// PATCH /api/proposals/[id] - Partial update proposal
// ====================

export const PATCH = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
  },
  async ({ req, body, user }) => {
    const id = req.url.split('/').pop()?.split('?')[0];

    if (!id) {
      return Response.json(fail('VALIDATION_ERROR', 'Proposal ID is required'), { status: 400 });
    }

    try {
      logInfo('Partial proposal update (PATCH)', {
        proposalId: id,
        component: 'IndividualProposalEndpoint',
        operation: 'PATCH',
        userStory: 'US-3.2',
        hypothesis: 'H7',
        userId: user.id,
      });

      // Extract changesSummary for version creation
      const { changesSummary, ...updateData } = body as ProposalRequestBody;

      // Process the update data
      const processedUpdateData: Prisma.ProposalUpdateInput = {
        ...updateData,
      } as Prisma.ProposalUpdateInput;

      // Handle value conversion
      if (processedUpdateData.value !== undefined) {
        processedUpdateData.value = Number(processedUpdateData.value);
      }

      // Handle customer relationship
      if (
        processedUpdateData.customer &&
        typeof processedUpdateData.customer === 'object' &&
        'id' in processedUpdateData.customer
      ) {
        processedUpdateData.customer = {
          connect: { id: (processedUpdateData.customer as any).id },
        };
      }

      // Handle dueDate conversion
      if (processedUpdateData.dueDate && typeof processedUpdateData.dueDate === 'string') {
        processedUpdateData.dueDate = new Date(processedUpdateData.dueDate);
      }

      // Perform the update
      await prisma.proposal.update({
        where: { id },
        data: processedUpdateData,
      });

      // Fetch the complete proposal with all relations for the response
      const updatedProposal = await prisma.proposal.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              industry: true,
            },
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  description: true,
                },
              },
            },
          },
          sections: {
            select: {
              id: true,
              title: true,
              content: true,
              order: true,
            },
          },
        },
      });

      // Create version snapshot
      const lastVersion =
        (
          await prisma.proposalVersion.findFirst({
            where: { proposalId: id },
            orderBy: { version: 'desc' },
          })
        )?.version || 0;

      const nextVersion = lastVersion + 1;

      if (!updatedProposal) {
        throw new Error('Failed to retrieve updated proposal');
      }

      const snapshot = {
        title: updatedProposal.title,
        status: updatedProposal.status,
        priority: updatedProposal.priority,
        value: updatedProposal.value,
        dueDate: updatedProposal.dueDate,
        updatedAt: updatedProposal.updatedAt,
        customerId: updatedProposal.customerId,
        products: updatedProposal.products?.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          total: p.total,
        })),
      };

      await prisma.proposalVersion.create({
        data: {
          proposalId: id,
          version: nextVersion,
          changeType: 'UPDATE',
          changesSummary:
            changesSummary || `Proposal updated: ${Object.keys(updateData).join(', ')}`,
          snapshot: snapshot as Prisma.InputJsonValue,
        },
      });

      if (!updatedProposal) {
        throw new Error('Failed to retrieve updated proposal');
      }

      // Transform response data
      const transformedProposal = {
        ...updatedProposal,
        // ✅ FIX: Convert value from string to number
        value:
          updatedProposal.value !== null && updatedProposal.value !== undefined
            ? Number(updatedProposal.value)
            : undefined,
        customer: updatedProposal.customer
          ? {
              ...updatedProposal.customer,
              email: updatedProposal.customer.email || undefined,
            }
          : undefined,
        products: updatedProposal.products
          ? updatedProposal.products
              .filter(pp => pp.product)
              .map(pp => ({
                ...pp,
                // ✅ FIX: Convert numeric fields from strings to numbers
                unitPrice:
                  pp.unitPrice !== null && pp.unitPrice !== undefined ? Number(pp.unitPrice) : 0,
                discount:
                  pp.discount !== null && pp.discount !== undefined ? Number(pp.discount) : 0,
                total: pp.total !== null && pp.total !== undefined ? Number(pp.total) : 0,
                name: pp.product?.name || `Product ${pp.productId}`,
                // ✅ FIX: Convert category array to string (take first element)
                category: Array.isArray(pp.product?.category)
                  ? pp.product.category[0] || 'General'
                  : pp.product?.category || 'General',
                // ✅ FIX: Convert null configuration to empty object
                configuration: pp.configuration || {},
              }))
          : [],
      };

      logInfo('Proposal partially updated with version creation', {
        proposalId: id,
        component: 'IndividualProposalEndpoint',
        operation: 'PATCH',
        version: nextVersion,
        userId: user.id,
      });

      const responsePayload = { ok: true, data: transformedProposal };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to partially update proposal',
        undefined,
        {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'PATCH',
          userId: user.id,
        }
      );
      throw processedError;
    }
  }
);

// ====================
// DELETE /api/proposals/[id] - Delete proposal
// ====================

export const DELETE = createRoute(
  {
    roles: ['admin', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const id = req.url.split('/').pop()?.split('?')[0];

    if (!id) {
      return Response.json(fail('VALIDATION_ERROR', 'Proposal ID is required'), { status: 400 });
    }

    try {
      logInfo('Deleting proposal', {
        proposalId: id,
        component: 'IndividualProposalEndpoint',
        operation: 'DELETE',
        userStory: 'US-3.2',
        hypothesis: 'H4',
        userId: user.id,
      });

      // Use transaction to ensure all related data is cleaned up
      await prisma.$transaction(async tx => {
        // Delete related records first due to foreign key constraints
        await tx.proposalVersion.deleteMany({
          where: { proposalId: id },
        });

        await tx.proposalProduct.deleteMany({
          where: { proposalId: id },
        });

        await tx.proposalSection.deleteMany({
          where: { proposalId: id },
        });

        // Finally delete the proposal
        await tx.proposal.delete({
          where: { id },
        });
      });

      logInfo('Proposal deleted successfully', {
        proposalId: id,
        component: 'IndividualProposalEndpoint',
        operation: 'DELETE',
        userId: user.id,
      });

      const responsePayload = { ok: true, data: { success: true } };
      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to delete proposal',
        undefined,
        {
          proposalId: id,
          component: 'IndividualProposalEndpoint',
          operation: 'DELETE',
          userId: user.id,
        }
      );
      throw processedError;
    }
  }
);
