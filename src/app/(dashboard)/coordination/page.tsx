/**
 * PosalPro MVP2 - Coordination Hub Page
 * Central hub for cross-department collaboration and coordination
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { UsersIcon } from '@heroicons/react/24/outline';

export default function CoordinationPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coordination Hub</h1>
            <p className="text-gray-600 mt-1">
              Cross-department collaboration and coordination center
            </p>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-8 text-center">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-4">Coordination Hub Coming Soon</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Advanced coordination tools, team collaboration features, and cross-department workflow
            management will be available in the next release.
          </p>
        </div>
      </Card>
    </div>
  );
}
