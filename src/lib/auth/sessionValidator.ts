// [AUTH_FIX] Enhanced session validation
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';

interface ValidationDebug {
  hasSession: boolean;
  hasUser: boolean;
  hasUserId: boolean;
  userEmail: string | null | undefined;
  userRoles: unknown;
  timestamp: string;
}

export interface ValidationResult {
  isValid: boolean;
  session: Session | null;
  user: Session['user'] | null;
  error: string | null;
  debug: ValidationDebug;
}

export class SessionValidator {
  static async validateSession(): Promise<ValidationResult> {
    const session = await getServerSession(authOptions);
    const user = session?.user as ({ id?: unknown; email?: string | null; roles?: unknown } | undefined);

    const validation: ValidationResult = {
      isValid: false,
      session: null,
      user: null,
      error: null,
      debug: {
        hasSession: Boolean(session),
        hasUser: Boolean(user),
        hasUserId: Boolean(user?.id),
        userEmail: user?.email ?? null,
        userRoles: user?.roles,
        timestamp: new Date().toISOString(),
      },
    };

    if (!session) {
      validation.error = 'No session found';
      console.log('[AUTH_FIX] Session validation failed: No session');
      return validation;
    }

    if (!session.user) {
      validation.error = 'No user in session';
      console.log('[AUTH_FIX] Session validation failed: No user in session');
      return validation;
    }

    if (!('id' in session.user) || !(session.user as { id?: unknown }).id) {
      validation.error = 'No user ID in session';
      console.log('[AUTH_FIX] Session validation failed: No user ID');
      return validation;
    }

    validation.isValid = true;
    validation.session = session;
    validation.user = session.user;

    console.log('[AUTH_FIX] Session validation successful:', {
      userId: session.user.id,
      email: session.user.email,
      roles: session.user.roles,
    });

    return validation;
  }

  static createUnauthorizedResponse(validation: ValidationResult) {
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
