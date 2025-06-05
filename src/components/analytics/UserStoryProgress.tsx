/**
 * PosalPro MVP2 - User Story Progress Component
 * Displays user story completion and tracking data
 */

'use client';

import { Card } from '@/components/ui/Card';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface UserStoryData {
  totalStories: number;
  completedStories: number;
  inProgress: number;
  avgCompletionRate: number;
  completionPercentage: number;
  storiesWithFailures: number;
}

interface UserStoryProgressProps {
  data: UserStoryData;
  timeRange: string;
}

export const UserStoryProgress: React.FC<UserStoryProgressProps> = ({ data, timeRange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">User Story Progress</h3>
        <p className="text-sm text-gray-600 mb-6">
          User story completion tracking and acceptance criteria validation for the {timeRange}{' '}
          period.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <span className="text-2xl font-bold text-gray-900">{data.completedStories}</span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Completed Stories</h4>
            <p className="text-xs text-gray-600">
              {Math.round(data.completionPercentage)}% of total stories
            </p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <ClockIcon className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{data.inProgress}</span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">In Progress</h4>
            <p className="text-xs text-gray-600">Active development stories</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-sm font-bold text-purple-600">%</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {Math.round(data.avgCompletionRate * 100)}%
              </span>
            </div>
            <h4 className="text-sm font-medium text-gray-900 mb-1">Avg Completion Rate</h4>
            <p className="text-xs text-gray-600">Average acceptance criteria passed</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Overall Progress</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Stories</span>
              <span className="font-medium text-gray-900">{data.totalStories}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 bg-green-500 rounded-full"
                style={{ width: `${data.completionPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {data.completedStories} completed, {data.inProgress} in progress
              </span>
              <span className="text-gray-600">{data.storiesWithFailures} with failures</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
