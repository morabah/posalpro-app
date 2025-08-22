import { logger } from '@/lib/logger';/**
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
      logger.info('Starting license validation', {
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
        const settings = product.settings;
        if (settings.requiresLicense && !settings.licenseKey) {
          issues.push({
            id: `license_issue_${Math.random().toString(36).substr(2, 9)}`,
            type: 'error',
            severity: 'high',
            category: 'license',
            field: 'licenseKey',
            message: `Product ${product.productId} requires a license but none is configured`,
            affectedProducts: [product.productId],
            fixSuggestions: [
              {
                id: `license_fix_${Math.random().toString(36).substr(2, 5)}`,
                type: 'manual',
                title: 'Configure License Key',
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
                issueId: `license_issue_${Math.random().toString(36).substr(2, 9)}`,
                suggestion: 'Configure license key for this product',
                priority: 'high',
                automated: false,
              },
            ],
          });

          suggestions.push({
            id: `license_suggestion_${Math.random().toString(36).substr(2, 5)}`,
            type: 'manual',
            title: 'Configure Product License',
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
            issueId: `license_issue_${Math.random().toString(36).substr(2, 9)}`,
            suggestion: `Configure license for ${product.productId}`,
            priority: 'high',
            automated: false,
          });
        }
      });

      const result: LicenseValidationResult = {
        hasIssues: issues.length > 0,
        issues,
        suggestions,
      };

      logger.info('License validation completed', {
        configId: config.id,
        hasIssues: result.hasIssues,
        issueCount: issues.length,
      });

      return result;
    } catch (error) {
      logger.error('License validation error', {
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
            field: 'configuration',
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
