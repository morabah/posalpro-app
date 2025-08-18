/**
 * AI & Analytics Types and Interfaces
 * Type definitions for advanced analytics and AI features
 */

export interface PredictiveAnalytics {
  revenue: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
    factors: Array<{
      name: string;
      impact: 'positive' | 'negative' | 'neutral';
      weight: number;
    }>;
  };
  pipeline: {
    conversionRate: number;
    expectedClose: number;
    riskFactors: string[];
  };
  trends: Array<{
    metric: string;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    timeframe: string;
  }>;
}

export interface AnomalyDetection {
  anomalies: Array<{
    id: string;
    type: 'revenue' | 'pipeline' | 'performance' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    detectedAt: Date;
    impact: string;
    recommendations: string[];
  }>;
  patterns: Array<{
    id: string;
    pattern: string;
    frequency: number;
    confidence: number;
    businessImpact: string;
  }>;
}

export interface NLQQuery {
  id: string;
  query: string;
  result: any;
  confidence: number;
  executionTime: number;
  timestamp: Date;
}

export interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actions: string[];
  dataPoints: Array<{
    metric: string;
    value: number;
    change: number;
  }>;
}

