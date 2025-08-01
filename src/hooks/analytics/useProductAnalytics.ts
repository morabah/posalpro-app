/**
 * Product Analytics Hook
 *
 * Component Traceability Matrix:
 * - User Stories: US-1.2, US-3.1, US-3.2
 * - Hypotheses: H1 (Content Discovery), H8 (Technical Validation)
 * - Methods: trackProductCreation(), trackAIDescriptionUsage(), trackValidationPerformance(), trackCategorizationEfficiency()
 */

import { useCallback } from 'react';
import { useOptimizedAnalytics } from '../useOptimizedAnalytics';

interface ProductCreationMetrics {
  productData: any;
  creationTime: number;
  useAIDescription: boolean;
  categoriesCount: number;
  attributesCount: number;
  userStory: string;
  hypothesis: string;
  acceptanceCriteria: string;
}

interface AIDescriptionMetrics {
  productName: string;
  categories: string[];
  generationTime: number;
  descriptionLength: number;
  userStory: string;
  hypothesis: string;
}

interface ValidationPerformanceMetrics {
  validationType: string;
  validationTime: number;
  errorsDetected: number;
  errorsFixed: number;
  userStory: string;
  hypothesis: string;
}

interface CategorizationEfficiencyMetrics {
  categoriesSelected: number;
  tagsAdded: number;
  aiAssisted: boolean;
  userStory: string;
  hypothesis: string;
}

export function useProductAnalytics() {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  
  // Create wrapper functions for different event types with appropriate priorities
  const trackEvent = useCallback((event: string, data: Record<string, any>) => {
    // Determine priority based on event type
    const priority: 'high' | 'medium' | 'low' = 
      event.includes('error') || event.includes('critical') ? 'high' : 
      event.includes('performance') || event.includes('validation') ? 'medium' : 'low';
    
    analytics(event, data, priority);
  }, [analytics]);

  const trackPerformance = useCallback((metric: string, value: number, data: Record<string, any>) => {
    const performanceData = {
      ...data,
      value,
    };
    analytics(`performance_${metric}`, performanceData, 'medium');
  }, [analytics]);

  const trackHypothesis = useCallback((hypothesis: string, data: Record<string, any>) => {
    analytics(`hypothesis_${hypothesis}`, data, 'medium');
  }, [analytics]);

  const trackProductCreation = useCallback(
    (metrics: ProductCreationMetrics) => {
      // Track product creation performance for H8 validation
      trackEvent('product_creation', {
        ...metrics,
        eventType: 'product_management',
      });

      // Track performance metrics
      trackPerformance('product_creation_time', metrics.creationTime, {
        categoriesCount: metrics.categoriesCount,
        attributesCount: metrics.attributesCount,
        aiAssisted: metrics.useAIDescription,
      });

      // Track hypothesis validation
      trackHypothesis(metrics.hypothesis, {
        userStory: metrics.userStory,
        acceptanceCriteria: metrics.acceptanceCriteria,
        creationTime: metrics.creationTime,
        targetMet: metrics.creationTime < 300000, // 5 minutes target
      });
    },
    [trackEvent, trackPerformance, trackHypothesis]
  );

  const trackAIDescriptionUsage = useCallback(
    (metrics: AIDescriptionMetrics) => {
      // Track AI description generation for H8 validation
      trackEvent('ai_description_generation', {
        ...metrics,
        eventType: 'ai_assistance',
      });

      // Track performance impact
      trackPerformance('ai_description_time', metrics.generationTime, {
        categoriesCount: metrics.categories.length,
        descriptionLength: metrics.descriptionLength,
      });

      // Track hypothesis validation
      trackHypothesis(metrics.hypothesis, {
        userStory: metrics.userStory,
        generationTime: metrics.generationTime,
        targetMet: metrics.generationTime < 5000, // 5 seconds target
      });
    },
    [trackEvent, trackPerformance, trackHypothesis]
  );

  const trackValidationPerformance = useCallback(
    (metrics: ValidationPerformanceMetrics) => {
      // Track validation performance for H8 validation
      const errorReductionRate =
        metrics.errorsDetected > 0 ? (metrics.errorsFixed / metrics.errorsDetected) * 100 : 100;

      trackEvent('product_validation', {
        ...metrics,
        errorReductionRate,
        eventType: 'validation',
      });

      // Track performance metrics
      trackPerformance('validation_time', metrics.validationTime, {
        errorsDetected: metrics.errorsDetected,
        errorsFixed: metrics.errorsFixed,
      });

      // Track H8 hypothesis validation (50% error reduction target)
      trackHypothesis(metrics.hypothesis, {
        userStory: metrics.userStory,
        errorReductionRate,
        targetMet: errorReductionRate >= 50,
      });
    },
    [trackEvent, trackPerformance, trackHypothesis]
  );

  const trackCategorizationEfficiency = useCallback(
    (metrics: CategorizationEfficiencyMetrics) => {
      // Track categorization efficiency for H1 validation
      trackEvent('product_categorization', {
        ...metrics,
        eventType: 'content_discovery',
      });

      // Calculate efficiency score
      const efficiencyScore = metrics.categoriesSelected * 10 + metrics.tagsAdded * 5;
      const bonusForAI = metrics.aiAssisted ? 20 : 0;
      const totalScore = efficiencyScore + bonusForAI;

      trackPerformance('categorization_efficiency', totalScore, {
        categoriesSelected: metrics.categoriesSelected,
        tagsAdded: metrics.tagsAdded,
        aiAssisted: metrics.aiAssisted,
      });

      // Track H1 hypothesis validation (content discovery improvement)
      trackHypothesis(metrics.hypothesis, {
        userStory: metrics.userStory,
        efficiencyScore: totalScore,
        targetMet: totalScore >= 30, // Efficiency target
      });
    },
    [trackEvent, trackPerformance, trackHypothesis]
  );

  const trackProductUsage = useCallback(
    (productId: string, usageType: string, duration: number) => {
      trackEvent('product_usage', {
        productId,
        usageType,
        duration,
        eventType: 'product_analytics',
      });
    },
    [trackEvent]
  );

  const trackProductSearch = useCallback(
    (searchQuery: string, resultsCount: number, searchTime: number) => {
      trackEvent('product_search', {
        searchQuery,
        resultsCount,
        searchTime,
        eventType: 'content_discovery',
      });

      // Track H1 hypothesis validation (45% search time reduction)
      trackHypothesis('H1', {
        userStory: 'US-1.1',
        searchTime,
        resultsCount,
        targetMet: searchTime < 2000, // 2 seconds target
      });
    },
    [trackEvent, trackHypothesis]
  );

  return {
    trackProductCreation,
    trackAIDescriptionUsage,
    trackValidationPerformance,
    trackCategorizationEfficiency,
    trackProductUsage,
    trackProductSearch,
  };
}
