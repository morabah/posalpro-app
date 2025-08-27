/**
 * Individual Proposal API Routes - Modern Architecture
 * User Story: US-3.1 (Proposal Creation), US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination), H7 (Deadline Management)
 */

import { WizardProposalUpdateSchema } from '@/features/proposals/schemas';
import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
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
      return Response.json({ error: 'Proposal ID is required' }, { status: 400 });
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
        throw new Error('Proposal not found');
      }

      logInfo('Proposal fetched successfully', {
        component: 'ProposalAPI',
        operation: 'GET',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });

      return Response.json(ok(proposal));
    } catch (error) {
      logError('Failed to fetch proposal', error, {
        component: 'ProposalAPI',
        operation: 'GET',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      });
      throw error; // createRoute handles errorToJson automatically
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
      return Response.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    // ✅ ADDED: Debug logging to see what's being received
    logInfo('Received proposal update request', {
      component: 'ProposalAPI',
      operation: 'PUT',
      proposalId: id,
      bodyKeys: Object.keys(body || {}),
      hasTeamData: !!(body as any)?.teamData,
      hasContentData: !!(body as any)?.contentData,
      hasProductData: !!(body as any)?.productData,
      hasSectionData: !!(body as any)?.sectionData,
      hasReviewData: !!(body as any)?.reviewData,
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
      if (teamData || contentData || productData || sectionData || reviewData) {
        updateData.metadata = {
          teamData,
          contentData,
          productData,
          sectionData,
          reviewData,
          submittedAt: new Date().toISOString(),
          wizardVersion: 'modern',
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

      const proposal = await prisma.proposal.update({
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

      logInfo('Proposal updated successfully', {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      return Response.json(ok(proposal));
    } catch (error) {
      logError('Failed to update proposal', error, {
        component: 'ProposalAPI',
        operation: 'PUT',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
      throw error; // createRoute handles errorToJson automatically
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
      return Response.json({ error: 'Proposal ID is required' }, { status: 400 });
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
      logError('Failed to delete proposal', error, {
        component: 'ProposalAPI',
        operation: 'DELETE',
        proposalId: id,
        userId: user.id,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });
      throw error; // createRoute handles errorToJson automatically
    }
  }
);
