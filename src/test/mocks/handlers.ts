import { http, HttpResponse } from 'msw';
import { createAuthHandler } from './api.mock';

export const handlers = [
  http.get('/api/health', ({ request, params }) => {
    return HttpResponse.json({ status: 'healthy' });
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
