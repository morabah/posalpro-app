/**
 * PosalPro MVP2 - Optimized Image Component
 * User Story: US-6.1 (Performance Monitoring), US-6.2 (Memory Optimization)
 * Hypothesis: H8 (Memory Efficiency), H9 (Performance Optimization)
 *
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md patterns
 * ✅ USES: Next.js Image with WebP/AVIF optimization
 * ✅ PROVIDES: Lazy loading, responsive images, performance monitoring
 */

'use client';

import Image from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logDebug, logInfo, logError } from '@/lib/logger';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  // Performance monitoring
  component?: string;
  operation?: string;
  userStory?: string;
  hypothesis?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  className,
  style,
  onLoad,
  onError,
  onClick,
  component = 'OptimizedImage',
  operation = 'image_load',
  userStory = 'US-6.1',
  hypothesis = 'H8',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const analytics = useOptimizedAnalytics();
  const loadStartTime = useRef<number>(Date.now());
  const imageRef = useRef<HTMLImageElement>(null);

  // Performance monitoring
  useEffect(() => {
    if (priority) {
      logDebug('OptimizedImage: Priority image loading', {
        component,
        operation,
        src,
        userStory,
        hypothesis,
      });
    }
  }, [priority, src, component, operation, userStory, hypothesis]);

  const handleLoad = useCallback(() => {
    const loadDuration = Date.now() - loadStartTime.current;
    setLoadTime(loadDuration);
    setIsLoading(false);
    setHasError(false);

    // Performance analytics
    analytics.trackOptimized('image_load_success', {
      component,
      operation,
      src,
      loadTime: loadDuration,
      priority,
      quality,
      userStory,
      hypothesis,
    });

    logInfo('OptimizedImage: Image loaded successfully', {
      component,
      operation,
      src,
      loadTime: loadDuration,
      priority,
      quality,
    });

    onLoad?.();
  }, [analytics, component, operation, src, priority, quality, userStory, hypothesis, onLoad]);

  const handleError = useCallback(() => {
    const loadDuration = Date.now() - loadStartTime.current;
    setIsLoading(false);
    setHasError(true);

    // Error analytics
    analytics.trackOptimized('image_load_error', {
      component,
      operation,
      src,
      loadTime: loadDuration,
      priority,
      userStory,
      hypothesis,
    });

    logError('OptimizedImage: Image load failed', {
      component,
      operation,
      src,
      loadTime: loadDuration,
      priority,
    });

    onError?.();
  }, [analytics, component, operation, src, priority, userStory, hypothesis, onError]);

  // Generate optimized src for WebP/AVIF support
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    // If it's already a Next.js optimized image, return as-is
    if (originalSrc.includes('/_next/image')) {
      return originalSrc;
    }

    // For external images, we'll let Next.js handle optimization
    return originalSrc;
  }, []);

  const optimizedSrc = getOptimizedSrc(src);

  return (
    <div className={cn('relative', className)} style={style}>
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 rounded-md flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs">Failed to load</p>
          </div>
        </div>
      )}

      {/* Optimized Image */}
      <Image
        ref={imageRef}
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          onClick && 'cursor-pointer hover:opacity-90'
        )}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        // Performance optimization
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />

      {/* Performance indicator (development only) */}
      {process.env.NODE_ENV === 'development' && loadTime && (
        <div className="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
          {loadTime}ms
        </div>
      )}
    </div>
  );
}

// Preset configurations for common use cases
export const ImagePresets = {
  // Product thumbnails
  productThumbnail: {
    width: 200,
    height: 200,
    quality: 80,
    sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px',
  },

  // Product gallery
  productGallery: {
    width: 400,
    height: 400,
    quality: 85,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px',
  },

  // Hero images
  hero: {
    fill: true,
    quality: 90,
    priority: true,
    sizes: '100vw',
  },

  // Avatar images
  avatar: {
    width: 40,
    height: 40,
    quality: 75,
    sizes: '40px',
  },

  // Card images
  card: {
    width: 300,
    height: 200,
    quality: 80,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px',
  },
} as const;

// Convenience component for product images
export function ProductImage({
  src,
  alt,
  preset = 'productThumbnail',
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill' | 'quality' | 'sizes' | 'priority'> & {
  preset?: keyof typeof ImagePresets;
}) {
  const presetConfig = ImagePresets[preset];

  return (
    <OptimizedImage
      {...presetConfig}
      {...props}
      src={src}
      alt={alt}
      component="ProductImage"
      operation="product_image_load"
      userStory="US-4.1"
      hypothesis="H8"
    />
  );
}

// Convenience component for avatar images
export function AvatarImage({
  src,
  alt,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'quality' | 'sizes'>) {
  return (
    <OptimizedImage
      {...ImagePresets.avatar}
      {...props}
      src={src}
      alt={alt}
      component="AvatarImage"
      operation="avatar_load"
      userStory="US-6.1"
      hypothesis="H8"
    />
  );
}
