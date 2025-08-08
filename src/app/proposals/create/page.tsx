/**
 * Server page shell for Proposal Creation. Renders client wrapper.
 */
import React, { Suspense } from 'react';
import ClientPage from './ClientPage';

export default function ProposalCreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ClientPage />
    </Suspense>
  );
}
