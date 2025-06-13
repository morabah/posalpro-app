import { rest } from 'msw';
import { createAuthHandler } from './api.mock';

export const handlers = [
  rest.get('/api/health', (req, res, ctx) => {
    return res(ctx.json({ status: 'healthy' }));
  }),

  createAuthHandler<{ token: string; user: { id: string; email: string; role: string } }>(
    '/api/auth/login',
    {
      token: 'mock-jwt-token',
      user: {
        id: '123',
        email: 'test@example.com',
        role: 'Technical SME',
      },
    },
    'Invalid email or password. Please try again.'
  ),
];
