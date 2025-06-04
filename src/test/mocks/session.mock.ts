/**
 * PosalPro MVP2 - Session Mock Utilities
 * Mock session management for testing authentication flows
 */

import { UserType } from '@/types';

// Mock session interface
export interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserType;
  } | null;
}

// Global session state for tests
let mockSessionState: MockSession = { user: null };

// Set mock session
export const setMockSession = (session: MockSession) => {
  mockSessionState = session;
};

// Get current mock session
export const getMockSession = (): MockSession => {
  return mockSessionState;
};

// Clear mock session
export const clearMockSession = () => {
  mockSessionState = { user: null };
};

// Create mock user
export const createMockUser = (overrides: Partial<MockSession['user']> = {}) => ({
  id: 'mock-user-123',
  name: 'Mock User',
  email: 'mock@example.com',
  role: UserType.PROPOSAL_MANAGER,
  ...overrides,
});

// Mock different user roles
export const mockUserRoles = {
  proposalManager: createMockUser({
    id: 'pm-123',
    name: 'Proposal Manager',
    email: 'pm@example.com',
    role: UserType.PROPOSAL_MANAGER,
  }),
  contentManager: createMockUser({
    id: 'cm-123',
    name: 'Content Manager',
    email: 'cm@example.com',
    role: UserType.CONTENT_MANAGER,
  }),
  sme: createMockUser({
    id: 'sme-123',
    name: 'Subject Matter Expert',
    email: 'sme@example.com',
    role: UserType.SME,
  }),
  executive: createMockUser({
    id: 'exec-123',
    name: 'Executive',
    email: 'exec@example.com',
    role: UserType.EXECUTIVE,
  }),
  admin: createMockUser({
    id: 'admin-123',
    name: 'System Administrator',
    email: 'admin@example.com',
    role: UserType.SYSTEM_ADMINISTRATOR,
  }),
};

// Set session by role
export const setMockSessionByRole = (role: UserType) => {
  const userMap = {
    [UserType.PROPOSAL_MANAGER]: mockUserRoles.proposalManager,
    [UserType.CONTENT_MANAGER]: mockUserRoles.contentManager,
    [UserType.SME]: mockUserRoles.sme,
    [UserType.EXECUTIVE]: mockUserRoles.executive,
    [UserType.SYSTEM_ADMINISTRATOR]: mockUserRoles.admin,
  };

  setMockSession({ user: userMap[role] });
};
