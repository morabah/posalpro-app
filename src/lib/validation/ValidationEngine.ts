/**
 * Core Validation Engine for PosalPro MVP2
 * Orchestrates all validation logic and workflows
 * Supports H8 hypothesis tracking and component traceability
 */

import { Product, ProductRelationship } from '@prisma/client';
import { CompatibilityResult } from '../../types/compatibility';
import {
  ProductConfiguration,
  VALIDATION_COMPONENT_MAPPING,
  ValidationAnalyticsEvent,
  ValidationContext,
  ValidationPerformanceMetrics,
  ValidationResult,
  ValidationSummary,
} from '../../types/validation';
import { LicenseValidationService } from '../services/LicenseValidationService';
import { ProductCompatibilityService } from '../services/ProductCompatibilityService';
import { RuleExecutor } from './RuleExecutor';

export class ValidationEngine {
  private ruleExecutor: RuleExecutor;
  private compatibilityService: ProductCompatibilityService;
  private licenseValidator: LicenseValidationService;
  private performanceMetrics: Map<string, ValidationPerformanceMetrics>;
  private validationCache: Map<string, ValidationResult>;

  constructor() {
    this.ruleExecutor = new RuleExecutor();
    this.compatibilityService = new ProductCompatibilityService();
    this.licenseValidator = new LicenseValidationService();
    this.performanceMetrics = new Map();
    this.validationCache = new Map();
  }

  /**
   * Validates a complete product configuration
   * Primary method for H8 hypothesis validation
   */
  async validateProductConfiguration(
    config: ProductConfiguration,
    context: Partial<ValidationContext>
  ): Promise<ValidationResult> {
    const startTime = performance.now();
    const validationId = this.generateValidationId();

    try {
      console.log('Starting product configuration validation', {
        configId: config.id,
        productCount: config.products.length,
        userStoryMappings: VALIDATION_COMPONENT_MAPPING.userStories,
      });

      // Build complete validation context
      const validationContext = await this.buildValidationContext(config, context);

      // Check cache first
      const cacheKey = this.generateCacheKey(config);
      if (this.validationCache.has(cacheKey)) {
        const cached = this.validationCache.get(cacheKey)!;
        console.log('Using cached validation result', { validationId, cacheKey });
        return cached;
      }

      // Execute validation workflow
      const result = await this.executeValidationWorkflow(validationId, config, validationContext);

      // Cache result
      this.validationCache.set(cacheKey, result);

      // Track performance metrics for H8 hypothesis
      const executionTime = performance.now() - startTime;
      await this.trackValidationPerformance(validationId, executionTime, result);

      console.log('Product configuration validation completed', {
        validationId,
        status: result.status,
        issueCount: result.issues.length,
        executionTime,
      });

      return result;
    } catch (error) {
      console.error('Validation engine error', {
        validationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        config: config.id,
      });

      return this.createErrorResult(validationId, config, error);
    }
  }

  /**
   * Validates multiple products with relationships
   */
  async validateProducts(
    products: Product[],
    relationships: ProductRelationship[],
    context: Partial<ValidationContext>
  ): Promise<ValidationResult[]> {
    const startTime = performance.now();

    try {
      console.info('Starting multi-product validation', {
        productCount: products.length,
        relationshipCount: relationships.length,
      });

      const results: ValidationResult[] = [];

      // Validate each product individually
      for (const product of products) {
        const productConfig: ProductConfiguration = {
          id: `temp-${product.id}`,
          products: [
            {
              productId: product.id,
              quantity: 1,
              settings: {},
              customizations: {},
              dependencies: [],
              conflicts: [],
            },
          ],
          globalSettings: {},
          relationships: relationships.map(rel => ({
            id: rel.id,
            productAId: rel.sourceProductId,
            productBId: rel.targetProductId,
            type: rel.type as 'requires' | 'conflicts' | 'enhances' | 'replaces',
            strength: 1.0,
          })),
          metadata: {
            version: '1.0',
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: context.userId || 'system',
          },
        };

        const result = await this.validateProductConfiguration(productConfig, context);
        results.push(result);
      }

      // Validate relationships between products
      const compatibilityResult =
        await this.compatibilityService.checkProductCompatibility(products);
      if (compatibilityResult.overall === 'incompatible') {
        // Add compatibility issues to results
        results.forEach(result => {
          result.issues.push(...this.convertCompatibilityIssues(compatibilityResult));
        });
      }

      const executionTime = performance.now() - startTime;
      console.info('Multi-product validation completed', {
        productCount: products.length,
        totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
        executionTime,
      });

      return results;
    } catch (error) {
      console.error('Multi-product validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productCount: products.length,
      });

      throw error;
    }
  }

  /**
   * Generates a comprehensive validation report
   */
  async generateValidationReport(results: ValidationResult[]): Promise<ValidationSummary> {
    try {
      const summary: ValidationSummary = {
        totalProducts: results.length,
        validProducts: results.filter(r => r.status === 'valid').length,
        invalidProducts: results.filter(r => r.status === 'invalid').length,
        warningProducts: results.filter(r => r.status === 'warning').length,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        automatedFixesApplied: 0,
        manualFixesRequired: 0,
        overallStatus: 'valid',
      };

      // Count issues by severity
      results.forEach(result => {
        result.issues.forEach(issue => {
          switch (issue.severity) {
            case 'critical':
              summary.criticalIssues++;
              break;
            case 'high':
              summary.highIssues++;
              break;
            case 'medium':
              summary.mediumIssues++;
              break;
            case 'low':
              summary.lowIssues++;
              break;
          }
        });

        // Count fix suggestions
        result.suggestions.forEach(suggestion => {
          if (suggestion.type === 'automatic') {
            summary.automatedFixesApplied++;
          } else {
            summary.manualFixesRequired++;
          }
        });
      });

      // Determine overall status
      if (summary.criticalIssues > 0 || summary.invalidProducts > 0) {
        summary.overallStatus = 'invalid';
      } else if (summary.highIssues > 0 || summary.warningProducts > 0) {
        summary.overallStatus = 'warning';
      }

      console.info('Validation report generated', {
        totalProducts: summary.totalProducts,
        validProducts: summary.validProducts,
        criticalIssues: summary.criticalIssues,
      });

      return summary;
    } catch (error) {
      console.error('Report generation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Executes a complete validation workflow
   */
  async executeValidationWorkflow(
    workflowId: string,
    config: ProductConfiguration,
    context: ValidationContext
  ): Promise<ValidationResult> {
    const startTime = performance.now();

    try {
      const validationId = this.generateValidationId();
      const issues: any[] = [];
      const suggestions: any[] = [];

      // Step 1: Execute validation rules
      const ruleResults = await this.ruleExecutor.executeRuleset(context.rules, context);

      ruleResults.forEach(ruleResult => {
        issues.push(...ruleResult.issues);
        suggestions.push(...ruleResult.suggestions);
      });

      // Step 2: Check product compatibility
      const compatibilityResult =
        await this.compatibilityService.validateProductConfiguration(config);
      if (!compatibilityResult.valid) {
        issues.push(...compatibilityResult.issues);
      }

      // Step 3: Validate licenses
      const licenseValidation = await this.licenseValidator.validateConfiguration(config);
      if (licenseValidation.hasIssues) {
        issues.push(...licenseValidation.issues);
        suggestions.push(...licenseValidation.suggestions);
      }

      // Step 4: Generate fix suggestions
      const additionalSuggestions = await this.generateFixSuggestions(issues, context);
      suggestions.push(...additionalSuggestions);

      // Determine overall status
      const status = this.determineValidationStatus(issues);

      const executionTime = performance.now() - startTime;

      const result: ValidationResult = {
        id: validationId,
        proposalId: config.proposalId,
        status,
        issues,
        suggestions,
        timestamp: new Date(),
        executionTime,
        userStoryMappings: VALIDATION_COMPONENT_MAPPING.userStories,
        performanceMetrics: {
          totalRulesExecuted: ruleResults.length,
          rulesExecutionTime: executionTime,
          issuesDetected: issues.length,
          issuesResolved: 0, // Will be updated when fixes are applied
          automatedFixes: suggestions.filter(s => s.type === 'automatic').length,
          manualFixes: suggestions.filter(s => s.type === 'manual').length,
          falsePositives: 0, // To be tracked over time
          falseNegatives: 0, // To be tracked over time
          userEfficiencyGain: 0, // To be calculated based on time savings
          errorReductionRate: 0, // To be calculated for H8 hypothesis
        },
      };

      // Track analytics event for H8 hypothesis
      await this.trackValidationEvent({
        eventType: 'validation_completed',
        timestamp: new Date(),
        userId: context.userId,
        proposalId: config.proposalId,
        productIds: config.products.map(p => p.productId),
        metrics: result.performanceMetrics!,
        userStoryMappings: VALIDATION_COMPONENT_MAPPING.userStories,
        hypotheses: VALIDATION_COMPONENT_MAPPING.hypotheses,
      });

      return result;
    } catch (error) {
      console.error('Validation workflow error', {
        validationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async buildValidationContext(
    config: ProductConfiguration,
    partialContext: Partial<ValidationContext>
  ): Promise<ValidationContext> {
    // Load products from database
    const products = await this.loadProducts(config.products.map(p => p.productId));

    // Load relationships from database
    const relationships = await this.loadRelationships(config.relationships.map(r => r.id));

    // Load validation rules
    const rules = await this.loadValidationRules();

    return {
      proposalId: config.proposalId,
      userId: partialContext.userId || 'system',
      products,
      relationships,
      configuration: config,
      environment: partialContext.environment || 'development',
      timestamp: new Date(),
      rules,
    };
  }

  private async loadProducts(productIds: string[]): Promise<Product[]> {
    // This would typically load from database
    // For now, return empty array - to be implemented with actual DB calls
    return [];
  }

  private async loadRelationships(relationshipIds: string[]): Promise<ProductRelationship[]> {
    // This would typically load from database
    // For now, return empty array - to be implemented with actual DB calls
    return [];
  }

  private async loadValidationRules() {
    // This would typically load from database or configuration
    // For now, return empty array - to be implemented with actual rule loading
    return [];
  }

  private generateValidationId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(config: ProductConfiguration): string {
    const configHash = JSON.stringify({
      products: config.products.sort((a, b) => a.productId.localeCompare(b.productId)),
      relationships: config.relationships.sort((a, b) => a.id.localeCompare(b.id)),
      globalSettings: config.globalSettings,
    });

    return `cache_${Buffer.from(configHash).toString('base64').substr(0, 32)}`;
  }

  private convertCompatibilityIssues(compatibilityResult: CompatibilityResult): any[] {
    return compatibilityResult.circularDependencies.map(dep => ({
      id: dep.id,
      type: 'error',
      severity: dep.severity === 'error' ? 'critical' : 'medium',
      category: 'dependency',
      message: dep.description,
      affectedProducts: dep.path,
      fixSuggestions: dep.resolution.map(res => ({
        id: `fix_${dep.id}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'manual',
        description: res,
        confidence: 0.8,
        impact: 'medium',
        actions: [],
      })),
    }));
  }

  private async generateFixSuggestions(issues: any[], context: ValidationContext) {
    // Generate automated fix suggestions based on issues
    return issues
      .filter(issue => issue.severity === 'critical')
      .map(issue => ({
        id: `suggestion_${issue.id}_${Math.random().toString(36).substr(2, 5)}`,
        type: 'automatic',
        description: `Automated fix for ${issue.message}`,
        confidence: 0.7,
        impact: 'medium',
        actions: [],
      }));
  }

  private determineValidationStatus(issues: any[]): 'valid' | 'invalid' | 'warning' | 'pending' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    if (criticalIssues > 0) return 'invalid';
    if (highIssues > 0) return 'warning';
    return issues.length > 0 ? 'warning' : 'valid';
  }

  private createErrorResult(
    validationId: string,
    config: ProductConfiguration,
    error: any
  ): ValidationResult {
    return {
      id: validationId,
      proposalId: config.proposalId,
      status: 'invalid',
      issues: [
        {
          id: `error_${validationId}`,
          type: 'error',
          severity: 'critical',
          category: 'configuration',
          message: `Validation engine error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          affectedProducts: config.products.map(p => p.productId),
          fixSuggestions: [],
        },
      ],
      suggestions: [],
      timestamp: new Date(),
      executionTime: 0,
      userStoryMappings: VALIDATION_COMPONENT_MAPPING.userStories,
    };
  }

  private async trackValidationPerformance(
    validationId: string,
    executionTime: number,
    result: ValidationResult
  ): Promise<void> {
    const metrics: ValidationPerformanceMetrics = {
      totalRulesExecuted: result.performanceMetrics?.totalRulesExecuted || 0,
      rulesExecutionTime: executionTime,
      issuesDetected: result.issues.length,
      issuesResolved: 0,
      automatedFixes: result.suggestions.filter(s => s.type === 'automatic').length,
      manualFixes: result.suggestions.filter(s => s.type === 'manual').length,
      falsePositives: 0,
      falseNegatives: 0,
      userEfficiencyGain: 0,
      errorReductionRate: 0,
    };

    this.performanceMetrics.set(validationId, metrics);

    console.info('Validation performance tracked', {
      validationId,
      executionTime,
      issuesDetected: metrics.issuesDetected,
      automatedFixes: metrics.automatedFixes,
    });
  }

  private async trackValidationEvent(event: ValidationAnalyticsEvent): Promise<void> {
    try {
      // This would integrate with the analytics system
      console.info('Validation analytics event tracked', {
        eventType: event.eventType,
        userId: event.userId,
        productCount: event.productIds.length,
        hypotheses: event.hypotheses,
      });

      // TODO: Integrate with actual analytics service
    } catch (error) {
      console.error('Analytics tracking error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType: event.eventType,
      });
    }
  }

  /**
   * Public utility methods
   */

  public getPerformanceMetrics(validationId: string): ValidationPerformanceMetrics | undefined {
    return this.performanceMetrics.get(validationId);
  }

  public clearCache(): void {
    this.validationCache.clear();
    console.info('Validation cache cleared');
  }

  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.validationCache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }
}
