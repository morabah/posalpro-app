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
  searchParams: {
    callbackUrl?: string;
    error?: string;
    registered?: string;
    verified?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm callbackUrl={searchParams.callbackUrl} />
    </Suspense>
  );
}
