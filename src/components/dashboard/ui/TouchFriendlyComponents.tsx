/**
 * Touch-Friendly Components for Executive Dashboard
 * Mobile-optimized components with enhanced touch interactions
 */

import { memo } from 'react';

// Touch-Friendly Interactive Elements
export const TouchFriendlyButton = memo(
  ({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
  }: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
  }) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[44px]',
      md: 'px-4 py-3 text-sm min-h-[48px]',
      lg: 'px-6 py-4 text-base min-h-[56px]',
    };

    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400',
      secondary:
        'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-gray-400',
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
        style={{ touchAction: 'manipulation' }}
      >
        {children}
      </button>
    );
  }
);

// Mobile-Optimized Layout Component
export const MobileOptimizedLayout = memo(
  ({ children, isMobile }: { children: React.ReactNode; isMobile: boolean }) => {
    return (
      <div className={`${isMobile ? 'space-y-4 px-2' : 'space-y-8 container mx-auto px-4'}`}>
        {children}
      </div>
    );
  }
);

// Mobile-Optimized Chart Container
export const MobileChartContainer = memo(
  ({
    children,
    title,
    isMobile,
  }: {
    children: React.ReactNode;
    title: string;
    isMobile: boolean;
  }) => {
    return (
      <div className={`${isMobile ? 'p-3' : 'p-6'} bg-white rounded-lg shadow-md`}>
        <div className={`${isMobile ? 'mb-3' : 'mb-6'}`}>
          <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
            {title}
          </h3>
        </div>
        <div className={`${isMobile ? 'h-64' : 'h-80'} relative`}>{children}</div>
      </div>
    );
  }
);

// Mobile-Optimized Filter Panel
export const MobileFilterPanel = memo(
  ({
    isOpen,
    onClose,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
                aria-label="Close filters"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    );
  }
);

// Mobile-Optimized Data Table
export const MobileDataTable = memo(
  ({
    data,
    columns,
    isMobile,
  }: {
    data: TableRow[];
    columns: Array<{ key: string; label: string; render?: (value: unknown) => React.ReactNode }>;
    isMobile: boolean;
  }) => {
    if (isMobile) {
      return (
        <div className="space-y-3">
          {data.map((row, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              {columns.map(column => (
                <div
                  key={column.key}
                  className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <span className="font-medium text-gray-700">{column.label}:</span>
                  <span className="text-gray-900">
                    {column.render ? column.render(row[column.key]) : String(row[column.key] || '')}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map(column => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {column.render ? column.render(row[column.key]) : String(row[column.key] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

// Enhanced Layout Grid Component
export const EnhancedLayoutGrid = memo(
  ({
    children,
    layout = 'default',
    isMobile,
  }: {
    children: React.ReactNode;
    layout?: 'default' | 'focused' | 'analytics' | 'executive' | 'dashboard';
    isMobile: boolean;
  }) => {
    const layoutClasses = {
      default: 'grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
      focused: 'grid gap-8 grid-cols-1 lg:grid-cols-2',
      analytics: 'grid gap-6 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4',
      executive: 'grid gap-8 grid-cols-1 xl:grid-cols-2',
      dashboard: 'grid gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
    };

    return (
      <div className={`${layoutClasses[layout]} ${isMobile ? 'space-y-4' : ''}`}>{children}</div>
    );
  }
);

// Comprehensive interfaces for TouchFriendlyComponents
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableRow {
  id: string;
  [key: string]: string | number | boolean | Date | null | undefined;
}

interface TouchFriendlyTableProps {
  data: TableRow[];
  columns: TableColumn[];
  onRowClick?: (row: TableRow) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
}

interface TouchFriendlyCardProps {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}
