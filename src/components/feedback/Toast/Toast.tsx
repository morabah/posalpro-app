/**
 * Toast Component
 * Individual toast notification with animations and accessibility
 */

'use client';

import { AlertTriangleIcon, CheckIcon, InfoIcon, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({ id, title, message, type, onClose, action }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckIcon className="w-5 h-5 text-green-600" />;
      case 'error':
        return <X className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <InfoIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <InfoIcon className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-blue-800';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Delay actual removal to allow exit animation
    setTimeout(onClose, 200);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  useEffect(() => {
    // Focus management for accessibility
    const toastElement = document.getElementById(`toast-${id}`);
    if (toastElement) {
      toastElement.focus();
    }
  }, [id]);

  return (
    <>
      {isVisible && (
        <div
          id={`toast-${id}`}
          className={`
            w-full max-w-sm
            ${getBackgroundColor()}
            border
            rounded-lg
            shadow-lg
            p-4
            relative
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:ring-offset-2
            animate-in slide-in-from-right-2 duration-200
          `}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {title && (
                <div className={`text-sm font-semibold ${getTextColor()} mb-1`}>{title}</div>
              )}
              <div className={`text-sm ${getTextColor()}`}>{message}</div>

              {/* Action Button */}
              {action && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={action.onClick}
                    className={`
                      text-sm font-medium
                      ${type === 'success' ? 'text-green-700 hover:text-green-600' : ''}
                      ${type === 'error' ? 'text-red-700 hover:text-red-600' : ''}
                      ${type === 'warning' ? 'text-yellow-700 hover:text-yellow-600' : ''}
                      ${type === 'info' ? 'text-blue-700 hover:text-blue-600' : ''}
                      underline
                      focus:outline-none
                      focus:ring-2
                      focus:ring-primary-500
                      focus:ring-offset-1
                      rounded
                    `}
                  >
                    {action.label}
                  </button>
                </div>
              )}
            </div>

            {/* Close Button */}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className={`
                  inline-flex
                  rounded-md
                  p-1.5
                  ${
                    type === 'success'
                      ? 'text-green-400 hover:bg-green-100 focus:ring-green-600'
                      : ''
                  }
                  ${type === 'error' ? 'text-red-400 hover:bg-red-100 focus:ring-red-600' : ''}
                  ${
                    type === 'warning'
                      ? 'text-yellow-400 hover:bg-yellow-100 focus:ring-yellow-600'
                      : ''
                  }
                  ${type === 'info' ? 'text-blue-400 hover:bg-blue-100 focus:ring-blue-600' : ''}
                  focus:outline-none
                  focus:ring-2
                  focus:ring-offset-2
                  transition-colors
                  duration-200
                `}
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress bar for timed toasts */}
          <div
            className={`
              absolute bottom-0 left-0 h-1 rounded-b-lg
              ${type === 'success' ? 'bg-green-400' : ''}
              ${type === 'error' ? 'bg-red-400' : ''}
              ${type === 'warning' ? 'bg-yellow-400' : ''}
              ${type === 'info' ? 'bg-blue-400' : ''}
              animate-pulse
            `}
          />
        </div>
      )}
    </>
  );
}

// Add default export for easier importing
export default Toast;
