/**
 * Rule Executor for PosalPro MVP2 Validation Engine
 * Handles individual validation rule processing and execution
 */

import {
  ActionResult,
  ActionTarget,
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

  constructor() {
    this.executionMetrics = new Map();
  }

  /**
   * Executes a single validation rule
   */
  async executeRule(rule: ValidationRule, context: ValidationContext): Promise<RuleResult> {
    const startTime = performance.now();

    try {
      console.log(`Executing validation rule: ${rule.name}`, {
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
            type: actionResult.type as 'error' | 'warning',
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
                target: (actionResult.data?.target || 'configuration') as ActionTarget,
                value: actionResult.data?.value,
                description: actionResult.message,
                automated: actionResult.automated || false,
              },
            ],
            issueId: `issue_${rule.id}_${Math.random().toString(36).substr(2, 9)}`,
            suggestion: actionResult.message,
            priority: this.determineImpact(rule.severity) as 'high' | 'medium' | 'low',
            automated: actionResult.automated || false,
          });
        }
      });

      const executionTime = performance.now() - startTime;
      const status = issues.length > 0 ? 'failed' : 'passed';

      // Track execution metrics
      this.trackRuleExecution(rule.id, executionTime);

      console.log(`Rule execution completed: ${rule.name}`, {
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
      console.error(`Rule execution error: ${rule.name}`, {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

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
      console.log('Executing validation ruleset', {
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

      // Execute rules in sequence
      for (const rule of sortedRules) {
        const result = await this.executeRule(rule, context);
        results.push(result);

        // Stop execution on critical errors if configured
        if (result.status === 'error' && rule.severity === 'critical') {
          console.warn('Critical error encountered, stopping rule execution', {
            ruleId: rule.id,
            ruleName: rule.name,
          });
          break;
        }
      }

      const executionTime = performance.now() - startTime;

      console.log('Ruleset execution completed', {
        ruleCount: rules.length,
        resultsCount: results.length,
        totalIssues: results.reduce((sum, r) => sum + (r.issues?.length || 0), 0),
        totalSuggestions: results.reduce((sum, r) => sum + (r.suggestions?.length || 0), 0),
        executionTime,
      });

      return results;
    } catch (error) {
      console.error('Ruleset execution error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ruleCount: rules.length,
      });

      throw error;
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
      console.error('Condition evaluation error', {
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
  ): Promise<Array<ActionResult>> {
    const results: Array<ActionResult> = [];

    try {
      for (const action of actions) {
        const result = await this.executeAction(action, context);
        results.push(result);
      }

      return results;
    } catch (error) {
      console.error('Action execution error', {
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
          return typeof value === 'string' && value.includes(condition.value);
        case 'exists':
          return value !== undefined && value !== null;
        case 'greater':
          return typeof value === 'number' && value > condition.value;
        case 'less':
          return typeof value === 'number' && value < condition.value;
        case 'matches':
          return typeof value === 'string' && new RegExp(condition.value).test(value);
        default:
          console.warn('Unknown condition operator', { operator: condition.operator });
          return false;
      }
    } catch (error) {
      console.error('Condition evaluation error', {
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
    context: ValidationContext
  ): Promise<ActionResult> {
    return {
      type: action.type as 'error' | 'warning' | 'fix' | 'suggest' | 'block',
      message: action.message,
      data: action.data,
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
    console.log('Rule execution metrics cleared');
  }
}
