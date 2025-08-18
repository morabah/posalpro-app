/**
 * Accessibility Components
 * WCAG 2.1 AA compliant components and utilities
 */

import { memo, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

// Accessibility Provider Context
export const AccessibilityProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [isReducedMotion, setIsReducedMotion] = useState(false);
    const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>('normal');

    useEffect(() => {
      // Check for user preferences
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(mediaQuery.matches);

      const handleMotionChange = (e: MediaQueryListEvent) => {
        setIsReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleMotionChange);
      return () => mediaQuery.removeEventListener('change', handleMotionChange);
    }, []);

    const contextValue = {
      isHighContrast,
      setIsHighContrast,
      isReducedMotion,
      fontSize,
      setFontSize,
    };

    return (
      <div
        className={`${isHighContrast ? 'high-contrast' : ''} ${isReducedMotion ? 'motion-reduced' : ''} font-size-${fontSize}`}
        data-accessibility-provider
      >
        {children}
      </div>
    );
  }
);

AccessibilityProvider.displayName = 'AccessibilityProvider';

// Screen Reader Announcement Hook
export const useScreenReaderAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (announcement) {
      // Create a live region for screen reader announcements
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.textContent = announcement;

      document.body.appendChild(liveRegion);

      // Remove after announcement
      const timer = setTimeout(() => {
        document.body.removeChild(liveRegion);
        setAnnouncement('');
      }, 1000);

      return () => {
        clearTimeout(timer);
        if (document.body.contains(liveRegion)) {
          document.body.removeChild(liveRegion);
        }
      };
    }
  }, [announcement]);

  return setAnnouncement;
};

// Accessible Button Component
export const AccessibleButton = memo(
  ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    ...props
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        {...props}
      >
        {children}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

// Accessible Card Component
export const AccessibleCard = memo(
  ({
    children,
    title,
    description,
    className = '',
    ...props
  }: {
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
  } & React.HTMLAttributes<HTMLDivElement>) => {
    return (
      <Card
        className={`p-6 ${className}`}
        role="region"
        aria-labelledby={title ? 'card-title' : undefined}
        aria-describedby={description ? 'card-description' : undefined}
        {...props}
      >
        {title && (
          <h3 id="card-title" className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
        )}
        {description && (
          <p id="card-description" className="text-sm text-gray-600 mb-4">
            {description}
          </p>
        )}
        {children}
      </Card>
    );
  }
);

AccessibleCard.displayName = 'AccessibleCard';

// Skip Navigation Link
export const SkipNavigationLink = memo(() => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
    >
      Skip to main content
    </a>
  );
});

SkipNavigationLink.displayName = 'SkipNavigationLink';

// Focus Trap Hook
export const useFocusTrap = (isActive: boolean) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
};

// Accessible Loading Spinner
export const AccessibleLoadingSpinner = memo(
  ({
    size = 'md',
    'aria-label': ariaLabel = 'Loading...',
    className = ''
  }: {
    size?: 'sm' | 'md' | 'lg';
    'aria-label'?: string;
    className?: string;
  }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    };

    return (
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
        role="status"
        aria-label={ariaLabel}
      >
        <span className="sr-only">{ariaLabel}</span>
      </div>
    );
  }
);

AccessibleLoadingSpinner.displayName = 'AccessibleLoadingSpinner';

// Accessible Error Boundary
export const AccessibleErrorBoundary = memo(
  ({
    children,
    fallback,
    'aria-label': ariaLabel = 'Error occurred'
  }: {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    'aria-label'?: string;
  }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
      return (
        <div
          role="alert"
          aria-label={ariaLabel}
          className="p-4 bg-red-50 border border-red-200 rounded-md"
        >
          {fallback || (
            <div className="text-red-800">
              <h3 className="font-medium">Something went wrong</h3>
              <p className="text-sm mt-1">Please try refreshing the page or contact support if the problem persists.</p>
            </div>
          )}
        </div>
      );
    }

    return <>{children}</>;
  }
);

AccessibleErrorBoundary.displayName = 'AccessibleErrorBoundary';

