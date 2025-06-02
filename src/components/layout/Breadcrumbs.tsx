/**
 * PosalPro MVP2 - Breadcrumb Navigation
 * Hierarchical navigation component for page location indication
 * Based on wireframe specifications for navigation context
 */

'use client';

import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Map route segments to readable labels
const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  proposals: 'Proposals',
  content: 'Content',
  products: 'Products',
  sme: 'SME Tools',
  validation: 'Validation',
  workflows: 'Workflows',
  coordination: 'Coordination',
  rfp: 'RFP Parser',
  customers: 'Customers',
  analytics: 'Analytics',
  admin: 'Admin',
  profile: 'Profile',
  settings: 'Settings',
  create: 'Create',
  edit: 'Edit',
  management: 'Management',
  search: 'Search',
  selection: 'Selection',
  relationships: 'Relationships',
  contributions: 'Contributions',
  assignments: 'Assignments',
  rules: 'Rules',
  approval: 'Approval',
  templates: 'Templates',
  parser: 'Parser',
  analysis: 'Analysis',
};

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from current path if items not provided
  const breadcrumbItems = useMemo(() => {
    if (items) return items;

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Home',
        href: '/dashboard',
        icon: HomeIcon,
      },
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip dynamic route segments (those starting with [)
      if (segment.startsWith('[')) return;

      const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        label,
        href: currentPath,
      });
    });

    return breadcrumbs;
  }, [items, pathname]);

  // Don't render if only home breadcrumb
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const IconComponent = item.icon;

          return (
            <li key={`${index}-${item.href}`} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 mx-1 text-gray-400" aria-hidden="true" />
              )}

              {isLast ? (
                <span className="flex items-center font-medium text-gray-900" aria-current="page">
                  {IconComponent && <IconComponent className="w-4 h-4 mr-1" aria-hidden="true" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center hover:text-gray-700 transition-colors duration-150"
                  aria-label={`Navigate to ${item.label}`}
                >
                  {IconComponent && <IconComponent className="w-4 h-4 mr-1" aria-hidden="true" />}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
