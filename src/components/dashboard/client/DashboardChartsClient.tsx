'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { useEffect, useMemo, useState } from 'react';

type NearDuePoint = { date: string; count: number };
type EmployeeRow = {
  userId: string;
  name: string;
  createdCount: number;
  assignedCount: number;
  total: number;
};
type ProductRow = {
  productId: string;
  name: string;
  category: string | null;
  usage: number;
  totalQuantity: number;
  revenue: number;
  wins: number;
};
type BundleRow = { aId: string; bId: string; aName: string; bName: string; count: number };

export default function DashboardChartsClient() {
  const apiClient = useApiClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nearDue, setNearDue] = useState<NearDuePoint[]>([]);
  const [byEmployee, setByEmployee] = useState<EmployeeRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [topWinning, setTopWinning] = useState<ProductRow[]>([]);
  const [funnel, setFunnel] = useState<Array<{ stage: string; count: number }>>([]);
  const [overdueByPriority, setOverdueByPriority] = useState<
    Array<{ priority: string; count: number }>
  >([]);
  const [bundles, setBundles] = useState<Array<BundleRow>>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [nearDueRes, empRes, prodRes, funnelRes, overduePrioRes, bundlesRes] =
          await Promise.all([
            apiClient.get('/proposals/analytics/near-due?days=14'),
            apiClient.get('/proposals/analytics/by-employee'),
            apiClient.get('/proposals/analytics/products'),
            apiClient.get('/proposals/analytics/funnel'),
            apiClient.get('/proposals/analytics/overdue-by-priority'),
            apiClient.get('/proposals/analytics/product-bundles'),
          ]);

        const nd =
          (nearDueRes as any)?.data?.nearDueByDay ?? (nearDueRes as any)?.nearDueByDay ?? [];
        const be = (empRes as any)?.data?.byEmployee ?? (empRes as any)?.byEmployee ?? [];
        const pr = (prodRes as any)?.data?.products ?? (prodRes as any)?.products ?? [];
        const tw = (prodRes as any)?.data?.topWinning ?? (prodRes as any)?.topWinning ?? [];

        setNearDue(Array.isArray(nd) ? nd : []);
        setByEmployee(Array.isArray(be) ? be : []);
        setProducts(Array.isArray(pr) ? pr : []);
        setTopWinning(Array.isArray(tw) ? tw : []);
        const stages = (funnelRes as any)?.data?.stages ?? (funnelRes as any)?.stages ?? [];
        setFunnel(Array.isArray(stages) ? stages : []);
        const obp = (overduePrioRes as any)?.data ?? [];
        setOverdueByPriority(Array.isArray(obp) ? obp : []);
        const pb = (bundlesRes as any)?.data?.pairs ?? [];
        setBundles(
          Array.isArray(pb)
            ? pb.map((x: any) => ({
                aId: String(x.aId),
                bId: String(x.bId),
                aName: String(x.aName),
                bName: String(x.bName),
                count: Number(x.count || 0),
              }))
            : []
        );
      } catch (err) {
        const ehs = ErrorHandlingService.getInstance();
        ehs.processError(err, 'Failed to load dashboard charts', ErrorCodes.DATA.FETCH_FAILED, {
          component: 'DashboardChartsClient',
          operation: 'loadCharts',
        });
        setError('Failed to load charts');
      } finally {
        setLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    run();
  }, []);

  const topEmployees = useMemo(() => byEmployee.slice(0, 8), [byEmployee]);
  const topProducts = useMemo(() => products.slice(0, 8), [products]);
  const maxNearDue = useMemo(() => Math.max(1, ...nearDue.map(p => p.count || 0)), [nearDue]);
  const maxFunnel = useMemo(() => Math.max(1, ...funnel.map(s => s.count || 0)), [funnel]);
  const maxOverdue = useMemo(
    () => Math.max(1, ...overdueByPriority.map(p => p.count || 0)),
    [overdueByPriority]
  );

  const exportPdf = async () => {
    // Use browser print-to-PDF approach (no new deps): open printable view
    window.print();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-6 h-48 bg-gray-100 rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <Card className="p-4 text-red-600">{error}</Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <Button onClick={exportPdf} variant="outline" size="sm">
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Near-Due Proposals (Next 14 days)</h3>
              <span className="text-sm text-gray-500">by day</span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-end h-40">
              {nearDue.map(point => (
                <div key={point.date} className="flex flex-col items-center justify-end h-full">
                  <div
                    className="bg-blue-500 rounded-t w-full"
                    style={{ height: `${Math.max(4, (point.count / maxNearDue) * 160)}px` }}
                  />
                  <div className="text-[10px] mt-1 text-gray-500">{point.date.slice(5)}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Employee Load (Created + Assigned)</h3>
              <span className="text-sm text-gray-500">top 8</span>
            </div>
            <div className="space-y-2">
              {topEmployees.map(row => (
                <div key={row.userId} className="flex items-center gap-2">
                  <div className="w-40 truncate" title={row.name}>
                    {row.name}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-4"
                      style={{
                        width: `${Math.min(100, (row.total / (topEmployees[0]?.total || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">{row.total}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Pipeline Funnel</h3>
              <span className="text-sm text-gray-500">stage counts</span>
            </div>
            <div className="grid grid-cols-6 gap-2 items-end h-40">
              {funnel.map(s => (
                <div key={s.stage} className="flex flex-col items-center justify-end h-full">
                  <div
                    className="bg-purple-500 rounded-t w-full"
                    style={{ height: `${Math.max(4, (s.count / maxFunnel) * 160)}px` }}
                  />
                  <div className="text-[10px] mt-1 text-gray-500">{s.stage.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Overdue by Priority</h3>
              <span className="text-sm text-gray-500">open only</span>
            </div>
            <div className="grid grid-cols-3 gap-4 items-end h-40">
              {overdueByPriority.map(p => (
                <div key={p.priority} className="flex flex-col items-center justify-end h-full">
                  <div
                    className="bg-red-500 rounded-t w-full"
                    style={{ height: `${Math.max(4, (p.count / maxOverdue) * 160)}px` }}
                  />
                  <div className="text-[11px] mt-1 text-gray-500">{p.priority}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Top Products (Usage)</h3>
              <span className="text-sm text-gray-500">top 8</span>
            </div>
            <div className="space-y-2">
              {topProducts.map(p => (
                <div key={p.productId} className="flex items-center gap-2">
                  <div className="w-40 truncate" title={p.name}>
                    {p.name}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-4"
                      style={{
                        width: `${Math.min(100, (p.usage / (topProducts[0]?.usage || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">{p.usage}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Winning Products (by wins)</h3>
              <span className="text-sm text-gray-500">top 10</span>
            </div>
            <div className="space-y-2">
              {topWinning.map(p => (
                <div key={p.productId} className="flex items-center gap-2">
                  <div className="w-40 truncate" title={p.name}>
                    {p.name}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                    <div
                      className="bg-amber-500 h-4"
                      style={{
                        width: `${Math.min(100, (p.wins / (topWinning[0]?.wins || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-right text-sm text-gray-600">{p.wins}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">Top Product Bundles</h3>
              <span className="text-sm text-gray-500">pairs by frequency</span>
            </div>
            <div className="space-y-2">
              {bundles.map(pair => (
                <div key={`${pair.aId}-${pair.bId}`} className="flex items-center gap-2">
                  <div className="w-56 truncate" title={`${pair.aName} + ${pair.bName}`}>
                    {pair.aName} + {pair.bName}
                  </div>
                  <div className="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
                    <div
                      className="bg-sky-500 h-4"
                      style={{
                        width: `${Math.min(100, (pair.count / (bundles[0]?.count || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="w-10 text-right text-sm text-gray-600">{pair.count}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
