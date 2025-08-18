/**
 * Team Performance Heatmap Component
 * Visual representation of team member performance with rankings
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { TeamPerformance } from '@/types/dashboard';
import { EyeIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { memo } from 'react';
import { formatCurrency, formatPercentage } from '../design';

export const TeamPerformanceHeatmap = memo(
  ({ data, loading }: { data: TeamPerformance[]; loading: boolean }) => {
    if (loading) {
      return (
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </Card>
      );
    }

    const getPerformanceColor = (performance: number) => {
      if (performance >= 100) return 'bg-green-500';
      if (performance >= 80) return 'bg-yellow-500';
      if (performance >= 60) return 'bg-orange-500';
      return 'bg-red-500';
    };

    if (!data || data.length === 0) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">Team Performance Scorecard</h3>
              <p className="text-gray-600">Ranking by target attainment</p>
            </div>
            <Button variant="outline" size="sm" aria-label="View team performance details">
              <EyeIcon className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>

          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Team Performance Loading</h4>
            <p className="text-gray-500 mb-4">Performance metrics are being calculated</p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </Card>
      );
    }

    const sorted = [...data].sort((a, b) => b.performance - a.performance);

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Team Performance Scorecard</h3>
            <p className="text-gray-600">Ranking by target attainment</p>
          </div>
          <Button variant="outline" size="sm" aria-label="View team performance details">
            <EyeIcon className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>

        <div className="space-y-4">
          {sorted.map((member, index) => (
            <div key={`${member.name}-${index}`} className="relative">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {member.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </span>
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-6 h-6 ${getPerformanceColor(member.performance)} rounded-full border-2 border-white flex items-center justify-center`}
                    >
                      {index === 0 && <TrophyIcon className="h-3 w-3 text-white" />}
                    </div>
                    <div className="absolute -top-1 -left-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold">{member.name}</h4>
                    <p className="text-sm text-gray-600">
                      {member.deals} deals • {formatPercentage(member.winRate)} win rate
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(member.revenue)}</div>
                    <div className="text-sm text-gray-600">of {formatCurrency(member.target)}</div>
                  </div>

                  <div className="w-36">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Target</span>
                      <span className="font-semibold">{formatPercentage(member.performance)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getPerformanceColor(member.performance)}`}
                        style={{ width: `${Math.min(100, Math.max(0, member.performance))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
);

TeamPerformanceHeatmap.displayName = 'TeamPerformanceHeatmap';
