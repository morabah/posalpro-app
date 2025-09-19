'use client';

import { Badge } from '@/components/ui/Badge';

interface VersionHistoryStatsProps {
  stats: {
    total: number;
    uniqueUsers: number;
    byType: Record<string, number>;
  };
}

export default function VersionHistoryStats({ stats }: VersionHistoryStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6" aria-label="Summary stats">
      <Badge>{stats.total} changes</Badge>
      <Badge variant="secondary">{stats.uniqueUsers} users</Badge>
      <Badge variant="outline">{stats.byType.create} creates</Badge>
      <Badge variant="outline">{stats.byType.update} updates</Badge>
      <Badge variant="outline">{stats.byType.delete} deletes</Badge>
      <Badge variant="outline">{stats.byType.batch_import} imports</Badge>
    </div>
  );
}
