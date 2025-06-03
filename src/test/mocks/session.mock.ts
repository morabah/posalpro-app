/**
 * Next Auth Session Mock
 *
 * This mock provides simulated authentication functionality for testing
 * components that rely on next-auth/react.
 */

import { Session } from 'next-auth';

// Default mock user
const defaultUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  department: 'Business Development',
  roles: ['Proposal Manager'],
  permissions: ['proposals:read', 'proposals:write', 'content:read'],
  image: 'https://via.placeholder.com/150',
};

// Default mock session
const defaultSession: Session = {
  user: defaultUser,
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours from now
};

// Mock of the useSession hook
const useSession = jest.fn(() => ({
  data: defaultSession,
  status: 'authenticated', // 'authenticated' | 'loading' | 'unauthenticated'
  update: jest.fn(),
}));

// Mock of the getSession function
const getSession = jest.fn().mockResolvedValue(defaultSession);

// Mock of the signIn function
const signIn = jest.fn().mockResolvedValue({
  ok: true,
  error: null,
  status: 200,
  url: '/dashboard',
});

// Mock of the signOut function
const signOut = jest.fn().mockResolvedValue({
  ok: true,
  url: '/',
});

// Utility to customize the mock session for specific tests
export const setMockSession = (
  session: Partial<Session> | null,
  status: 'authenticated' | 'loading' | 'unauthenticated' = 'authenticated'
) => {
  if (session === null) {
    useSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });
    getSession.mockResolvedValue(null);
  } else {
    const mockSession = { ...defaultSession, ...session };
    useSession.mockReturnValue({
      data: mockSession,
      status,
      update: jest.fn(),
    });
    getSession.mockResolvedValue(mockSession);
  }
};

// Reset all session mocks to default values
export const resetSessionMock = () => {
  useSession.mockReset().mockReturnValue({
    data: defaultSession,
    status: 'authenticated',
    update: jest.fn(),
  });
  getSession.mockReset().mockResolvedValue(defaultSession);
  signIn.mockReset().mockResolvedValue({
    ok: true,
    error: null,
    status: 200,
    url: '/dashboard',
  });
  signOut.mockReset().mockResolvedValue({
    ok: true,
    url: '/',
  });
};

// Export the mock implementation
export const mockSession = {
  useSession,
  getSession,
  signIn,
  signOut,
  setCsrfToken: jest.fn(),
  getProviders: jest.fn().mockResolvedValue({
    google: { id: 'google', name: 'Google', type: 'oauth' },
    github: { id: 'github', name: 'GitHub', type: 'oauth' },
  }),
};
