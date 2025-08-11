'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useApiClient } from '@/hooks/useApiClient';
import { useEffect } from 'react';

export function ProfileDataLoader() {
  const { user } = useAuth() || {};
  const apiClient = useApiClient();

  useEffect(() => {
    console.log('🚀 NEW COMPONENT: ProfileDataLoader mounted');
    console.log('🚀 User data:', user?.email);

    const loadData = async () => {
      if (!user?.email) {
        console.log('⚠️ No user email, skipping data load');
        return;
      }

      try {
        console.log('📡 Fetching profile data...');
        interface ProfilePayload {
          firstName?: string;
          lastName?: string;
          title?: string;
          email?: string;
        }
        interface ProfileResponse {
          success: boolean;
          data?: ProfilePayload;
          error?: string;
        }
        const response = await apiClient.get<ProfileResponse>('/api/profile');

        console.log('📊 Profile API Response:', response);

        if (response.success) {
          console.log('✅ SUCCESS: Profile data retrieved!');
          console.log('📋 Job Title in database:', response.data?.title);
          console.log('📋 Full profile data:', response.data);

          if (response.data?.title === 'sales') {
            console.log('🎉 CONFIRMED: Job title "sales" found in API response!');
            console.log('✅ Backend persistence is working correctly');
          } else {
            console.log('⚠️ Different job title found:', response.data?.title);
          }
        } else {
          console.log('❌ Failed to get profile data:', response.error);
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error);
      }
    };

    loadData();
  }, [user?.email, apiClient]);

  // Add dramatic visual alert to force visibility
  console.log('🔥 PROFILE DATA LOADER RENDERING NOW!');

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        background: '#ff0000',
        color: 'white',
        padding: '20px',
        border: '5px solid #000',
        zIndex: 99999,
        fontSize: '18px',
        fontWeight: 'bold',
      }}
    >
      <div>🚀 ProfileDataLoader ACTIVE</div>
      <div>User: {user?.email || 'NONE'}</div>
      <div>Check console for logs!</div>
      <div style={{ fontSize: '14px', marginTop: '10px' }}>
        If you see this box, the component is working!
      </div>
    </div>
  );
}
