import { comparePassword } from '@/lib/auth/passwordUtils';
import { logDebug } from '@/lib/logger';
import { getUserByEmail } from '@/lib/services/userService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    logDebug('Testing auth for user:', { email });

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check password
    if (user.password) {
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles.map(r => r.role.name),
      },
    });
  } catch (error) {
    logDebug('Auth test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
