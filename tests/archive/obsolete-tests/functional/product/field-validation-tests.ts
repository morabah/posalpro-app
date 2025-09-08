#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Field Validation Tests
 * Tests comprehensive field validation against database schema, Zod schemas, and validation rules
 */

import { ApiClient } from './api-client';

export class FieldValidationTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    console.log('\n🔍 Testing Product Field Validation');
    this.api.resetTracking();

    const tests = [
      {
        name: 'Comprehensive Product Field Validation',
        test: async () => {
          console.log('📊 Validating product fields against schemas...');

          // Get sample products to validate field structure
          const productsRes = await this.api.request('GET', '/api/products?limit=3');
          if (productsRes.status !== 200) {
            throw new Error('Cannot test field validation - API not responding');
          }

          const productsData = await productsRes.json();
          const products = productsData.data?.items || [];

          if (products.length === 0) {
            return { status: 'no_data', message: 'No products available for field validation' };
          }

          // Validate fields for each product
          const validationResults = [];
          for (const product of products.slice(0, 2)) {
            const productValidation = this.validateProductFields(product);
            validationResults.push(productValidation);
          }

          // Calculate overall statistics
          const totalFields = validationResults.reduce((sum, v) => sum + v.totalFields, 0);
          const validFields = validationResults.reduce((sum, v) => sum + v.validFields, 0);
          const invalidFields = validationResults.reduce((sum, v) => sum + v.invalidFields, 0);

          // Collect all field issues for reporting
          const allFieldIssues = validationResults.flatMap(v =>
            v.fieldResults
              .filter(f => !f.valid)
              .map(f => ({
                productId: v.productId,
                field: f.field,
                issues: f.issues,
                dbType: f.dbType,
                zodType: f.zodType,
                required: f.required,
              }))
          );

          return {
            productsValidated: validationResults.length,
            totalFieldsValidated: totalFields,
            validFields,
            invalidFields,
            validationSuccessRate: `${((validFields / totalFields) * 100).toFixed(1)}%`,
            criticalIssues: allFieldIssues.filter(issue =>
              issue.issues.some(
                i => i.includes('Required field missing') || i.includes('Invalid enum')
              )
            ),
            fieldValidationResults: validationResults,
          };
        },
      },
    ];

    const results = [];

    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        results.push({
          test: name,
          status: 'PASS',
          duration: Date.now() - start,
          result,
        });
      } catch (error: any) {
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
        });
      }
    }

    return results;
  }

  private validateProductFields(product: any) {
    const fields = {
      id: {
        dbType: 'String',
        zodType: 'string',
        required: true,
        pattern: '^cm',
        relationship: null,
        description: 'Primary key for product',
      },
      name: {
        dbType: 'String',
        zodType: 'string',
        required: true,
        minLength: 1,
        maxLength: 255,
        relationship: null,
        description: 'Product name',
      },
      description: {
        dbType: 'String',
        zodType: 'string',
        required: false,
        maxLength: 1000,
        relationship: null,
        description: 'Detailed product description',
      },
      sku: {
        dbType: 'String',
        zodType: 'string',
        required: true,
        unique: true,
        maxLength: 100,
        relationship: null,
        description: 'Stock Keeping Unit identifier',
      },
      category: {
        dbType: 'String',
        zodType: 'string',
        required: true,
        maxLength: 100,
        relationship: null,
        description: 'Product category classification',
      },
      price: {
        dbType: 'Decimal',
        zodType: 'number',
        required: true,
        min: 0,
        relationship: null,
        description: 'Product selling price',
      },
      cost: {
        dbType: 'Decimal',
        zodType: 'number',
        required: false,
        min: 0,
        relationship: null,
        description: 'Product cost price',
      },
      stockQuantity: {
        dbType: 'Int',
        zodType: 'number',
        required: true,
        min: 0,
        relationship: null,
        description: 'Available stock quantity',
      },
      status: {
        dbType: 'String',
        zodType: 'enum',
        required: true,
        enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
        relationship: null,
        description: 'Product availability status',
      },
      createdAt: {
        dbType: 'DateTime',
        zodType: 'string',
        required: true,
        format: 'ISO',
        relationship: null,
        description: 'Timestamp when product was created',
      },
      updatedAt: {
        dbType: 'DateTime',
        zodType: 'string',
        required: true,
        format: 'ISO',
        relationship: null,
        description: 'Timestamp when product was last updated',
      },
    };

    const fieldValidationResults = [];

    for (const [fieldName, config] of Object.entries(fields)) {
      const actualValue = product[fieldName];
      let isValid = true;
      const issues = [];

      // Required field validation
      if (config.required && (actualValue === undefined || actualValue === null)) {
        isValid = false;
        issues.push('Required field missing');
      }

      // Type validation
      if (actualValue !== undefined && actualValue !== null) {
        // Database type validation
        const dbTypeValid = this.validateDatabaseType(config.dbType, actualValue);
        if (!dbTypeValid.valid) {
          isValid = false;
          issues.push(dbTypeValid.error);
        }

        // Zod type validation
        const zodTypeValid = this.validateZodType(config.zodType, actualValue, config.enum);
        if (!zodTypeValid.valid) {
          isValid = false;
          issues.push(zodTypeValid.error);
        }

        // Format validation
        if (config.format) {
          const formatValid = this.validateFormat(config.format, actualValue);
          if (!formatValid.valid) {
            isValid = false;
            issues.push(formatValid.error);
          }
        }

        // Pattern validation
        if (config.pattern && !new RegExp(config.pattern).test(actualValue)) {
          isValid = false;
          issues.push(`Pattern mismatch: ${config.pattern}`);
        }

        // Length constraints
        if (config.minLength && actualValue.length < config.minLength) {
          isValid = false;
          issues.push(`Too short: min ${config.minLength} chars`);
        }
        if (config.maxLength && actualValue.length > config.maxLength) {
          isValid = false;
          issues.push(`Too long: max ${config.maxLength} chars`);
        }

        // Numeric constraints
        if (config.min !== undefined && actualValue < config.min) {
          isValid = false;
          issues.push(`Below minimum: ${config.min}`);
        }
        if (config.max !== undefined && actualValue > config.max) {
          isValid = false;
          issues.push(`Above maximum: ${config.max}`);
        }

        // Enum validation
        if (config.enum && !config.enum.includes(actualValue)) {
          isValid = false;
          issues.push(`Invalid enum value: ${actualValue}. Expected: ${config.enum.join(', ')}`);
        }
      }

      fieldValidationResults.push({
        field: fieldName,
        dbType: config.dbType,
        zodType: config.zodType,
        required: config.required,
        valid: isValid,
        issues: issues,
        actualValue: actualValue,
      });
    }

    return {
      productId: product.id,
      validFields: fieldValidationResults.filter(f => f.valid).length,
      invalidFields: fieldValidationResults.filter(f => !f.valid).length,
      totalFields: fieldValidationResults.length,
      fieldResults: fieldValidationResults,
      overallValid: fieldValidationResults.every(f => f.valid),
    };
  }

  private validateDatabaseType(dbType: string, value: any) {
    switch (dbType) {
      case 'String':
        if (typeof value !== 'string') {
          return { valid: false, error: `Expected String, got ${typeof value}` };
        }
        break;
      case 'Int':
        if (typeof value !== 'number' || !Number.isInteger(value)) {
          return { valid: false, error: `Expected Int, got ${typeof value}` };
        }
        break;
      case 'Decimal':
        if (typeof value !== 'number') {
          return { valid: false, error: `Expected Decimal, got ${typeof value}` };
        }
        break;
      case 'DateTime':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          return { valid: false, error: 'Expected valid DateTime' };
        }
        break;
    }
    return { valid: true };
  }

  private validateZodType(zodType: string, value: any, enumValues?: string[]) {
    switch (zodType) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: `Expected string, got ${typeof value}` };
        }
        break;
      case 'number':
        if (typeof value !== 'number') {
          return { valid: false, error: `Expected number, got ${typeof value}` };
        }
        break;
      case 'enum':
        if (enumValues && !enumValues.includes(value)) {
          return { valid: false, error: `Invalid enum value: ${value}` };
        }
        break;
    }
    return { valid: true };
  }

  private validateFormat(format: string, value: any) {
    switch (format) {
      case 'ISO':
        if (isNaN(Date.parse(value))) {
          return { valid: false, error: 'Invalid ISO date format' };
        }
        break;
    }
    return { valid: true };
  }
}
