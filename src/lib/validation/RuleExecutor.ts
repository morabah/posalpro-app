import { logger } from '@/utils/logger';/**
 * Rule Executor for PosalPro MVP2 Validation Engine
 * Handles individual validation rule processing and execution
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import {
  ActionResult,
  ActionType,
  FixSuggestion,
  RuleAction,
  RuleCondition,
  RuleResult,
  SuggestionImpact,
  SuggestionType,
  ValidationContext,
  ValidationIssue,
  ValidationRule,
} from '../../types/validation';

export class RuleExecutor {
  private executionMetrics: Map<string, { count: number; totalTime: number }>;
  private errorHandlingService: ErrorHandlingService;

  constructor() {
    this.executionMetrics = new Map();
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }

  /**
   * Executes a single validation rule
   */
  async executeRule(rule: ValidationRule, context: ValidationContext): Promise<RuleResult> {
    const startTime = performance.now();

    try {
      // Log rule execution start with structured error handling
      this.errorHandlingService.processError(
        new Error(`Executing validation rule: ${rule.name}`),
        'Rule execution started',
        ErrorCodes.VALIDATION.PROCESSING,
        {
          component: 'RuleExecutor',
          operation: 'executeRule',
          ruleId: rule.id,
          category: rule.category,
          severity: rule.severity,
          userFriendlyMessage: `Validating rule: ${rule.name}`,
        }
      );

      logger.info(`Executing validation rule: ${rule.name}`, {
        ruleId: rule.id,
        category: rule.category,
        severity: rule.severity,
      });

      // Check if rule is enabled
      if (!rule.enabled) {
        return {
          ruleId: rule.id,
          isValid: true,
          severity: rule.severity,
          message: `Rule ${rule.name} is disabled`,
          field: rule.field,
          status: 'skipped',
          issues: [],
          suggestions: [],
          executionTime: performance.now() - startTime,
          context,
        };
      }

      // Evaluate rule conditions
      const conditionsPass = await this.checkConditions(rule.conditions || [], context);

      if (!conditionsPass) {
        return {
          ruleId: rule.id,
          isValid: true,
          severity: rule.severity,
          message: `Rule ${rule.name} conditions not met`,
          field: rule.field,
          status: 'passed',
          issues: [],
          suggestions: [],
          executionTime: performance.now() - startTime,
          context,
        };
      }

      // Execute rule actions
      const actionResults = await this.executeActions(rule.actions || [], context);

      // Convert action results to issues and suggestions
      const issues: ValidationIssue[] = [];
      const suggestions: FixSuggestion[] = [];

      actionResults.forEach(actionResult => {
        if (actionResult.type === 'error' || actionResult.type === 'warning') {
          issues.push({
            id: `issue_${rule.id}_${Math.random().toString(36).substr(2, 9)}`,
            type: actionResult.type,
            severity: rule.severity,
            category: rule.category as
              | 'compatibility'
              | 'license'
              | 'configuration'
              | 'dependency'
              | 'performance',
            message: actionResult.message,
            field: rule.field,
            description: actionResult.data?.description,
            affectedProducts: this.extractAffectedProducts(context, actionResult),
            fixSuggestions: [],
            ruleId: rule.id,
            context,
          });
        }

        if (actionResult.type === 'fix' || actionResult.type === 'suggest') {
          suggestions.push({
            id: `suggestion_${rule.id}_${Math.random().toString(36).substr(2, 9)}`,
            type: actionResult.automated ? 'automatic' : ('manual' as SuggestionType),
            title: actionResult.message,
            description: actionResult.message,
            confidence: actionResult.data?.confidence || 0.5,
            impact: this.determineImpact(rule.severity) as SuggestionImpact,
            actions: [
              {
                id: `action_${Math.random().toString(36).substr(2, 9)}`,
                type: 'configure' as ActionType,
                target: (actionResult.data?.target || 'configuration'),
                value: actionResult.data?.value,
                description: actionResult.message,
                automated: actionResult.automated || false,
              },
            ],
            issueId: `issue_${rule.id}_${Math.random().toString(36).substr(2, 9)}`,
            suggestion: actionResult.message,
            priority: this.determineImpact(rule.severity),
            automated: actionResult.automated || false,
          });
        }
      });

      const executionTime = performance.now() - startTime;
      const status = issues.length > 0 ? 'failed' : 'passed';

      // Track execution metrics
      this.trackRuleExecution(rule.id, executionTime);

      // Log rule execution completion with structured error handling
      this.errorHandlingService.processError(
        new Error(`Rule execution completed: ${rule.name}`),
        'Rule execution completed successfully',
        ErrorCodes.VALIDATION.SUCCESS,
        {
          component: 'RuleExecutor',
          operation: 'executeRule',
          ruleId: rule.id,
          status,
          issueCount: issues.length,
          suggestionCount: suggestions.length,
          executionTime,
          userFriendlyMessage: `Rule validation completed: ${rule.name}`,
        }
      );

      logger.info(`Rule execution completed: ${rule.name}`, {
        ruleId: rule.id,
        status,
        issueCount: issues.length,
        suggestionCount: suggestions.length,
        executionTime,
      });

      return {
        ruleId: rule.id,
        isValid: true,
        severity: rule.severity,
        message: `Rule ${rule.name} execution completed`,
        field: rule.field,
        status,
        issues,
        suggestions,
        executionTime,
        context,
      };
    } catch (error) {
      this.errorHandlingService.processError(
        error,
        `Rule execution error: ${rule.name}`,
        ErrorCodes.VALIDATION.OPERATION_FAILED,
        {
          component: 'RuleExecutor',
          operation: 'executeRule',
          ruleId: rule.id,
          userFriendlyMessage: `Validation rule "${rule.name}" encountered an error. Please check rule configuration.`,
        }
      );

      return {
        ruleId: rule.id,
        isValid: true,
        severity: 'critical',
        message: `Rule execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        field: rule.field,
        status: 'error',
        issues: [
          {
            id: `error_${rule.id}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'error',
            severity: 'critical',
            category: 'configuration',
            message: `Rule execution error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            field: rule.field,
            affectedProducts: context.products.map(p => p.id),
            fixSuggestions: [],
            ruleId: rule.id,
            context,
          },
        ],
        suggestions: [],
        executionTime: performance.now() - startTime,
        context,
      };
    }
  }

  /**
   * Executes multiple validation rules in sequence
   */
  async executeRuleset(rules: ValidationRule[], context: ValidationContext): Promise<RuleResult[]> {
    const startTime = performance.now();

    try {
      // Log ruleset execution start with structured error handling
      this.errorHandlingService.processError(
        new Error('Executing validation ruleset'),
        'Ruleset execution started',
        ErrorCodes.VALIDATION.PROCESSING,
        {
          component: 'RuleExecutor',
          operation: 'executeRuleset',
          ruleCount: rules.length,
          productCount: context.products.length,
          userFriendlyMessage: `Validating ${rules.length} rules...`,
        }
      );

      logger.info('Executing validation ruleset', {
        ruleCount: rules.length,
        context: {
          productCount: context.products.length,
          environment: context.environment,
        },
      });

      // Sort rules by execution order
      const sortedRules = [...rules].sort(
        (a, b) => (a.executionOrder || 0) - (b.executionOrder || 0)
      );

      const results: RuleResult[] = [];
      let criticalErrorEncountered = false;

      // Execute rules in sequence
      for (const rule of sortedRules) {
        try {
          const result = await this.executeRule(rule, context);
          results.push(result);

          // Check for critical errors
          if (
            result.status === 'error' ||
            result.issues?.some(issue => issue.severity === 'critical')
          ) {
            criticalErrorEncountered = true;

            this.errorHandlingService.processError(
              new Error('Critical error encountered, stopping rule execution'),
              'Critical validation error detected',
              ErrorCodes.VALIDATION.CRITICAL_ERROR,
              {
                component: 'RuleExecutor',
                operation: 'executeRuleset',
                ruleId: rule.id,
                userFriendlyMessage: 'Critical validation error detected. Rule execution stopped.',
              }
            );
            break;
          }
        } catch {
          // Handle individual rule execution errors
          criticalErrorEncountered = true;
          break;
        }
      }

      const executionTime = performance.now() - startTime;

      // Log ruleset execution completion
      this.errorHandlingService.processError(
        new Error('Ruleset execution completed'),
        'Ruleset execution finished',
        criticalErrorEncountered
          ? ErrorCodes.VALIDATION.PARTIAL_SUCCESS
          : ErrorCodes.VALIDATION.SUCCESS,
        {
          component: 'RuleExecutor',
          operation: 'executeRuleset',
          rulesExecuted: results.length,
          totalRules: rules.length,
          executionTime,
          criticalErrors: criticalErrorEncountered,
          userFriendlyMessage: `Validation completed. ${results.length}/${rules.length} rules executed.`,
        }
      );

      logger.info('Ruleset execution completed', {
        ruleCount: rules.length,
        resultsCount: results.length,
        totalIssues: results.reduce((sum, r) => sum + (r.issues?.length || 0), 0),
        totalSuggestions: results.reduce((sum, r) => sum + (r.suggestions?.length || 0), 0),
        executionTime,
      });

      return results;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Ruleset execution error',
        ErrorCodes.VALIDATION.OPERATION_FAILED,
        {
          component: 'RuleExecutor',
          operation: 'executeRuleset',
          ruleCount: rules.length,
          userFriendlyMessage:
            'Validation ruleset execution failed. Please check rule configurations.',
        }
      );
      throw processedError;
    }
  }

  /**
   * Checks if rule conditions are met
   */
  async checkConditions(conditions: RuleCondition[], context: ValidationContext): Promise<boolean> {
    if (conditions.length === 0) return true;

    try {
      for (const condition of conditions) {
        const result = await this.evaluateCondition(condition, context);

        // Apply negation if specified
        const finalResult = condition.negated ? !result : result;

        if (!finalResult) {
          return false; // AND logic: all conditions must pass
        }
      }

      return true;
    } catch (error) {
      logger.error('Condition evaluation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        conditionCount: conditions.length,
      });

      return false; // Fail safe: if we can't evaluate, don't execute rule
    }
  }

  /**
   * Executes rule actions
   */
  async executeActions(
    actions: RuleAction[],
    context: ValidationContext
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];

    try {
      for (const action of actions) {
        const result = await this.executeAction(action, context);
        results.push(result);
      }

      return results;
    } catch (error) {
      logger.error('Action execution error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        actionCount: actions.length,
      });

      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async evaluateCondition(
    condition: RuleCondition,
    context: ValidationContext
  ): Promise<boolean> {
    try {
      const value = this.extractValue(condition.field, context);

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          if (typeof condition.value !== 'string') return false;
          return typeof value === 'string' && value.includes(condition.value);
        case 'exists':
          return value !== undefined && value !== null;
        case 'greater':
          if (typeof condition.value !== 'number') return false;
          return typeof value === 'number' && value > condition.value;
        case 'less':
          if (typeof condition.value !== 'number') return false;
          return typeof value === 'number' && value < condition.value;
        case 'matches':
          if (
            typeof condition.value !== 'string' && !(condition.value instanceof RegExp)
          ) {
            return false;
          }
          {
            const regex =
              typeof condition.value === 'string'
                ? new RegExp(condition.value)
                : condition.value;
            return typeof value === 'string' && regex.test(value);
          }
        default:
          logger.warn('Unknown condition operator', { operator: condition.operator });
          return false;
      }
    } catch (error) {
      logger.error('Condition evaluation error', {
        condition: condition.id,
        field: condition.field,
        operator: condition.operator,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  }

  private async executeAction(
    action: RuleAction,
    _context: ValidationContext
  ): Promise<ActionResult> {
    // Mark parameter as used to satisfy ESLint without altering behavior
    void _context;
    return {
      type: action.type,
      message: action.message,
      data: this.normalizeActionData(action.data),
      automated: action.automated,
    };
  }

  private extractValue(field: string, context: ValidationContext): any {
    // Extract values from context based on field path
    const parts = field.split('.');
    let value: any = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private normalizeActionData(data: unknown): ActionResult['data'] {
    if (data === undefined) return undefined;
    if (data !== null && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      const normalized: NonNullable<ActionResult['data']> = {};
      if (typeof obj.description === 'string') normalized.description = obj.description;
      if (typeof obj.confidence === 'number') normalized.confidence = obj.confidence;
      if (typeof obj.target === 'string') normalized.target = obj.target;
      if ('value' in obj) normalized.value = obj.value;
      return Object.keys(normalized).length > 0 ? normalized : undefined;
    }
    return { value: data };
  }

  private extractAffectedProducts(context: ValidationContext, actionResult: any): string[] {
    // Extract affected products from context or action result
    if (actionResult.data?.affectedProducts) {
      return actionResult.data.affectedProducts;
    }

    // Default to all products in context
    return context.products.map(p => p.id);
  }

  private determineImpact(severity: string): 'low' | 'medium' | 'high' {
    switch (severity) {
      case 'critical':
        return 'high';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  private trackRuleExecution(ruleId: string, executionTime: number): void {
    const current = this.executionMetrics.get(ruleId) || { count: 0, totalTime: 0 };
    current.count++;
    current.totalTime += executionTime;
    this.executionMetrics.set(ruleId, current);
  }

  /**
   * Public utility methods
   */

  public getRuleExecutionMetrics(ruleId: string): { count: number; avgTime: number } | undefined {
    const metrics = this.executionMetrics.get(ruleId);
    if (!metrics) return undefined;

    return {
      count: metrics.count,
      avgTime: metrics.totalTime / metrics.count,
    };
  }

  public getAllExecutionMetrics(): Record<string, { count: number; avgTime: number }> {
    const result: Record<string, { count: number; avgTime: number }> = {};

    this.executionMetrics.forEach((metrics, ruleId) => {
      result[ruleId] = {
        count: metrics.count,
        avgTime: metrics.totalTime / metrics.count,
      };
    });

    return result;
  }

  public clearMetrics(): void {
    this.executionMetrics.clear();
    logger.info('Rule execution metrics cleared');
  }
}
