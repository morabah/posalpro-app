/**
 * Enhanced UI Components for Executive Dashboard
 * Reusable UI components with enhanced styling and functionality
 */

import { memo } from 'react';

// Enhanced Card Component with Better Styling
export const EnhancedCard = memo(
  ({
    children,
    className = '',
    variant = 'default',
    padding = 'lg',
    shadow = 'md',
    border = true,
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'gradient' | 'elevated' | 'minimal';
    padding?: 'sm' | 'md' | 'lg' | 'xl';
    shadow?: 'sm' | 'md' | 'lg' | 'xl';
    border?: boolean;
  }) => {
    const baseClasses = 'rounded-xl transition-all duration-200 hover:shadow-lg';

    const variantClasses = {
      default: 'bg-white border border-gray-200',
      gradient: 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100',
      elevated: 'bg-white shadow-xl border-0',
      minimal: 'bg-gray-50 border-0',
    };

    const paddingClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    const shadowClasses = {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    };

    return (
      <div
        className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${border ? '' : 'border-0'}
        ${className}
      `}
      >
        {children}
      </div>
    );
  }
);

// Enhanced Metric Card with Better Visual Design
export const EnhancedMetricCard = memo(
  ({
    title,
    value,
    change,
    icon,
    color = 'primary',
    trend = 'neutral',
    size = 'md',
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'danger';
    trend?: 'up' | 'down' | 'neutral';
    size?: 'sm' | 'md' | 'lg';
  }) => {
    const colorClasses = {
      primary: 'bg-blue-50 text-blue-700 border-blue-200',
      success: 'bg-green-50 text-green-700 border-green-200',
      warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      danger: 'bg-red-50 text-red-700 border-red-200',
    };

    const sizeClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const valueSizeClasses = {
      sm: 'text-2xl',
      md: 'text-3xl',
      lg: 'text-4xl',
    };

    return (
      <EnhancedCard
        variant="gradient"
        padding={size}
        className="relative overflow-hidden group hover:scale-105 transition-transform duration-200"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400 to-blue-600 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
            {icon && <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>}
          </div>

          <div className="mb-2">
            <div className={`font-bold ${valueSizeClasses[size]} text-gray-900`}>{value}</div>
          </div>

          {change !== undefined && (
            <div className="flex items-center">
              <span
                className={`text-sm font-medium ${
                  trend === 'up'
                    ? 'text-green-600'
                    : trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-500'
                }`}
              >
                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {Math.abs(change)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last period</span>
            </div>
          )}
        </div>
      </EnhancedCard>
    );
  }
);

// Enhanced Dashboard Container with Better Background
export const EnhancedDashboardContainer = memo(
  ({
    children,
    variant = 'default',
  }: {
    children: React.ReactNode;
    variant?: 'default' | 'gradient' | 'minimal';
  }) => {
    const variantClasses = {
      default: 'min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50',
      gradient: 'min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900',
      minimal: 'min-h-screen bg-white',
    };

    return (
      <div className={variantClasses[variant]}>
        <div className="container mx-auto px-4 py-8">{children}</div>
      </div>
    );
  }
);

// Enhanced Section Header with Better Typography
export const EnhancedSectionHeader = memo(
  ({
    title,
    subtitle,
    actions,
    variant = 'default',
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    variant?: 'default' | 'gradient' | 'minimal';
  }) => {
    const variantClasses = {
      default: 'border-b border-gray-200 pb-4 mb-6',
      gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl mb-6',
      minimal: 'pb-2 mb-4',
    };

    return (
      <div className={variantClasses[variant]}>
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`text-2xl font-bold ${
                variant === 'gradient' ? 'text-white' : 'text-gray-900'
              }`}
            >
              {title}
            </h2>
            {subtitle && (
              <p className={`mt-1 ${variant === 'gradient' ? 'text-blue-100' : 'text-gray-600'}`}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center space-x-3">{actions}</div>}
        </div>
      </div>
    );
  }
);

// Enhanced Dashboard Header
export const EnhancedDashboardHeader = memo(
  ({
    title,
    subtitle,
    actions,
    breadcrumbs,
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    breadcrumbs?: Array<{ label: string; href?: string }>;
  }) => {
    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        {breadcrumbs && (
          <nav className="flex mb-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="text-gray-400 mx-2">/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="text-blue-600 hover:text-blue-800 text-sm">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-3">{actions}</div>}
        </div>
      </div>
    );
  }
);

// Quick Actions Panel
export const QuickActionsPanel = memo(
  ({
    actions,
  }: {
    actions: Array<{
      id: string;
      label: string;
      icon: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary' | 'danger';
    }>;
  }) => {
    return (
      <EnhancedCard className="p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] ${
                action.variant === 'primary'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                  : action.variant === 'danger'
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <span className="mr-2">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </EnhancedCard>
    );
  }
);

