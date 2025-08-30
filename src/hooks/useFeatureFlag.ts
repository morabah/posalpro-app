"use client";

import { useFlags } from '@/components/providers/FlagsProvider';

type FlagKey = keyof ReturnType<typeof useFlags>;

export function useFeatureFlag(key: FlagKey): boolean {
  const flags = useFlags();
  return Boolean(flags[key]);
}

