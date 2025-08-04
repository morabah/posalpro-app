'use client';

/**
 * PosalPro MVP2 - Login Page
 * Optimized with direct imports for better performance
 * Target: Reduce login page load time from 4798ms to <3000ms
 */

import { OptimizedLoginForm } from '@/components/auth/OptimizedLoginForm';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Metadata is handled by layout.tsx for Client Components

function LoginPageContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || undefined;

  return <OptimizedLoginForm callbackUrl={callbackUrl || undefined} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
