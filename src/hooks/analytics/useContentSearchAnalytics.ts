/**
 * Content Search Analytics Hook
 * Specialized analytics for H1 hypothesis validation (45% search time reduction)
 * Supports US-1.1, US-1.2, US-1.3 with performance and quality tracking
 */

import { useCallback, useRef, useState } from 'react';
import { useAnalytics } from '../useAnalytics';

// Types for content search analytics
export interface ContentSearchMetrics {
  searchId: string;
  sessionId: string;
  searchStartTime: number;
  timeToFirstResult?: number;
  timeToSelection?: number;
  resultsCount: number;
  searchAccuracy?: number;
  userSatisfaction?: number;
  searchQuery: string;
  filtersUsed: string[];
  userStory: 'US-1.1' | 'US-1.2' | 'US-1.3';
  hypothesis: 'H1';
}

export interface SearchPerformanceData {
  averageSearchTime: number;
  searchAccuracy: number;
  searchCompletionRate: number;
  averageResultsCount: number;
  filterUsageRate: number;
  userSatisfactionScore: number;
  improvementPercentage: number;
  hypothesis: 'H1';
  targetImprovement: 45; // 45% search time reduction
}

export interface AIContentMetrics {
  categorySuggestionAccuracy: number;
  aiEnhancementUsageRate: number;
  qualityScoreImprovement: number;
  relatedContentClickRate: number;
  smartSearchUsageRate: number;
}

export interface ContentQualityMetrics {
  averageContentQuality: number;
  contentUtilizationRate: number;
  contentFreshness: number;
  userEngagementScore: number;
  winRateImprovement: number;
}

export const useContentSearchAnalytics = () => {
  const { track, identify, page } = useAnalytics();

  // Tracking state
  const [currentSearch, setCurrentSearch] = useState<ContentSearchMetrics | null>(null);
  const searchHistory = useRef<ContentSearchMetrics[]>([]);
  const performanceData = useRef<SearchPerformanceData>({
    averageSearchTime: 0,
    searchAccuracy: 0,
    searchCompletionRate: 0,
    averageResultsCount: 0,
    filterUsageRate: 0,
    userSatisfactionScore: 0,
    improvementPercentage: 0,
    hypothesis: 'H1',
    targetImprovement: 45,
  });

  // US-1.1: Semantic Search Analytics
  const trackSemanticSearch = useCallback(
    async (searchQuery: string, sessionId: string, filters?: Record<string, any>) => {
      const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const searchStartTime = Date.now();

      const searchMetrics: ContentSearchMetrics = {
        searchId,
        sessionId,
        searchStartTime,
        searchQuery,
        filtersUsed: filters ? Object.keys(filters) : [],
        resultsCount: 0,
        userStory: 'US-1.1',
        hypothesis: 'H1',
      };

      setCurrentSearch(searchMetrics);

      // Track search initiation
      track('content_search_initiated', {
        searchId,
        sessionId,
        searchQuery: searchQuery.substring(0, 100), // Truncate for privacy
        filtersCount: searchMetrics.filtersUsed.length,
        userStory: 'US-1.1',
        hypothesis: 'H1',
        timestamp: Date.now(),
      });

      return searchId;
    },
    [track]
  );

  const trackSearchResults = useCallback(
    async (searchId: string, resultsCount: number, searchAccuracy: number) => {
      if (!currentSearch || currentSearch.searchId !== searchId) return;

      const timeToFirstResult = Date.now() - currentSearch.searchStartTime;

      const updatedMetrics = {
        ...currentSearch,
        timeToFirstResult,
        resultsCount,
        searchAccuracy,
      };

      setCurrentSearch(updatedMetrics);

      // Track search results delivery
      track('content_search_results', {
        searchId,
        timeToFirstResult,
        resultsCount,
        searchAccuracy,
        userStory: 'US-1.1',
        hypothesis: 'H1',
        timestamp: Date.now(),
      });

      // Performance tracking for H1 hypothesis
      track('search_performance', {
        searchId,
        timeToFirstResult,
        resultsCount,
        searchAccuracy,
        hypothesis: 'H1',
        targetTime: 2000, // Target <2 seconds for H1
        performanceScore:
          timeToFirstResult <= 2000 ? 100 : Math.max(0, 100 - (timeToFirstResult - 2000) / 20),
      });
    },
    [currentSearch, track]
  );

  const trackSearchCompletion = useCallback(
    async (searchId: string, selectedResultId?: string, userSatisfaction?: number) => {
      if (!currentSearch || currentSearch.searchId !== searchId) return;

      const timeToSelection = selectedResultId
        ? Date.now() - currentSearch.searchStartTime
        : undefined;

      const finalMetrics = {
        ...currentSearch,
        timeToSelection,
        userSatisfaction,
      };

      // Add to search history
      searchHistory.current.push(finalMetrics);

      // Track search completion
      track('content_search_completed', {
        searchId,
        totalSearchTime: timeToSelection || Date.now() - currentSearch.searchStartTime,
        resultSelected: !!selectedResultId,
        selectedResultId,
        userSatisfaction,
        userStory: 'US-1.1',
        hypothesis: 'H1',
        timestamp: Date.now(),
      });

      // Update performance data for H1 hypothesis validation
      updatePerformanceMetrics(finalMetrics);

      setCurrentSearch(null);
    },
    [currentSearch, track]
  );

  // US-1.2: AI Categorization Analytics
  const trackAICategorization = useCallback(
    async (
      contentId: string,
      suggestedCategories: string[],
      acceptedCategories: string[],
      userModifications: boolean
    ) => {
      const accuracy =
        acceptedCategories.length > 0
          ? acceptedCategories.filter(cat => suggestedCategories.includes(cat)).length /
            suggestedCategories.length
          : 0;

      track('ai_categorization_used', {
        contentId,
        suggestedCount: suggestedCategories.length,
        acceptedCount: acceptedCategories.length,
        accuracy: accuracy * 100,
        userModified: userModifications,
        userStory: 'US-1.2',
        hypothesis: 'H1',
        timestamp: Date.now(),
      });

      return accuracy;
    },
    [track]
  );

  const trackRelatedContent = useCallback(
    async (contentId: string, relatedContentIds: string[], clickedContentId?: string) => {
      track('related_content_displayed', {
        contentId,
        relatedCount: relatedContentIds.length,
        userStory: 'US-1.2',
        hypothesis: 'H1',
        timestamp: Date.now(),
      });

      if (clickedContentId) {
        track('related_content_clicked', {
          sourceContentId: contentId,
          clickedContentId,
          userStory: 'US-1.2',
          hypothesis: 'H1',
          timestamp: Date.now(),
        });
      }
    },
    [track]
  );

  // US-1.3: Content Quality Analytics
  const trackContentQuality = useCallback(
    async (
      contentId: string,
      qualityScore: number,
      usageMetrics: {
        views: number;
        uses: number;
        clickThroughRate: number;
        popularityScore: number;
      }
    ) => {
      track('content_quality_assessed', {
        contentId,
        qualityScore,
        views: usageMetrics.views,
        uses: usageMetrics.uses,
        clickThroughRate: usageMetrics.clickThroughRate * 100,
        popularityScore: usageMetrics.popularityScore,
        userStory: 'US-1.3',
        hypothesis: 'H1',
        timestamp: Date.now(),
      });

      // Track quality improvement for H1 hypothesis
      if (qualityScore >= 75) {
        track('high_quality_content_identified', {
          contentId,
          qualityScore,
          userStory: 'US-1.3',
          hypothesis: 'H1',
          timestamp: Date.now(),
        });
      }
    },
    [track]
  );

  const trackContentWinRate = useCallback(
    async (
      contentId: string,
      proposalOutcome: 'won' | 'lost' | 'pending',
      contentUtilizationScore: number
    ) => {
      track('content_win_rate_tracking', {
        contentId,
        proposalOutcome,
        contentUtilizationScore,
        userStory: 'US-1.3',
        hypothesis: 'H1',
        timestamp: Date.now(),
      });
    },
    [track]
  );

  // Hypothesis H1 Validation Functions
  const getSearchPerformanceMetrics = useCallback((): SearchPerformanceData => {
    return { ...performanceData.current };
  }, []);

  const validateH1Hypothesis = useCallback((): {
    isHypothesisValidated: boolean;
    currentImprovement: number;
    targetImprovement: number;
    confidence: number;
    metrics: SearchPerformanceData;
  } => {
    const metrics = performanceData.current;
    const currentImprovement = metrics.improvementPercentage;
    const targetImprovement = 45; // 45% search time reduction

    const isHypothesisValidated = currentImprovement >= targetImprovement;
    const confidence = Math.min(100, (currentImprovement / targetImprovement) * 100);

    return {
      isHypothesisValidated,
      currentImprovement,
      targetImprovement,
      confidence,
      metrics,
    };
  }, []);

  // Helper function to update performance metrics
  const updatePerformanceMetrics = (searchMetrics: ContentSearchMetrics) => {
    const history = searchHistory.current;
    const totalSearches = history.length;

    if (totalSearches === 0) return;

    // Calculate average search time
    const averageSearchTime =
      history.reduce((sum, search) => {
        return sum + (search.timeToSelection || search.timeToFirstResult || 0);
      }, 0) / totalSearches;

    // Calculate search accuracy
    const searchAccuracy =
      history.reduce((sum, search) => {
        return sum + (search.searchAccuracy || 0);
      }, 0) / totalSearches;

    // Calculate completion rate
    const completedSearches = history.filter(search => search.timeToSelection).length;
    const searchCompletionRate = (completedSearches / totalSearches) * 100;

    // Calculate filter usage rate
    const searchesWithFilters = history.filter(search => search.filtersUsed.length > 0).length;
    const filterUsageRate = (searchesWithFilters / totalSearches) * 100;

    // Calculate improvement percentage (comparing to baseline)
    const baselineSearchTime = 5000; // 5 seconds baseline
    const improvementPercentage = Math.max(
      0,
      ((baselineSearchTime - averageSearchTime) / baselineSearchTime) * 100
    );

    // Update performance data
    performanceData.current = {
      averageSearchTime,
      searchAccuracy,
      searchCompletionRate,
      averageResultsCount:
        history.reduce((sum, search) => sum + search.resultsCount, 0) / totalSearches,
      filterUsageRate,
      userSatisfactionScore:
        history.reduce((sum, search) => sum + (search.userSatisfaction || 0), 0) / totalSearches,
      improvementPercentage,
      hypothesis: 'H1',
      targetImprovement: 45,
    };
  };

  // User Journey Tracking for Content Search
  const trackContentSearchJourney = useCallback(
    async (
      journeyStep:
        | 'search_initiated'
        | 'filters_applied'
        | 'results_reviewed'
        | 'content_selected'
        | 'content_used',
      context: Record<string, any>
    ) => {
      track('content_search_journey', {
        journeyStep,
        ...context,
        hypothesis: 'H1',
        timestamp: Date.now(),
      });
    },
    [track]
  );

  return {
    // Search Analytics (US-1.1)
    trackSemanticSearch,
    trackSearchResults,
    trackSearchCompletion,

    // AI Features Analytics (US-1.2)
    trackAICategorization,
    trackRelatedContent,

    // Quality Analytics (US-1.3)
    trackContentQuality,
    trackContentWinRate,

    // Hypothesis Validation
    getSearchPerformanceMetrics,
    validateH1Hypothesis,

    // Journey Tracking
    trackContentSearchJourney,

    // Current state
    currentSearch,
    searchHistory: searchHistory.current,
  };
};
