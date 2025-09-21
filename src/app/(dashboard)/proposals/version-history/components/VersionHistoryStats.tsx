'use client';

import { ArrowTrendingUpIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

interface VersionHistoryStatsProps {
  stats: {
    total: number;
    uniqueUsers: number;
    byType: Record<string, number>;
  };
  lastUpdated?: Date | null;
  filteredCount: number;
}

const statCards = (
  stats: VersionHistoryStatsProps['stats'],
  lastUpdated: Date | null | undefined,
  filteredCount: number
) => {
  const totalCreations = stats.byType.create ?? 0;
  const totalUpdates = stats.byType.update ?? 0;

  return [
    {
      title: 'Visible versions',
      value: filteredCount,
      caption: `${stats.total} total across selection`,
      icon: ArrowTrendingUpIcon,
      gradient: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700',
    },
    {
      title: 'Contributors',
      value: stats.uniqueUsers,
      caption: `${totalCreations} created • ${totalUpdates} updated`,
      icon: UsersIcon,
      gradient: 'from-indigo-500/15 to-indigo-500/5 text-indigo-700',
    },
    {
      title: 'Last activity',
      value: lastUpdated ? lastUpdated.toLocaleDateString() : '—',
      caption: lastUpdated ? lastUpdated.toLocaleTimeString() : 'No recent activity',
      icon: ClockIcon,
      gradient: 'from-amber-500/15 to-amber-500/5 text-amber-700',
    },
  ];
};

export default function VersionHistoryStats({ stats, lastUpdated, filteredCount }: VersionHistoryStatsProps) {
  const cards = statCards(stats, lastUpdated, filteredCount);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Version history insights">
      {cards.map(card => (
        <div
          key={card.title}
          className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {card.title}
              </p>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</div>
              <p className="mt-1 text-sm text-gray-600">{card.caption}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 text-gray-700 shadow-sm">
              <card.icon className="h-5 w-5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
