'use client';

import { logger } from '@/utils/logger';
/**
 * PosalPro MVP2 - Validation Hook
 * Real-time validation capabilities with H8 hypothesis tracking
 * Component Traceability: US-3.1, US-3.2, US-3.3, AC-3.1.1, AC-3.1.2, AC-3.2.1, AC-3.3.1
 */

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ValidationEngine } from '@/lib/validation/ValidationEngine';
import {
  ValidationCategory,
  ValidationIssue,
  ValidationRequest,
  ValidationResult,
} from '@/types/validation';
import { useCallback, useState } from 'react';

// Component Traceability Matrix
const COMPONENT_MAPPING = {
  userStories: ['US-3.1', 'US-3.2', 'US-3.3'],
  acceptanceCriteria: ['AC-3.1.1', 'AC-3.1.2', 'AC-3.2.1', 'AC-3.2.2', 'AC-3.3.1', 'AC-3.3.2'],
  methods: [
    'validateProductConfiguration()',
    'trackErrorReduction()',
    'generateFixSuggestions()',
    'measureValidationSpeed()',
  ],
  hypotheses: ['H8'],
  testCases: ['TC-H8-001', 'TC-H8-002', 'TC-H8-003'],
};

// Validation state interface
interface ValidationState {
  isValidating: boolean;
  results: ValidationResult | null;
  issues: ValidationIssue[];
  activeIssueCount: number;
  criticalIssueCount: number;
  lastValidated: Date | null;
  error: string | null;
}

// Filter state for validation issues
interface ValidationFilters {
  severity?: string[];
  status?: Array<'open' | 'in_progress' | 'resolved' | 'deferred' | 'suppressed'>;
  category?: string[];
  proposalId?: string;
  search?: string;
}

// Sort options for validation issues
interface ValidationSort {
  field: 'severity' | 'detectedAt' | 'proposalId' | 'category';
  direction: 'asc' | 'desc';
}

// Validation performance metrics for H8 hypothesis tracking
interface ValidationMetrics {
  validationTime: number;
  errorsDetected: number;
  errorsFixed: number;
  fixSuggestionAccuracy: number;
  userEfficiencyGain: number;
}

export function useValidation() {
  const [state, setState] = useState<ValidationState>({
    isValidating: false,
    results: null,
    issues: [],
    activeIssueCount: 0,
    criticalIssueCount: 0,
    lastValidated: null,
    error: null,
  });

  const [validationEngine] = useState(() => new ValidationEngine());
  const { trackOptimized: analytics } = useOptimizedAnalytics();

  // Real-time validation function (US-3.1, AC-3.1.1)
  const validateConfiguration = async (request: ValidationRequest) => {
    const startTime = Date.now();
    try {
      setState(prev => ({ ...prev, isValidating: true, error: null }));

      // Track validation start event for H8 hypothesis
      analytics('validation_started', {
        proposalId: request.proposalId,
        configurationSize: request.products.length,
      }, 'medium');

      const validationSummary = await validationEngine.validateProductConfiguration(
        request.proposalId,
        {
          products: request.products,
        }
      );
      const endTime = Date.now();
      const validationTime = endTime - startTime;

      // Transform ValidationSummary to ValidationResult
      const issues: ValidationIssue[] = validationSummary.results.map(vr => ({
        id: vr.ruleId,
        type: 'configuration' as ValidationCategory,
        severity: vr.severity,
        message: vr.message,
        field: 'configuration',
        category: 'configuration' as ValidationCategory,
        affectedProducts: [validationSummary.metadata.productId],
        status: vr.isValid ? 'resolved' : ('open' as const),
        fixSuggestions: [],
      }));

      const result: ValidationResult = {
        id: `validation-${Date.now()}`,
        proposalId: request.proposalId,
        status: validationSummary.isValid ? 'valid' : 'invalid',
        issues,
        suggestions: [],
        timestamp: validationSummary.timestamp,
        executionTime: validationTime,
        userStoryMappings: COMPONENT_MAPPING.userStories,
        isValid: validationSummary.isValid,
        validationTime,
        configHash: `hash-${Date.now()}`,
      };

      // Calculate metrics for H8 hypothesis validation
      const metrics: ValidationMetrics = {
        validationTime,
        errorsDetected: result.issues.filter(
          (issue: ValidationIssue) => issue.severity === 'critical' || issue.severity === 'high'
        ).length,
        errorsFixed: 0, // Will be updated when fixes are applied
        fixSuggestionAccuracy:
          result.issues.reduce(
            (acc: number, issue: ValidationIssue) => acc + (issue.fixSuggestions?.length || 0),
            0
          ) / Math.max(result.issues.length, 1),
        userEfficiencyGain: 0, // Will be calculated based on time savings
      };

      // Track validation completion for H8 hypothesis
      analytics('validation_completed', {
        proposalId: request.proposalId,
        validationTime,
        errorsDetected: result.issues.length,
        criticalErrors: result.issues.filter(i => i.severity === 'critical').length,
        fixSuggestionsGenerated: result.suggestions.length,
      }, 'medium');

      setState(prev => ({
        ...prev,
        isValidating: false,
        results: result,
        issues: result.issues,
        activeIssueCount: result.issues.filter(
          issue => issue.status === 'open' || issue.status === 'in_progress'
        ).length,
        criticalIssueCount: result.issues.filter(issue => issue.severity === 'critical').length,
        lastValidated: new Date(),
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';

      // Track validation error for monitoring
      analytics('validation_error', {
        proposalId: request.proposalId,
        error: errorMessage,
      }, 'high');

      setState(prev => ({
        ...prev,
        isValidating: false,
        error: errorMessage,
      }));

      throw error;
    }
  };

  // Apply fix suggestion (US-3.1, AC-3.1.2)
  const applyFixSuggestion = useCallback(
    async (issueId: string, fixId: string): Promise<boolean> => {
      const startTime = Date.now();

      try {
        // Track fix application attempt
        analytics('fix_suggestion_applied', {
          issueId,
          fixId,
        }, 'medium');

        const success = await validationEngine.applyFix(issueId, fixId);

        if (success) {
          setState(prev => ({
            ...prev,
            issues: prev.issues.map(issue =>
              issue.id === issueId
                ? { ...issue, status: 'resolved', resolvedAt: new Date() }
                : issue
            ),
            activeIssueCount: prev.activeIssueCount - 1,
            criticalIssueCount:
              prev.issues.find(issue => issue.id === issueId)?.severity === 'critical'
                ? prev.criticalIssueCount - 1
                : prev.criticalIssueCount,
          }));

          // Track successful fix for H8 hypothesis validation
          analytics('fix_suggestion_success', {
            issueId,
            fixId,
            resolutionTime: Date.now() - startTime,
          }, 'medium');
        }

        return success;
      } catch (error) {
        analytics('fix_suggestion_error', {
          issueId,
          fixId,
          error: error instanceof Error ? error.message : 'Fix application failed',
        }, 'high');

        logger.error('Fix suggestion application failed:', error);
        return false;
      }
    },
    [validationEngine, analytics]
  );

  // Filter validation issues
  const filterIssues = useCallback(
    (filters: ValidationFilters, sort?: ValidationSort): ValidationIssue[] => {
      let filteredIssues = [...state.issues];

      // Apply filters
      if (filters.severity?.length) {
        filteredIssues = filteredIssues.filter(issue => filters.severity!.includes(issue.severity));
      }

      if (filters.status?.length) {
        filteredIssues = filteredIssues.filter(
          issue => issue.status && filters.status!.includes(issue.status)
        );
      }

      if (filters.category?.length) {
        filteredIssues = filteredIssues.filter(issue => filters.category!.includes(issue.category));
      }

      if (filters.proposalId) {
        filteredIssues = filteredIssues.filter(issue => issue.proposalId === filters.proposalId);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredIssues = filteredIssues.filter(
          issue =>
            issue.message.toLowerCase().includes(searchLower) ||
            (issue.description || '').toLowerCase().includes(searchLower) ||
            (issue.ruleName || '').toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      if (sort) {
        filteredIssues.sort((a, b) => {
          const aValue = a[sort.field];
          const bValue = b[sort.field];

          if (sort.field === 'detectedAt') {
            const aTime = new Date(aValue || 0).getTime();
            const bTime = new Date(bValue || 0).getTime();
            return sort.direction === 'asc' ? aTime - bTime : bTime - aTime;
          }

          if (sort.field === 'severity') {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
            const aOrder = severityOrder[aValue as keyof typeof severityOrder] || 0;
            const bOrder = severityOrder[bValue as keyof typeof severityOrder] || 0;
            return sort.direction === 'asc' ? aOrder - bOrder : bOrder - aOrder;
          }

          return sort.direction === 'asc'
            ? String(aValue || '').localeCompare(String(bValue || ''))
            : String(bValue || '').localeCompare(String(aValue || ''));
        });
      }

      return filteredIssues;
    },
    [state.issues]
  );

  // Get validation summary for dashboard
  const getValidationSummary = useCallback(() => {
    const summary = {
      total: state.issues.length,
      critical: state.criticalIssueCount,
      active: state.activeIssueCount,
      resolved: state.issues.filter(issue => issue.status === 'resolved').length,
      suppressed: state.issues.filter(issue => issue.status === 'suppressed').length,
      lastValidated: state.lastValidated,
      isValidating: state.isValidating,
    };

    // Track dashboard view for analytics
    analytics('validation_summary_viewed', {
      ...summary,
    }, 'low');

    return summary;
  }, [state, analytics]);

  // Batch operations for multiple issues
  const batchApplyFix = useCallback(
    async (issueIds: string[], fixType: string): Promise<{ success: number; failed: number }> => {
      const results = { success: 0, failed: 0 };

      analytics('batch_fix_started', {
        issueCount: issueIds.length,
        fixType,
      }, 'medium');

      for (const issueId of issueIds) {
        try {
          const issue = state.issues.find(i => i.id === issueId);
          const fix = issue?.fixSuggestions?.find(f => f.type === fixType);

          if (fix && (await applyFixSuggestion(issueId, fix.id))) {
            results.success++;
          } else {
            results.failed++;
          }
        } catch (error) {
          results.failed++;
        }
      }

      analytics('batch_fix_completed', {
        ...results,
        fixType,
      }, 'medium');

      return results;
    },
    [state.issues, applyFixSuggestion, analytics]
  );

  // Real-time validation monitoring (US-3.2, AC-3.2.1)
  const startRealTimeValidation = useCallback(
    (proposalId: string, interval: number = 30000) => {
      analytics('realtime_validation_started', {
        proposalId,
        interval,
      }, 'low');

      const intervalId = setInterval(async () => {
        try {
          // Only validate if not currently validating
          if (!state.isValidating) {
            const request: ValidationRequest = {
              proposalId,
              products: [], // Would be fetched from current proposal state
              rules: 'all',
              mode: 'incremental',
            };

            await validateConfiguration(request);
          }
        } catch (error) {
          logger.error('Real-time validation error:', error);
        }
      }, interval);

      return () => {
        clearInterval(intervalId);
        analytics('realtime_validation_stopped', {
          proposalId,
        }, 'low');
      };
    },
    [state.isValidating, validateConfiguration, analytics]
  );

  return {
    // State
    ...state,

    // Actions
    validateConfiguration,
    applyFixSuggestion,
    batchApplyFix,

    // Utilities
    filterIssues,
    getValidationSummary,
    startRealTimeValidation,

    // Analytics for H8 hypothesis tracking
    componentMapping: COMPONENT_MAPPING,
  };
}

// Export for use in validation analytics hook
export type { ValidationFilters, ValidationMetrics, ValidationSort, ValidationState };
