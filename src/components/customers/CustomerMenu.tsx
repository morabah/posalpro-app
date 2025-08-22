'use client';

// Using basic button elements instead of custom components
import { Customer } from '@/hooks/useCustomers';
import { Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CustomerCreationSidebar } from './CustomerCreationSidebar';

export function CustomerMenu() {
  const [isCreationSidebarOpen, setIsCreationSidebarOpen] = useState(false);
  const router = useRouter();

  // ✅ FIXED: Replace any type with proper Customer interface
  const handleCustomerCreated = async (customer: Customer) => {
    const { logDebug } = await import('@/lib/logger');
    await logDebug('[CustomerMenu] Customer created', { customer });
    // Optionally navigate to customer page or refresh customer list
  };

  return (
    <>
      {/* Customer Menu Dropdown */}
      <div className="relative inline-block text-left">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/dashboard/customers')}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <Users className="h-4 w-4" />
            <span>Customers</span>
          </button>

          <button
            onClick={() => setIsCreationSidebarOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Creation Sidebar */}
      <CustomerCreationSidebar
        isOpen={isCreationSidebarOpen}
        onClose={() => setIsCreationSidebarOpen(false)}
        onSuccess={handleCustomerCreated}
      />
    </>
  );
}
