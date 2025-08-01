/**
 * PosalPro MVP2 - Mobile Touch Gestures Component
 * Phase 2: Enhanced Component Library - Touch Interaction Systems
 * Component Traceability Matrix: US-8.1, US-8.4, H9, H10
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Touch Gesture Types
type SwipeDirection = 'left' | 'right' | 'up' | 'down';
type PinchType = 'zoom_in' | 'zoom_out';
type RotationType = 'clockwise' | 'counterclockwise';

// Touch Event Interfaces
interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface SwipeEvent {
  direction: SwipeDirection;
  distance: number;
  velocity: number;
  duration: number;
  startPoint: TouchPoint;
  endPoint: TouchPoint;
}

interface PinchEvent {
  type: PinchType;
  scale: number;
  distance: number;
  center: TouchPoint;
  velocity: number;
}

interface RotationEvent {
  type: RotationType;
  angle: number;
  center: TouchPoint;
  velocity: number;
}

interface LongPressEvent {
  point: TouchPoint;
  duration: number;
}

interface TapEvent {
  point: TouchPoint;
  tapCount: number;
  timestamp: number;
}

// Gesture Configuration
interface GestureConfig {
  swipe?: {
    enabled: boolean;
    threshold: number; // Minimum distance in pixels
    velocity: number; // Minimum velocity
    directions: SwipeDirection[];
  };
  pinch?: {
    enabled: boolean;
    threshold: number; // Minimum scale change
    minDistance: number; // Minimum distance between fingers
  };
  rotation?: {
    enabled: boolean;
    threshold: number; // Minimum angle in degrees
  };
  longPress?: {
    enabled: boolean;
    duration: number; // Duration in milliseconds
    threshold: number; // Maximum movement allowed
  };
  tap?: {
    enabled: boolean;
    maxDistance: number; // Maximum distance for tap
    doubleTapTimeout: number; // Time window for double tap
  };
}

// Analytics tracking context for mobile touch gesture interactions
interface TrackingContext {
  userId?: string;
  page?: string;
  section?: string;
  hypothesis?: string;
  testCase?: string;
  userStory?: string;
  sessionId?: string;
  experimentId?: string;
  cohort?: string;
  source?: string;
  metadata?: Record<string, string | number | boolean>;
}

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-8.1', 'US-8.4', 'US-1.1', 'US-4.1'],
  acceptanceCriteria: ['AC-8.1.2', 'AC-8.4.1', 'AC-8.4.2', 'AC-8.4.3'],
  methods: ['handleTouchGesture()', 'detectSwipeDirection()', 'trackGestureAnalytics()'],
  hypotheses: ['H9', 'H10'],
  testCases: ['TC-H9-005', 'TC-H9-006', 'TC-H10-003'],
};

// Default Configuration
const DEFAULT_CONFIG: GestureConfig = {
  swipe: {
    enabled: true,
    threshold: 50,
    velocity: 0.3,
    directions: ['left', 'right', 'up', 'down'],
  },
  pinch: {
    enabled: true,
    threshold: 0.1,
    minDistance: 50,
  },
  rotation: {
    enabled: false,
    threshold: 15,
  },
  longPress: {
    enabled: true,
    duration: 500,
    threshold: 10,
  },
  tap: {
    enabled: true,
    maxDistance: 10,
    doubleTapTimeout: 300,
  },
};

interface MobileTouchGesturesProps {
  children: React.ReactNode;
  config?: Partial<GestureConfig>;
  className?: string;

  // Gesture Handlers
  onSwipe?: (event: SwipeEvent) => void;
  onPinch?: (event: PinchEvent) => void;
  onRotation?: (event: RotationEvent) => void;
  onLongPress?: (event: LongPressEvent) => void;
  onTap?: (event: TapEvent) => void;
  onDoubleTap?: (event: TapEvent) => void;

  // Advanced Handlers
  onTouchStart?: (touches: TouchPoint[]) => void;
  onTouchMove?: (touches: TouchPoint[]) => void;
  onTouchEnd?: (touches: TouchPoint[]) => void;

  // Analytics Context
  trackingContext?: TrackingContext;
  disabled?: boolean;
}

export function MobileTouchGestures({
  children,
  config = {},
  className = '',
  onSwipe,
  onPinch,
  onRotation,
  onLongPress,
  onTap,
  onDoubleTap,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  trackingContext = {},
  disabled = false,
}: MobileTouchGesturesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchState = useRef({
    startTouches: [] as TouchPoint[],
    currentTouches: [] as TouchPoint[],
    longPressTimer: null as NodeJS.Timeout | null,
    lastTap: null as TapEvent | null,
    initialDistance: 0,
    initialAngle: 0,
    isTracking: false,
  });

  const [gestureConfig] = useState<GestureConfig>({ ...DEFAULT_CONFIG, ...config });
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { handleAsyncError } = useErrorHandler();

  // Utility Functions
  const getDistance = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }, []);

  const getAngle = useCallback((p1: TouchPoint, p2: TouchPoint): number => {
    return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  }, []);

  const getCenter = useCallback((p1: TouchPoint, p2: TouchPoint): TouchPoint => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      timestamp: Date.now(),
    };
  }, []);

  const getTouchPoints = useCallback((touches: React.TouchList): TouchPoint[] => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return [];

    return Array.from(touches).map(touch => ({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      timestamp: Date.now(),
    }));
  }, []);

  // Gesture Detection Functions
  const detectSwipe = useCallback(
    (startPoint: TouchPoint, endPoint: TouchPoint): SwipeEvent | null => {
      try {
        if (!gestureConfig.swipe?.enabled) return null;

        const distance = getDistance(startPoint, endPoint);
        const duration = endPoint.timestamp - startPoint.timestamp;
        const velocity = distance / duration;

        if (distance < gestureConfig.swipe.threshold || velocity < gestureConfig.swipe.velocity) {
          return null;
        }

        const deltaX = endPoint.x - startPoint.x;
        const deltaY = endPoint.y - startPoint.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        let direction: SwipeDirection;
        if (absDeltaX > absDeltaY) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        if (!gestureConfig.swipe.directions.includes(direction)) {
          return null;
        }

        return {
          direction,
          distance,
          velocity,
          duration,
          startPoint,
          endPoint,
        };
      } catch (error) {
        handleAsyncError(error, 'Failed to detect swipe gesture', {
          component: 'MobileTouchGestures',
          method: 'detectSwipe',
        });
        return null;
      }
    },
    [gestureConfig.swipe, getDistance, handleAsyncError]
  );

  const detectPinch = useCallback(
    (touches: TouchPoint[]): PinchEvent | null => {
      try {
        if (!gestureConfig.pinch?.enabled || touches.length !== 2) return null;

        const currentDistance = getDistance(touches[0], touches[1]);

        if (touchState.current.initialDistance === 0) {
          touchState.current.initialDistance = currentDistance;
          return null;
        }

        const scale = currentDistance / touchState.current.initialDistance;
        const scaleChange = Math.abs(scale - 1);

        if (scaleChange < gestureConfig.pinch.threshold) {
          return null;
        }

        const center = getCenter(touches[0], touches[1]);
        const type: PinchType = scale > 1 ? 'zoom_in' : 'zoom_out';
        const velocity = scaleChange / (Date.now() - touchState.current.startTouches[0].timestamp);

        return {
          type,
          scale,
          distance: currentDistance,
          center,
          velocity,
        };
      } catch (error) {
        handleAsyncError(error, 'Failed to detect pinch gesture', {
          component: 'MobileTouchGestures',
          method: 'detectPinch',
        });
        return null;
      }
    },
    [gestureConfig.pinch, getDistance, getCenter, handleAsyncError]
  );

  // Touch Event Handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      try {
        const touches = getTouchPoints(e.touches);
        touchState.current.startTouches = touches;
        touchState.current.currentTouches = touches;
        touchState.current.isTracking = true;

        // Initialize for multi-touch gestures
        if (touches.length === 2) {
          touchState.current.initialDistance = getDistance(touches[0], touches[1]);
          touchState.current.initialAngle = getAngle(touches[0], touches[1]);
        }

        // Start long press timer
        if (gestureConfig.longPress?.enabled && touches.length === 1) {
          touchState.current.longPressTimer = setTimeout(() => {
            if (touchState.current.isTracking) {
              const longPressEvent: LongPressEvent = {
                point: touches[0],
                duration: gestureConfig.longPress!.duration,
              };

              // Track long press analytics (H9: Mobile User Experience)
              analytics('mobile_long_press_detected', {
                duration: longPressEvent.duration,
                position: longPressEvent.point,
                hypothesis: 'H9',
                testCase: 'TC-H9-005',
                componentMapping: COMPONENT_MAPPING,
                ...trackingContext,
              }, 'medium');

              onLongPress?.(longPressEvent);
            }
          }, gestureConfig.longPress.duration);
        }

        onTouchStart?.(touches);
      } catch (error) {
        handleAsyncError(error, 'Failed to handle touch start', {
          component: 'MobileTouchGestures',
          method: 'handleTouchStart',
          touchCount: e.touches.length,
        });
      }
    },
    [
      disabled,
      getTouchPoints,
      getDistance,
      getAngle,
      gestureConfig.longPress,
      analytics,
      trackingContext,
      onLongPress,
      onTouchStart,
      handleAsyncError,
    ]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !touchState.current.isTracking) return;

      try {
        const touches = getTouchPoints(e.touches);
        touchState.current.currentTouches = touches;

        // Check if movement exceeds long press threshold
        if (
          gestureConfig.longPress?.enabled &&
          touches.length === 1 &&
          touchState.current.startTouches.length === 1
        ) {
          const distance = getDistance(touchState.current.startTouches[0], touches[0]);
          if (distance > gestureConfig.longPress.threshold && touchState.current.longPressTimer) {
            clearTimeout(touchState.current.longPressTimer);
            touchState.current.longPressTimer = null;
          }
        }

        // Detect pinch gesture
        if (touches.length === 2 && onPinch) {
          const pinchEvent = detectPinch(touches);
          if (pinchEvent) {
            // Track pinch analytics (H9: Mobile User Experience)
            analytics('mobile_pinch_detected', {
              type: pinchEvent.type,
              scale: pinchEvent.scale,
              velocity: pinchEvent.velocity,
              hypothesis: 'H9',
              testCase: 'TC-H9-006',
              componentMapping: COMPONENT_MAPPING,
              ...trackingContext,
            }, 'medium');

            onPinch(pinchEvent);
          }
        }

        onTouchMove?.(touches);
      } catch (error) {
        handleAsyncError(error, 'Failed to handle touch move', {
          component: 'MobileTouchGestures',
          method: 'handleTouchMove',
          touchCount: e.touches.length,
        });
      }
    },
    [
      disabled,
      getTouchPoints,
      gestureConfig.longPress,
      getDistance,
      detectPinch,
      analytics,
      trackingContext,
      onPinch,
      onTouchMove,
      handleAsyncError,
    ]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      try {
        const remainingTouches = getTouchPoints(e.touches);

        // Clear long press timer
        if (touchState.current.longPressTimer) {
          clearTimeout(touchState.current.longPressTimer);
          touchState.current.longPressTimer = null;
        }

        // Detect swipe gesture (single touch)
        if (
          touchState.current.startTouches.length === 1 &&
          touchState.current.currentTouches.length === 1 &&
          onSwipe
        ) {
          const swipeEvent = detectSwipe(
            touchState.current.startTouches[0],
            touchState.current.currentTouches[0]
          );
          if (swipeEvent) {
            // Track swipe analytics (H9: Mobile User Experience)
            analytics('mobile_swipe_detected', {
              direction: swipeEvent.direction,
              distance: swipeEvent.distance,
              velocity: swipeEvent.velocity,
              duration: swipeEvent.duration,
              hypothesis: 'H9',
              testCase: 'TC-H9-005',
              componentMapping: COMPONENT_MAPPING,
              ...trackingContext,
            }, 'medium');

            onSwipe(swipeEvent);
          }
        }

        // Detect tap gesture
        if (gestureConfig.tap?.enabled && touchState.current.startTouches.length === 1 && onTap) {
          const startPoint = touchState.current.startTouches[0];
          const endPoint = touchState.current.currentTouches[0] || startPoint;
          const distance = getDistance(startPoint, endPoint);

          if (distance <= gestureConfig.tap.maxDistance) {
            const tapEvent: TapEvent = {
              point: endPoint,
              tapCount: 1,
              timestamp: Date.now(),
            };

            // Check for double tap
            const isDoubleTap =
              touchState.current.lastTap &&
              tapEvent.timestamp - touchState.current.lastTap.timestamp <
                gestureConfig.tap.doubleTapTimeout &&
              getDistance(tapEvent.point, touchState.current.lastTap.point) <=
                gestureConfig.tap.maxDistance;

            if (isDoubleTap && onDoubleTap) {
              // Track double tap analytics (H9: Mobile User Experience)
              analytics('mobile_double_tap_detected', {
                position: tapEvent.point,
                timeBetweenTaps: tapEvent.timestamp - touchState.current.lastTap!.timestamp,
                hypothesis: 'H9',
                testCase: 'TC-H9-006',
                componentMapping: COMPONENT_MAPPING,
                ...trackingContext,
              }, 'medium');

              onDoubleTap({ ...tapEvent, tapCount: 2 });
              touchState.current.lastTap = null;
            } else {
              // Delay single tap to check for double tap
              setTimeout(() => {
                if (touchState.current.lastTap?.timestamp === tapEvent.timestamp) {
                  // Track single tap analytics (H9: Mobile User Experience)
                  analytics('mobile_tap_detected', {
                    position: tapEvent.point,
                    hypothesis: 'H9',
                    componentMapping: COMPONENT_MAPPING,
                    ...trackingContext,
                  }, 'low');

                  onTap(tapEvent);
                }
              }, gestureConfig.tap.doubleTapTimeout);

              touchState.current.lastTap = tapEvent;
            }
          }
        }

        // Reset tracking state
        if (remainingTouches.length === 0) {
          touchState.current.isTracking = false;
          touchState.current.initialDistance = 0;
          touchState.current.initialAngle = 0;
        }

        onTouchEnd?.(remainingTouches);
      } catch (error) {
        handleAsyncError(error, 'Failed to handle touch end', {
          component: 'MobileTouchGestures',
          method: 'handleTouchEnd',
          remainingTouches: e.touches.length,
        });
      }
    },
    [
      disabled,
      getTouchPoints,
      detectSwipe,
      gestureConfig.tap,
      getDistance,
      analytics,
      trackingContext,
      onSwipe,
      onTap,
      onDoubleTap,
      onTouchEnd,
      handleAsyncError,
    ]
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (touchState.current.longPressTimer) {
        clearTimeout(touchState.current.longPressTimer);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`touch-gesture-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: disabled ? 'auto' : 'none' }}
    >
      {children}
    </div>
  );
}

export default MobileTouchGestures;
