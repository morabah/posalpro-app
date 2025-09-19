'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CheckCircleIcon, ExclamationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface HypothesesTabProps {
  analyticsData: any;
  isMobile: boolean;
}

export default function HypothesesTab({ analyticsData, isMobile }: HypothesesTabProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'good':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'needs_attention':
        return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      case 'needs_attention':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Hypothesis Validation Tracking</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsData.hypothesesMetrics.map((h: any) => (
          <Card key={h.id} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{h.name}</h3>
                <Badge className={getStatusColor(h.status)}>{h.status.replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Progress: {h.progressPercentage}% | Events: {h.eventsCount}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${h.progressPercentage}%`,
                    backgroundColor:
                      h.progressPercentage >= 80
                        ? '#10b981'
                        : h.progressPercentage >= 60
                          ? '#3b82f6'
                          : h.progressPercentage >= 40
                            ? '#f59e0b'
                            : '#ef4444',
                  }}
                ></div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {getStatusIcon(h.status)}
                <span>
                  {h.progressPercentage >= 80
                    ? 'Excellent progress'
                    : h.progressPercentage >= 60
                      ? 'Good progress'
                      : h.progressPercentage >= 40
                        ? 'Needs attention'
                        : 'Critical - requires immediate action'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
