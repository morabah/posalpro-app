/**
 * PosalPro MVP2 - Registration Page
 * Based on USER_REGISTRATION_SCREEN.md wireframe specifications
 * 🚀 MEMORY OPTIMIZATION: Dynamic import for better performance
 */

import { AuthenticatedRedirect } from '@/components/auth/AuthenticatedRedirect';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// ✅ CRITICAL: Memory optimization with dynamic import
// Following Lesson #30: Performance Optimization - Component Lazy Loading
const RegistrationForm = dynamic(
  () =>
    import('@/components/auth/RegistrationForm').then(mod => ({ default: mod.RegistrationForm })),
  {
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false, // Disable SSR for better performance
  }
);

export const metadata: Metadata = {
  title: 'User Registration - PosalPro',
  description: 'Create a new PosalPro account with role-based access configuration',
};

export default function RegisterPage() {
  return (
    <AuthenticatedRedirect redirectTo="/dashboard">
      <RegistrationForm />
    </AuthenticatedRedirect>
  );
}
