/**
 * Anomaly Detection Components
 * AI-powered anomaly detection and pattern recognition
 */

import { Card } from '@/components/ui/Card';
import { AnomalyDetection } from '@/types/dashboard';
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { memo, useState } from 'react';

// Anomaly Detection Panel
export const AnomalyDetectionPanel = memo(
  ({
    anomalies,
    onAcknowledge,
    onInvestigate,
  }: {
    anomalies: AnomalyDetection[];
    onAcknowledge: (anomalyId: string) => void;
    onInvestigate: (anomalyId: string) => void;
  }) => {
    const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'high':
          return 'text-red-600 bg-red-50 border-red-200';
        case 'medium':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'low':
          return 'text-blue-600 bg-blue-50 border-blue-200';
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };

    const getSeverityIcon = (severity: string) => {
      switch (severity) {
        case 'high':
          return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
        case 'medium':
          return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
        case 'low':
          return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
        default:
          return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'acknowledged':
          return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
        case 'investigating':
          return <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" />;
        case 'new':
          return <BellIcon className="h-4 w-4 text-orange-500" />;
        default:
          return <ClockIcon className="h-4 w-4 text-gray-500" />;
      }
    };

    const filteredAnomalies = anomalies.filter(
      anomaly => filter === 'all' || anomaly.severity === filter
    );

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Anomaly Detection</h3>
            <p className="text-sm text-gray-600">AI-powered pattern recognition and alerts</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilter(e.currentTarget.value as 'all' | 'high' | 'medium' | 'low')
              }
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredAnomalies.map(anomaly => (
            <div
              key={anomaly.id}
              className={`p-4 border rounded-lg ${getSeverityColor(anomaly.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">{getSeverityIcon(anomaly.severity)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{anomaly.title}</h4>
                      {getStatusIcon(anomaly.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{anomaly.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">Metric:</span>
                        <div className="font-medium">{anomaly.metric}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Expected:</span>
                        <div className="font-medium">{anomaly.expectedValue}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Actual:</span>
                        <div className="font-medium">{anomaly.actualValue}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Deviation:</span>
                        <div className="font-medium">{anomaly.deviation}%</div>
                      </div>
                    </div>

                    {anomaly.patterns && anomaly.patterns.length > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Detected Patterns:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {anomaly.patterns.map((pattern, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium"
                            >
                              {pattern}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {anomaly.recommendations &&
                      Array.isArray(anomaly.recommendations) &&
                      anomaly.recommendations.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Recommendations:
                          </div>
                          <ul className="space-y-1">
                            {anomaly.recommendations.map((recommendation, index) => (
                              <li
                                key={index}
                                className="text-sm text-gray-600 flex items-start space-x-2"
                              >
                                <InformationCircleIcon className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span>{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => onInvestigate(anomaly.id)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => onAcknowledge(anomaly.id)}
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Detected: {new Date(anomaly.detectedAt).toLocaleString('en-US', { timeZone: 'UTC' })}
              </div>
            </div>
          ))}

          {filteredAnomalies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No anomalies detected</p>
              <p className="text-sm">AI is monitoring your data for unusual patterns</p>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

AnomalyDetectionPanel.displayName = 'AnomalyDetectionPanel';

// Anomaly Trend Chart
export const AnomalyTrendChart = memo(
  ({
    data,
    title,
  }: {
    data: Array<{ date: string; anomalyCount: number; severity: 'high' | 'medium' | 'low' }>;
    title: string;
  }) => {
    const maxCount = Math.max(...data.map(d => d.anomalyCount));

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'high':
          return 'bg-red-500';
        case 'medium':
          return 'bg-yellow-500';
        case 'low':
          return 'bg-blue-500';
        default:
          return 'bg-gray-500';
      }
    };

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>

        <div className="space-y-3">
          {data.map((point, index) => {
            const percentage = maxCount > 0 ? (point.anomalyCount / maxCount) * 100 : 0;

            return (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-20 text-sm text-gray-600">
                  {new Date(point.date).toLocaleDateString()}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${getSeverityColor(point.severity)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-right">{point.anomalyCount}</div>
                <div className={`w-3 h-3 rounded ${getSeverityColor(point.severity)}`}></div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Low</span>
          </div>
        </div>
      </Card>
    );
  }
);

AnomalyTrendChart.displayName = 'AnomalyTrendChart';

// Anomaly Alert Settings
export const AnomalyAlertSettings = memo(
  ({
    settings,
    onUpdateSettings,
  }: {
    settings: {
      enabled: boolean;
      thresholds: {
        high: number;
        medium: number;
        low: number;
      };
      notifications: {
        email: boolean;
        push: boolean;
        slack: boolean;
      };
      autoAcknowledge: boolean;
    };
    onUpdateSettings: (settings: any) => void;
  }) => {
    const updateThreshold = (severity: string, value: number) => {
      onUpdateSettings({
        ...settings,
        thresholds: {
          ...settings.thresholds,
          [severity]: value,
        },
      });
    };

    const updateNotification = (type: string, enabled: boolean) => {
      onUpdateSettings({
        ...settings,
        notifications: {
          ...settings.notifications,
          [type]: enabled,
        },
      });
    };

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Alert Settings</h3>

        <div className="space-y-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={e => onUpdateSettings({ ...settings, enabled: e.target.checked })}
                className="mr-3"
              />
              <span className="text-sm font-medium">Enable Anomaly Detection</span>
            </label>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Detection Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">High Priority (%)</label>
                <input
                  type="number"
                  value={settings.thresholds.high}
                  onChange={e => updateThreshold('high', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Medium Priority (%)</label>
                <input
                  type="number"
                  value={settings.thresholds.medium}
                  onChange={e => updateThreshold('medium', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Low Priority (%)</label>
                <input
                  type="number"
                  value={settings.thresholds.low}
                  onChange={e => updateThreshold('low', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Notification Channels</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={e => updateNotification('email', e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm">Email notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={e => updateNotification('push', e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm">Push notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notifications.slack}
                  onChange={e => updateNotification('slack', e.target.checked)}
                  className="mr-3"
                />
                <span className="text-sm">Slack notifications</span>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoAcknowledge}
                onChange={e => onUpdateSettings({ ...settings, autoAcknowledge: e.target.checked })}
                className="mr-3"
              />
              <span className="text-sm">
                Auto-acknowledge low priority anomalies after 24 hours
              </span>
            </label>
          </div>
        </div>
      </Card>
    );
  }
);

AnomalyAlertSettings.displayName = 'AnomalyAlertSettings';
