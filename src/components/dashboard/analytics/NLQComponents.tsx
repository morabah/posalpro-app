/**
 * Natural Language Query Components
 * AI-powered natural language query interface
 */

import { memo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { NLQQuery } from '@/types/dashboard';

// Type definitions for query builder
interface QueryBuilderData {
  metric: string;
  timeRange: string;
  filters: string[];
  aggregation: string;
}

// NLQ Interface
export const NLQInterface = memo(
  ({
    onQuery,
    recentQueries,
    suggestions
  }: {
    onQuery: (query: string) => void;
    recentQueries: NLQQuery[];
    suggestions: string[];
  }) => {
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim()) return;

      setIsProcessing(true);
      try {
        await onQuery(query.trim());
        setQuery('');
      } finally {
        setIsProcessing(false);
      }
    };

    const handleSuggestionClick = (suggestion: string) => {
      setQuery(suggestion);
    };

    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <SparklesIcon className="h-6 w-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Ask Your Data</h3>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your data... (e.g., 'Show me revenue trends for Q4')"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <ClockIcon className="h-4 w-4 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>

        {suggestions.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Suggested Questions</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {recentQueries.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Queries</h4>
            <div className="space-y-2">
              {recentQueries.slice(0, 5).map((recentQuery, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSuggestionClick(recentQuery.query)}
                >
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{recentQuery.query}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {recentQuery.isFavorite && (
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(recentQuery.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }
);

NLQInterface.displayName = 'NLQInterface';

// Query Results Display
interface ChartData { data: Array<{ label: string; value: number }> }

interface QueryResults {
  summary?: string;
  data?: Array<Record<string, unknown>>;
  chart?: ChartData;
  insights?: string[];
}

export const QueryResultsDisplay = memo(
  ({
    results,
    query,
    isLoading
  }: {
    results: QueryResults;
    query: string;
    isLoading: boolean;
  }) => {
    if (isLoading) {
      return (
        <Card className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-600">Analyzing your query...</span>
            </div>
          </div>
        </Card>
      );
    }

    if (!results) {
      return null;
    }

    const renderValue = (value: unknown) => {
      if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
      }
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return JSON.stringify(value);
    };

    const renderChart = (chartData: ChartData) => {
      // Simple chart rendering - in a real implementation, you'd use Chart.js or similar
      return (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Chart visualization</div>
          <div className="h-32 bg-white border rounded flex items-end justify-around p-2">
            {chartData.data?.map((point: { label: string; value: number }, index: number) => (
              <div
                key={index}
                className="bg-blue-500 rounded-t"
                style={{
                  height: `${(point.value / Math.max(...chartData.data.map((p) => p.value))) * 100}%`,
                  width: '20px'
                }}
                title={`${point.label}: ${point.value}`}
              />
            ))}
          </div>
        </div>
      );
    };

    return (
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Query Results</h3>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Query:</strong> {query}
          </div>
        </div>

        {results.summary && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">{results.summary}</p>
            </div>
          </div>
        )}

        {results.data && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Data</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(results.data[0] || {}).map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.data.map((row: Record<string, unknown>, index: number) => (
                    <tr key={index}>
                      {Object.values(row).map((value: unknown, cellIndex: number) => (
                        <td
                          key={cellIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {renderValue(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {results.chart && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Visualization</h4>
            {renderChart(results.chart)}
          </div>
        )}

        {results.insights && results.insights.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Insights</h4>
            <div className="space-y-2">
              {results.insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start space-x-2">
                  <SparklesIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    );
  }
);

QueryResultsDisplay.displayName = 'QueryResultsDisplay';

// Query History
export const QueryHistory = memo(
  ({
    queries,
    onQuerySelect,
    onToggleFavorite
  }: {
    queries: NLQQuery[];
    onQuerySelect: (query: string) => void;
    onToggleFavorite: (queryId: string) => void;
  }) => {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Query History</h3>

        <div className="space-y-3">
          {queries.map((query) => (
            <div
              key={query.id}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => onQuerySelect(query.query)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{query.query}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(query.timestamp).toLocaleString('en-US', { timeZone: 'UTC' })}
                  </div>
                  {query.resultCount && (
                    <div className="text-xs text-gray-500 mt-1">
                      {query.resultCount} results
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(query.id);
                  }}
                  className="p-1 text-gray-400 hover:text-yellow-500"
                >
                  <StarIcon className={`h-4 w-4 ${query.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                </button>
              </div>
            </div>
          ))}

          {queries.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No query history available
            </div>
          )}
        </div>
      </Card>
    );
  }
);

QueryHistory.displayName = 'QueryHistory';

// Query Builder
export const QueryBuilder = memo(
  ({
    onBuildQuery
  }: {
    onBuildQuery: (query: QueryBuilderData) => void;
  }) => {
    const [queryBuilder, setQueryBuilder] = useState({
      metric: '',
      timeRange: '30d',
      filters: [],
      aggregation: 'sum',
    });

    const metrics = [
      'revenue',
      'proposals',
      'conversion_rate',
      'pipeline_value',
      'customer_count',
    ];

    const timeRanges = [
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
      { value: '90d', label: 'Last 90 days' },
      { value: '1y', label: 'Last year' },
    ];

    const aggregations = [
      { value: 'sum', label: 'Sum' },
      { value: 'avg', label: 'Average' },
      { value: 'count', label: 'Count' },
      { value: 'min', label: 'Minimum' },
      { value: 'max', label: 'Maximum' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onBuildQuery(queryBuilder);
    };

    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Query Builder</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Metric
            </label>
            <select
              value={queryBuilder.metric}
              onChange={(e) => setQueryBuilder({ ...queryBuilder, metric: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              required
            >
              <option value="">Select a metric</option>
              {metrics.map(metric => (
                <option key={metric} value={metric}>
                  {metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              value={queryBuilder.timeRange}
              onChange={(e) => setQueryBuilder({ ...queryBuilder, timeRange: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aggregation
            </label>
            <select
              value={queryBuilder.aggregation}
              onChange={(e) => setQueryBuilder({ ...queryBuilder, aggregation: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {aggregations.map(agg => (
                <option key={agg.value} value={agg.value}>
                  {agg.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Build Query
          </button>
        </form>
      </Card>
    );
  }
);

QueryBuilder.displayName = 'QueryBuilder';
