// __FILE_DESCRIPTION__: Client component skeleton using design system and accessibility patterns
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { logDebug, logInfo } from '@/lib/logger';
import { cn } from '@/lib/utils';
import React, { forwardRef, memo } from 'react';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';

export type __COMPONENT_NAME__Props = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
};

export const __COMPONENT_NAME__ = memo(
  forwardRef<HTMLDivElement, __COMPONENT_NAME__Props>(
    (
      {
        title,
        description,
        onAction,
        actionLabel = 'Do Action',
        disabled = false,
        isLoading = false,
        className,
        children,
        'data-testid': dataTestId = '__COMPONENT_NAME__',
        ...rest
      },
      ref
    ) => {
  // Component Traceability Matrix logging
  logDebug('Component render', {
    component: '__COMPONENT_NAME__',
    operation: 'render',
    userStory: '__USER_STORY__',
    hypothesis: '__HYPOTHESIS__',
    acceptanceCriteria: ['Renders title', 'Handles action clicks', 'Accessible to screen readers'],
    context: { title, disabled, isLoading },
  });

  const handleAction = React.useCallback(() => {
    logInfo('Component action', {
      component: '__COMPONENT_NAME__',
      operation: 'action_clicked',
      target: 'primary_button',
      userStory: '__USER_STORY__',
      hypothesis: '__HYPOTHESIS__',
      context: { title },
    });
    onAction?.();
  }, [onAction, title]);

  return (
    <Card
      ref={ref as any}
      data-testid={dataTestId}
      role="region"
      aria-label={title}
      aria-busy={isLoading || undefined}
      className={cn(disabled && 'opacity-60', className)}
      {...rest}
    >
      <div className="p-4 grid gap-3">
        <h2 className="text-lg font-semibold" data-testid={`${dataTestId}-title`}>
          {title}
        </h2>
        {description && (
          <p className="text-sm text-neutral-600" data-testid={`${dataTestId}-description`}>
            {description}
          </p>
        )}

        {children}

        <div className="flex items-center gap-3">
          {onAction && (
            <Button
              type="button"
              onClick={handleAction}
              disabled={disabled || isLoading}
              size="md" // 44px minimum for touch targets
              aria-label={`${title} action`}
              data-testid={`${dataTestId}-action-button`}
            >
              {actionLabel}
            </Button>
          )}
          {isLoading && <LoadingSpinner size="sm" aria-label="Loading" />}
        </div>
      </div>
    </Card>
  );
}
));

__COMPONENT_NAME__.displayName = '__COMPONENT_NAME__';
