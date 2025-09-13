/**
 * Proposal Preview API
 * - GET: fetch proposal with sections and products organized for preview
 */

import { createRoute } from '@/lib/api/route';
import { badRequest, errorHandlingService } from '@/lib/errors';
import { logInfo } from '@/lib/logger';
import { proposalService } from '@/lib/services/proposalService';

function getProposalIdFromUrl(req: Request): string | undefined {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('proposals');
  return idx >= 0 ? parts[idx + 1] : undefined;
}

export const GET = createRoute(
  {
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ req, user }) => {
    const id = getProposalIdFromUrl(req);
    if (!id) {
      return Response.json(badRequest('Proposal ID is required'), { status: 400 });
    }

    try {
      // Fetch proposal with all related data
      const proposal = await proposalService.getProposalWithDetails(id);

      if (!proposal) {
        return Response.json({ ok: false, error: 'Proposal not found' }, { status: 404 });
      }

      // Organize data for preview
      const previewData = {
        company: {
          name: proposal.customer.name,
          industry: undefined, // TODO: Add industry field to customer model
          contactPerson: proposal.customer.contacts?.[0]?.name || undefined,
          contactEmail:
            proposal.customer.contacts?.[0]?.email || proposal.customer.email || undefined,
          contactPhone: undefined, // TODO: Add phone field to customer contacts
        },
        proposal: {
          title: proposal.title,
          description: proposal.description || '',
          dueDate: proposal.dueDate || null,
          priority: proposal.priority || 'MEDIUM',
          rfpReferenceNumber: undefined, // TODO: Add rfpReferenceNumber field to proposal model
        },
        sections: proposal.sections.map(section => {
          // Get products assigned to this section
          const sectionProducts = proposal.products.filter(
            product => product.sectionId === section.id
          );

          const sectionTotal = sectionProducts.reduce((sum, product) => {
            return sum + Number(product.total || 0);
          }, 0);

          return {
            id: section.id,
            title: section.title,
            content: section.content,
            order: section.order,
            products: sectionProducts.map(product => ({
              id: product.id,
              productId: product.productId,
              name: product.product.name,
              sku: product.product.sku,
              quantity: product.quantity || 1,
              unitPrice: Number(product.unitPrice || product.product.price),
              total: Number(product.total || 0),
              category: product.product.category?.[0] || 'General',
              datasheetPath: product.product.datasheetPath,
            })),
            total: sectionTotal,
          };
        }),
        // Products not assigned to any section
        unassignedProducts: proposal.products
          .filter(product => !product.sectionId)
          .map(product => ({
            id: product.id,
            productId: product.productId,
            name: product.product.name,
            sku: product.product.sku,
            quantity: product.quantity || 1,
            unitPrice: Number(product.unitPrice || product.product.price),
            total: Number(product.total || 0),
            category: product.product.category?.[0] || 'General',
            datasheetPath: product.product.datasheetPath,
          })),
        totals: {
          currency: 'USD',
          amount: proposal.products.reduce((sum, product) => {
            return sum + Number(product.total || 0);
          }, 0),
        },
        terms: [], // TODO: Add terms from proposal metadata if needed
      };

      logInfo('proposal_preview_fetched', {
        proposalId: id,
        userId: user.id,
        sectionsCount: previewData.sections.length,
        totalProducts: proposal.products.length,
        totalValue: previewData.totals.amount,
      });

      return Response.json({ ok: true, data: previewData });
    } catch (error) {
      const processed = errorHandlingService.processError(
        error,
        'Failed to fetch proposal preview data',
        undefined,
        { proposalId: id, userId: user.id, route: 'proposal:preview' }
      );
      throw processed;
    }
  }
);
