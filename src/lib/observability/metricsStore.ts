type MetricPoint = { ts: number; value: number };

const latencyPoints: MetricPoint[] = [];
const errorCodes: Record<string, number> = {};

export function recordLatency(ms: number) {
  latencyPoints.push({ ts: Date.now(), value: ms });
  if (latencyPoints.length > 1000) latencyPoints.shift();
}

export function recordError(code: string) {
  errorCodes[code] = (errorCodes[code] || 0) + 1;
}

export function snapshot() {
  const values = latencyPoints.map(p => p.value).sort((a, b) => a - b);
  const p = (q: number) => (values.length ? values[Math.floor((q / 100) * (values.length - 1))] : 0);
  return {
    count: values.length,
    p95: p(95),
    p99: p(99),
    errorRate: Object.values(errorCodes).reduce((a, b) => a + b, 0),
    codes: errorCodes,
  };
}
