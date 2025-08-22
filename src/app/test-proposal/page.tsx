'use client';

import React from 'react';
import { logInfo } from '@/lib/logger';

export default function TestProposalPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Proposal Creation</h1>
      <p>This is a minimal test page to check if the basic routing works.</p>
      <button
        onClick={() => void logInfo('Test Proposal Button clicked')}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Button
      </button>
    </div>
  );
}
