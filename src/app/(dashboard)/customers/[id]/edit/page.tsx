import { CustomerEditForm } from '@/components/customers/CustomerEditForm';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Edit Customer - PosalPro',
  description: 'Edit customer information and update customer data',
};

// Server Component shell
export default async function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<CustomerEditSkeleton />}>
        <CustomerEditForm customerId={id} />
      </Suspense>
    </div>
  );
}

// Loading skeleton
function CustomerEditSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Form skeleton */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
