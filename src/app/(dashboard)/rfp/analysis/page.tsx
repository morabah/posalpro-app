/**
 * PosalPro MVP2 - RFP Analysis Tools
 * Based on RFP_PARSER_SCREEN.md wireframe specifications
 *
 * User Stories: US-4.2
 * Hypothesis Coverage: H6 (Automated Requirement Extraction - 30% improvement)
 * Component Traceability: AIAnalysisPanel, RequirementClassifier, SourceTextMapping
 */

'use client';

import { useApiClient } from '@/hooks/useApiClient';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { StandardError } from '@/lib/errors/StandardError';
import { ApiResponse } from '@/types/api';
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface AnalysisMetrics {
  totalDocuments: number;
  averageRequirements: number;
  averageCompliance: number;
  processingTime: number;
  accuracyScore: number;
}

interface RequirementTrend {
  category: string;
  count: number;
  complianceRate: number;
  trend: 'up' | 'down' | 'stable';
}

export default function RFPAnalysisPage() {
  const apiClient = useApiClient();
  const { handleAsyncError } = useErrorHandler();
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const [trends, setTrends] = useState<RequirementTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      setLoading(true);
      try {
        const [metricsResponse, trendsResponse] = await Promise.all([
          apiClient.get<ApiResponse<AnalysisMetrics>>('/api/rfp/analysis/metrics'),
          apiClient.get<ApiResponse<RequirementTrend[]>>('/api/rfp/analysis/trends'),
        ]);

        if (metricsResponse.success && metricsResponse.data) {
          setMetrics(metricsResponse.data);
        }

        if (trendsResponse.success && Array.isArray(trendsResponse.data)) {
          setTrends(trendsResponse.data);
        }
      } catch (error) {
        handleAsyncError(
          new StandardError({
            message: 'Failed to load RFP analysis data',
            code: ErrorCodes.DATA.QUERY_FAILED,
            metadata: {
              component: 'RFPAnalysisPage',
              operation: 'GET',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysisData();
  }, [apiClient, handleAsyncError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RFP Analysis Tools</h1>
              <p className="mt-2 text-gray-600">
                Advanced analytics and insights for RFP requirement extraction
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <DocumentTextIcon className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalDocuments}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <MagnifyingGlassIcon className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Requirements</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageRequirements}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.averageCompliance}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Accuracy Score</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.accuracyScore}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trends Analysis */}
        <div className="bg-white shadow-sm rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Requirement Trends</h2>
          </div>
          <div className="p-6">
            {trends.length === 0 ? (
              <div className="text-center py-8">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No trend data available yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trends.map(trend => (
                  <div
                    key={trend.category}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{trend.category}</h3>
                        <p className="text-sm text-gray-600">
                          {trend.count} requirements • {trend.complianceRate}% compliance
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {trend.trend === 'up' && '↗'}
                        {trend.trend === 'down' && '↘'}
                        {trend.trend === 'stable' && '→'}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          trend.trend === 'up'
                            ? 'text-green-600'
                            : trend.trend === 'down'
                              ? 'text-red-600'
                              : 'text-gray-600'
                        }`}
                      >
                        {trend.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analysis Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Pattern Recognition */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pattern Recognition</h3>
            <p className="text-sm text-gray-600 mb-4">
              AI-powered analysis to identify common requirement patterns and suggest optimizations.
            </p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              Run Analysis
            </button>
          </div>

          {/* Compliance Optimization */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance Optimization</h3>
            <p className="text-sm text-gray-600 mb-4">
              Identify gaps in compliance and suggest improvements for better proposal success
              rates.
            </p>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
              Optimize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
