/**
 * PosalPro MVP2 - Authentication Test Page
 * Simple test to verify authentication pattern works
 */

'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { Card } from '@/components/ui/Card';
import { useApiClient } from '@/hooks/useApiClient';
import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('Loading...');
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const apiClient = useApiClient();

  useEffect(() => {
    const testAuth = async () => {
      try {
        if (authLoading) {
          setStatus('Auth loading...');
          return;
        }

        if (!isAuthenticated) {
          setStatus('Not authenticated');
          return;
        }

        setStatus('Authenticated, testing API...');

        // Test API call
        const response = await apiClient.get<{ data?: { applicationTier?: string } }>(
          '/api/user/preferences'
        );
        setStatus(
          `API working! User: ${user?.email}, Tier: ${response.data?.applicationTier || 'unknown'}`
        );
      } catch (error) {
        setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testAuth();
  }, [isAuthenticated, authLoading, user, apiClient]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Test</h1>
      <Card className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Status</h2>
        <p className="text-gray-600">{status}</p>

        <div className="mt-4 space-y-2">
          <p>
            <strong>Auth Loading:</strong> {authLoading ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>User Email:</strong> {user?.email || 'None'}
          </p>
          <p>
            <strong>User Roles:</strong> {user?.roles?.join(', ') || 'None'}
          </p>
        </div>
      </Card>
    </div>
  );
}
