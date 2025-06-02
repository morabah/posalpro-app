/**
 * PosalPro MVP2 - Customers Main Page
 * Central hub for customer management and profiles
 */

'use client';

import { Breadcrumbs } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { UsersIcon } from '@heroicons/react/24/outline';

export default function CustomersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Breadcrumbs className="mb-4" />
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">
              Manage customer profiles and relationship information
            </p>
          </div>
        </div>
      </div>

      <Card>
        <div className="p-8 text-center">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-4">
            Customer Management Coming Soon
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Comprehensive customer relationship management, profile tracking, and proposal history
            will be available in the next release.
          </p>
        </div>
      </Card>
    </div>
  );
}
