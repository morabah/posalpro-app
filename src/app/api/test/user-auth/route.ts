import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserByEmail } from '@/lib/services/userService';
import { ErrorCodes, errorHandlingService, StandardError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const testEmail = 'admin@posalpro.com';

  try {
    if (process.env.NODE_ENV === 'development') {

      console.log('🧪 Testing user authentication query...');
    }

    // Test 1: Simple user query
    if (process.env.NODE_ENV === 'development') {

      console.log('Test 1: Simple user query');
    }
    const simpleUser = await prisma.user.findUnique({
      where: { email: testEmail },
      select: { id: true, email: true, name: true }
    });

    // Test 2: User with roles (without transaction)
    if (process.env.NODE_ENV === 'development') {

      console.log('Test 2: User with roles (no transaction)');
    }
    const userWithRoles = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        roles: {
          where: { isActive: true },
          include: {
            role: true,
          },
        },
      },
    });

    // Test 3: Transaction with timeout
    if (process.env.NODE_ENV === 'development') {

      console.log('Test 3: Transaction with timeout');
    }
    const transactionUser = await prisma.$transaction(async tx => {
      return await tx.user.findUnique({
        where: { email: testEmail },
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
    });

    // Test 4: User service function
    if (process.env.NODE_ENV === 'development') {

      console.log('Test 4: User service function');
    }
    const serviceUser = await getUserByEmail(testEmail);

    const results = {
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

    return new NextResponse(JSON.stringify(results, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    } catch (error) {
    // Use standardized error handling for test failures
    errorHandlingService.processError(
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

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'User authentication test failed',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
