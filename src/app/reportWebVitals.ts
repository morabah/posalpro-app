// Next.js App Router reportWebVitals hook
// Sends Web Vitals metrics via Beacon to a local API for aggregation

import type { NextWebVitalsMetric } from 'next/app';
import { apiClient } from '@/lib/api/client';

export function reportWebVitals(metric: NextWebVitalsMetric) {
  try {
    const url = '/api/observability/web-vitals';
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      label: metric.label,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      // Fallback to centralized API client
       
      apiClient
        .post<void>(url, JSON.parse(body))
        .catch(() => {});
    }
  } catch {
    // no-op
  }
}
