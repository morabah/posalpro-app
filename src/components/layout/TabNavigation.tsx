/**
 * PosalPro MVP2 - TabNavigation Component
 * Accessible tab navigation with keyboard support
 * WCAG 2.1 AA compliant with proper ARIA attributes
 */

'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useRef, useState } from 'react';

export interface Tab {
  /**
   * Unique identifier for the tab
   */
  id: string;

  /**
   * Display label for the tab
   */
  label: string;

  /**
   * Optional icon component
   */
  icon?: React.ReactNode;

  /**
   * Whether the tab is disabled
   */
  disabled?: boolean;

  /**
   * Badge content (e.g., notification count)
   */
  badge?: string | number;

  /**
   * Tab content
   */
  content: React.ReactNode;
}

export interface TabNavigationProps {
  /**
   * Array of tabs
   */
  tabs: Tab[];

  /**
   * Default active tab ID
   */
  defaultActiveTab?: string;

  /**
   * Controlled active tab ID
   */
  activeTab?: string;

  /**
   * Callback when tab changes
   */
  onTabChange?: (tabId: string) => void;

  /**
   * Tab orientation
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Tab variant
   */
  variant?: 'default' | 'pills' | 'underline';

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Content container classes
   */
  contentClassName?: string;
}

/**
 * Accessible Tab Navigation component
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  defaultActiveTab,
  activeTab: controlledActiveTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  className,
  contentClassName,
}) => {
  // State management
  const [internalActiveTab, setInternalActiveTab] = useState(defaultActiveTab || tabs[0]?.id || '');

  const isControlled = controlledActiveTab !== undefined;
  const activeTab = isControlled ? controlledActiveTab : internalActiveTab;

  // Refs for keyboard navigation
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const tabListRef = useRef<HTMLDivElement>(null);

  // Handle tab change
  const handleTabChange = useCallback(
    (tabId: string) => {
      if (!isControlled) {
        setInternalActiveTab(tabId);
      }
      onTabChange?.(tabId);
    },
    [isControlled, onTabChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const enabledTabs = tabs.filter(tab => !tab.disabled);
      const currentEnabledIndex = enabledTabs.findIndex(tab => tab.id === activeTab);

      let nextIndex = currentEnabledIndex;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1;
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = enabledTabs.length - 1;
          break;
        default:
          return;
      }

      const nextTab = enabledTabs[nextIndex];
      if (nextTab) {
        handleTabChange(nextTab.id);
        // Focus the next tab
        const nextTabIndex = tabs.findIndex(tab => tab.id === nextTab.id);
        tabsRef.current[nextTabIndex]?.focus();
      }
    },
    [activeTab, tabs, handleTabChange]
  );

  // Size styles
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };

  // Variant styles
  const getVariantStyles = (isActive: boolean, isDisabled: boolean) => {
    const baseStyles =
      'transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

    switch (variant) {
      case 'pills':
        return cn(
          baseStyles,
          'rounded-md',
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
          isDisabled && 'opacity-50 cursor-not-allowed'
        );
      case 'underline':
        return cn(
          baseStyles,
          'border-b-2 rounded-none',
          isActive
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300',
          isDisabled && 'opacity-50 cursor-not-allowed'
        );
      default:
        return cn(
          baseStyles,
          'border border-neutral-200 rounded-t-md -mb-px',
          isActive
            ? 'bg-white text-primary-600 border-b-white z-10'
            : 'bg-neutral-50 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
          isDisabled && 'opacity-50 cursor-not-allowed'
        );
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={cn('w-full', orientation === 'vertical' && 'flex gap-4', className)}>
      {/* Tab List */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-orientation={orientation}
        className={cn(
          'flex',
          orientation === 'horizontal'
            ? 'border-b border-neutral-200'
            : 'flex-col border-r border-neutral-200 pr-4',
          orientation === 'vertical' && 'w-48 flex-shrink-0'
        )}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              ref={el => {
                tabsRef.current[index] = el;
              }}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              aria-disabled={Boolean(isDisabled)}
              disabled={isDisabled}
              onClick={() => !isDisabled && handleTabChange(tab.id)}
              onKeyDown={e => handleKeyDown(e, index)}
              className={cn(
                'inline-flex items-center gap-2 relative',
                sizeStyles[size],
                getVariantStyles(isActive, Boolean(isDisabled))
              )}
            >
              {/* Icon */}
              {tab.icon && (
                <span className="w-4 h-4" aria-hidden="true">
                  {tab.icon}
                </span>
              )}

              {/* Label */}
              <span>{tab.label}</span>

              {/* Badge */}
              {tab.badge && (
                <span
                  className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-error-100 text-error-800 rounded-full"
                  aria-label={`${tab.badge} notifications`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div
        className={cn('flex-1', orientation === 'horizontal' ? 'mt-4' : 'ml-4', contentClassName)}
      >
        {activeTabData && (
          <div
            key={activeTabData.id}
            role="tabpanel"
            id={`tabpanel-${activeTabData.id}`}
            aria-labelledby={`tab-${activeTabData.id}`}
            tabIndex={0}
            className="focus:outline-none"
          >
            {activeTabData.content}
          </div>
        )}
      </div>
    </div>
  );
};

TabNavigation.displayName = 'TabNavigation';
