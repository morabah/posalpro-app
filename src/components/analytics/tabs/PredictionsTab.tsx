'use client';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

interface PredictionsTabProps {
  analyticsData: any;
  isMobile: boolean;
}

export default function PredictionsTab({ analyticsData, isMobile }: PredictionsTabProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ChartBarIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Predictive Analytics & Insights</h2>

      {/* Key Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyticsData.predictionInsights.map((prediction: any) => (
          <Card key={prediction.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <LightBulbIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{prediction.title}</h3>
                  <p className="text-sm text-gray-600">{prediction.category}</p>
                </div>
              </div>
              <Badge className={getConfidenceColor(prediction.confidence)}>
                {prediction.confidence}% confidence
              </Badge>
            </div>

            <p className="text-sm text-gray-700 mb-4">{prediction.description}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Predicted Impact</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(prediction.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(prediction.trend)}`}>
                    {prediction.impact}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Timeframe</span>
                <span className="text-sm font-medium text-gray-900">{prediction.timeframe}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Risk Level</span>
                <Badge
                  className={
                    prediction.riskLevel === 'low'
                      ? 'bg-green-100 text-green-800'
                      : prediction.riskLevel === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  }
                >
                  {prediction.riskLevel}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Actionable Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analyticsData.recommendations.map((rec: any) => (
            <Card key={rec.id} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <LightBulbIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{rec.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">{rec.priority} priority</Badge>
                    <Badge className="bg-gray-100 text-gray-800">{rec.effort} effort</Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
