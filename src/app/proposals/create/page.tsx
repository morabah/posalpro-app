/**
 * Server page shell for Proposal Creation. Renders client wrapper.
 */
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Suspense } from 'react';
import ClientPage from './ClientPage';

export default function ProposalCreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ClientLayoutWrapper>
        <QueryProvider>
          <AuthProvider>
            <ClientPage />
          </AuthProvider>
        </QueryProvider>
      </ClientLayoutWrapper>
    </Suspense>
  );
}
