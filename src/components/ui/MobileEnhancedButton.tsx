/**
 * PosalPro MVP2 - Mobile Enhanced Button Component
 * WCAG 2.1 AA Compliant with Optimal Touch Targets
 * Component Traceability Matrix: US-8.1, US-8.4, H9, H10
 *
 * Features:
 * - Minimum 44px touch targets (WCAG 2.1 AA)
 * - Responsive sizing and spacing
 * - Touch feedback and haptic support
 * - Accessibility optimizations
 * - Performance optimized with centralized responsive detection
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import React, { forwardRef, useCallback } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.4', 'US-1.1'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.2', 'AC-8.4.1'],
  methods: [
    'ensureTouchTargetCompliance()',
    'optimizeMobileInteraction()',
    'implementAccessibilityStandards()',
  ],
  hypotheses: ['H9', 'H10'], // Mobile UX optimization
  testCases: ['TC-H9-003', 'TC-H10-002'],
};

export interface MobileEnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant for different use cases
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

  /**
   * Size variant - all variants ensure minimum 44px touch targets
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Enable haptic feedback on supported devices
   */
  enableHaptics?: boolean;

  /**
   * Loading state with accessible loading indicator
   */
  loading?: boolean;

  /**
   * Icon to display alongside text
   */
  icon?: React.ReactNode;

  /**
   * Icon position
   */
  iconPosition?: 'left' | 'right';

  /**
   * Full width on mobile
   */
  fullWidthMobile?: boolean;

  /**
   * Analytics tracking identifier
   */
  trackingId?: string;
}

export const MobileEnhancedButton = forwardRef<HTMLButtonElement, MobileEnhancedButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      enableHaptics = true,
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidthMobile = false,
      trackingId,
      onClick,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const { isMobile, isTablet, isDesktop } = useResponsive();
    const { trackOptimized: analytics } = useOptimizedAnalytics();
    const { handleAsyncError } = useErrorHandler();

    // ✅ WCAG 2.1 AA COMPLIANT: Minimum 44px touch targets
    const sizeClasses = {
      sm: {
        base: 'min-h-[44px] px-4 py-2 text-sm',
        mobile: 'min-h-[48px] px-5 py-3 text-base', // Enhanced for mobile
        icon: 'w-4 h-4',
      },
      md: {
        base: 'min-h-[44px] px-6 py-3 text-base',
        mobile: 'min-h-[52px] px-7 py-4 text-lg', // Enhanced for mobile
        icon: 'w-5 h-5',
      },
      lg: {
        base: 'min-h-[48px] px-8 py-4 text-lg',
        mobile: 'min-h-[56px] px-9 py-5 text-xl', // Enhanced for mobile
        icon: 'w-6 h-6',
      },
      xl: {
        base: 'min-h-[52px] px-10 py-5 text-xl',
        mobile: 'min-h-[60px] px-11 py-6 text-2xl', // Enhanced for mobile
        icon: 'w-7 h-7',
      },
    };

    const variantClasses = {
      primary: {
        base: 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white',
        mobile: 'active:bg-blue-800 active:scale-[0.98]', // Touch feedback
        focus: 'focus:ring-4 focus:ring-blue-200',
      },
      secondary: {
        base: 'bg-gray-600 hover:bg-gray-700 focus:bg-gray-700 text-white',
        mobile: 'active:bg-gray-800 active:scale-[0.98]',
        focus: 'focus:ring-4 focus:ring-gray-200',
      },
      outline: {
        base: 'border-2 border-gray-300 hover:border-gray-400 focus:border-gray-400 bg-white text-gray-700',
        mobile: 'active:border-gray-500 active:scale-[0.98]',
        focus: 'focus:ring-4 focus:ring-gray-100',
      },
      ghost: {
        base: 'hover:bg-gray-100 focus:bg-gray-100 text-gray-700',
        mobile: 'active:bg-gray-200 active:scale-[0.98]',
        focus: 'focus:ring-4 focus:ring-gray-100',
      },
      destructive: {
        base: 'bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white',
        mobile: 'active:bg-red-800 active:scale-[0.98]',
        focus: 'focus:ring-4 focus:ring-red-200',
      },
    };

    // ✅ PERFORMANCE: Haptic feedback for supported devices
    const triggerHapticFeedback = useCallback(() => {
      if (enableHaptics && 'vibrate' in navigator && isMobile) {
        try {
          navigator.vibrate(10); // Subtle 10ms vibration
        } catch (error) {
          // Silently fail if haptics not supported
        }
      }
    }, [enableHaptics, isMobile]);

    // ✅ PERFORMANCE OPTIMIZED: Lightweight click tracking
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        try {
          // ⚡ IMMEDIATE: Trigger haptic feedback first (non-blocking)
          triggerHapticFeedback();

          // ⚡ IMMEDIATE: Call original onClick handler FIRST
          onClick?.(event);

          // ⚡ ASYNC: Defer analytics to prevent UI blocking
          if (trackingId) {
            // Use requestIdleCallback if available, otherwise setTimeout
            const trackAnalytics = () => {
              try {
                analytics('mobile_button_interaction', {
                  buttonId: trackingId,
                  variant,
                  size,
                  deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
                }, 'low');
              } catch (error) {
                // Silent analytics failure to prevent UI impact
                console.warn('Analytics tracking failed silently:', error);
              }
            };

            // Use idle callback for better performance
            if ('requestIdleCallback' in window) {
              requestIdleCallback(trackAnalytics);
            } else {
              setTimeout(trackAnalytics, 0);
            }
          }
        } catch (error) {
          // Log error but don't block user interaction
          console.error('Button click error:', error);
          
          // Still try to execute the original onClick if it wasn't called yet
          if (!event.defaultPrevented) {
            try {
              onClick?.(event);
            } catch (onClickError) {
              handleAsyncError(onClickError, 'Button onClick handler failed', {
                component: 'MobileEnhancedButton',
                trackingId,
              });
            }
          }
        }
      },
      [onClick, triggerHapticFeedback, analytics, trackingId, variant, size, isMobile, isTablet, handleAsyncError]
    );

    const currentSizeClass = sizeClasses[size];
    const currentVariantClass = variantClasses[variant];

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',

          // ✅ MOBILE OPTIMIZATIONS
          'touch-manipulation', // Optimize touch handling
          'will-change-transform', // GPU acceleration
          'select-none', // Prevent text selection on touch

          // Size classes - responsive
          isMobile ? currentSizeClass.mobile : currentSizeClass.base,

          // Variant classes
          currentVariantClass.base,
          currentVariantClass.focus,
          isMobile && currentVariantClass.mobile,

          // Full width on mobile
          fullWidthMobile && isMobile && 'w-full',

          // Loading state
          loading && 'cursor-wait',

          className
        )}
        onClick={handleClick}
        disabled={disabled || loading}
        aria-label={loading ? 'Loading...' : undefined}
        aria-busy={loading}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-current border-t-transparent',
              currentSizeClass.icon
            )}
            aria-hidden="true"
          />
        )}

        {/* Left icon */}
        {icon && iconPosition === 'left' && !loading && (
          <span className={cn(currentSizeClass.icon, 'flex-shrink-0')} aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Button text */}
        {children && <span className={loading ? 'opacity-70' : ''}>{children}</span>}

        {/* Right icon */}
        {icon && iconPosition === 'right' && !loading && (
          <span className={cn(currentSizeClass.icon, 'flex-shrink-0')} aria-hidden="true">
            {icon}
          </span>
        )}
      </button>
    );
  }
);

MobileEnhancedButton.displayName = 'MobileEnhancedButton';

/**
 * Quick action button optimized for mobile dashboards
 */
export interface QuickActionButtonProps
  extends Omit<MobileEnhancedButtonProps, 'variant' | 'size'> {
  /**
   * Action type for consistent styling
   */
  actionType?: 'create' | 'edit' | 'delete' | 'view' | 'approve' | 'reject';
}

export const QuickActionButton = forwardRef<HTMLButtonElement, QuickActionButtonProps>(
  ({ actionType = 'view', ...props }, ref) => {
    const actionConfig = {
      create: { variant: 'primary' as const, size: 'md' as const },
      edit: { variant: 'outline' as const, size: 'md' as const },
      delete: { variant: 'destructive' as const, size: 'md' as const },
      view: { variant: 'ghost' as const, size: 'md' as const },
      approve: { variant: 'primary' as const, size: 'md' as const },
      reject: { variant: 'destructive' as const, size: 'md' as const },
    };

    return (
      <MobileEnhancedButton
        ref={ref}
        {...actionConfig[actionType]}
        fullWidthMobile={true}
        enableHaptics={true}
        {...props}
      />
    );
  }
);

QuickActionButton.displayName = 'QuickActionButton';
