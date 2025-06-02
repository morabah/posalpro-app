/**
 * PosalPro MVP2 - Registration Page
 * Based on USER_REGISTRATION_SCREEN.md wireframe specifications
 */

import { AuthenticatedRedirect } from '@/components/auth/AuthenticatedRedirect';
import { RegistrationForm } from '@/components/auth/RegistrationForm';
import { Metadata } from 'next';

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
