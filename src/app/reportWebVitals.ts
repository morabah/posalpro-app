// Next.js App Router reportWebVitals hook
// Sends Web Vitals metrics via Beacon to a local API for aggregation

import type { NextWebVitalsMetric } from 'next/app';

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
      // Fallback to fetch in keepalive mode
      fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
  } catch {
    // no-op
  }
}
