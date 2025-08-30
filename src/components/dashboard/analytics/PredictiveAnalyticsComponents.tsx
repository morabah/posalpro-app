/**
 * Predictive Analytics Components
 * AI-powered predictive analytics and forecasting
 */

import { Card } from '@/components/ui/Card';
import { PredictiveAnalytics } from '@/types/dashboard';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { memo, useState } from 'react';
import { formatCurrency, formatDateUTC, formatNumber } from '@/lib/utils';

// Predictive Analytics Dashboard
export const PredictiveAnalyticsDashboard = memo(
  ({
    predictions,
    onRefreshPredictions,
  }: {
    predictions: PredictiveAnalytics[];
    onRefreshPredictions: () => void;
  }) => {
    const [selectedMetric, setSelectedMetric] = useState<string>('revenue');

    const getConfidenceColor = (confidence: number) => {
      if (confidence >= 80) return 'text-green-600';
      if (confidence >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getConfidenceLabel = (confidence: number) => {
      if (confidence >= 80) return 'High';
      if (confidence >= 60) return 'Medium';
      return 'Low';
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
      switch (trend) {
        case 'up':
          return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
        case 'down':
          return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
        case 'stable':
          return <ChartBarIcon className="h-4 w-4 text-gray-500" />;
        default:
          return <ChartBarIcon className="h-4 w-4 text-gray-500" />;
      }
    };

    const formatValue = (value: number, type: string) => {
      switch (type) {
        case 'currency':
          return formatCurrency(value);
        case 'percentage':
          return `${value.toFixed(1)}%`;
        case 'number':
          return formatNumber(value);
        default:
          return value.toString();
      }
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Predictive Analytics</h3>
            <p className="text-sm text-gray-600">AI-powered insights and forecasts</p>
          </div>
          <button
            onClick={onRefreshPredictions}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Predictions
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Metric</label>
          <select
            value={selectedMetric}
            onChange={e => setSelectedMetric(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="revenue">Revenue</option>
            <option value="pipeline">Pipeline</option>
            <option value="conversion">Conversion Rate</option>
            <option value="churn">Churn Rate</option>
          </select>
        </div>

        <div className="space-y-4">
          {predictions
            .filter(prediction => prediction.metric === selectedMetric)
            .map(prediction => (
              <div key={prediction.id} className="p-4 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <LightBulbIcon className="h-5 w-5 text-blue-500" />
                    <h4 className="font-medium text-gray-900">{prediction.title}</h4>
                  </div>
                  <div
                    className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}
                  >
                    {getConfidenceLabel(prediction.confidence)} Confidence
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-sm text-gray-500">Current Value</div>
                    <div className="text-lg font-semibold">
                      {formatValue(prediction.currentValue, prediction.valueType)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Predicted Value</div>
                    <div className="text-lg font-semibold flex items-center space-x-1">
                      {formatValue(prediction.predictedValue, prediction.valueType)}
                      {getTrendIcon(prediction.trend)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Growth Rate</div>
                    <div
                      className={`text-lg font-semibold ${
                        prediction.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {prediction.growthRate > 0 ? '+' : ''}
                      {prediction.growthRate.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="text-sm text-blue-800">
                    <strong>Key Factors:</strong> {prediction.keyFactors.join(', ')}
                  </div>
                </div>

                {prediction.recommendations &&
                  Array.isArray(prediction.recommendations) &&
                  prediction.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Recommendations:</div>
                      <ul className="space-y-1">
                        {prediction.recommendations.map((recommendation, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start space-x-2"
                          >
                            <InformationCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                <div className="mt-3 text-xs text-gray-500">
                  Last updated:{' '}
                  {formatDateUTC(prediction.lastUpdated, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}

          {predictions &&
            Array.isArray(predictions) &&
            predictions.filter(p => p.metric === selectedMetric).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No predictions available for {selectedMetric}</p>
                <p className="text-sm">AI models are analyzing your data</p>
              </div>
            )}
        </div>
      </Card>
    );
  }
);

PredictiveAnalyticsDashboard.displayName = 'PredictiveAnalyticsDashboard';

// Prediction Confidence Indicator
export const PredictionConfidenceIndicator = memo(
  ({ confidence, showLabel = true }: { confidence: number; showLabel?: boolean }) => {
    const getColor = (confidence: number) => {
      if (confidence >= 80) return 'bg-green-500';
      if (confidence >= 60) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    const getLabel = (confidence: number) => {
      if (confidence >= 80) return 'High';
      if (confidence >= 60) return 'Medium';
      return 'Low';
    };

    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getColor(confidence)}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 min-w-[40px]">{confidence}%</span>
        )}
      </div>
    );
  }
);

PredictionConfidenceIndicator.displayName = 'PredictionConfidenceIndicator';

// Trend Analysis Chart
export const TrendAnalysisChart = memo(
  ({
    data,
    title,
    type = 'line',
  }: {
    data: Array<{ date: string; value: number; predicted?: boolean }>;
    title: string;
    type?: 'line' | 'bar';
  }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        <div className="space-y-2">
          {data.map((point, index) => {
            const percentage = ((point.value - minValue) / (maxValue - minValue)) * 100;

            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-600">
                  {formatDateUTC(point.date, { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      point.predicted ? 'bg-blue-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-16 text-sm font-medium text-right">
                  {numberFormatter.format(point.value)}
                </div>
                {point.predicted && (
                  <div className="text-xs text-blue-600 font-medium">Predicted</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Historical</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Predicted</span>
          </div>
        </div>
      </Card>
    );
  }
);

TrendAnalysisChart.displayName = 'TrendAnalysisChart';

// AI Model Performance
export const AIModelPerformance = memo(
  ({
    models,
  }: {
    models: Array<{
      id: string;
      name: string;
      accuracy: number;
      lastTrained: string;
      status: 'active' | 'training' | 'error';
      predictions: number;
    }>;
  }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active':
          return 'text-green-600 bg-green-50';
        case 'training':
          return 'text-yellow-600 bg-yellow-50';
        case 'error':
          return 'text-red-600 bg-red-50';
        default:
          return 'text-gray-600 bg-gray-50';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'active':
          return <ChartBarIcon className="h-4 w-4" />;
        case 'training':
          return <ArrowTrendingUpIcon className="h-4 w-4 animate-pulse" />;
        case 'error':
          return <ExclamationTriangleIcon className="h-4 w-4" />;
        default:
          return <ChartBarIcon className="h-4 w-4" />;
      }
    };

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Model Performance</h3>

        <div className="space-y-4">
          {models.map(model => (
            <div key={model.id} className={`p-4 border rounded-lg ${getStatusColor(model.status)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(model.status)}
                  <div>
                    <h4 className="font-medium text-gray-900">{model.name}</h4>
                    <div className="text-sm text-gray-600">
                      Last trained:{' '}
                      {formatDateUTC(model.lastTrained, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{model.accuracy.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 font-medium capitalize">{model.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Predictions:</span>
                  <span className="ml-2 font-medium">{numberFormatter.format(model.predictions)}</span>
                </div>
              </div>

              <div className="mt-3">
                <PredictionConfidenceIndicator confidence={model.accuracy} showLabel={false} />
              </div>
            </div>
          ))}

          {models.length === 0 && (
            <div className="text-center py-4 text-gray-500">No AI models configured</div>
          )}
        </div>
      </Card>
    );
  }
);

AIModelPerformance.displayName = 'AIModelPerformance';
