'use client';

/**
 * PosalPro MVP2 - Login Page
 * Further optimized with dynamic import to shrink initial JS
 */

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const OptimizedLoginForm = dynamic(
  () => import('@/components/auth/OptimizedLoginForm').then(m => m.OptimizedLoginForm),
  {
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center">Loading...</div>,
  }
);

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
