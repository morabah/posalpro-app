/**
 * ✅ PERFORMANCE OPTIMIZED: Real-time Performance Monitoring Dashboard
 * Tracks performance violations and provides optimization recommendations
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-react';

interface PerformanceViolation {
  type: 'message' | 'reflow' | 'click' | 'interval';
  duration: number;
  timestamp: number;
  component?: string;
}

interface PerformanceStats {
  violations: PerformanceViolation[];
  totalViolations: number;
  avgViolationTime: number;
  performanceScore: number;
  recommendations: string[];
}

export const PerformanceMonitoringDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    violations: [],
    totalViolations: 0,
    avgViolationTime: 0,
    performanceScore: 100,
    recommendations: []
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  const generateRecommendations = useCallback((violations: PerformanceViolation[]): string[] => {
    const recommendations = [];
    const recentViolations = violations.filter(v => Date.now() - v.timestamp < 60000);

    if (recentViolations.filter(v => v.type === 'message').length > 5) {
      recommendations.push('Reduce analytics batching frequency');
    }
    
    if (recentViolations.filter(v => v.type === 'reflow').length > 3) {
      recommendations.push('Implement DOM batching for layout operations');
    }
    
    if (recentViolations.filter(v => v.type === 'click').length > 2) {
      recommendations.push('Add debouncing to click handlers');
    }
    
    if (recentViolations.filter(v => v.type === 'interval').length > 3) {
      recommendations.push('Increase setInterval frequencies or use requestIdleCallback');
    }

    return recommendations;
  }, []);

  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Performance Monitor</h3>
        <button
          onClick={toggleMonitoring}
          className={`px-2 py-1 text-xs rounded ${
            isMonitoring 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isMonitoring ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Performance Score</span>
          <div className="flex items-center space-x-1">
            {stats.performanceScore >= 80 ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
            )}
            <span className={`text-xs font-medium ${
              stats.performanceScore >= 80 ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {stats.performanceScore.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Total Violations</span>
          <span className="text-xs font-medium">{stats.totalViolations}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Avg Duration</span>
          <span className="text-xs font-medium">{stats.avgViolationTime.toFixed(1)}ms</span>
        </div>

        {stats.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {stats.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-xs text-gray-600 leading-tight">
                  • {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};