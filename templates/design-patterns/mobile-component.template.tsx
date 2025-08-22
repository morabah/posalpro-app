// __FILE_DESCRIPTION__: Mobile-optimized component template with 44px touch targets and responsive design
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

'use client';

import React from 'react';
import { logInfo, logDebug } from '@/lib/logger';
import { Button } from '@/components/ui/forms/Button';
import { Card } from '@/components/ui/Card';

export type __MOBILE_COMPONENT_NAME__Props = {
  title: string;
  onAction?: () => void;
  onTouch?: (event: React.TouchEvent) => void;
  disabled?: boolean;
  'data-testid'?: string;
};

export function __MOBILE_COMPONENT_NAME__({
  title,
  onAction,
  onTouch,
  disabled = false,
  'data-testid': dataTestId = '__MOBILE_COMPONENT_NAME__',
}: __MOBILE_COMPONENT_NAME__Props) {
  const [isTouching, setIsTouching] = React.useState(false);

  // Handle touch events with proper event filtering for forms
  const handleTouchStart = React.useCallback((event: React.TouchEvent) => {
    // Skip gesture handling if touching input/select/textarea/button elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.closest('input, select, textarea, button')
    ) {
      return;
    }

    setIsTouching(true);

    logDebug('Touch start', {
      component: '__MOBILE_COMPONENT_NAME__',
      operation: 'touch_start',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    onTouch?.(event);
  }, [onTouch]);

  const handleTouchEnd = React.useCallback(() => {
    setIsTouching(false);

    logDebug('Touch end', {
      component: '__MOBILE_COMPONENT_NAME__',
      operation: 'touch_end',
    });
  }, []);

  const handleAction = React.useCallback((event: React.MouseEvent) => {
    // Use stopPropagation + visual feedback for form components
    event.stopPropagation();

    logInfo('Action triggered', {
      component: '__MOBILE_COMPONENT_NAME__',
      operation: 'action',
      target: 'button',
      context: { title },
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
    });

    onAction?.();
  }, [onAction, title]);

  return (
    <Card
      data-testid={dataTestId}
      role="region"
      aria-label={title}
      className={`
        transition-all duration-200
        ${isTouching ? 'scale-98 bg-primary-50' : ''}
        ${disabled ? 'opacity-60 pointer-events-none' : ''}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 grid gap-4">
        {/* Mobile-optimized header with proper spacing */}
        <h2 className="text-lg font-semibold leading-tight">
          {title}
        </h2>

        {/* Content area with mobile-friendly spacing */}
        <div className="space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            Mobile-optimized content goes here. Use proper line-height and spacing.
          </p>
        </div>

        {/* 44px+ touch target button per WCAG 2.1 AA */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={handleAction}
            disabled={disabled}
            size="md" // Ensures 44px minimum height
            className="min-h-[44px] min-w-[44px] touch-manipulation" // Enforce 44px touch target
            aria-label={`${title} action`}
            data-testid={`${dataTestId}-action-button`}
          >
            Action
          </Button>

          {/* Secondary action with proper touch target */}
          <Button
            type="button"
            variant="outline"
            size="md"
            className="min-h-[44px] min-w-[44px] touch-manipulation"
            aria-label={`${title} secondary action`}
            data-testid={`${dataTestId}-secondary-button`}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Mobile responsiveness hook for this component
export function useMobileOptimizations() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [touchSupported, setTouchSupported] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setTouchSupported('ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile, touchSupported };
}
