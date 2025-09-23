/**
 * PosalPro MVP2 - Tier Settings Hook
 * Manages application tier state and sidebar filtering
 * Follows useApiClient pattern for CORE_REQUIREMENTS.md compliance
 */

import { useApiClient } from '@/hooks/useApiClient';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { useCallback, useEffect, useState } from 'react';

export type ApplicationTier = 'basic' | 'advanced' | 'enterprise';

interface UseTierSettingsReturn {
  currentTier: ApplicationTier;
  isLoading: boolean;
  updateTier: (tier: ApplicationTier) => Promise<void>;
  getSidebarItems: () => string[];
}

// Define which sidebar items are available for each tier
const TIER_SIDEBAR_CONFIG: Record<ApplicationTier, string[]> = {
  basic: ['dashboard', 'proposals', 'products', 'customers', 'admin'],
  advanced: [
    'dashboard',
    'proposals',
    'products',
    'customers',
    'coordination',
    'validation',
    'admin',
  ],
  enterprise: ['all'], // Special value indicating all items should be shown
};

export function useTierSettings(): UseTierSettingsReturn {
  const [currentTier, setCurrentTier] = useState<ApplicationTier>('basic');
  const [isLoading, setIsLoading] = useState(true);
  const apiClient = useApiClient();
  const TIER_EVENT = 'posalpro:tier-updated';

  // Load current tier from backend
  useEffect(() => {
    const loadTierSettings = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/api/user/preferences');
        const data = response as { data?: { applicationTier?: ApplicationTier } };

        if (data.data?.applicationTier) {
          setCurrentTier(data.data.applicationTier);
        }
      } catch (error) {
        const errorHandlingService = ErrorHandlingService.getInstance();
        errorHandlingService.processError(error as Error, 'Failed to load tier settings');
        // Continue with default tier
      } finally {
        setIsLoading(false);
      }
    };

    loadTierSettings();
  }, [apiClient]);

  // Listen for cross-component tier updates (Settings page → Sidebar, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onTierUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ tier?: ApplicationTier }>).detail;
      if (detail && detail.tier) {
        setCurrentTier(detail.tier);
      }
    };
    window.addEventListener(TIER_EVENT, onTierUpdated as EventListener);
    return () => window.removeEventListener(TIER_EVENT, onTierUpdated as EventListener);
  }, []);

  // Update tier setting
  const updateTier = useCallback(
    async (tier: ApplicationTier) => {
      try {
        setIsLoading(true);
        await apiClient.put('/api/user/preferences', {
          applicationTier: tier,
        });
        setCurrentTier(tier);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(TIER_EVENT, { detail: { tier } }));
        }
      } catch (error) {
        const errorHandlingService = ErrorHandlingService.getInstance();
        errorHandlingService.processError(error as Error, 'Failed to update tier setting');
        throw error; // Re-throw for UI error handling
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient]
  );

  // Get sidebar items for current tier
  const getSidebarItems = useCallback(() => {
    return TIER_SIDEBAR_CONFIG[currentTier] || TIER_SIDEBAR_CONFIG.basic;
  }, [currentTier]);

  return {
    currentTier,
    isLoading,
    updateTier,
    getSidebarItems,
  };
}
