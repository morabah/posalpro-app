/**
 * PosalPro MVP2 - Proposals API Routes (Modern Architecture)
 * Enhanced proposal management with authentication, RBAC, and analytics
 * Component Traceability: US-3.1, US-3.2, H4
 *
 * ✅ SCHEMA CONSOLIDATION: All schemas imported from src/features/proposals/schemas.ts
 * ✅ REMOVED DUPLICATION: No inline schema definitions
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';

// Import consolidated schemas from feature folder
import {
  ProposalCreateSchema,
  ProposalListSchema,
  ProposalQuerySchema,
  ProposalSchema,
} from '@/features/proposals/schemas';

// GET /api/proposals - Retrieve proposals with filtering and cursor pagination
export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'manager', 'viewer', 'System Administrator', 'Administrator'],
    query: ProposalQuerySchema,
  },
  async ({ query, user }) => {
    try {
      logInfo('Fetching proposals', {
        component: 'ProposalAPI',
        operation: 'GET',
        userId: user.id,
        params: query,
      });

      // Build where clause
      const where: Record<string, unknown> = {};

      if (query!.search) {
        where.OR = [
          { title: { contains: query!.search, mode: 'insensitive' } },
          { description: { contains: query!.search, mode: 'insensitive' } },
          { customer: { name: { contains: query!.search, mode: 'insensitive' } } },
        ];
      }

      if (query!.status) {
        where.status = query!.status;
      }

      if (query!.priority) {
        where.priority = query!.priority;
      }

      if (query!.customerId) {
        where.customerId = query!.customerId;
      }

      if (query!.assignedTo) {
        where.teamAssignments = {
          path: ['teamLead'],
          equals: query!.assignedTo,
        };
      }

      // Deadline filters
      if (query!.dueBefore || query!.dueAfter) {
        where.dueDate = {} as any;
        if (query!.dueBefore) (where.dueDate as any).lte = new Date(query!.dueBefore);
        if (query!.dueAfter) (where.dueDate as any).gte = new Date(query!.dueAfter);
      }

      // Open-only filter (exclude final states)
      if (query!.openOnly) {
        where.status = {
          notIn: ['APPROVED', 'REJECTED', 'ACCEPTED', 'DECLINED'],
        } as any;
      }

      // Build order by
      const orderBy: Array<Record<string, string>> = [{ [query!.sortBy]: query!.sortOrder }];

      // Add secondary sort for cursor pagination
      if (query!.sortBy !== 'createdAt') {
        orderBy.push({ id: query!.sortOrder });
      }

      // Execute query with cursor pagination
      const rows = await prisma.proposal.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          customerId: true,
          dueDate: true,
          priority: true,
          value: true,
          currency: true,
          status: true,
          tags: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              industry: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy,
        take: query!.limit + 1, // Take one extra to check if there are more
        ...(query!.cursor ? { cursor: { id: query!.cursor }, skip: 1 } : {}),
      });

      // Determine if there are more pages
      const hasNextPage = rows.length > query!.limit;
      const nextCursor = hasNextPage ? rows[query!.limit - 1].id : null;

      // Remove the extra item if it exists
      const items = hasNextPage ? rows.slice(0, query!.limit) : rows;

      // Transform null values to appropriate defaults before validation
      const transformedItems = items.map(item => ({
        ...item,
        description: item.description || '',
        metadata: item.metadata || {},
        customer: item.customer
          ? {
              ...item.customer,
              email: item.customer.email || '',
              industry: item.customer.industry || '',
            }
          : undefined,
        title: item.title || 'Untitled Proposal', // Handle empty titles
      }));

      logInfo('Proposals fetched successfully', {
        component: 'ProposalAPI',
        operation: 'GET',
        userId: user.id,
        count: items.length,
        hasNextPage,
      });

      // Validate response against schema
      const validatedResponse = ProposalListSchema.parse({
        items: transformedItems,
        nextCursor,
      });

      return Response.json(ok(validatedResponse));
    } catch (error) {
      logError('Failed to fetch proposals', {
        component: 'ProposalAPI',
        operation: 'GET',
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);

// POST /api/proposals - Create a new proposal
export const POST = createRoute(
  {
    roles: ['admin', 'sales', 'manager', 'System Administrator', 'Administrator'],
    body: ProposalCreateSchema,
  },
  async ({ body, user }) => {
    try {
      logInfo('Creating proposal', {
        component: 'ProposalAPI',
        operation: 'POST',
        userId: user.id,
        proposalTitle: body!.basicInfo.title,
        customerId: body!.basicInfo.customerId,
      });

      // Calculate total value from products
      const totalValue = body!.productData.products.reduce(
        (sum, product) => sum + product.total,
        0
      );

      // Determine the final proposal value:
      // 1. If products are selected, use the sum of product totals
      // 2. If no products, use the estimated value from step 1
      // 3. If neither, use 0
      const finalValue =
        body!.productData.products.length > 0 ? totalValue : body!.basicInfo.value || 0;

      // Create proposal with transaction support for complex operations
      const proposal = await prisma.$transaction(async tx => {
        // Create the main proposal
        const proposal = await tx.proposal.create({
          data: {
            title: body!.basicInfo.title,
            description: body!.basicInfo.description,
            customerId: body!.basicInfo.customerId,
            dueDate: body!.basicInfo.dueDate ? new Date(body!.basicInfo.dueDate) : null,
            priority: body!.basicInfo.priority,
            value: finalValue,
            currency: body!.basicInfo.currency,
            status: 'DRAFT',
            tags: body!.basicInfo.tags || [],
            createdBy: user.id,
            metadata: {
              projectType: body!.basicInfo.projectType,
              teamData: body!.teamData,
              contentData: body!.contentData,
              productData: JSON.parse(JSON.stringify(body!.productData)),
              sectionData: body!.sectionData,
              wizardVersion: 'modern',
              submittedAt: new Date().toISOString(),
              planType: body!.planType,
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
            customerId: true,
            dueDate: true,
            priority: true,
            value: true,
            currency: true,
            status: true,
            tags: true,
            metadata: true,
            createdAt: true,
            updatedAt: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                industry: true,
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Update proposal with team assignments if team data is provided
        if (body!.teamData.teamLead || body!.teamData.salesRepresentative) {
          const assignedUserIds = [];
          if (body!.teamData.teamLead) assignedUserIds.push(body!.teamData.teamLead);
          if (body!.teamData.salesRepresentative)
            assignedUserIds.push(body!.teamData.salesRepresentative);

          await tx.proposal.update({
            where: { id: proposal.id },
            data: {
              assignedTo: {
                connect: assignedUserIds.map(userId => ({ id: userId })),
              },
            },
          });
        }

        // Create product assignments if products are provided
        if (body!.productData.products.length > 0) {
          await tx.proposalProduct.createMany({
            data: body!.productData.products.map(product => ({
              proposalId: proposal.id,
              productId: product.productId,
              quantity: product.quantity,
              unitPrice: product.unitPrice,
              total: product.total,
              discount: product.discount,
            })),
          });
        }

        return proposal;
      });

      // Transform null values to appropriate defaults before validation
      const transformedProposal = {
        ...proposal,
        description: proposal.description || '',
        metadata: proposal.metadata || {},
        customer: proposal.customer
          ? {
              ...proposal.customer,
              email: proposal.customer.email || '',
              industry: proposal.customer.industry || '',
            }
          : undefined,
        title: proposal.title || 'Untitled Proposal', // Handle empty titles
      };

      logInfo('Proposal created successfully', {
        component: 'ProposalAPI',
        operation: 'POST',
        userId: user.id,
        proposalId: proposal.id,
        proposalTitle: proposal.title,
      });

      // Validate response against schema
      const validationResult = ProposalSchema.safeParse(transformedProposal);
      if (!validationResult.success) {
        logError('Proposal schema validation failed after creation', validationResult.error, {
          component: 'ProposalAPI',
          operation: 'POST',
          proposalId: proposal.id,
        });
        // Return the transformed proposal data anyway for now, but log the validation error
        return Response.json(ok(transformedProposal), { status: 201 });
      }

      return Response.json(ok(validationResult.data), { status: 201 });
    } catch (error) {
      logError('Failed to create proposal', {
        component: 'ProposalAPI',
        operation: 'POST',
        userId: user.id,
        proposalTitle: body!.basicInfo.title,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
