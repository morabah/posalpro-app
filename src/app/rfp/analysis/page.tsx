/**
 * PosalPro MVP2 - RFP Analysis Page
 * Advanced RFP analysis and insights dashboard
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function RFPAnalysisPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RFP Analysis</h1>
            <p className="text-gray-600 mt-1">Advanced analysis and insights for RFP documents</p>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-8 text-center">
          <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-4">RFP Analysis Coming Soon</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            AI-powered RFP analysis, competitive intelligence, and automated scoring will be
            available in the next release.
          </p>
        </div>
      </Card>
    </div>
  );
}
