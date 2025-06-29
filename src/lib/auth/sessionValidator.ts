// [AUTH_FIX] Enhanced session validation
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export class SessionValidator {
  static async validateSession(request: any) {
    const session = await getServerSession(authOptions);

    const validation = {
      isValid: false,
      session: null,
      user: null,
      error: null,
      debug: {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasUserId: !!session?.user?.id,
        userEmail: session?.user?.email,
        userRoles: session?.user?.roles,
        timestamp: new Date().toISOString(),
      },
    };

    if (!session) {
      validation.error = 'No session found' as any;
      console.log('[AUTH_FIX] Session validation failed: No session');
      return validation;
    }

    if (!session.user) {
      validation.error = 'No user in session' as any;
      console.log('[AUTH_FIX] Session validation failed: No user in session');
      return validation;
    }

    if (!session.user.id) {
      validation.error = 'No user ID in session' as any;
      console.log('[AUTH_FIX] Session validation failed: No user ID');
      return validation;
    }

    validation.isValid = true;
    validation.session = session as any;
    validation.user = session.user as any;

    console.log('[AUTH_FIX] Session validation successful:', {
      userId: session.user.id,
      email: session.user.email,
      roles: session.user.roles,
    });

    return validation;
  }

  static createUnauthorizedResponse(validation: any) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: validation.error || 'Authentication required',
        debug: process.env.NODE_ENV === 'development' ? validation.debug : undefined,
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
