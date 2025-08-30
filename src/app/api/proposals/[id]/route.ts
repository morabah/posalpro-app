/**
 * Individual Proposal API Routes - Modern Architecture
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { ProposalSchema, WizardProposalUpdateSchema } from '@/features/proposals/schemas';
import { fail, ok } from '@/lib/api/response';
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
        return Response.json(ok(transformedProposal));
      }

      return Response.json(ok(validationResult.data));
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

      const updateData: any = {
        ...basicFields,
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

      // ✅ FIXED: Use transaction to ensure data consistency
      const proposal = await prisma.$transaction(async tx => {
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
        return Response.json(ok(transformedProposal));
      }

      return Response.json(ok(validationResult.data));
    } catch (error) {
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

      return Response.json(ok({ success: true }));
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
