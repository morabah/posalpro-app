/**
 * PosalPro MVP2 - Proposals API Routes
 * Handles proposal CRUD operations using service functions
 * Based on PROPOSAL_CREATION_SCREEN.md and proposal management requirements
 */

import { proposalService } from '@/lib/services';
import { createProposalSchema } from '@/lib/validation/schemas/proposal';
import { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

function createErrorResponse(error: string, details?: any, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    },
    { status }
  );
}

/**
 * GET /api/proposals - List proposals with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status');
    const priorityParam = searchParams.get('priority');
    const customerId = searchParams.get('customerId') || undefined;
    const createdBy = searchParams.get('createdBy') || undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;

    // Build filters object
    const filters: any = {};

    if (search) filters.search = search;
    if (customerId) filters.customerId = customerId;
    if (createdBy) filters.createdBy = createdBy;
    if (assignedTo) filters.assignedTo = assignedTo;

    if (statusParam) {
      try {
        filters.status = statusParam.split(',');
      } catch (error) {
        return createErrorResponse('Invalid status filter', undefined, 400);
      }
    }

    if (priorityParam) {
      try {
        filters.priority = priorityParam.split(',');
      } catch (error) {
        return createErrorResponse('Invalid priority filter', undefined, 400);
      }
    }

    // Get proposals using service
    const result = await proposalService.getProposals(filters, undefined, page, limit);

    return createApiResponse(result.proposals, 'Proposals retrieved successfully', 200);
  } catch (error) {
    console.error('Failed to fetch proposals:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to fetch proposals',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

/**
 * POST /api/proposals - Create new proposal
 */
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/proposals - Starting proposal creation');
    const body = await request.json();
    console.log('Request body received:', JSON.stringify(body, null, 2));

    // Transform date strings to Date objects for validation
    if (body.metadata?.deadline && typeof body.metadata.deadline === 'string') {
      body.metadata.deadline = new Date(body.metadata.deadline);
    }

    console.log('Transformed body:', JSON.stringify(body, null, 2));

    // Validate the request body using the proper schema
    const validatedData = createProposalSchema.parse(body);
    console.log('Validation successful');

    // Transform schema data to service data format
    const proposalData = {
      title: validatedData.metadata.title,
      description: validatedData.metadata.description,
      customerId: body.customerId || 'cmbgvm5ww00006gox6gg0a3t4', // Use actual existing customer ID
      createdBy: body.createdBy || 'cmbgmgsuk0000qg7l9tug8zm7', // Use actual existing user ID
      priority: validatedData.metadata.priority.toUpperCase() as any,
      value: validatedData.metadata.estimatedValue,
      currency: validatedData.metadata.currency,
      validUntil: validatedData.metadata.deadline,
      dueDate: body.dueDate,
      tags: validatedData.metadata.tags || [],
      metadata: {
        clientName: validatedData.metadata.clientName,
        clientContact: validatedData.metadata.clientContact,
        projectType: validatedData.metadata.projectType,
      },
    };

    // Create proposal using service
    const proposal = await proposalService.createProposal(proposalData);
    console.log('Proposal created with ID:', proposal.id);

    return createApiResponse(proposal, 'Proposal created successfully', 201);
  } catch (error) {
    console.error('Failed to create proposal:', error);

    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.errors);
      return createErrorResponse('Validation failed', error.errors, 400);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return createErrorResponse('Referenced customer or user not found', error.message, 400);
      }
      return createErrorResponse('Database error', error.message, 500);
    }

    return createErrorResponse(
      'Failed to create proposal',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}
