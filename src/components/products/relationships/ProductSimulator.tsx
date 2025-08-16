'use client';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

type Mode = 'validate' | 'simulate';

interface SimulationResult {
  valid?: boolean;
  errors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

// API response shape from `/api/products/relationships/simulate`
interface ApiSuccess<T> {
  success: true;
  data: T;
}
interface ApiFailure {
  success: false;
  error?: string;
  issues?: unknown;
}
type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export default function ProductSimulator() {
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();

  const [skus, setSkus] = useState<string[]>([]);
  const [newSku, setNewSku] = useState('');
  const [mode, setMode] = useState<Mode>('validate');
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState<
    Array<{
      id: string;
      skus: string[];
      mode: string;
      timestamp: Date;
      status: 'success' | 'error' | 'warning';
    }>
  >([]);

  const addSku = () => {
    const trimmedSku = newSku.trim().toUpperCase();
    if (trimmedSku && !skus.includes(trimmedSku)) {
      setSkus([...skus, trimmedSku]);
      setNewSku('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSku();
    }
  };

  const runSimulation = async () => {
    if (skus.length === 0) return;
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<SimulationResult>>(
        '/products/relationships/simulate',
        { skus, mode }
      );
      if (!res.success) {
        throw new Error(res.error || 'Simulation failed');
      }
      const result: SimulationResult = res.data;
      setResults(result);

      // Add to history
      const historyItem = {
        id: Date.now().toString(),
        skus: [...skus],
        mode,
        timestamp: new Date(),
        status:
          result?.valid === false
            ? ('error' as const)
            : (result?.warnings?.length ?? 0) > 0
              ? ('warning' as const)
              : ('success' as const),
      };
      setSimulationHistory(prev => [historyItem, ...prev.slice(0, 4)]); // Keep last 5
    } catch (error) {
      handleAsyncError(error, 'Simulation failed', { component: 'ProductSimulator', skus, mode });

      // Add error to history
      const historyItem = {
        id: Date.now().toString(),
        skus: [...skus],
        mode,
        timestamp: new Date(),
        status: 'error' as const,
      };
      setSimulationHistory(prev => [historyItem, ...prev.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <XMarkIcon className="w-4 h-4 text-red-500" />;
      default:
        return <InformationCircleIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50 shadow-lg border-blue-200">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <PlayIcon className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Product Simulator</h3>
        </div>

        <div className="space-y-4">
          {/* SKU Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Product SKUs</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter SKU (e.g., PROD-001)..."
                value={newSku}
                onChange={e => setNewSku(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-white border-gray-300 focus:border-blue-400"
              />
              <Button
                onClick={addSku}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                disabled={!newSku.trim()}
              >
                <PlusIcon className="w-4 h-4" />
                Add
              </Button>
            </div>
          </div>

          {/* SKU List */}
          {skus.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Selected SKUs ({skus.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border">
                {skus.map(sku => (
                  <Badge
                    key={sku}
                    className="bg-blue-100 text-blue-800 px-3 py-1 flex items-center gap-2 hover:bg-blue-200 transition-colors"
                  >
                    <span className="font-mono text-sm">{sku}</span>
                    <button
                      onClick={() => setSkus(skus.filter(s => s !== sku))}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Simulation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">Mode</label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value as 'validate' | 'simulate')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
              >
                <option value="validate">Validate Configuration</option>
                <option value="simulate">Simulate Relationships</option>
              </select>
            </div>
            <div className="pt-6">
              <Button
                onClick={runSimulation}
                disabled={loading || skus.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Results</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                {results.valid === false ? (
                  <div className="flex items-start gap-2 text-red-700">
                    <XMarkIcon className="w-5 h-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Configuration Invalid</p>
                      {results.errors?.map((error, i) => (
                        <p key={i} className="text-sm mt-1">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (results.warnings?.length ?? 0) > 0 ? (
                  <div className="flex items-start gap-2 text-amber-700">
                    <ExclamationTriangleIcon className="w-5 h-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Configuration Valid (with warnings)</p>
                      {results.warnings?.map((warning, i) => (
                        <p key={i} className="text-sm mt-1">
                          {warning}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-green-700">
                    <CheckCircleIcon className="w-5 h-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Configuration Valid</p>
                      <p className="text-sm mt-1">All product relationships are compatible</p>
                    </div>
                  </div>
                )}

                {(results.recommendations?.length ?? 0) > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recommendations:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {results.recommendations?.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Simulation History */}
          {simulationHistory.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Recent Simulations</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {simulationHistory.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded border text-xs"
                  >
                    {getStatusIcon(item.status)}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.mode === 'validate' ? 'Validation' : 'Simulation'} •{' '}
                        {item.skus.length} SKUs
                      </div>
                      <div className="text-gray-600">
                        {item.skus.slice(0, 3).join(', ')}
                        {item.skus.length > 3 && ` +${item.skus.length - 3} more`}
                      </div>
                    </div>
                    <div className="text-gray-500">{item.timestamp.toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
