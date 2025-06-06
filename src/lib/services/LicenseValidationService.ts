/**
 * License Validation Service for PosalPro MVP2
 * Handles license validation and compliance checking
 */

import { FixSuggestion, ProductConfiguration, ValidationIssue } from '../../types/validation';

export interface LicenseValidationResult {
  hasIssues: boolean;
  issues: ValidationIssue[];
  suggestions: FixSuggestion[];
}

export class LicenseValidationService {
  constructor() {}

  /**
   * Validates configuration for license compliance
   */
  async validateConfiguration(config: ProductConfiguration): Promise<LicenseValidationResult> {
    try {
      console.log('Starting license validation', {
        configId: config.id,
        productCount: config.products.length,
      });

      const issues: ValidationIssue[] = [];
      const suggestions: FixSuggestion[] = [];

      // Basic license validation (placeholder)
      // This would typically check against license requirements database

      // Example: Check for products that require licenses
      config.products.forEach(product => {
        // Placeholder license check
        if (product.settings?.requiresLicense && !product.settings?.licenseKey) {
          issues.push({
            id: `license_issue_${Math.random().toString(36).substr(2, 9)}`,
            type: 'error',
            severity: 'high',
            category: 'license',
            message: `Product ${product.productId} requires a license but none is configured`,
            affectedProducts: [product.productId],
            fixSuggestions: [
              {
                id: `license_fix_${Math.random().toString(36).substr(2, 5)}`,
                type: 'manual',
                description: 'Configure license key for this product',
                confidence: 0.9,
                impact: 'high',
                actions: [
                  {
                    id: `action_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'configure',
                    target: `product.${product.productId}.licenseKey`,
                    value: '',
                    description: 'Add license key',
                    automated: false,
                  },
                ],
              },
            ],
          });

          suggestions.push({
            id: `license_suggestion_${Math.random().toString(36).substr(2, 5)}`,
            type: 'manual',
            description: `Configure license for ${product.productId}`,
            confidence: 0.9,
            impact: 'high',
            actions: [
              {
                id: `action_${Math.random().toString(36).substr(2, 9)}`,
                type: 'configure',
                target: `product.${product.productId}.licenseKey`,
                value: '',
                description: 'Add license key',
                automated: false,
              },
            ],
          });
        }
      });

      const result: LicenseValidationResult = {
        hasIssues: issues.length > 0,
        issues,
        suggestions,
      };

      console.log('License validation completed', {
        configId: config.id,
        hasIssues: result.hasIssues,
        issueCount: issues.length,
      });

      return result;
    } catch (error) {
      console.error('License validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        configId: config.id,
      });

      return {
        hasIssues: true,
        issues: [
          {
            id: `license_error_${Math.random().toString(36).substr(2, 9)}`,
            type: 'error',
            severity: 'critical',
            category: 'license',
            message: `License validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            affectedProducts: config.products.map(p => p.productId),
            fixSuggestions: [],
          },
        ],
        suggestions: [],
      };
    }
  }
}
