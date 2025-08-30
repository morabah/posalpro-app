"use client";

import React, { createContext, useContext, useMemo } from 'react';
import { getFeatureFlags } from '@/lib/env';

export type FeatureFlags = ReturnType<typeof getFeatureFlags>;

const FlagsContext = createContext<FeatureFlags | null>(null);

export interface FlagsProviderProps {
  initial?: Partial<FeatureFlags>;
  children: React.ReactNode;
}

export function FlagsProvider({ initial, children }: FlagsProviderProps) {
  // Read default flags from env-configured source; safe in browser via env.ts
  const envFlags = getFeatureFlags();
  const value = useMemo<FeatureFlags>(() => ({
    ...envFlags,
    ...(initial || {}),
  }), [envFlags, initial]);

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

export function useFlags(): FeatureFlags {
  const ctx = useContext(FlagsContext);
  if (!ctx) {
    // Allow usage without provider by falling back to env-based flags
    return getFeatureFlags();
  }
  return ctx;
}

