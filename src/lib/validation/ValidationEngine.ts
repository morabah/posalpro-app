/**
 * ValidationEngine Class
 *
 * Component Traceability Matrix:
 * - User Stories: US-3.1, US-3.2, US-4.1
 * - Acceptance Criteria: AC-3.1.1, AC-3.2.1, AC-4.1.1
 * - Methods: validateProduct(), validateRelationships(), predictValidation()
 * - Hypotheses: H8 (Technical Validation)
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */

// Validation rule types
export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ValidationRuleType =
  | 'compatibility'
  | 'dependency'
  | 'licensing'
  | 'configuration'
  | 'custom';

export interface ValidationRule {
  id: string;
  type: ValidationRuleType;
  name: string;
  description: string;
  severity: ValidationSeverity;
  validate: (context: ValidationContext) => Promise<ValidationResult>;
}

export interface ValidationContext {
  productId: string;
  relatedProductIds?: string[];
  configuration?: Record<string, any>;
  customizations?: string[];
  licenses?: string[];
}

export interface ValidationResult {
  ruleId: string;
  isValid: boolean;
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationSummary {
  isValid: boolean;
  results: ValidationResult[];
  timestamp: Date;
  metadata: {
    productId: string;
    validationDuration: number;
    rulesExecuted: number;
  };
}

export class ValidationEngine {
  private rules: Map<string, ValidationRule>;
  private validationHistory: Map<string, ValidationSummary[]>;

  constructor() {
    this.rules = new Map();
    this.validationHistory = new Map();
  }

  /**
   * Register a new validation rule
   */
  public registerRule(rule: ValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a validation rule
   */
  public unregisterRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Validate a product against all registered rules
   */
  public async validateProduct(context: ValidationContext): Promise<ValidationSummary> {
    const startTime = Date.now();
    const results: ValidationResult[] = [];

    for (const rule of this.rules.values()) {
      try {
        const result = await rule.validate(context);
        results.push(result);
      } catch (error) {
        results.push({
          ruleId: rule.id,
          isValid: false,
          severity: 'error',
          message: `Validation error: ${error.message}`,
        });
      }
    }

    const summary: ValidationSummary = {
      isValid: results.every(r => r.isValid || r.severity === 'warning' || r.severity === 'info'),
      results,
      timestamp: new Date(),
      metadata: {
        productId: context.productId,
        validationDuration: Date.now() - startTime,
        rulesExecuted: results.length,
      },
    };

    // Store validation history
    const history = this.validationHistory.get(context.productId) || [];
    history.push(summary);
    this.validationHistory.set(context.productId, history);

    return summary;
  }

  /**
   * Validate relationships between products
   */
  public async validateRelationships(
    productId: string,
    relatedProductIds: string[]
  ): Promise<ValidationSummary> {
    return this.validateProduct({
      productId,
      relatedProductIds,
    });
  }

  /**
   * Get validation history for a product
   */
  public getValidationHistory(productId: string): ValidationSummary[] {
    return this.validationHistory.get(productId) || [];
  }

  /**
   * Clear validation history for a product
   */
  public clearValidationHistory(productId: string): void {
    this.validationHistory.delete(productId);
  }

  /**
   * Get all registered rules
   */
  public getRegisteredRules(): ValidationRule[] {
    return Array.from(this.rules.values());
  }
}

// Export default instance
export const validationEngine = new ValidationEngine();
