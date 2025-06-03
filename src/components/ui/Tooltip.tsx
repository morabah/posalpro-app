/**
 * PosalPro MVP2 - Tooltip Component
 * Accessible tooltip with positioning, animations, and keyboard support
 * WCAG 2.1 AA compliant with proper focus management
 */

'use client';

import { cn } from '@/lib/utils';
import React, {
  cloneElement,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export interface TooltipProps {
  /**
   * Tooltip content
   */
  content: React.ReactNode;

  /**
   * Element that triggers the tooltip
   */
  children: React.ReactElement;

  /**
   * Tooltip placement
   */
  placement?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Show delay in milliseconds
   */
  showDelay?: number;

  /**
   * Hide delay in milliseconds
   */
  hideDelay?: number;

  /**
   * Disable the tooltip
   */
  disabled?: boolean;

  /**
   * Keep tooltip open (for debugging)
   */
  open?: boolean;

  /**
   * Trigger method
   */
  trigger?: 'hover' | 'focus' | 'click' | 'manual';

  /**
   * Additional CSS classes for tooltip
   */
  className?: string;

  /**
   * Additional CSS classes for arrow
   */
  arrowClassName?: string;

  /**
   * Show arrow
   */
  showArrow?: boolean;

  /**
   * Maximum width
   */
  maxWidth?: string;

  /**
   * Z-index for tooltip
   */
  zIndex?: number;
}

/**
 * Tooltip component
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      placement = 'top',
      showDelay = 200,
      hideDelay = 0,
      disabled = false,
      open: controlledOpen,
      trigger = 'hover',
      className,
      arrowClassName,
      showArrow = true,
      maxWidth = '200px',
      zIndex = 50,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement>(null);
    const showTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Use controlled open state if provided
    const isVisible = controlledOpen !== undefined ? controlledOpen : isOpen;

    // Clear timeouts
    const clearTimeouts = useCallback(() => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = undefined;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = undefined;
      }
    }, []);

    // Show tooltip
    const showTooltip = useCallback(() => {
      if (disabled) return;
      clearTimeouts();
      showTimeoutRef.current = setTimeout(() => {
        setIsOpen(true);
      }, showDelay);
    }, [disabled, showDelay, clearTimeouts]);

    // Hide tooltip
    const hideTooltip = useCallback(() => {
      clearTimeouts();
      hideTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, hideDelay);
    }, [hideDelay, clearTimeouts]);

    // Calculate position
    const updatePosition = useCallback(() => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 8;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = triggerRect.bottom + 8;
          left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.left - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
          left = triggerRect.right + 8;
          break;
      }

      // Viewport boundary adjustments
      if (left < 8) left = 8;
      if (left + tooltipRect.width > viewport.width - 8) {
        left = viewport.width - tooltipRect.width - 8;
      }
      if (top < 8) top = 8;
      if (top + tooltipRect.height > viewport.height - 8) {
        top = viewport.height - tooltipRect.height - 8;
      }

      setPosition({ top, left });
    }, [placement]);

    // Update position when visible
    useEffect(() => {
      if (isVisible) {
        updatePosition();
        window.addEventListener('scroll', updatePosition);
        window.addEventListener('resize', updatePosition);
        return () => {
          window.removeEventListener('scroll', updatePosition);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [isVisible, updatePosition]);

    // Cleanup timeouts on unmount
    useEffect(() => {
      return clearTimeouts;
    }, [clearTimeouts]);

    // Handle escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isVisible) {
          setIsOpen(false);
        }
      };

      if (isVisible) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isVisible]);

    // Trigger event handlers
    const triggerHandlers = {
      hover: {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      },
      focus: {
        onFocus: showTooltip,
        onBlur: hideTooltip,
      },
      click: {
        onClick: () => {
          if (isVisible) {
            hideTooltip();
          } else {
            showTooltip();
          }
        },
      },
      manual: {},
    };

    // Arrow positioning
    const arrowStyles = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
      bottom:
        'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
      right:
        'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
    };

    // Clone children with event handlers
    const triggerElement = isValidElement(children)
      ? cloneElement(children as React.ReactElement<any>, {
          ...triggerHandlers[trigger],
          ref: (node: HTMLElement) => {
            triggerRef.current = node;
          },
          'aria-describedby': isVisible
            ? `tooltip-${Math.random().toString(36).substr(2, 9)}`
            : undefined,
        })
      : children;

    return (
      <>
        {triggerElement}

        {/* Tooltip Portal */}
        {isVisible && (
          <div
            ref={tooltipRef}
            role="tooltip"
            className={cn(
              'fixed px-2 py-1 text-sm text-white bg-neutral-900 rounded shadow-lg pointer-events-none',
              'animate-in fade-in-0 zoom-in-95 duration-200',
              'z-50',
              className
            )}
            style={{
              top: position.top,
              left: position.left,
              maxWidth,
              zIndex,
            }}
          >
            {content}

            {/* Arrow */}
            {showArrow && (
              <div
                className={cn(
                  'absolute w-0 h-0 border-4',
                  arrowStyles[placement],
                  placement === 'top' && 'border-t-neutral-900',
                  placement === 'bottom' && 'border-b-neutral-900',
                  placement === 'left' && 'border-l-neutral-900',
                  placement === 'right' && 'border-r-neutral-900',
                  arrowClassName
                )}
              />
            )}
          </div>
        )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

/**
 * Simple tooltip wrapper for common use cases
 */
export interface SimpleTooltipProps {
  /**
   * Tooltip text
   */
  text: string;

  /**
   * Children to wrap
   */
  children: React.ReactElement;

  /**
   * Placement
   */
  placement?: TooltipProps['placement'];

  /**
   * Additional props for Tooltip
   */
  tooltipProps?: Partial<TooltipProps>;
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  text,
  children,
  placement = 'top',
  tooltipProps,
}) => {
  return (
    <Tooltip content={text} placement={placement} {...tooltipProps}>
      {children}
    </Tooltip>
  );
};

SimpleTooltip.displayName = 'SimpleTooltip';
