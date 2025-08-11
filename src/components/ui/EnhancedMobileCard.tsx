/**
 * PosalPro MVP2 - Enhanced Mobile Card Component
 * Phase 2: Enhanced Component Library - Mobile Card Systems
 * Component Traceability Matrix: US-8.1, US-8.3, H9, H10
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { AlertCircle, ChevronDown, ChevronRight, Clock, MoreVertical } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import Image from 'next/image';

// Enhanced Mobile Card Interfaces
interface MobileCardAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'danger' | 'success';
  onClick: () => void;
  disabled?: boolean;
}

interface MobileCardStatus {
  type: 'success' | 'warning' | 'error' | 'info' | 'pending';
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MobileCardMetric {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.3', 'US-1.1', 'US-4.1'],
  acceptanceCriteria: ['AC-8.1.1', 'AC-8.1.3', 'AC-8.3.1', 'AC-8.3.2'],
  methods: ['handleSwipeGesture()', 'toggleExpansion()', 'trackMobileInteraction()'],
  hypotheses: ['H9', 'H10'],
  testCases: ['TC-H9-003', 'TC-H9-004', 'TC-H10-002'],
};

interface EnhancedMobileCardProps {
  // Basic Properties
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;

  // Status and Metadata
  status?: MobileCardStatus;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated?: Date;
  metrics?: MobileCardMetric[];
  tags?: string[];

  // Interactive Features
  expandable?: boolean;
  defaultExpanded?: boolean;
  swipeActions?: MobileCardAction[];
  contextActions?: MobileCardAction[];
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;

  // Progressive Disclosure
  children?: React.ReactNode;
  expandedContent?: React.ReactNode;

  // Accessibility
  ariaLabel?: string;
  role?: string;

  // Analytics
  trackingContext?: Record<string, unknown>;

  // Styling
  className?: string;
  variant?: 'default' | 'compact' | 'detailed' | 'featured';
  highlighted?: boolean;
}

export function EnhancedMobileCard({
  title,
  subtitle,
  description,
  image,
  imageAlt,
  status,
  priority = 'medium',
  lastUpdated,
  metrics = [],
  tags = [],
  expandable = false,
  defaultExpanded = false,
  swipeActions = [],
  contextActions = [],
  onTap,
  onDoubleTap,
  onLongPress,
  children,
  expandedContent,
  ariaLabel,
  role = 'article',
  trackingContext = {},
  className = '',
  variant = 'default',
  highlighted = false,
}: EnhancedMobileCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isPressed, setIsPressed] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTap = useRef<number>(0);

  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();

  // Handle swipe gestures for actions
  const _handleSwipeGesture = useCallback(
    (direction: 'left' | 'right') => {
      try {
        if (swipeActions.length === 0) return;

        // Track swipe gesture analytics (H9: Mobile User Experience)
        analytics('mobile_card_swipe', {
          direction,
          cardTitle: title,
          actionsAvailable: swipeActions.length,
          hypothesis: 'H9',
          testCase: 'TC-H9-003',
          componentMapping: COMPONENT_MAPPING,
          ...trackingContext,
        }, 'medium');

        // Show swipe actions
        setShowActions(true);

        // Auto-hide after 3 seconds
        setTimeout(() => setShowActions(false), 3000);
      } catch (error) {
        handleAsyncError(error, 'Failed to handle swipe gesture', {
          component: 'EnhancedMobileCard',
          method: 'handleSwipeGesture',
          direction,
          cardTitle: title,
        });
      }
    },
    [swipeActions, analytics, title, trackingContext, handleAsyncError]
  );
  // Mark underscored gesture handler as used (not yet wired)
  void _handleSwipeGesture;

  // Handle tap interactions
  const handleTap = useCallback(() => {
    try {
      const now = Date.now();
      const timeDiff = now - lastTap.current;
      lastTap.current = now;

      // Double tap detection (within 300ms)
      if (timeDiff < 300 && onDoubleTap) {
        // Track double tap analytics (H9: Mobile User Experience)
        analytics('mobile_card_double_tap', {
          cardTitle: title,
          hypothesis: 'H9',
          testCase: 'TC-H9-004',
          componentMapping: COMPONENT_MAPPING,
          ...trackingContext,
        }, 'medium');

        onDoubleTap();
        return;
      }

      // Single tap
      if (onTap) {
        // Track single tap analytics (H9: Mobile User Experience)
        analytics('mobile_card_tap', {
          cardTitle: title,
          isExpanded,
          hypothesis: 'H9',
          componentMapping: COMPONENT_MAPPING,
          ...trackingContext,
        }, 'low');

        onTap();
      }
    } catch (error) {
      handleAsyncError(error, 'Failed to handle tap interaction', {
        component: 'EnhancedMobileCard',
        method: 'handleTap',
        cardTitle: title,
      });
    }
  }, [onTap, onDoubleTap, analytics, title, isExpanded, trackingContext, handleAsyncError]);

  // Handle long press
  const handleTouchStart = useCallback(() => {
    setIsPressed(true);

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        try {
          // Track long press analytics (H9: Mobile User Experience)
          analytics('mobile_card_long_press', {
            cardTitle: title,
            hypothesis: 'H9',
            componentMapping: COMPONENT_MAPPING,
            ...trackingContext,
          }, 'medium');

          onLongPress();
        } catch (error) {
          handleAsyncError(error, 'Failed to handle long press', {
            component: 'EnhancedMobileCard',
            method: 'handleTouchStart',
            cardTitle: title,
          });
        }
      }, 500); // 500ms for long press
    }
  }, [onLongPress, analytics, title, trackingContext, handleAsyncError]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  // Handle expansion toggle
  const toggleExpansion = useCallback(() => {
    try {
      if (!expandable) return;

      setIsExpanded(prev => {
        const newState = !prev;

        // Track expansion analytics (H9: Mobile User Experience)
        analytics('mobile_card_expansion_toggle', {
          action: newState ? 'expand' : 'collapse',
          cardTitle: title,
          hypothesis: 'H9',
          componentMapping: COMPONENT_MAPPING,
          ...trackingContext,
        }, 'low');

        return newState;
      });
    } catch (error) {
      handleAsyncError(error, 'Failed to toggle card expansion', {
        component: 'EnhancedMobileCard',
        method: 'toggleExpansion',
        cardTitle: title,
      });
    }
  }, [expandable, analytics, title, trackingContext, handleAsyncError]);

  // Priority color mapping
  const priorityColors = {
    low: 'border-green-200 bg-green-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50',
  };

  // Status color mapping
  const statusColors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100',
    pending: 'text-gray-600 bg-gray-100',
  };

  // Variant styling
  const variantClasses = {
    default: 'p-4',
    compact: 'p-3',
    detailed: 'p-5',
    featured: 'p-6 border-2',
  };

  const baseClasses = `
    bg-white rounded-lg border shadow-sm transition-all duration-200
    ${highlighted ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
    ${isPressed ? 'scale-95 shadow-lg' : 'hover:shadow-md'}
    ${priorityColors[priority]}
    ${variantClasses[variant]}
    ${className}
  `;

  return (
    <div
      ref={cardRef}
      className={baseClasses}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role={role}
      aria-label={ariaLabel || title}
      aria-expanded={expandable ? isExpanded : undefined}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* Image */}
          {image && (
            <div className="w-12 h-12 rounded-lg overflow-hidden mb-3 flex-shrink-0 relative">
              <Image src={image} alt={imageAlt || title} fill sizes="48px" className="object-cover" />
            </div>
          )}

          {/* Title and Subtitle */}
          <div className="mb-2">
            <h3 className="text-base font-semibold text-gray-900 leading-tight">{title}</h3>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>

          {/* Status and Priority */}
          <div className="flex items-center space-x-2 mb-2">
            {status && (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[status.type]}`}
              >
                {status.icon && <status.icon className="w-3 h-3 mr-1" />}
                {status.label}
              </span>
            )}

            {priority === 'high' || priority === 'critical' ? (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  priority === 'critical'
                    ? 'text-red-600 bg-red-100'
                    : 'text-orange-600 bg-orange-100'
                }`}
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Context Actions */}
        <div className="flex items-center space-x-2 ml-3">
          {contextActions.length > 0 && (
            <button
              onClick={e => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="More actions"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
          )}

          {expandable && (
            <button
              onClick={e => {
                e.stopPropagation();
                toggleExpansion();
              }}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {description && <p className="text-sm text-gray-700 mb-3 leading-relaxed">{description}</p>}

      {/* Metrics */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-semibold text-gray-900" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="text-xs text-gray-600">{metric.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center text-xs text-gray-500 mb-3">
          <Clock className="w-3 h-3 mr-1" />
          Updated {lastUpdated.toLocaleDateString()}
        </div>
      )}

      {/* Children Content */}
      {children && <div className="mb-3">{children}</div>}

      {/* Expanded Content */}
      {expandable && isExpanded && expandedContent && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top duration-200">
          {expandedContent}
        </div>
      )}

      {/* Swipe Actions Overlay */}
      {showActions && swipeActions.length > 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
          <div className="flex space-x-3">
            {swipeActions.map(action => (
              <button
                key={action.id}
                onClick={e => {
                  e.stopPropagation();
                  action.onClick();
                  setShowActions(false);
                }}
                disabled={action.disabled}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : action.variant === 'secondary'
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : action.variant === 'danger'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {action.icon && <action.icon className="w-4 h-4 mr-2 inline" />}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context Actions Menu */}
      {showActions && contextActions.length > 0 && (
        <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48">
          {contextActions.map(action => (
            <button
              key={action.id}
              onClick={e => {
                e.stopPropagation();
                action.onClick();
                setShowActions(false);
              }}
              disabled={action.disabled}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
              } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2 inline" />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default EnhancedMobileCard;
