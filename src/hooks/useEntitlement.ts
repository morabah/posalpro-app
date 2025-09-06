"use client";

import { useEffect, useMemo, useState } from 'react';

type EntitlementMap = Record<string, string | true>;

export function useEntitlements() {
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<EntitlementMap>({});
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/tenant/entitlements', { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch entitlements (${res.status})`);
        const json = await res.json();
        if (!cancelled) setMap(json?.data?.map ?? {});
      } catch (e) {
        if (!cancelled) setError(e as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const has = (key: string) => Boolean(map[key]);
  const keys = useMemo(() => Object.keys(map).sort(), [map]);

  return { loading, error, map, keys, has };
}

export function useEntitlement(key: string): boolean {
  const { loading, map } = useEntitlements();
  if (loading) return false; // conservative until loaded
  return Boolean(map[key]);
}

