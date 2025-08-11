/**
 * PosalPro MVP2 - Mobile Responsive Wrapper
 * Ensures consistent mobile responsiveness across all components
 */

'use client';

import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import React from 'react';

interface MobileResponsiveWrapperProps {
  children: React.ReactNode;
  className?: string;
  enableMobilePadding?: boolean;
  enableTouchTargets?: boolean;
  variant?: 'page' | 'card' | 'grid' | 'form';
}

const variantClasses = {
  page: {
    mobile: 'px-4 py-6',
    tablet: 'sm:px-6 sm:py-8',
    desktop: 'lg:px-8 lg:py-10',
  },
  card: {
    mobile: 'p-4',
    tablet: 'sm:p-6',
    desktop: 'lg:p-8',
  },
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'sm:grid-cols-2',
    desktop: 'lg:grid-cols-3 xl:grid-cols-4',
  },
  form: {
    mobile: 'space-y-4',
    tablet: 'sm:space-y-6',
    desktop: 'lg:space-y-8',
  },
};

export function MobileResponsiveWrapper({
  children,
  className = '',
  enableMobilePadding = true,
  enableTouchTargets = true,
  variant = 'page',
}: MobileResponsiveWrapperProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getResponsiveClasses = () => {
    const classes = [];

    if (enableMobilePadding) {
      const variantClass = variantClasses[variant];
      classes.push(variantClass.mobile);
      classes.push(variantClass.tablet);
      classes.push(variantClass.desktop);
    }

    if (enableTouchTargets) {
      classes.push('touch-manipulation');
      if (isMobile) {
        classes.push('[&_button]:min-h-[44px]', '[&_a]:min-h-[44px]');
      }
    }

    return classes.join(' ');
  };

  const responsiveClasses = getResponsiveClasses();

  return (
    <div
      className={cn(
        'mobile-responsive-wrapper',
        responsiveClasses,
        {
          'mobile-layout': isMobile,
          'tablet-layout': isTablet,
          'desktop-layout': isDesktop,
        },
        className
      )}
    >
      {children}
    </div>
  );
}
