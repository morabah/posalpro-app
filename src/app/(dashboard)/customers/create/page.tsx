'use client';

import { CustomerCreationSidebar } from '@/components/customers/CustomerCreationSidebar';
import { Building, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateCustomerPage() {
  const [isCreationSidebarOpen, setIsCreationSidebarOpen] = useState(true);
  const router = useRouter();

  const handleCustomerCreated = (customer: any) => {
    console.log('[CreateCustomerPage] Customer created:', customer);
    // Navigate to customer list or customer detail page
    router.push('/customers');
  };

  const handleClose = () => {
    setIsCreationSidebarOpen(false);
    // Navigate back to customers list
    router.push('/customers');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Customer</h1>
                <p className="text-sm text-gray-600">
                  Add a new customer to your database for proposal management
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Building className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Customer Creation Form</h2>
            <p className="text-gray-600 mb-6">
              The customer creation form will open in a sidebar. Fill in the required information to
              add a new customer to your system.
            </p>
            <button
              onClick={() => setIsCreationSidebarOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Open Customer Form
            </button>
          </div>
        </div>
      </div>

      {/* Customer Creation Sidebar */}
      <CustomerCreationSidebar
        isOpen={isCreationSidebarOpen}
        onClose={handleClose}
        onSuccess={handleCustomerCreated}
      />
    </div>
  );
}
