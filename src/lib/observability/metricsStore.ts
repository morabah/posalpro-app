export interface MetricPoint { ts: number; value: number }

const latencyPoints: MetricPoint[] = [];
const dbLatencyPoints: MetricPoint[] = [];
const errorCodes: Record<string, number> = {};
let cacheHits = 0;
let cacheMisses = 0;

// Web Vitals tracking
type WebVitalName = 'FCP' | 'LCP' | 'CLS' | 'TTFB' | 'INP';
const webVitalPoints: Record<WebVitalName, MetricPoint[]> = {
  FCP: [],
  LCP: [],
  CLS: [],
  TTFB: [],
  INP: [],
};

export interface VitalBuckets { total: number; good: number; needsImprovement: number; poor: number }
const webVitalBuckets: Record<WebVitalName, VitalBuckets> = {
  FCP: { total: 0, good: 0, needsImprovement: 0, poor: 0 },
  LCP: { total: 0, good: 0, needsImprovement: 0, poor: 0 },
  CLS: { total: 0, good: 0, needsImprovement: 0, poor: 0 },
  TTFB: { total: 0, good: 0, needsImprovement: 0, poor: 0 },
  INP: { total: 0, good: 0, needsImprovement: 0, poor: 0 },
};

export function recordLatency(ms: number) {
  latencyPoints.push({ ts: Date.now(), value: ms });
  if (latencyPoints.length > 1000) latencyPoints.shift();
}

export function recordDbLatency(ms: number) {
  dbLatencyPoints.push({ ts: Date.now(), value: ms });
  if (dbLatencyPoints.length > 1000) dbLatencyPoints.shift();
}

export function recordError(code: string) {
  errorCodes[code] = (errorCodes[code] || 0) + 1;
}

export function recordCacheHit() {
  cacheHits += 1;
}

export function recordCacheMiss() {
  cacheMisses += 1;
}

// Classify web vitals into simple buckets (good/needs improvement/poor) per Web Vitals guidance
function classifyVital(name: WebVitalName, value: number): 'good' | 'needsImprovement' | 'poor' {
  switch (name) {
    case 'LCP':
      return value < 2500 ? 'good' : value < 4000 ? 'needsImprovement' : 'poor';
    case 'INP':
      return value < 200 ? 'good' : value < 500 ? 'needsImprovement' : 'poor';
    case 'CLS':
      return value < 0.1 ? 'good' : value < 0.25 ? 'needsImprovement' : 'poor';
    case 'TTFB':
      return value < 800 ? 'good' : value < 1800 ? 'needsImprovement' : 'poor';
    case 'FCP':
      return value < 1800 ? 'good' : value < 3000 ? 'needsImprovement' : 'poor';
    default:
      return 'needsImprovement';
  }
}

export function recordWebVital(name: WebVitalName, value: number) {
  const arr = webVitalPoints[name];
  arr.push({ ts: Date.now(), value });
  if (arr.length > 1000) arr.shift();
  const cls = classifyVital(name, value);
  const b = webVitalBuckets[name];
  b.total += 1;
  if (cls === 'good') b.good += 1;
  else if (cls === 'needsImprovement') b.needsImprovement += 1;
  else b.poor += 1;
}

function percentile(values: number[], q: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((q / 100) * (sorted.length - 1))];
}

export function snapshot() {
  const appVals = latencyPoints.map(p => p.value);
  const dbVals = dbLatencyPoints.map(p => p.value);
  const errors = Object.values(errorCodes).reduce((a, b) => a + b, 0);
  const cacheTotal = cacheHits + cacheMisses;
  const vitalSummary = (name: WebVitalName) => {
    const pts = webVitalPoints[name].map(p => p.value);
    const buckets = webVitalBuckets[name];
    return {
      count: buckets.total,
      good: buckets.good,
      needsImprovement: buckets.needsImprovement,
      poor: buckets.poor,
      p95: percentile(pts, 95),
      p99: percentile(pts, 99),
    };
  };
  return {
    requests: {
      count: appVals.length,
      p95: percentile(appVals, 95),
      p99: percentile(appVals, 99),
    },
    db: {
      count: dbVals.length,
      p95: percentile(dbVals, 95),
      p99: percentile(dbVals, 99),
    },
    cache: {
      hit: cacheHits,
      miss: cacheMisses,
      ratio: cacheTotal ? cacheHits / cacheTotal : 0,
    },
    errors: {
      total: errors,
      codes: errorCodes,
    },
    webVitals: {
      FCP: vitalSummary('FCP'),
      LCP: vitalSummary('LCP'),
      CLS: vitalSummary('CLS'),
      TTFB: vitalSummary('TTFB'),
      INP: vitalSummary('INP'),
    },
  };
}
