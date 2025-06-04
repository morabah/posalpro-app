/**
 * PosalPro MVP2 - Proposals API Route
 * Production-ready proposal management with database integration
 */

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const ProposalCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  customerId: z.string().cuid('Invalid customer ID'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  value: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  products: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().positive().default(1),
        unitPrice: z.number().positive(),
        discount: z.number().min(0).max(100).default(0),
      })
    )
    .optional(),
  sections: z
    .array(
      z.object({
        title: z.string().min(1),
        content: z.string(),
        type: z.enum(['TEXT', 'PRODUCTS', 'TERMS', 'PRICING', 'CUSTOM']).default('TEXT'),
        order: z.number().int().positive(),
      })
    )
    .optional(),
});

const ProposalUpdateSchema = ProposalCreateSchema.partial().extend({
  id: z.string().cuid('Invalid proposal ID'),
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
});

const ProposalQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
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
  customerId: z.string().cuid().optional(),
  createdBy: z.string().cuid().optional(),
  search: z.string().max(100).optional(),
  sortBy: z
    .enum(['title', 'createdAt', 'updatedAt', 'dueDate', 'value', 'priority'])
    .default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Helper function to check user permissions
async function checkUserPermissions(userId: string, action: string, scope: string = 'ALL') {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const hasPermission = userRoles.some(userRole =>
    userRole.role.permissions.some(
      rolePermission =>
        rolePermission.permission.resource === 'proposals' &&
        rolePermission.permission.action === action &&
        (rolePermission.permission.scope === 'ALL' || rolePermission.permission.scope === scope)
    )
  );

  return hasPermission;
}

// GET /api/proposals - List proposals with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // Check read permissions
    const canRead = await checkUserPermissions(session.user.id, 'read');
    if (!canRead) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'PERMISSION_DENIED' },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const query = ProposalQuerySchema.parse(queryParams);

    // Build where clause
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.createdBy) {
      where.createdBy = query.createdBy;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Fetch proposals with relations
    const [proposals, totalCount] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              industry: true,
              tier: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  price: true,
                  currency: true,
                },
              },
            },
          },
          sections: {
            select: {
              id: true,
              title: true,
              type: true,
              order: true,
              validationStatus: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              sections: true,
              products: true,
              approvals: true,
              validationIssues: true,
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take: query.limit,
      }),
      prisma.proposal.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / query.limit);
    const hasNextPage = query.page < totalPages;
    const hasPreviousPage = query.page > 1;

    return NextResponse.json({
      proposals,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      filters: {
        status: query.status,
        priority: query.priority,
        customerId: query.customerId,
        search: query.search,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Proposals GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST /api/proposals - Create new proposal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // Check create permissions
    const canCreate = await checkUserPermissions(session.user.id, 'create');
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'PERMISSION_DENIED' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const data = ProposalCreateSchema.parse(body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found', code: 'CUSTOMER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Calculate total value from products if provided
    let calculatedValue = data.value;
    if (data.products && data.products.length > 0) {
      calculatedValue = data.products.reduce((total, product) => {
        const discountAmount = (product.unitPrice * product.discount) / 100;
        const discountedPrice = product.unitPrice - discountAmount;
        return total + discountedPrice * product.quantity;
      }, 0);
    }

    // Create proposal with transaction
    const proposal = await prisma.$transaction(async tx => {
      // Create the proposal
      const newProposal = await tx.proposal.create({
        data: {
          title: data.title,
          description: data.description,
          customerId: data.customerId,
          createdBy: session.user.id,
          priority: data.priority,
          value: calculatedValue,
          currency: data.currency,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          metadata: {
            createdVia: 'api',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        },
      });

      // Add products if provided
      if (data.products && data.products.length > 0) {
        await tx.proposalProduct.createMany({
          data: data.products.map(product => ({
            proposalId: newProposal.id,
            productId: product.productId,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            discount: product.discount,
            total:
              (product.unitPrice - (product.unitPrice * product.discount) / 100) * product.quantity,
          })),
        });
      }

      // Add sections if provided
      if (data.sections && data.sections.length > 0) {
        await tx.proposalSection.createMany({
          data: data.sections.map(section => ({
            proposalId: newProposal.id,
            title: section.title,
            content: section.content,
            type: section.type,
            order: section.order,
          })),
        });
      }

      return newProposal;
    });

    // Fetch the complete proposal with relations
    const completeProposal = await prisma.proposal.findUnique({
      where: { id: proposal.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            industry: true,
            tier: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                price: true,
                currency: true,
              },
            },
          },
        },
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(
      {
        proposal: completeProposal,
        message: 'Proposal created successfully',
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Proposals POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PUT /api/proposals - Update proposal (bulk updates)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const data = ProposalUpdateSchema.parse(body);

    // Check if proposal exists and user has permission
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: data.id },
      include: {
        creator: true,
      },
    });

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found', code: 'PROPOSAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check update permissions
    const canUpdateAll = await checkUserPermissions(session.user.id, 'update', 'ALL');
    const canUpdateOwn = await checkUserPermissions(session.user.id, 'update', 'OWN');

    if (!canUpdateAll && !(canUpdateOwn && existingProposal.createdBy === session.user.id)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: 'PERMISSION_DENIED' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);

    // Update proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id: data.id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            industry: true,
            tier: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                price: true,
                currency: true,
              },
            },
          },
        },
        sections: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      proposal: updatedProposal,
      message: 'Proposal updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Proposals PUT error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
