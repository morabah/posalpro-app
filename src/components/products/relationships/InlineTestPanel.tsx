'use client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import useErrorHandler from '@/hooks/useErrorHandler';
import { useCallback, useState } from 'react';

export default function InlineTestPanel({ productId }: { productId: string }) {
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const analytics = useAnalytics();
  const [skus, setSkus] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    try {
      const selectedSkus = skus
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const res = await apiClient.patch<{ success: boolean; data: unknown }>(
        '/products/relationships/rules',
        { selectedSkus, attributes: {}, mode: 'advisory' }
      );
      setOutput((res as any)?.data || null);
      analytics.track('relationships_inline_test_run', { skus: selectedSkus.length });
    } catch (error) {
      handleAsyncError(error, 'Test failed', { component: 'InlineTestPanel', phase: 'run' });
    } finally {
      setRunning(false);
    }
  }, [analytics, apiClient, handleAsyncError, skus]);

  return (
    <div className="p-4 space-y-2">
      <Input
        placeholder="SKUs, comma-separated"
        value={skus}
        onChange={e => setSkus(e.target.value)}
      />
      <Button onClick={run} disabled={running}>
        {running ? 'Testing...' : 'Test'}
      </Button>
      {output && (
        <pre className="text-xs bg-gray-50 p-2 rounded border max-h-56 overflow-auto">
          {JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}
