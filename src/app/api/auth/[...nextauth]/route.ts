/**
 * PosalPro MVP2 - NextAuth API Route
 * Handles authentication endpoints
 */

import { authOptions } from '@/lib/auth';
import NextAuth from 'next-auth';

// Ensure Node.js runtime for NextAuth (avoids Edge env/token incompatibility)
export const runtime = 'nodejs';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
