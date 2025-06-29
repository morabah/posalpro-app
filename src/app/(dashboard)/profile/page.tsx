'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';

// Lazy load the UserProfile component for better performance
const UserProfile = dynamic(() => import('@/components/profile/UserProfile'), {
  loading: () => (
    <div className="animate-pulse p-6">
      <div className="h-8 bg-gray-200 rounded mb-6"></div>
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded"></div>
        ))}
      </div>
    </div>
  ),
});

// [PERFORMANCE_FIX] Performance monitoring
export default function ProfilePage() {
  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      console.log('[PERFORMANCE] Profile page render time:', endTime - startTime, 'ms');
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your profile...</p>
              </div>
            </div>
          }
        >
          <UserProfile />
        </Suspense>
      </div>
    </div>
  );
}
