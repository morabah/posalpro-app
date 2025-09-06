"use client";

import React from 'react';
import { useEntitlement } from '@/hooks/useEntitlement';
import FeatureLockedBanner from '@/components/entitlements/FeatureLockedBanner';

type Props = {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  bannerTitle?: string;
  bannerDescription?: string;
  bannerCtaLabel?: string;
  bannerHref?: string;
  onBannerCtaClick?: () => void;
};

export default function FeatureGate({
  featureKey,
  children,
  fallback,
  bannerTitle,
  bannerDescription,
  bannerCtaLabel,
  bannerHref,
  onBannerCtaClick,
}: Props) {
  const enabled = useEntitlement(featureKey);
  if (enabled) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <FeatureLockedBanner
      featureKey={featureKey}
      title={bannerTitle}
      description={bannerDescription}
      ctaLabel={bannerCtaLabel}
      href={bannerHref}
      onCtaClick={onBannerCtaClick}
    />
  );
}

