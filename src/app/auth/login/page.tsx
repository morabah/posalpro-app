/**
 * PosalPro MVP2 - Login Page
 * Based on LOGIN_SCREEN.md wireframe specifications
 */

import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Sign In - PosalPro',
  description: 'Sign in to your PosalPro account with role-based access',
};

interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string;
    error?: string;
    registered?: string;
    verified?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm callbackUrl={params.callbackUrl} />
    </Suspense>
  );
}
