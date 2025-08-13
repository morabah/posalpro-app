'use client';
import { useEffect, useState } from 'react';
import { useApiClient } from '@/hooks/useApiClient';

interface MetricsData {
  requests: { count: number; p95: number; p99: number };
  db: { count: number; p95: number; p99: number };
  cache: { hit: number; miss: number; ratio: number };
  errors: { total: number; codes: Record<string, number> };
  webVitals?: {
    lcp?: number;
    fid?: number;
    cls?: number;
    inp?: number;
    ttfb?: number;
    [key: string]: unknown;
  };
  headline?: { lcpP95: number; inpP95: number; clsRate: number };
}

interface ApiMetricsResponse {
  data?: MetricsData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isMetricsData(value: unknown): value is MetricsData {
  if (!isRecord(value)) return false;
  const v = value;
  return (
    isRecord(v.requests) &&
    typeof v.requests.count === 'number' &&
    isRecord(v.db) &&
    isRecord(v.cache) &&
    isRecord(v.errors) &&
    isRecord(v.errors.codes ?? {})
  );
}

function isApiMetricsResponse(value: unknown): value is ApiMetricsResponse {
  if (!isRecord(value)) return false;
  if (!('data' in value)) return true;
  const maybe = value as { data?: unknown };
  return maybe.data === undefined || isMetricsData(maybe.data);
}

export default function ObservabilityPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const apiClient = useApiClient();
  useEffect(() => {
    const tick = async () => {
      try {
        const json = (await apiClient.get<{ data?: MetricsData }>('observability/metrics')) as {
          data?: MetricsData;
        };
        if (isApiMetricsResponse(json)) {
          setData(json.data ?? null);
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      }
    };
    tick();
    const i = setInterval(tick, 2000);
    return () => clearInterval(i);
  }, []);

  const d = data;
  const codes: Record<string, number> = d ? d.errors.codes : {};
  const topCodes = Object.entries(codes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Precompute safe primitives to avoid optional chaining in JSX
  const requestsCount = d ? d.requests.count : 0;
  const requestsP95 = d ? d.requests.p95 : 0;
  const requestsP99 = d ? d.requests.p99 : 0;

  const dbCount = d ? d.db.count : 0;
  const dbP95 = d ? d.db.p95 : 0;
  const dbP99 = d ? d.db.p99 : 0;

  const cacheHit = d ? d.cache.hit : 0;
  const cacheMiss = d ? d.cache.miss : 0;
  const cacheRatio = d ? d.cache.ratio : 0;

  const headlineLcpP95 = d && d.headline ? d.headline.lcpP95 : 0;
  const headlineInpP95 = d && d.headline ? d.headline.inpP95 : 0;
  const headlineClsRate = d && d.headline ? d.headline.clsRate : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Observability</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">Requests</h2>
          <div className="text-sm">Count: {requestsCount}</div>
          <div className="text-sm">p95: {requestsP95} ms</div>
          <div className="text-sm">p99: {requestsP99} ms</div>
        </div>

        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">Database</h2>
          <div className="text-sm">Queries: {dbCount}</div>
          <div className="text-sm">p95: {dbP95} ms</div>
          <div className="text-sm">p99: {dbP99} ms</div>
        </div>

        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">Cache</h2>
          <div className="text-sm">Hit: {cacheHit}</div>
          <div className="text-sm">Miss: {cacheMiss}</div>
          <div className="text-sm">Ratio: {cacheRatio.toFixed(2)}</div>
        </div>
      </div>

      <div className="rounded border p-4 bg-white">
        <h2 className="font-semibold mb-2">Top Error Codes</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-1">Code</th>
              <th className="py-1">Count</th>
            </tr>
          </thead>
          <tbody>
            {topCodes.map(([code, count]) => (
              <tr key={code} className="border-t">
                <td className="py-1">{code}</td>
                <td className="py-1">{count}</td>
              </tr>
            ))}
            {topCodes.length === 0 && (
              <tr>
                <td className="py-1" colSpan={2}>
                  No errors recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded border p-4 bg-white">
        <h2 className="font-semibold mb-2">Web Vitals (headline)</h2>
        <div className="text-sm">LCP p95: {headlineLcpP95} ms</div>
        <div className="text-sm">INP p95: {headlineInpP95} ms</div>
        <div className="text-sm">CLS poor rate: {(headlineClsRate * 100).toFixed(1)}%</div>
      </div>
    </div>
  );
}
