/**
 * PosalPro MVP2 - Modal Component
 * Accessible modal dialog with focus management and animation
 * WCAG 2.1 AA compliant with proper keyboard navigation
 */

'use client';

import { cn } from '@/lib/utils';
import React, { useCallback, useEffect, useRef } from 'react';

export interface ModalProps {
  /**
   * Modal visibility
   */
  isOpen: boolean;

  /**
   * Close handler
   */
  onClose: () => void;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Modal content
   */
  children: React.ReactNode;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Visual variant
   */
  variant?: 'default' | 'danger' | 'success' | 'warning';

  /**
   * Hide close button
   */
  hideCloseButton?: boolean;

  /**
   * Prevent closing on overlay click
   */
  preventOverlayClose?: boolean;

  /**
   * Prevent closing on escape key
   */
  preventEscapeClose?: boolean;

  /**
   * Modal footer content
   */
  footer?: React.ReactNode;

  /**
   * Initial focus target selector
   */
  initialFocus?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Content classes
   */
  contentClassName?: string;

  /**
   * Header classes
   */
  headerClassName?: string;

  /**
   * Animation duration in milliseconds
   */
  animationDuration?: number;
}

/**
 * Modal component with accessibility and focus management
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  hideCloseButton = false,
  preventOverlayClose = false,
  preventEscapeClose = false,
  footer,
  initialFocus,
  className,
  contentClassName,
  headerClassName,
  animationDuration = 200,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Size mapping
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full m-4',
  };

  // Variant mapping
  const variantStyles = {
    default: {
      header: 'border-neutral-200',
      title: 'text-neutral-900',
    },
    danger: {
      header: 'border-error-200 bg-error-50',
      title: 'text-error-900',
    },
    success: {
      header: 'border-success-200 bg-success-50',
      title: 'text-success-900',
    },
    warning: {
      header: 'border-warning-200 bg-warning-50',
      title: 'text-warning-900',
    },
  };

  const styles = variantStyles[variant];

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Set initial focus
      setTimeout(() => {
        if (initialFocus) {
          const element = document.querySelector(initialFocus) as HTMLElement;
          element?.focus();
        } else if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          firstFocusable?.focus();
        }
      }, animationDuration);
    } else {
      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen, initialFocus, animationDuration]);

  // Trap focus within modal
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen || !modalRef.current) return;

      if (event.key === 'Escape' && !preventEscapeClose) {
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [isOpen, onClose, preventEscapeClose]
  );

  // Attach/detach keyboard listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current && !preventOverlayClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={handleOverlayClick}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black bg-opacity-50 backdrop-blur-sm',
        'animate-in fade-in',
        className
      )}
      style={{
        animationDuration: `${animationDuration}ms`,
      }}
    >
      {/* Modal Content */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-white rounded-lg shadow-xl',
          'animate-in zoom-in-95 slide-in-from-bottom-4',
          'max-h-[90vh] overflow-hidden flex flex-col',
          sizeStyles[size],
          contentClassName
        )}
        style={{
          animationDuration: `${animationDuration}ms`,
        }}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div
            className={cn(
              'flex items-center justify-between p-6 border-b',
              styles.header,
              headerClassName
            )}
          >
            {title && (
              <h2 id="modal-title" className={cn('text-xl font-semibold', styles.title)}>
                {title}
              </h2>
            )}

            {!hideCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';

/**
 * Hook for modal state management
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = React.useState(initialOpen);

  const openModal = React.useCallback(() => setIsOpen(true), []);
  const closeModal = React.useCallback(() => setIsOpen(false), []);
  const toggleModal = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
