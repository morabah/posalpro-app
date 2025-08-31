/**
 * PosalPro MVP2 - Communication Messages API
 * Real-time messaging and collaboration endpoints
 * Based on CORE_REQUIREMENTS.md patterns
 *
 * User Stories: US-2.2, US-4.1, US-4.3
 * Hypotheses: H4 (40% coordination reduction)
 * Component Traceability: CommunicationCenter, TeamChat
 */

import { error as apiError } from '@/lib/api/response';
import { authOptions } from '@/lib/auth';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';
import { ErrorHandlingService } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Initialize error handling service
const errorHandlingService = ErrorHandlingService.getInstance();

// In-memory storage for messages (in production, this would be replaced with database)
const messageStore = new Map<string, any[]>();

// Note: Response envelopes handled by ok() and apiError() functions from @/lib/api/response

/**
 * GET /api/communication/messages - Get messages for a proposal
 */
export async function GET(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'communications', action: 'read' });
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const standardError = new StandardError({
        message: 'Authentication required to access messages',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          component: 'CommunicationMessagesAPI',
          operation: 'GET',
        },
      });
      errorHandlingService.processError(standardError);
      return NextResponse.json(apiError(ErrorCodes.AUTH.UNAUTHORIZED, 'Unauthorized access'), {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');

    if (!proposalId) {
      const standardError = new StandardError({
        message: 'Proposal ID is required',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        metadata: {
          component: 'CommunicationMessagesAPI',
          operation: 'GET',
        },
      });
      errorHandlingService.processError(standardError);
      return NextResponse.json(
        apiError(ErrorCodes.VALIDATION.INVALID_INPUT, 'Proposal ID is required'),
        { status: 400 }
      );
    }

    // Get messages from in-memory store
    const messages = messageStore.get(proposalId) || [];

    const responsePayload = { ok: true, data: messages };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    const standardError = new StandardError({
      message: 'Failed to retrieve messages',
      code: ErrorCodes.DATA.QUERY_FAILED,
      metadata: {
        component: 'CommunicationMessagesAPI',
        operation: 'GET',
        error: errMessage,
      },
    });

    return NextResponse.json(apiError(ErrorCodes.DATA.QUERY_FAILED, 'Failed to load messages'), {
      status: 500,
    });
  }
}

/**
 * POST /api/communication/messages - Send a new message
 */
export async function POST(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'communications', action: 'create' });
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      const standardError = new StandardError({
        message: 'Authentication required to send messages',
        code: ErrorCodes.AUTH.UNAUTHORIZED,
        metadata: {
          component: 'CommunicationMessagesAPI',
          operation: 'POST',
        },
      });
      errorHandlingService.processError(standardError);
      return NextResponse.json(apiError(ErrorCodes.AUTH.UNAUTHORIZED, 'Unauthorized access'), {
        status: 401,
      });
    }

    const body = await request.json();
    const { proposalId, content, type = 'message', priority = 'normal' } = body;

    if (!proposalId || !content) {
      const standardError = new StandardError({
        message: 'Proposal ID and content are required',
        code: ErrorCodes.VALIDATION.INVALID_INPUT,
        metadata: {
          component: 'CommunicationMessagesAPI',
          operation: 'POST',
        },
      });
      errorHandlingService.processError(standardError);
      return NextResponse.json(
        apiError(ErrorCodes.VALIDATION.INVALID_INPUT, 'Proposal ID and content are required'),
        { status: 400 }
      );
    }

    // Create new message
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      proposalId,
      from: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      content,
      type,
      priority,
      timestamp: new Date(),
      isRead: false,
      mentions: [],
      tags: [],
    };

    // Store message in memory
    const existingMessages = messageStore.get(proposalId) || [];
    existingMessages.push(message);
    messageStore.set(proposalId, existingMessages);

    const responsePayload = { ok: true, data: message };
    return new Response(JSON.stringify(responsePayload), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    const standardError = new StandardError({
      message: 'Failed to send message',
      code: ErrorCodes.DATA.CREATE_FAILED,
      metadata: {
        component: 'CommunicationMessagesAPI',
        operation: 'POST',
        error: errMessage,
      },
    });

    return NextResponse.json(apiError(ErrorCodes.DATA.CREATE_FAILED, 'Failed to send message'), {
      status: 500,
    });
  }
}
