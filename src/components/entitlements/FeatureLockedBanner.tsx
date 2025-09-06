"use client";

import React from 'react';
import { useEntitlement } from '@/hooks/useEntitlement';

type Props = {
  featureKey: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  href?: string;
};

export default function FeatureLockedBanner({
  featureKey,
  title = 'Feature Locked',
  description = 'This feature is not enabled for your plan. Contact your admin or upgrade to unlock it.',
  ctaLabel = 'Learn more',
  onCtaClick,
  href,
}: Props) {
  const enabled = useEntitlement(featureKey);
  if (enabled) return null;

  const Button = () => (
    href ? (
      <a
        href={href}
        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {ctaLabel}
      </a>
    ) : (
      <button
        type="button"
        onClick={onCtaClick}
        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {ctaLabel}
      </button>
    )
  );

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 flex-none text-amber-600"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-10.5a.75.75 0 011.5 0v4a.75.75 0 01-1.5 0v-4zm.75 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm">{description}</p>
          <div className="mt-3">
            <Button />
          </div>
        </div>
      </div>
    </div>
  );
}

