'use client';

import { useApiClient } from '@/hooks/useApiClient';
import { useEffect, useState } from 'react';

interface DebugInfo {
  windowOrigin?: string;
  nodeEnv?: string;
  publicApiUrl?: string;
  typeof_window?: string;
  apiResponse?: any;
  apiError?: string;
}

export default function DebugApiPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const apiClient = useApiClient();

  useEffect(() => {
    const testApiClient = async () => {
      // Test URL construction
      const windowOrigin = typeof window !== 'undefined' ? window.location.origin : 'N/A';
      const nodeEnv = process.env.NODE_ENV;
      const publicApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      console.log('🔍 Debug Info:', {
        windowOrigin,
        nodeEnv,
        publicApiUrl,
        typeof_window: typeof window,
      });

      setDebugInfo({
        windowOrigin,
        nodeEnv,
        publicApiUrl,
        typeof_window: typeof window,
      });

      // Test actual API call
      try {
        console.log('🔍 Testing API call to /customers...');
        const response = await apiClient.get('/customers');
        console.log('🔍 API Response:', response);
        setDebugInfo(prev => ({ ...prev, apiResponse: response }));
      } catch (error) {
        console.error('🔍 API Error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setDebugInfo(prev => ({ ...prev, apiError: errorMessage }));
      }
    };

    testApiClient();
  }, [apiClient]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Debug Page</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Debug Information:</h2>
        <pre className="text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  );
}
