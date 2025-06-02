/**
 * PosalPro MVP2 - User Profile Page (Alternative Route)
 * Based on USER_PROFILE_SCREEN.md wireframe specifications
 * Provides /userprofile route for user profile management
 */

import { UserProfile } from '@/components/profile/UserProfile';
import { Loader2 } from 'lucide-react';
import { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'User Profile | PosalPro',
  description: 'Manage your personal information, preferences, and security settings',
  keywords: ['profile', 'settings', 'user management', 'preferences', 'security'],
};

function ProfileLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <main role="main" aria-label="User Profile">
      <Suspense fallback={<ProfileLoading />}>
        <UserProfile />
      </Suspense>
    </main>
  );
}
