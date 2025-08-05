/**
 * PosalPro MVP2 - Communication Messages API
 * Real-time messaging and collaboration endpoints
 * Based on CORE_REQUIREMENTS.md patterns
 *
 * User Stories: US-2.2, US-4.1, US-4.3
 * Hypotheses: H4 (40% coordination reduction)
 * Component Traceability: CommunicationCenter, TeamChat
 */

import { authOptions } from '@/lib/auth';
import { ErrorHandlingService } from '@/lib/errors';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// Initialize error handling service
const errorHandlingService = ErrorHandlingService.getInstance();

// In-memory storage for messages (in production, this would be replaced with database)
const messageStore = new Map<string, any[]>();

function createApiResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

function createApiErrorResponse(
  error: StandardError,
  userMessage: string,
  code: string,
  status: number
) {
  errorHandlingService.processError(error);

  return NextResponse.json(
    {
      success: false,
      error: {
        message: userMessage,
        code,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * GET /api/communication/messages - Get messages for a proposal
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Authentication required to access messages',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'CommunicationMessagesAPI',
            operation: 'GET',
          },
        }),
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');

    if (!proposalId) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Proposal ID is required',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'CommunicationMessagesAPI',
            operation: 'GET',
          },
        }),
        'Proposal ID is required',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
      );
    }

    // Get messages from in-memory store
    const messages = messageStore.get(proposalId) || [];

    return createApiResponse(messages, 'Messages retrieved successfully');
  } catch (error) {
    const standardError = new StandardError({
      message: 'Failed to retrieve messages',
      code: ErrorCodes.DATA.QUERY_FAILED,
      metadata: {
        component: 'CommunicationMessagesAPI',
        operation: 'GET',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return createApiErrorResponse(
      standardError,
      'Failed to load messages',
      ErrorCodes.DATA.QUERY_FAILED,
      500
    );
  }
}

/**
 * POST /api/communication/messages - Send a new message
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Authentication required to send messages',
          code: ErrorCodes.AUTH.UNAUTHORIZED,
          metadata: {
            component: 'CommunicationMessagesAPI',
            operation: 'POST',
          },
        }),
        'Unauthorized access',
        ErrorCodes.AUTH.UNAUTHORIZED,
        401
      );
    }

    const body = await request.json();
    const { proposalId, content, type = 'message', priority = 'normal' } = body;

    if (!proposalId || !content) {
      return createApiErrorResponse(
        new StandardError({
          message: 'Proposal ID and content are required',
          code: ErrorCodes.VALIDATION.INVALID_INPUT,
          metadata: {
            component: 'CommunicationMessagesAPI',
            operation: 'POST',
          },
        }),
        'Proposal ID and content are required',
        ErrorCodes.VALIDATION.INVALID_INPUT,
        400
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

    return createApiResponse(message, 'Message sent successfully');
  } catch (error) {
    const standardError = new StandardError({
      message: 'Failed to send message',
      code: ErrorCodes.DATA.CREATE_FAILED,
      metadata: {
        component: 'CommunicationMessagesAPI',
        operation: 'POST',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return createApiErrorResponse(
      standardError,
      'Failed to send message',
      ErrorCodes.DATA.CREATE_FAILED,
      500
    );
  }
}
