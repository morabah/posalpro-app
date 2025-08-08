'use client';
import { useEffect, useState } from 'react';

type MetricsData = {
  requests: { count: number; p95: number; p99: number };
  db: { count: number; p95: number; p99: number };
  cache: { hit: number; miss: number; ratio: number };
  errors: { total: number; codes: Record<string, number> };
  webVitals?: any;
  headline?: { lcpP95: number; inpP95: number; clsRate: number };
};

export default function ObservabilityPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  useEffect(() => {
    const tick = async () => {
      const res = await fetch('/api/observability/metrics', { cache: 'no-store' });
      const json = await res.json();
      setData(json.data as MetricsData);
    };
    tick();
    const i = setInterval(tick, 2000);
    return () => clearInterval(i);
  }, []);

  const codes = data?.errors?.codes || {};
  const topCodes = Object.entries(codes)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Observability</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">Requests</h2>
          <div className="text-sm">Count: {data?.requests?.count ?? 0}</div>
          <div className="text-sm">p95: {data?.requests?.p95 ?? 0} ms</div>
          <div className="text-sm">p99: {data?.requests?.p99 ?? 0} ms</div>
        </div>

        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">Database</h2>
          <div className="text-sm">Queries: {data?.db?.count ?? 0}</div>
          <div className="text-sm">p95: {data?.db?.p95 ?? 0} ms</div>
          <div className="text-sm">p99: {data?.db?.p99 ?? 0} ms</div>
        </div>

        <div className="rounded border p-4 bg-white">
          <h2 className="font-semibold mb-2">Cache</h2>
          <div className="text-sm">Hit: {data?.cache?.hit ?? 0}</div>
          <div className="text-sm">Miss: {data?.cache?.miss ?? 0}</div>
          <div className="text-sm">Ratio: {(data?.cache?.ratio ?? 0).toFixed(2)}</div>
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
                <td className="py-1">{count as number}</td>
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
        <div className="text-sm">LCP p95: {data?.headline?.lcpP95 ?? 0} ms</div>
        <div className="text-sm">INP p95: {data?.headline?.inpP95 ?? 0} ms</div>
        <div className="text-sm">CLS poor rate: {((data?.headline?.clsRate ?? 0) * 100).toFixed(1)}%</div>
      </div>
    </div>
  );
}
