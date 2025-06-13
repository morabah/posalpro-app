/**
 * PosalPro MVP2 - Avatar Component
 * User avatar with fallbacks, size variants, and accessibility features
 * WCAG 2.1 AA compliant with proper labeling and contrast
 */

'use client';

import { cn } from '@/lib/utils';
import React, { forwardRef, useState } from 'react';

export interface AvatarProps {
  /**
   * Image source URL
   */
  src?: string;

  /**
   * Alternative text for the image
   */
  alt?: string;

  /**
   * User name for fallback initials
   */
  name?: string;

  /**
   * Size variant
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  /**
   * Shape variant
   */
  shape?: 'circle' | 'square' | 'rounded';

  /**
   * Status indicator
   */
  status?: 'online' | 'offline' | 'busy' | 'away';

  /**
   * Show status indicator
   */
  showStatus?: boolean;

  /**
   * Custom fallback content
   */
  fallback?: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Loading state
   */
  loading?: boolean;
}

/**
 * Generate initials from name
 */
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Avatar component
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name,
      size = 'md',
      shape = 'circle',
      status,
      showStatus = false,
      fallback,
      className,
      onClick,
      loading = false,
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(!!src);

    // Size styles
    const sizeStyles = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-20 h-20 text-2xl',
    };

    // Shape styles
    const shapeStyles = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-md',
    };

    // Status styles
    const statusStyles = {
      online: 'bg-success-500',
      offline: 'bg-neutral-400',
      busy: 'bg-error-500',
      away: 'bg-warning-500',
    };

    // Status indicator size based on avatar size
    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
      '2xl': 'w-5 h-5',
    };

    // Handle image load error
    const handleImageError = () => {
      setImageError(true);
      setImageLoading(false);
    };

    // Handle image load success
    const handleImageLoad = () => {
      setImageLoading(false);
    };

    // Determine what to show
    const showImage = src && !imageError && !loading;
    const showInitials = name && !showImage && !fallback;
    const showFallback = fallback && !showImage && !showInitials;

    // Generate alt text
    const avatarAlt = alt || (name ? `${name}'s avatar` : 'User avatar');

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center',
          'bg-neutral-200 text-neutral-600 font-medium',
          'overflow-hidden select-none',
          sizeStyles[size],
          shapeStyles[shape],
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
          loading && 'animate-pulse',
          className
        )}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        aria-label={onClick ? `${avatarAlt}, click to view profile` : avatarAlt}
      >
        {/* Loading state */}
        {loading && <div className="absolute inset-0 bg-neutral-300 animate-pulse" />}

        {/* Image */}
        {showImage && (
          <>
            {imageLoading && <div className="absolute inset-0 bg-neutral-300 animate-pulse" />}
            <img
              src={src}
              alt={avatarAlt}
              className={cn('w-full h-full object-cover', shapeStyles[shape])}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
            />
          </>
        )}

        {/* Initials fallback */}
        {showInitials && (
          <span className="font-semibold" aria-hidden="true">
            {getInitials(name)}
          </span>
        )}

        {/* Custom fallback */}
        {showFallback && <div className="flex items-center justify-center">{fallback}</div>}

        {/* Default fallback icon */}
        {!showImage && !showInitials && !showFallback && !loading && (
          <svg
            className={cn('w-1/2 h-1/2 text-neutral-400')}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        )}

        {/* Status indicator */}
        {showStatus && status && (
          <div
            className={cn(
              'absolute -bottom-0 -right-0 rounded-full border-2 border-white',
              statusStyles[status],
              statusSizes[size]
            )}
            aria-label={`Status: ${status}`}
            role="img"
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * Avatar Group component for displaying multiple avatars
 */
export interface AvatarGroupProps {
  /**
   * Avatar configurations
   */
  avatars: (AvatarProps & { id: string })[];

  /**
   * Maximum number of avatars to show
   */
  max?: number;

  /**
   * Size for all avatars
   */
  size?: AvatarProps['size'];

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Show count of additional avatars
   */
  showCount?: boolean;

  /**
   * Click handler for the group or overflow count
   */
  onClick?: () => void;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 5,
  size = 'md',
  className,
  showCount = true,
  onClick,
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const hiddenCount = Math.max(0, avatars.length - max);

  // Size styles for AvatarGroup
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
  };

  // Size-based spacing
  const spacingStyles = {
    xs: '-space-x-1',
    sm: '-space-x-1.5',
    md: '-space-x-2',
    lg: '-space-x-2.5',
    xl: '-space-x-3',
    '2xl': '-space-x-4',
  };

  return (
    <div
      className={cn(
        'flex items-center',
        spacingStyles[size],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={avatar.id}
          {...avatar}
          size={size}
          className={cn(
            'border-2 border-white relative',
            `z-${Math.max(10, 20 - index)}` // Ensure proper stacking
          )}
        />
      ))}

      {/* Overflow count */}
      {hiddenCount > 0 && showCount && (
        <div
          className={cn(
            'relative inline-flex items-center justify-center',
            'bg-neutral-100 border-2 border-white',
            'text-neutral-600 font-medium rounded-full',
            'z-0',
            sizeStyles[size]
          )}
          aria-label={`${hiddenCount} more users`}
        >
          <span className="text-xs">+{hiddenCount}</span>
        </div>
      )}
    </div>
  );
};

AvatarGroup.displayName = 'AvatarGroup';
