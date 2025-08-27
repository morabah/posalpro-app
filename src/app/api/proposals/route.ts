/**
 * PosalPro MVP2 - Proposals API Routes (Modern Architecture)
 * Enhanced proposal management with authentication, RBAC, and analytics
 * Component Traceability: US-3.1, US-3.2, H4
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas for modern proposal data
const ProposalQuerySchema = z.object({
  search: z.string().trim().default(''),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().nullable().optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'title', 'status', 'priority', 'value'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z
    .enum([
      'DRAFT',
      'SUBMITTED',
      'IN_REVIEW',
      'PENDING_APPROVAL',
      'APPROVED',
      'REJECTED',
      'ACCEPTED',
      'DECLINED',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  customerId: z.string().optional(),
  assignedTo: z.string().optional(),
});

const ProposalBasicInfoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().optional(),
      industry: z.string().optional(),
    })
    .optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  value: z.number().min(0).optional().default(0),
  currency: z.string().default('USD'),
  projectType: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const ProposalTeamDataSchema = z.object({
  teamLead: z.string().min(1, 'Team lead is required'),
  salesRepresentative: z.string().min(1, 'Sales representative is required'),
  subjectMatterExperts: z.record(z.string()).default({}),
  executiveReviewers: z.array(z.string()).default([]),
  teamMembers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        role: z.string(),
        email: z.string().optional(),
      })
    )
    .optional(),
});

const ProposalContentDataSchema = z.object({
  selectedTemplates: z.array(z.string()).default([]),
  customContent: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        type: z.enum(['text', 'image', 'table']).default('text'),
      })
    )
    .default([]),
  contentLibrary: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.string(),
        isSelected: z.boolean(),
      })
    )
    .default([]),
});

const ProposalProductDataSchema = z.object({
  products: z
    .array(
      z.object({
        id: z.string(),
        productId: z.string(),
        name: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        total: z.number().positive(),
        discount: z.number().default(0),
        category: z.string(),
        configuration: z.record(z.unknown()).optional(),
      })
    )
    .default([]),
  totalValue: z.number().default(0),
  searchQuery: z.string().optional(),
  selectedCategory: z.string().optional(),
});

const ProposalSectionDataSchema = z.object({
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        order: z.number().positive(),
        type: z.enum(['TEXT', 'IMAGE', 'TABLE', 'CHART']).default('TEXT'),
        isRequired: z.boolean().default(false),
      })
    )
    .default([]),
  sectionTemplates: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        category: z.string(),
      })
    )
    .default([]),
});

const ProposalCreateSchema = z.object({
  basicInfo: ProposalBasicInfoSchema,
  teamData: ProposalTeamDataSchema,
  contentData: ProposalContentDataSchema,
  productData: ProposalProductDataSchema,
  sectionData: ProposalSectionDataSchema,
});

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

      logInfo('Proposals fetched successfully', {
        component: 'ProposalAPI',
        operation: 'GET',
        userId: user.id,
        count: items.length,
        hasNextPage,
      });

      return Response.json(
        ok({
          items,
          nextCursor,
        })
      );
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

      logInfo('Proposal created successfully', {
        component: 'ProposalAPI',
        operation: 'POST',
        userId: user.id,
        proposalId: proposal.id,
        proposalTitle: proposal.title,
      });

      return Response.json(ok(proposal), { status: 201 });
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
