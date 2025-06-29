
// Authentication Middleware Fix for API Routes
// Add this to your API route handlers

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function withAuth(handler) {
  return async (req, res) => {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.user) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Add user to request for downstream handlers
      req.user = session.user;
      req.session = session;

      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }
  };
}

// Usage in API routes:
// export default withAuth(async (req, res) => {
//   // Your protected API logic here
//   // req.user is now available
// });
