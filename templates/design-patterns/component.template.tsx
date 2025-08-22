// __FILE_DESCRIPTION__: Client component skeleton using design system and accessibility patterns
// __USER_STORY__: <short reference>
// __HYPOTHESIS__: <short reference>

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { logDebug, logInfo } from '@/lib/logger';
import React from 'react';

export type __COMPONENT_NAME__Props = {
  title: string;
  onAction?: () => void;
  disabled?: boolean;
  'data-testid'?: string;
};

export function __COMPONENT_NAME__({
  title,
  onAction,
  disabled = false,
  'data-testid': dataTestId = '__COMPONENT_NAME__',
}: __COMPONENT_NAME__Props) {
  // Component Traceability Matrix logging
  logDebug('Component render', {
    component: '__COMPONENT_NAME__',
    operation: 'render',
    userStory: '__USER_STORY__',
    hypothesis: '__HYPOTHESIS__',
    acceptanceCriteria: ['Renders title', 'Handles action clicks', 'Accessible to screen readers'],
    context: { title, disabled },
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
      data-testid={dataTestId}
      role="region"
      aria-label={title}
      className={disabled ? 'opacity-60' : ''}
    >
      <div className="p-4 grid gap-3">
        <h2 className="text-lg font-semibold" data-testid={`${dataTestId}-title`}>
          {title}
        </h2>
        <div>
          <Button
            type="button"
            onClick={handleAction}
            disabled={disabled}
            size="md" // 44px minimum for touch targets
            aria-label={`${title} action`}
            data-testid={`${dataTestId}-action-button`}
          >
            Do Action
          </Button>
        </div>
      </div>
    </Card>
  );
}
