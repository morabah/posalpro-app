/**
 * AI Insights Panel Component
 * AI-powered insights and recommendations
 */

import { memo, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

// AI Insights Component
interface AIInsight {
  type: 'trend' | 'alert' | 'opportunity';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  icon: string;
}

interface AIInsightsPanelProps {
  data?: AIInsight[];
  loading: boolean;
}

export const AIInsightsPanel = memo(({ data, loading }: AIInsightsPanelProps) => {
  // Avoid hydration mismatch by populating time after mount
  const [lastUpdated, setLastUpdated] = useState<string>('');
  useEffect(() => {
    if (!loading) setLastUpdated(new Date().toLocaleTimeString());
  }, [loading, data]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const defaultInsights: AIInsight[] = [
    {
      type: 'trend',
      title: 'Revenue Trend Analysis',
      description: 'Revenue is trending upward with 15% month-over-month growth',
      confidence: 0.92,
      impact: 'high',
      recommendation: 'Continue current sales strategies, focus on high-value proposals',
      icon: '📈',
    },
    {
      type: 'alert',
      title: 'Pipeline Bottleneck Detected',
      description: 'Proposals are stalling in the review stage (avg 8.5 days)',
      confidence: 0.87,
      impact: 'medium',
      recommendation: 'Implement automated review reminders and streamline approval process',
      icon: '⚠️',
    },
    {
      type: 'opportunity',
      title: 'Team Performance Opportunity',
      description: 'QA User shows 40% higher win rate than team average',
      confidence: 0.95,
      impact: 'high',
      recommendation: "Analyze QA User's approach and share best practices with team",
      icon: '🎯',
    },
  ];

  const insights = data || defaultInsights;

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getTypeColor = (type: 'trend' | 'alert' | 'opportunity') => {
    switch (type) {
      case 'trend':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'alert':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'opportunity':
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Analysis</span>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className={`p-4 rounded-lg border ${getTypeColor(insight.type)}`}>
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{insight.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}
                    >
                      {insight.impact.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                <div className="bg-white bg-opacity-50 p-3 rounded border-l-4 border-blue-500">
                  <p className="text-sm font-medium text-gray-900 mb-1">Recommendation:</p>
                  <p className="text-sm text-gray-700">{insight.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Last updated: {lastUpdated || '--'}</span>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All Insights →
          </button>
        </div>
      </div>
    </Card>
  );
});

AIInsightsPanel.displayName = 'AIInsightsPanel';
