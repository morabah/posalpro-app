/**
 * Toast Provider
 * Global toast notification system with accessibility and customization
 */

'use client';

import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from './Toast';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface ToastState {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  persistent: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  timestamp: number;
}

type ToastAction =
  | { type: 'ADD_TOAST'; payload: ToastState }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_ALL_TOASTS' }
  | { type: 'UPDATE_TOAST'; payload: { id: string; updates: Partial<ToastState> } };

interface ToastContextType {
  toasts: ToastState[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  updateToast: (id: string, updates: Partial<ToastState>) => void;
  success: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

const toastReducer = (state: ToastState[], action: ToastAction): ToastState[] => {
  switch (action.type) {
    case 'ADD_TOAST':
      // Limit to maximum 5 toasts to prevent overflow
      const newState = [action.payload, ...state].slice(0, 5);
      return newState;

    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload);

    case 'CLEAR_ALL_TOASTS':
      return [];

    case 'UPDATE_TOAST':
      return state.map(toast =>
        toast.id === action.payload.id ? { ...toast, ...action.payload.updates } : toast
      );

    default:
      return state;
  }
};

interface ToastProviderProps {
  children: React.ReactNode;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const generateId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  const addToast = useCallback(
    (options: ToastOptions): string => {
      const id = options.id || generateId();

      const toast: ToastState = {
        id,
        title: options.title,
        message: options.message,
        type: options.type || 'info',
        duration: options.duration ?? (options.type === 'error' ? 6000 : 4000),
        persistent: options.persistent || false,
        action: options.action,
        onClose: options.onClose,
        timestamp: Date.now(),
      };

      dispatch({ type: 'ADD_TOAST', payload: toast });
      return id;
    },
    [generateId]
  );

  const removeToast = useCallback(
    (id: string) => {
      const toast = toasts.find(t => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    },
    [toasts]
  );

  const clearAllToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_TOASTS' });
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<ToastState>) => {
    dispatch({ type: 'UPDATE_TOAST', payload: { id, updates } });
  }, []);

  // Convenience methods
  const success = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
      return addToast({ ...options, message, type: 'success' });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
      return addToast({ ...options, message, type: 'error' });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
      return addToast({ ...options, message, type: 'warning' });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, options?: Omit<ToastOptions, 'type' | 'message'>) => {
      return addToast({ ...options, message, type: 'info' });
    },
    [addToast]
  );

  // Auto-remove toasts after their duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    toasts.forEach(toast => {
      if (!toast.persistent && toast.duration > 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toasts, removeToast]);

  // Listen for global error events
  useEffect(() => {
    const handleAppError = (event: CustomEvent) => {
      const { message, type, duration, action } = event.detail;
      addToast({
        message,
        type: type || 'error',
        duration,
        action,
      });
    };

    window.addEventListener('app:error', handleAppError as EventListener);
    return () => {
      window.removeEventListener('app:error', handleAppError as EventListener);
    };
  }, [addToast]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    updateToast,
    success,
    error,
    warning,
    info,
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {typeof window !== 'undefined' &&
        createPortal(
          <div
            className={`fixed z-50 ${getPositionClasses()} space-y-2`}
            aria-live="polite"
            aria-label="Notifications"
          >
            {toasts.map(toast => (
              <Toast
                key={toast.id}
                id={toast.id}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
                action={toast.action}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
