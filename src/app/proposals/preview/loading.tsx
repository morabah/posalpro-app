'use client';

import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { FileText } from 'lucide-react';

export default function ProposalPreviewLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Proposal Preview</h2>
        <p className="text-gray-600 mb-4">
          We're preparing your proposal preview with all sections, products, and formatting.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Loading proposal data
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Organizing product sections
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
            Preparing print options
          </div>
        </div>
      </div>
    </div>
  );
}
