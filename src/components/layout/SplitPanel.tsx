/**
 * PosalPro MVP2 - SplitPanel Component
 * Resizable split panel layout with accessibility support
 * WCAG 2.1 AA compliant with keyboard controls
 */

'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useRef, useState } from 'react';

export interface SplitPanelProps {
  /**
   * Left/top panel content
   */
  left: React.ReactNode;

  /**
   * Right/bottom panel content
   */
  right: React.ReactNode;

  /**
   * Split direction
   */
  direction?: 'horizontal' | 'vertical';

  /**
   * Initial split percentage (0-100)
   */
  initialSplit?: number;

  /**
   * Minimum panel size in pixels
   */
  minSize?: number;

  /**
   * Whether panels are resizable
   */
  resizable?: boolean;

  /**
   * Callback when split changes
   */
  onSplitChange?: (splitPercentage: number) => void;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Left/top panel classes
   */
  leftClassName?: string;

  /**
   * Right/bottom panel classes
   */
  rightClassName?: string;
}

/**
 * Split Panel Layout component
 */
export const SplitPanel: React.FC<SplitPanelProps> = ({
  left,
  right,
  direction = 'horizontal',
  initialSplit = 50,
  minSize = 100,
  resizable = true,
  onSplitChange,
  className,
  leftClassName,
  rightClassName,
}) => {
  const [splitPercentage, setSplitPercentage] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const splitterRef = useRef<HTMLDivElement>(null);

  // Handle mouse drag
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!resizable) return;

      event.preventDefault();
      setIsDragging(true);

      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let newPercentage: number;

        if (direction === 'horizontal') {
          const x = e.clientX - rect.left;
          newPercentage = (x / rect.width) * 100;
        } else {
          const y = e.clientY - rect.top;
          newPercentage = (y / rect.height) * 100;
        }

        // Apply min/max constraints
        const containerSize = direction === 'horizontal' ? rect.width : rect.height;
        const minPercentage = (minSize / containerSize) * 100;
        const maxPercentage = 100 - minPercentage;

        newPercentage = Math.max(minPercentage, Math.min(maxPercentage, newPercentage));

        setSplitPercentage(newPercentage);
        onSplitChange?.(newPercentage);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [direction, minSize, resizable, onSplitChange]
  );

  // Handle keyboard controls
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!resizable) return;

      let newPercentage = splitPercentage;
      const step = 5; // 5% increments

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          newPercentage = Math.max(10, splitPercentage - step);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          newPercentage = Math.min(90, splitPercentage + step);
          break;
        case 'Home':
          event.preventDefault();
          newPercentage = 10;
          break;
        case 'End':
          event.preventDefault();
          newPercentage = 90;
          break;
        default:
          return;
      }

      setSplitPercentage(newPercentage);
      onSplitChange?.(newPercentage);
    },
    [splitPercentage, resizable, onSplitChange]
  );

  const isHorizontal = direction === 'horizontal';
  const leftPanelStyle = isHorizontal
    ? { width: `${splitPercentage}%` }
    : { height: `${splitPercentage}%` };
  const rightPanelStyle = isHorizontal
    ? { width: `${100 - splitPercentage}%` }
    : { height: `${100 - splitPercentage}%` };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full flex',
        isHorizontal ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {/* Left/Top Panel */}
      <div
        style={leftPanelStyle}
        className={cn(
          'overflow-auto bg-white border-neutral-200',
          isHorizontal ? 'border-r h-full' : 'border-b w-full',
          leftClassName
        )}
      >
        {left}
      </div>

      {/* Splitter */}
      {resizable && (
        <div
          ref={splitterRef}
          role="separator"
          aria-orientation={direction}
          aria-label={`Resize ${direction} panels`}
          aria-valuenow={Math.round(splitPercentage)}
          aria-valuemin={10}
          aria-valuemax={90}
          tabIndex={0}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          className={cn(
            'bg-neutral-200 hover:bg-primary-300 transition-colors duration-200',
            'focus:outline-none focus:bg-primary-400',
            isDragging && 'bg-primary-400',
            isHorizontal ? 'w-1 h-full cursor-col-resize' : 'h-1 w-full cursor-row-resize'
          )}
        >
          {/* Visual indicator for splitter */}
          <div
            className={cn(
              'absolute bg-neutral-400',
              isHorizontal
                ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8'
                : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-8'
            )}
          />
        </div>
      )}

      {/* Right/Bottom Panel */}
      <div
        style={rightPanelStyle}
        className={cn('overflow-auto bg-white', isHorizontal ? 'h-full' : 'w-full', rightClassName)}
      >
        {right}
      </div>
    </div>
  );
};

SplitPanel.displayName = 'SplitPanel';
