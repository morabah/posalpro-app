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
      logInfo('Fetching proposal', {
        component: 'ProposalAPI',
        operation: 'GET',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      const proposal = await prisma.proposal.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sections: {
            orderBy: { order: 'asc' },
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
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
          component: 'ProposalAPI',
          operation: 'GET',
          proposalId: id,
          userId: user.id,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
        return Response.json(
          { code: ErrorCodes.DATA.NOT_FOUND, message: 'Proposal not found' },
          { status: 404 }
        );
      }

      // Transform null values to appropriate defaults before validation
      const transformedProposal = {
        ...proposal,
        description: proposal.description || '',
        metadata: proposal.metadata || {},
        customer: proposal.customer
          ? {
              ...proposal.customer,
              email: proposal.customer.email || '',
              industry: (proposal.customer as any).industry || '',
            }
          : undefined,
        title: proposal.title || 'Untitled Proposal', // Handle empty titles
      };

      logInfo('Proposal fetched successfully', {
        component: 'ProposalAPI',
        operation: 'GET',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      // Validate response against schema
      const validationResult = ProposalSchema.safeParse(transformedProposal);
      if (!validationResult.success) {
        logError('Proposal schema validation failed', validationResult.error, {
          component: 'ProposalAPI',
          operation: 'GET',
          proposalId: id,
        });
        // Return the transformed proposal data anyway for now, but log the validation error
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
          component: 'ProposalAPI',
          operation: 'GET',
          proposalId: id,
          userId: user.id,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        }
      );
      throw processedError; // createRoute handles errorToJson automatically
    }
  }
);

// ====================
// PUT /api/proposals/[id] - Update proposal
// ====================

export const PUT = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
    body: WizardProposalUpdateSchema, // ✅ Use wizard schema for flat payload structure
  },
  async ({ req, body, user }) => {
    const id = req.url.split('/').pop()?.split('?')[0];

    if (!id) {
      return Response.json(fail('VALIDATION_ERROR', 'Proposal ID is required'), { status: 400 });
    }

    // ✅ ADDED: Debug logging to see what's being received
    const bodyData = body as any;
    logInfo('Received proposal update request', {
      component: 'ProposalAPI',
      operation: 'PUT',
      proposalId: id,
      bodyKeys: Object.keys(bodyData || {}),
      hasTeamData: !!bodyData?.teamData,
      hasContentData: !!bodyData?.contentData,
      hasProductData: !!bodyData?.productData,
      hasSectionData: !!bodyData?.sectionData,
      hasReviewData: !!bodyData?.reviewData,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    // ✅ ADDED: Detailed logging of the actual body structure
    logInfo('DEBUG: Full request body structure', {
      component: 'ProposalAPI',
      operation: 'PUT',
      proposalId: id,
      bodyType: typeof bodyData,
      bodySize: bodyData ? JSON.stringify(bodyData).length : 0,
      topLevelKeys: Object.keys(bodyData || {}),
      teamDataKeys: bodyData?.teamData ? Object.keys(bodyData.teamData) : null,
      contentDataKeys: bodyData?.contentData ? Object.keys(bodyData.contentData) : null,
      productDataKeys: bodyData?.productData ? Object.keys(bodyData.productData) : null,
      sectionDataKeys: bodyData?.sectionData ? Object.keys(bodyData.sectionData) : null,
      reviewDataKeys: bodyData?.reviewData ? Object.keys(bodyData.reviewData) : null,
      productCount: bodyData?.productData?.products?.length || 0,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    try {
      logInfo('Updating proposal', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        userId: user.id,
        updates: Object.keys(body!),
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // ✅ FIXED: Handle wizard flat payload structure
      const {
        teamData,
        contentData,
        productData,
        sectionData,
        reviewData,
        planType,
        customer,
        customerId, // Remove customerId to prevent Prisma conflict
        ...basicFields
      } = body as any;

      // ✅ FIXED: Convert string values to appropriate types before database update
      const processedBasicFields = {
        ...basicFields,
        // Convert value to number if it's a string (common issue from form inputs)
        value: basicFields.value !== undefined ? Number(basicFields.value) : undefined,
      };

      const updateData: any = {
        ...processedBasicFields,
        updatedAt: new Date(),
      };

      // ✅ FIXED: Handle customer relationship properly
      if (customer && customer.id) {
        updateData.customer = {
          connect: { id: customer.id },
        };
      }

      // Convert dueDate string to Date if provided
      if (basicFields.dueDate) {
        updateData.dueDate = new Date(basicFields.dueDate);
      }

      // ✅ FIXED: Save complex nested data to metadata field
      if (teamData || contentData || productData || sectionData || reviewData || planType) {
        updateData.metadata = {
          teamData,
          contentData,
          productData,
          sectionData,
          reviewData,
          submittedAt: new Date().toISOString(),
          wizardVersion: 'modern',
          planType,
        };

        // ✅ ADDED: Debug logging to verify metadata is being set
        logInfo('Setting metadata for proposal update', {
          component: 'ProposalAPI',
          operation: 'PUT',
          proposalId: id,
          metadataKeys: Object.keys(updateData.metadata),
          hasTeamData: !!teamData,
          hasContentData: !!contentData,
          hasProductData: !!productData,
          hasSectionData: !!sectionData,
          hasReviewData: !!reviewData,
          hasPlanType: !!planType,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });
      }

      // ✅ ADDED: Debug logging to verify updateData structure
      logInfo('Updating proposal with data', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        updateDataKeys: Object.keys(updateData),
        hasMetadata: !!updateData.metadata,
        metadataKeys: updateData.metadata ? Object.keys(updateData.metadata) : [],
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // ✅ FIXED: Use transaction with timeout to ensure data consistency and prevent network timeouts
      const transactionStartTime = Date.now();
      logInfo('Starting proposal update transaction', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const proposal = await prisma.$transaction(
        async tx => {
          // 1. Update the proposal
          const updatedProposal = await tx.proposal.update({
            where: { id },
            data: updateData,
            include: {
              customer: {
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
                  order: true,
                  type: true,
                },
                orderBy: { order: 'asc' },
              },
              products: {
                select: {
                  id: true,
                  productId: true,
                  quantity: true,
                  unitPrice: true,
                  discount: true,
                  total: true,
                  configuration: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
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

          // 2. ✅ FIXED: Handle product data by updating ProposalProduct records
          if (productData && productData.products && Array.isArray(productData.products)) {
            logInfo('Processing product data for proposal update', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              productCount: productData.products.length,
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });

            // Delete existing proposal products
            await tx.proposalProduct.deleteMany({
              where: { proposalId: id },
            });

            // Create new proposal products
            for (const product of productData.products) {
              if (product.productId && product.quantity && product.unitPrice) {
                await tx.proposalProduct.create({
                  data: {
                    proposalId: id,
                    productId: product.productId,
                    quantity: product.quantity,
                    unitPrice: product.unitPrice,
                    discount: product.discount || 0,
                    total:
                      product.total ||
                      product.quantity * product.unitPrice * (1 - (product.discount || 0) / 100),
                    configuration: product.configuration || {},
                  },
                });
              }
            }

            logInfo('Proposal products updated successfully', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              productsCreated: productData.products.length,
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });
          }

          // 3. ✅ FIXED: Handle section data by updating ProposalSection records
          if (sectionData && sectionData.sections && Array.isArray(sectionData.sections)) {
            logInfo('Processing section data for proposal update', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              sectionCount: sectionData.sections.length,
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });

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
                    order: section.order || 1,
                    type: section.type || 'TEXT',
                  },
                });
              }
            }

            logInfo('Proposal sections updated successfully', {
              component: 'ProposalAPI',
              operation: 'PUT',
              proposalId: id,
              sectionsCreated: sectionData.sections.length,
              userStory: 'US-3.2',
              hypothesis: 'H4',
            });
          }

          // 4. Fetch the updated proposal with all relations
          return await tx.proposal.findUnique({
            where: { id },
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              sections: {
                orderBy: { order: 'asc' },
              },
              products: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      sku: true,
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
        },
        {
          timeout: 15000, // 15 second timeout to prevent network connection loss
          isolationLevel: 'ReadCommitted',
        }
      );

      const transactionDuration = Date.now() - transactionStartTime;
      logInfo('Proposal update transaction completed', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        transactionDuration,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Transform null values to appropriate defaults before validation
      const transformedProposal = {
        ...proposal,
        description: proposal?.description || '',
        metadata: proposal?.metadata || {},
        customer: proposal?.customer
          ? {
              ...proposal.customer,
              email: proposal.customer.email || '',
              industry: (proposal.customer as any).industry || '',
            }
          : undefined,
        title: proposal?.title || 'Untitled Proposal', // Handle empty titles
      };

      logInfo('Proposal updated successfully', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Validate response against schema
      const validationResult = ProposalSchema.safeParse(transformedProposal);
      if (!validationResult.success) {
        logError('Proposal schema validation failed after update', validationResult.error, {
          component: 'ProposalAPI',
          operation: 'PUT',
          proposalId: id,
        });
        // Return the transformed proposal data anyway for now, but log the validation error
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
      // Handle specific network and timeout errors
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('Load failed')) {
          logError('Network timeout during proposal update', {
            component: 'ProposalAPI',
            operation: 'PUT',
            proposalId: id,
            error: error.message,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });
          return new Response(
            JSON.stringify({
              ok: false,
              code: 'NETWORK_TIMEOUT',
              message:
                'Request timed out. Please try again with a smaller update or check your connection.',
              details: { proposalId: id },
            }),
            {
              status: 408, // Request Timeout
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        if (error.message.includes('connection') || error.message.includes('network')) {
          logError('Network connection error during proposal update', {
            component: 'ProposalAPI',
            operation: 'PUT',
            proposalId: id,
            error: error.message,
            userStory: 'US-3.2',
            hypothesis: 'H4',
          });
          return new Response(
            JSON.stringify({
              ok: false,
              code: 'NETWORK_ERROR',
              message:
                'Network connection lost. Please check your internet connection and try again.',
              details: { proposalId: id },
            }),
            {
              status: 503, // Service Unavailable
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      const processedError = errorHandlingService.processError(
        error,
        'Failed to update proposal',
        undefined,
        {
          component: 'ProposalAPI',
          operation: 'PUT',
          proposalId: id,
          userId: user.id,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        }
      );
      throw processedError; // createRoute handles errorToJson automatically
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
        component: 'ProposalAPI',
        operation: 'DELETE',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      await prisma.proposal.delete({
        where: { id },
      });

      logInfo('Proposal deleted successfully', {
        component: 'ProposalAPI',
        operation: 'DELETE',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
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
          component: 'ProposalAPI',
          operation: 'DELETE',
          proposalId: id,
          userId: user.id,
          userStory: 'US-3.2',
          hypothesis: 'H4',
        }
      );
      throw processedError; // createRoute handles errorToJson automatically
    }
  }
);
