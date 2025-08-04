'use client';

/**
 * PosalPro MVP2 - useAuth Hook
 * Custom hook to access authentication context
 * Separated from AuthProvider to fix Fast Refresh issues
 */

import { useContext } from 'react';
import { AuthContext, type AuthContextState } from '@/components/providers/AuthProvider';

// Hook to use auth context
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
