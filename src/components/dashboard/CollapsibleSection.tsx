'use client';

import { CollapsibleKey, useDashboardCollapsed, useDashboardUIActions } from '@/lib/store/dashboardStore';
import React from 'react';

interface CollapsibleSectionProps {
  idKey: CollapsibleKey;
  sectionProps?: React.HTMLAttributes<HTMLElement>;
  detailsClassName?: string;
  summary: React.ReactNode;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  idKey,
  sectionProps,
  detailsClassName,
  summary,
  children,
}: CollapsibleSectionProps) {
  const collapsed = useDashboardCollapsed();
  const { setSection } = useDashboardUIActions();

  return (
    <section {...sectionProps}>
      <details
        className={detailsClassName}
        open={!collapsed[idKey]}
        onToggle={e => setSection(idKey, (e.currentTarget as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer list-none select-none px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-t-lg">
          {summary}
        </summary>
        <div className="p-4">{children}</div>
      </details>
    </section>
  );
}

