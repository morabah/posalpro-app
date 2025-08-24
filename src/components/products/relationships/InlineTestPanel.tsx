'use client';
import { useProductManagementBridge } from '@/components/bridges/ProductManagementBridge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import useErrorHandler from '@/hooks/useErrorHandler';
import { useCallback, useState } from 'react';

export default function InlineTestPanel({ productId }: { productId: string }) {
  let bridge;
  try {
    bridge = useProductManagementBridge();
  } catch (error) {
    // Bridge context not available yet - return loading state
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading test panel...</p>
        </div>
      </div>
    );
  }
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
      const res = await bridge.simulateProductRelationships({
        skus: selectedSkus,
        mode: 'advisory',
      });
      setOutput(res.simulationResults || null);
      analytics.track('relationships_inline_test_run', { skus: selectedSkus.length });
    } catch (error) {
      handleAsyncError(error, 'Test failed', { component: 'InlineTestPanel', phase: 'run' });
    } finally {
      setRunning(false);
    }
  }, [analytics, bridge, handleAsyncError, skus]);

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
