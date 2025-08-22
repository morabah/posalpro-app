'use client';

/**
 * PosalPro MVP2 - Login Page
 * Fixed loading issue by using direct import instead of dynamic import
 */

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { OptimizedLoginForm } from '@/components/auth/OptimizedLoginForm';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || undefined;

  return <OptimizedLoginForm callbackUrl={callbackUrl || undefined} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">PosalPro</h1>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
