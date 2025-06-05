/**
 * PosalPro MVP2 - Hypothesis Overview Component
 * Displays hypothesis validation metrics and progress
 */

'use client';

import { Card } from '@/components/ui/Card';
import { ArrowTrendingUpIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface HypothesisData {
  totalEvents: number;
  avgImprovement: number;
  successRate: number;
  hypothesisBreakdown: Array<{
    hypothesis: string;
    _count: { _all: number };
    _avg: { performanceImprovement: number };
  }>;
}

interface HypothesisOverviewProps {
  data: HypothesisData;
  timeRange: string;
}

const HYPOTHESIS_NAMES: Record<string, string> = {
  H1: 'Content Discovery',
  H3: 'SME Contribution',
  H4: 'Cross-Department Coordination',
  H6: 'Requirement Extraction',
  H7: 'Deadline Management',
  H8: 'Technical Validation',
};

export const HypothesisOverview: React.FC<HypothesisOverviewProps> = ({ data, timeRange }) => {
  const getStatusIcon = (improvement: number) => {
    if (improvement >= 40) return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
    if (improvement >= 20) return <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />;
    return <ClockIcon className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusColor = (improvement: number) => {
    if (improvement >= 40) return 'text-green-600 bg-green-100';
    if (improvement >= 20) return 'text-blue-600 bg-blue-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hypothesis Validation Overview</h3>
        <p className="text-sm text-gray-600 mb-6">
          Performance tracking across all validated hypotheses for the {timeRange} period.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.hypothesisBreakdown.map(item => {
          const improvement = item._avg.performanceImprovement || 0;
          const hypothesisName = HYPOTHESIS_NAMES[item.hypothesis] || item.hypothesis;

          return (
            <Card key={item.hypothesis}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(improvement)}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{item.hypothesis}</h4>
                      <p className="text-sm text-gray-600">{hypothesisName}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(improvement)}`}
                  >
                    {improvement >= 40
                      ? 'Exceeding'
                      : improvement >= 20
                        ? 'On Track'
                        : 'In Progress'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Performance Improvement</span>
                    <span className="text-lg font-bold text-gray-900">
                      {Math.round(improvement)}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        improvement >= 40
                          ? 'bg-green-500'
                          : improvement >= 20
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(improvement, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{item._count._all} validation events</span>
                    <span className="text-gray-600">Target: 30-50%</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {data.hypothesisBreakdown.length === 0 && (
        <Card>
          <div className="p-6 text-center">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">
              No hypothesis validation events found for the selected time range.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
