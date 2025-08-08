'use client';
import { useEffect, useState } from 'react';

export default function ObservabilityPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    const i = setInterval(async () => {
      const res = await fetch('/api/observability/metrics');
      const json = await res.json();
      setData(json.data);
    }, 2000);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Observability</h1>
      <pre className="mt-4 bg-gray-50 p-4 rounded border text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
