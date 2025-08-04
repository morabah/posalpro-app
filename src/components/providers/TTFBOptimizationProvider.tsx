'use client';

import TTFBOptimizer from '@/lib/performance/TTFBOptimizer';
import React, { useEffect } from 'react';

interface TTFBOptimizationProviderProps {
  children: React.ReactNode;
}

export const TTFBOptimizationProvider: React.FC<TTFBOptimizationProviderProps> = ({ children }) => {
  // ✅ CRITICAL: Initialize TTFB optimization in Client Component
  useEffect(() => {
    const ttfbOptimizer = TTFBOptimizer.getInstance();
    ttfbOptimizer.optimizeTTFB();
    ttfbOptimizer.monitorTTFB();
  }, []);

  return <>{children}</>;
};
