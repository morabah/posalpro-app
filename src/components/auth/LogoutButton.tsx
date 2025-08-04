'use client';

/**
 * PosalPro MVP2 - Logout Button Component
 * Simple logout functionality for authenticated users
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

interface LogoutButtonProps {
  className?: string;
  variant?: 'button' | 'link';
  children?: React.ReactNode;
}

export function LogoutButton({ className = '', variant = 'button', children }: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: '/auth/login' });
    } catch (error) {
      // ✅ STANDARDIZED ERROR HANDLING: Use ErrorHandlingService
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        error,
        'Logout failed. Please try again.',
        ErrorCodes.AUTH.LOGOUT_FAILED,
        {
          component: 'LogoutButton',
          operation: 'logout',
        }
      );

      // Log the error for debugging
      errorHandlingService.processError(standardError);
      setIsLoggingOut(false);
    }
  };

  if (variant === 'link') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 ${className}`}
      >
        <LogOut className="w-4 h-4" />
        <span>{children || (isLoggingOut ? 'Signing out...' : 'Sign out')}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`inline-flex items-center space-x-2 px-4 py-2 bg-neutral-600 text-white rounded-md hover:bg-neutral-700 disabled:opacity-50 transition-colors ${className}`}
    >
      <LogOut className="w-4 h-4" />
      <span>{children || (isLoggingOut ? 'Signing out...' : 'Sign out')}</span>
    </button>
  );
}
