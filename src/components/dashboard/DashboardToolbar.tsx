'use client';

import {
  useDashboardFilters,
  useDashboardUIActions,
  type DashboardUIState,
  type TimeRange,
} from '@/lib/store/dashboardStore';
import { useDashboardData } from '@/hooks/dashboard/useDashboardData';
import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const ranges = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

export default function DashboardToolbar() {
  const { search, status, timeRange } = useDashboardFilters();
  const { setFilters } = useDashboardUIActions();
  const { dashboardData } = useDashboardData({});

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);
  const paramsString = useMemo(() => searchParams.toString(), [searchParams]);

  // Initialize from URL on mount (once)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const next: Partial<DashboardUIState['filters']> = {};
    const urlParams = new URLSearchParams(paramsString);
    const urlSearch = urlParams.get('search') || '';
    const urlStatusRaw = urlParams.get('status') || undefined;
    const urlRangeRaw = urlParams.get('range') || undefined;

    const statuses = ['all', 'active', 'overdue', 'won'] as const;
    type StatusUnion = (typeof statuses)[number];
    const isStatus = (v: string): v is NonNullable<DashboardUIState['filters']['status']> =>
      (statuses as readonly string[]).includes(v);

    const rangesConst = ['day', 'week', 'month', 'quarter', 'year'] as const;
    type RangeUnion = (typeof rangesConst)[number];
    const isRange = (v: string): v is TimeRange => (rangesConst as readonly string[]).includes(v);

    if (typeof urlSearch === 'string') next.search = urlSearch;
    if (urlStatusRaw && isStatus(urlStatusRaw)) next.status = urlStatusRaw;
    if (urlRangeRaw && isRange(urlRangeRaw)) next.timeRange = urlRangeRaw;

    // Only set if different from current store
    const changed = (
      (typeof next.search !== 'undefined' && next.search !== (search || '')) ||
      (typeof next.status !== 'undefined' && next.status !== (status || 'all')) ||
      (typeof next.timeRange !== 'undefined' && next.timeRange !== timeRange)
    );

    if (changed) setFilters(next);
  // Intentionally exclude setFilters from deps; run only once using ref
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString, search, status, timeRange]);

  // Debounced URL sync when filters change (shareable URLs)
  useEffect(() => {
    const currentParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : searchParams.toString()
    );

    const nextParams = new URLSearchParams(currentParams);
    // Update params
    if (search) nextParams.set('search', search);
    else nextParams.delete('search');

    if (status && status !== 'all') nextParams.set('status', status);
    else nextParams.delete('status');

    if (timeRange) nextParams.set('range', timeRange);
    else nextParams.delete('range');

    // Only replace if something actually changed
    const nextStr = nextParams.toString();
    const currStr = currentParams.toString();
    if (nextStr === currStr) return;

    const t = setTimeout(() => {
      router.replace(`${pathname}${nextStr ? `?${nextStr}` : ''}`, { scroll: false });
    }, 300);

    return () => clearTimeout(t);
  }, [search, status, timeRange, pathname, router, searchParams]);

  const metrics = dashboardData?.proposals?.metrics;

  return (
    <div className="flex items-center gap-3" aria-label="Dashboard toolbar">
      {/* Search */}
      <input
        type="search"
        placeholder="Search…"
        value={search || ''}
        onChange={e => setFilters({ search: e.target.value })}
        className="text-sm border rounded-md px-2 py-1 bg-white dark:bg-gray-900 dark:border-gray-700 min-w-[180px]"
        aria-label="Search"
      />

      {/* Status */}
      <select
        id="status-filter"
        value={status || 'all'}
        onChange={e => {
          const v = e.target.value;
          const statusValue: DashboardUIState['filters']['status'] =
            v === 'all' || v === 'active' || v === 'overdue' || v === 'won' ? v : 'all';
          setFilters({ status: statusValue });
        }}
        className="text-sm border rounded-md px-2 py-1 bg-white dark:bg-gray-900 dark:border-gray-700"
        aria-label="Status filter"
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="overdue">Overdue</option>
        <option value="won">Won</option>
      </select>

      {/* Time Range */}
      <label htmlFor="time-range" className="text-sm text-gray-600">
        Range
      </label>
      <select
        id="time-range"
        value={timeRange}
        onChange={e => {
          const v = e.target.value;
          const rangeValue: TimeRange =
            v === 'day' || v === 'week' || v === 'month' || v === 'quarter' || v === 'year'
              ? (v as TimeRange)
              : 'week';
          setFilters({ timeRange: rangeValue });
        }}
        className="text-sm border rounded-md px-2 py-1 bg-white dark:bg-gray-900 dark:border-gray-700"
      >
        {ranges.map(r => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {/* Analytics chips */}
      <div className="hidden md:flex items-center gap-2 ml-2" aria-label="KPI chips">
        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Total: {metrics?.total ?? 0}
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Active: {metrics?.active ?? 0}
        </span>
        <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
          Win Rate: {metrics?.winRate ?? 0}%
        </span>
      </div>
    </div>
  );
}
