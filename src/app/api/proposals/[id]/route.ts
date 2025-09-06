/**
 * Individual Proposal API Routes - Modern Architecture
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { ProposalSchema, WizardProposalUpdateSchema } from '@/features/proposals/schemas';
import { fail } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { ErrorCodes, errorHandlingService } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { Prisma } from '@prisma/client';

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

      const proposal = await prisma.proposal.findUnique({
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
          sections: {
            select: {
              id: true,
              title: true,
              content: true,
              order: true,
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
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
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

      // Transform null values to appropriate defaults before validation
      const transformedProposal = {
        ...proposal,
        // ✅ FIX: Convert value from string to number
        value:
          proposal.value !== null && proposal.value !== undefined
            ? Number(proposal.value)
            : undefined,
        customer: proposal.customer
          ? {
              ...proposal.customer,
              email: proposal.customer.email || undefined,
            }
          : undefined,
        title: proposal.title || 'Untitled Proposal',
        // ✅ FIX: Handle assignedTo array and convert to string (take first user)
        assignedTo:
          proposal.assignedTo && proposal.assignedTo.length > 0
            ? proposal.assignedTo[0].id
            : undefined,
        products: proposal.products
          ? proposal.products
              .filter((pp: any) => pp.product) // Remove orphaned ProposalProduct records
              .map((pp: any) => ({
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
      } = body as any;

      // Process basic fields with proper type conversion
      const processedBasicFields = {
        ...basicFields,
        value: basicFields.value !== undefined ? Number(basicFields.value) : undefined,
      };

      const updateData: any = {
        ...processedBasicFields,
      };

      // Handle customer relationship
      if (customer && customer.id) {
        updateData.customer = {
          connect: { id: customer.id },
        };
      }

      // Convert dueDate string to Date if provided
      if (basicFields.dueDate) {
        updateData.dueDate = new Date(basicFields.dueDate);
      }

      // Save complex nested data to userStoryTracking field
      if (teamData || contentData || productData || sectionData || reviewData || planType) {
        updateData.userStoryTracking = {
          teamData,
          contentData,
          productData,
          sectionData,
          reviewData,
          planType,
          changesSummary,
        };
      }

      // Use transaction for data consistency
      const proposal = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const currentUserId = user.id;

          // 1. Update the proposal
          await tx.proposal.update({
            where: { id },
            data: updateData,
          });

          // 2. Fetch the complete proposal with all relations for the response
          const updatedProposal = await tx.proposal.findUnique({
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
              sections: {
                select: {
                  id: true,
                  title: true,
                  content: true,
                  order: true,
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
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          });

          // 3. Handle product data updates
          if (productData && productData.products && Array.isArray(productData.products)) {
            // Delete existing proposal products
            await tx.proposalProduct.deleteMany({
              where: { proposalId: id },
            });

            // Create new proposal products
            for (const product of productData.products) {
              const productId = product.productId;
              const quantity = Number(product.quantity) || 1;
              const unitPrice = Number(product.unitPrice) || 0;
              const discount = Number(product.discount) || 0;

              if (productId && quantity > 0 && unitPrice >= 0) {
                const calculatedTotal = quantity * unitPrice * (1 - discount / 100);
                const total = Number(product.total) || calculatedTotal;

                await tx.proposalProduct.create({
                  data: {
                    proposalId: id,
                    productId,
                    quantity,
                    unitPrice,
                    discount,
                    total,
                  },
                });
              }
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

          // 3. Handle section data updates
          if (sectionData && sectionData.sections && Array.isArray(sectionData.sections)) {
            // Delete existing proposal sections
            await tx.proposalSection.deleteMany({
              where: { proposalId: id },
            });

            // Create new proposal sections
            for (const section of sectionData.sections) {
              if (section.title && section.content) {
                await tx.proposalSection.create({
                  data: {
                    proposalId: id,
                    title: section.title,
                    content: section.content,
                    order: section.order || 0,
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

      // Transform response data
      const transformedProposal = {
        ...proposal,
        // ✅ FIX: Convert value from string to number
        value:
          proposal.value !== null && proposal.value !== undefined
            ? Number(proposal.value)
            : undefined,
        customer: proposal.customer
          ? {
              ...proposal.customer,
              email: proposal.customer.email || undefined,
            }
          : undefined,
        title: proposal.title || 'Untitled Proposal',
        // ✅ FIX: Handle assignedTo array and convert to string (take first user)
        assignedTo:
          proposal.assignedTo && proposal.assignedTo.length > 0
            ? proposal.assignedTo[0].id
            : undefined,
        products: proposal.products
          ? proposal.products
              .filter((pp: any) => pp.product)
              .map((pp: any) => ({
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
      const { changesSummary, ...updateData } = body as any;

      // Process the update data
      const processedUpdateData: any = {
        ...updateData,
      };

      // Handle value conversion
      if (processedUpdateData.value !== undefined) {
        processedUpdateData.value = Number(processedUpdateData.value);
      }

      // Handle customer relationship
      if (processedUpdateData.customer && processedUpdateData.customer.id) {
        processedUpdateData.customer = {
          connect: { id: processedUpdateData.customer.id },
        };
      }

      // Handle dueDate conversion
      if (processedUpdateData.dueDate) {
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
        products: updatedProposal.products?.map((p: any) => ({
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
          snapshot: snapshot as any,
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
              .filter((pp: any) => pp.product)
              .map((pp: any) => ({
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
      await prisma.$transaction(async (tx: any) => {
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
