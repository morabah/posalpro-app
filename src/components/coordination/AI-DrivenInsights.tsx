/**
 * PosalPro MVP2 - AI-Driven Insights Component
 * Provides intelligent recommendations and insights for cross-department coordination
 * Enhanced with standardized error handling and Component Traceability Matrix
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logDebug } from '@/lib/logger';
import {
  ArrowRightIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useState } from 'react';

const errorHandlingService = ErrorHandlingService.getInstance();

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-4.1', 'US-4.2', 'US-5.1', 'US-5.3'],
  acceptanceCriteria: ['AC-4.1.3', 'AC-4.2.2', 'AC-5.1.4', 'AC-5.3.1'],
  methods: [
    'generateInsights()',
    'analyzeCoordination()',
    'predictBottlenecks()',
    'recommendActions()',
  ],
  hypotheses: ['H4', 'H1', 'H8'],
  testCases: ['TC-H4-002', 'TC-H1-003', 'TC-H8-004'],
};

// Types
interface InsightMetadata {
  [key: string]: string | number | boolean | Date;
}

interface Insight {
  id: string;
  type: 'warning' | 'recommendation' | 'success' | 'error' | 'info';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  category: 'coordination' | 'performance' | 'quality' | 'timeline' | 'budget';
  actionable: boolean;
  suggestedActions?: string[];
  metadata?: InsightMetadata;
  createdAt: string;
}

interface InsightMetrics {
  totalInsights: number;
  actionableInsights: number;
  criticalWarnings: number;
  averageConfidence: number;
  topCategory: string;
}

interface AIDrivenInsightsProps {
  className?: string;
  maxInsights?: number;
  showMetrics?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const AIDrivenInsights: React.FC<AIDrivenInsightsProps> = ({
  className = '',
  maxInsights = 5,
  showMetrics = true,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
}) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [metrics, setMetrics] = useState<InsightMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { handleAsyncError } = useErrorHandler();
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Generate AI insights based on current system data
  const generateInsights = useCallback(async () => {
    try {
      setLoading(true);

      // Simulate AI analysis of current coordination data
      const mockInsights: Insight[] = [
        {
          id: 'insight_1',
          type: 'warning',
          title: 'SME Bottleneck Detected',
          description:
            'Technical validation team has 3 pending reviews that may delay proposal submissions by 2-3 days.',
          impact: 'high',
          confidence: 87,
          category: 'coordination',
          actionable: true,
          suggestedActions: [
            'Reassign one review to secondary SME',
            'Prioritize proposals with immediate deadlines',
            'Consider parallel review process for low-complexity items',
          ],
          metadata: {
            affectedProposals: 3,
            estimatedDelay: '2-3 days',
            teamUtilization: 95,
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'insight_2',
          type: 'recommendation',
          title: 'Content Reuse Opportunity',
          description:
            'Detected 73% similarity between current proposal and recently approved content. Consider leveraging existing sections.',
          impact: 'medium',
          confidence: 92,
          category: 'performance',
          actionable: true,
          suggestedActions: [
            'Review proposal sections 3.2-3.5 for reusable content',
            'Apply automated content matching suggestions',
            'Reduce development time by approximately 40%',
          ],
          metadata: {
            similarity: 73,
            potentialTimeSaving: '40%',
            relatedProposal: 'PROP-2024-089',
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'insight_3',
          type: 'success',
          title: 'Coordination Efficiency Improved',
          description:
            'Cross-department handoffs have improved by 23% this week. Team collaboration is trending positively.',
          impact: 'medium',
          confidence: 84,
          category: 'coordination',
          actionable: false,
          metadata: {
            improvementPercentage: 23,
            timeframe: 'this week',
            trend: 'positive',
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'insight_4',
          type: 'info',
          title: 'Resource Allocation Optimization',
          description:
            'Current resource allocation shows 15% underutilization in design team. Consider redistributing workload.',
          impact: 'low',
          confidence: 76,
          category: 'performance',
          actionable: true,
          suggestedActions: [
            'Review design team capacity',
            'Identify additional design tasks',
            'Consider cross-training opportunities',
          ],
          metadata: {
            underutilization: 15,
            teamSize: 8,
            availableCapacity: '32 hours/week',
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: 'insight_5',
          type: 'warning',
          title: 'Deadline Risk Assessment',
          description:
            'Two proposals approaching deadline with incomplete technical specifications. Risk of delay: 67%.',
          impact: 'high',
          confidence: 91,
          category: 'timeline',
          actionable: true,
          suggestedActions: [
            'Schedule immediate technical review meeting',
            'Identify specification gaps by EOD',
            'Consider deadline extension if quality at risk',
          ],
          metadata: {
            proposalsAtRisk: 2,
            delayProbability: 67,
            daysRemaining: 3,
          },
          createdAt: new Date().toISOString(),
        },
      ];

      // Apply category filter
      const filteredInsights =
        selectedCategory === 'all'
          ? mockInsights
          : mockInsights.filter(insight => insight.category === selectedCategory);

      // Limit results
      const limitedInsights = filteredInsights.slice(0, maxInsights);
      setInsights(limitedInsights);

      // Calculate metrics
      const insightMetrics: InsightMetrics = {
        totalInsights: mockInsights.length,
        actionableInsights: mockInsights.filter(i => i.actionable).length,
        criticalWarnings: mockInsights.filter(i => i.type === 'warning' && i.impact === 'high')
          .length,
        averageConfidence: Math.round(
          mockInsights.reduce((acc, i) => acc + i.confidence, 0) / mockInsights.length
        ),
        topCategory: 'coordination',
      };
      setMetrics(insightMetrics);

      // Track analytics
      analytics('ai_insights_generated', {
        totalInsights: mockInsights.length,
        actionableInsights: mockInsights.filter(i => i.actionable).length,
        criticalWarnings: mockInsights.filter(i => i.type === 'warning' && i.impact === 'high')
          .length,
        averageConfidence: Math.round(
          mockInsights.reduce((sum, insight) => sum + insight.confidence, 0) / mockInsights.length
        ),
        topCategory: insightMetrics.topCategory,
        component: 'AIDrivenInsights',
        userStory: 'US-4.1',
        acceptanceCriteria: ['AC-4.1.3'],
        hypothesis: 'H4',
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to generate AI insights',
        ErrorCodes.VALIDATION.OPERATION_FAILED,
        {
          component: 'AIDrivenInsights',
          operation: 'generateInsights',
          userFriendlyMessage: 'Unable to load insights. Please refresh.',
          traceability: COMPONENT_MAPPING,
        }
      );
      handleAsyncError(processedError, 'Unable to load insights. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, maxInsights, analytics, handleAsyncError]);

  // Initial load and auto-refresh
  useEffect(() => {
    generateInsights();

    if (autoRefresh) {
      const interval = setInterval(generateInsights, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [generateInsights, autoRefresh, refreshInterval]);

  // Handle insight action
  const handleInsightAction = useCallback(
    (insight: Insight, actionIndex: number) => {
      const action = insight.suggestedActions?.[actionIndex];
      if (!action) return;

      analytics('insight_action_taken', {
        insightId: insight.id,
        insightType: insight.type,
        actionIndex,
        action,
        component: 'AIDrivenInsights',
        userStory: 'US-4.1',
        acceptanceCriteria: ['AC-4.1.3'],
        hypothesis: 'H4',
      });

      // In a real implementation, this would trigger actual system actions
      logDebug(`Taking action: ${action} for insight: ${insight.title}`);
    },
    [analytics]
  );

  // Get icon for insight type
  const getInsightIcon = (type: string, impact: string) => {
    const iconClass = `h-5 w-5 ${
      type === 'warning'
        ? 'text-yellow-500'
        : type === 'success'
          ? 'text-green-500'
          : type === 'recommendation'
            ? 'text-blue-500'
            : 'text-gray-500'
    }`;

    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className={iconClass} />;
      case 'success':
        return <CheckCircleIcon className={iconClass} />;
      case 'recommendation':
        return <LightBulbIcon className={iconClass} />;
      default:
        return <ChartBarIcon className={iconClass} />;
    }
  };

  const categories = [
    { value: 'all', label: 'All Insights' },
    { value: 'coordination', label: 'Coordination' },
    { value: 'performance', label: 'Performance' },
    { value: 'resource', label: 'Resources' },
    { value: 'timeline', label: 'Timeline' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <LightBulbIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">AI-Driven Insights</h3>
            <p className="text-sm text-gray-500">
              Intelligent recommendations for coordination optimization
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={generateInsights}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <ArrowRightIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Metrics Overview */}
      {showMetrics && metrics && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalInsights}</div>
              <div className="text-sm text-gray-500">Total Insights</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.actionableInsights}</div>
              <div className="text-sm text-gray-500">Actionable</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{metrics.criticalWarnings}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{metrics.averageConfidence}%</div>
              <div className="text-sm text-gray-500">Confidence</div>
            </div>
          </div>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex space-x-2 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-500">Analyzing coordination data...</span>
          </div>
        ) : insights.length === 0 ? (
          <Card className="p-8 text-center">
            <LightBulbIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Insights Available</h3>
            <p className="text-gray-500">
              No coordination insights found for the selected category. Try adjusting your filters
              or check back later.
            </p>
          </Card>
        ) : (
          insights.map(insight => (
            <Card key={insight.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type, insight.impact)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-medium text-gray-900">{insight.title}</h4>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          insight.impact === 'high'
                            ? 'bg-red-100 text-red-800'
                            : insight.impact === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {insight.impact} impact
                      </span>
                      <span className="text-xs text-gray-500">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{insight.description}</p>

                  {insight.actionable && insight.suggestedActions && (
                    <div className="border-t pt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Suggested Actions:</h5>
                      <div className="space-y-2">
                        {insight.suggestedActions.map((action, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <span className="text-sm text-gray-700">{action}</span>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleInsightAction(insight, index)}
                              className="flex items-center space-x-1"
                            >
                              <ArrowRightIcon className="h-3 w-3" />
                              <span>Apply</span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{new Date(insight.createdAt).toLocaleTimeString()}</span>
                      </span>
                      <span className="capitalize">{insight.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AIDrivenInsights;
