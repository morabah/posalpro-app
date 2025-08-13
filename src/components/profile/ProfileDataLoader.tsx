'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logInfo } from '@/lib/logger';
import { useEffect } from 'react';

export function ProfileDataLoader() {
  const { user } = useAuth() || {};
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();

  useEffect(() => {
    logInfo('ProfileDataLoader mounted');
    logInfo('ProfileDataLoader user context', { email: user?.email });

    const loadData = async () => {
      if (!user?.email) {
        logInfo('ProfileDataLoader: no user email, skipping data load');
        return;
      }

      try {
        logInfo('ProfileDataLoader: fetching profile data');
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

        logInfo('ProfileDataLoader: profile API response');

        if (response.success) {
          logInfo('ProfileDataLoader: profile data retrieved');

          if (response.data?.title === 'sales') {
            logInfo('ProfileDataLoader: job title sales confirmed');
          } else {
            logInfo('ProfileDataLoader: different job title found');
          }
        } else {
          logInfo('ProfileDataLoader: profile fetch failed');
        }
      } catch (error) {
        handleAsyncError(error, 'Error loading profile', {
          component: 'ProfileDataLoader',
        });
      }
    };

    loadData();
  }, [user?.email, apiClient]);

  // Add dramatic visual alert to force visibility
  // Keep UI-only banner without console noise

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
