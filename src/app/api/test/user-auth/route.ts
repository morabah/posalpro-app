
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserByEmail } from '@/lib/services/userService';
import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';
import { logDebug } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';

export async function GET(request: NextRequest) {
  const errorHandler = getErrorHandler({
    component: 'UserAuthTestRoute',
    operation: 'GET',
  });

  const startTime = Date.now();
  const testEmail = 'admin@posalpro.com';

  try {
    if (process.env.NODE_ENV === 'development') {
      await logDebug('🧪 Testing user authentication query...');
    }

    // Test 1: Simple user query
    if (process.env.NODE_ENV === 'development') {
      await logDebug('Test 1: Simple user query');
    }
    const simpleUser = await withAsyncErrorHandler(
      () =>
        prisma.user.findUnique({
          where: {
            tenantId_email: {
              tenantId: 'tenant_default',
              email: testEmail,
            },
          },
          select: { id: true, email: true, name: true }
        }),
      'Failed to execute simple user query test',
      { component: 'UserAuthTestRoute', operation: 'GET' }
    );

    // Test 2: User with roles (without transaction)
    if (process.env.NODE_ENV === 'development') {
      await logDebug('Test 2: User with roles (no transaction)');
    }
    const userWithRoles = await withAsyncErrorHandler(
      () =>
        prisma.user.findUnique({
          where: {
            tenantId_email: {
              tenantId: 'tenant_default',
              email: testEmail,
            },
          },
          include: {
            roles: {
              where: { isActive: true },
              include: {
                role: true,
              },
            },
          },
        }),
      'Failed to execute user with roles query test',
      { component: 'UserAuthTestRoute', operation: 'GET' }
    );

    // Test 3: Transaction with timeout
    if (process.env.NODE_ENV === 'development') {
      await logDebug('Test 3: Transaction with timeout');
    }
    const transactionUser = await withAsyncErrorHandler(
      () =>
        prisma.$transaction(async tx => {
          return await tx.user.findUnique({
            where: {
              tenantId_email: {
                tenantId: 'tenant_default',
                email: testEmail,
              },
            },
            include: {
              roles: {
                where: { isActive: true },
                include: {
                  role: true,
                },
              },
            },
          });
        }, {
          timeout: 15000 // 15 second timeout
        }),
      'Failed to execute transaction user query test',
      { component: 'UserAuthTestRoute', operation: 'GET' }
    );

    // Test 4: User service function
    if (process.env.NODE_ENV === 'development') {
      await logDebug('Test 4: User service function');
    }
    const serviceUser = await withAsyncErrorHandler(
      () => getUserByEmail(testEmail),
      'Failed to execute user service function test',
      { component: 'UserAuthTestRoute', operation: 'GET' }
    );

    const responseData = {
      status: 'success',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      tests: {
        simpleUser: simpleUser ? 'found' : 'not_found',
        userWithRoles: userWithRoles ? 'found' : 'not_found',
        transactionUser: transactionUser ? 'found' : 'not_found',
        serviceUser: serviceUser ? 'found' : 'not_found'
      },
      userData: {
        simple: simpleUser,
        withRoles: userWithRoles ? {
          id: userWithRoles.id,
          email: userWithRoles.email,
          name: userWithRoles.name,
          rolesCount: userWithRoles.roles.length
        } : null,
        transaction: transactionUser ? {
          id: transactionUser.id,
          email: transactionUser.email,
          name: transactionUser.name,
          rolesCount: transactionUser.roles.length
        } : null,
        service: serviceUser ? {
          id: serviceUser.id,
          email: serviceUser.email,
          name: serviceUser.name,
          rolesCount: serviceUser.roles.length
        } : null
      }
    };

    return errorHandler.createSuccessResponse(
      responseData,
      'User authentication tests completed successfully'
    );
  } catch (error) {
    // Use standardized error handling for test failures
    const processedError = errorHandlingService.processError(
      error,
      'User authentication test failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      {
        component: 'UserAuthTestRoute',
        operation: 'GET',
        testEmail,
        responseTime: Date.now() - startTime,
      }
    );

    const errorResponse = errorHandler.createErrorResponse(
      processedError,
      'User authentication test failed',
      ErrorCodes.SYSTEM.INTERNAL_ERROR,
      500
    );
    return errorResponse;
  }
}
