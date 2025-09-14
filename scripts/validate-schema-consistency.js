#!/usr/bin/env node

/**
 * Schema Consistency Validator
 *
 * This script validates that the production Prisma schema matches the main schema
 * to prevent build failures due to missing fields or models.
 *
 * Usage: node scripts/validate-schema-consistency.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

class SchemaValidator {
  constructor() {
    this.mainSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    this.productionSchemaPath = path.join(process.cwd(), 'prisma', 'schema.production.prisma');
    this.errors = [];
    this.warnings = [];
  }

  parseSchema(schemaPath) {
    const content = fs.readFileSync(schemaPath, 'utf8');
    const lines = content.split('\n');

    const schema = {
      models: new Map(),
      enums: new Map(),
      fields: new Map()
    };

    let currentModel = null;
    let currentEnum = null;
    let inModel = false;
    let inEnum = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Skip comments and empty lines
      if (line.startsWith('//') || line === '') continue;

      // Model detection
      if (line.startsWith('model ')) {
        const modelName = line.split(' ')[1];
        schema.models.set(modelName, {
          name: modelName,
          fields: new Map(),
          lineNumber
        });
        currentModel = modelName;
        inModel = true;
        inEnum = false;
        continue;
      }

      // Enum detection
      if (line.startsWith('enum ')) {
        const enumName = line.split(' ')[1];
        schema.enums.set(enumName, {
          name: enumName,
          values: [],
          lineNumber
        });
        currentEnum = enumName;
        inEnum = true;
        inModel = false;
        continue;
      }

      // Field detection in models
      if (inModel && currentModel && line.includes(' ') && !line.startsWith('@@')) {
        const fieldMatch = line.match(/^(\w+)\s+([^@]+)/);
        if (fieldMatch) {
          const [, fieldName, fieldType] = fieldMatch;
          schema.models.get(currentModel).fields.set(fieldName, {
            name: fieldName,
            type: fieldType.trim(),
            lineNumber
          });
        }
      }

      // Enum value detection
      if (inEnum && currentEnum && /^[A-Z_][A-Z0-9_]*$/.test(line)) {
        schema.enums.get(currentEnum).values.push({
          name: line,
          lineNumber
        });
      }

      // End of model/enum detection
      if (line === '}') {
        inModel = false;
        inEnum = false;
        currentModel = null;
        currentEnum = null;
      }
    }

    return schema;
  }

  compareSchemas() {
    logInfo('Parsing main schema...');
    const mainSchema = this.parseSchema(this.mainSchemaPath);

    logInfo('Parsing production schema...');
    const productionSchema = this.parseSchema(this.productionSchemaPath);

    logInfo('Comparing schemas...');

    // Compare models
    this.compareModels(mainSchema.models, productionSchema.models);

    // Compare enums
    this.compareEnums(mainSchema.enums, productionSchema.enums);

    // Compare fields within models
    this.compareModelFields(mainSchema.models, productionSchema.models);
  }

  compareModels(mainModels, productionModels) {
    // Check for missing models in production
    for (const [modelName, model] of mainModels) {
      if (!productionModels.has(modelName)) {
        this.errors.push(`Missing model in production schema: ${modelName} (line ${model.lineNumber} in main schema)`);
      }
    }

    // Check for extra models in production
    for (const [modelName, model] of productionModels) {
      if (!mainModels.has(modelName)) {
        this.warnings.push(`Extra model in production schema: ${modelName} (line ${model.lineNumber} in production schema)`);
      }
    }
  }

  compareEnums(mainEnums, productionEnums) {
    // Check for missing enums in production
    for (const [enumName, enumDef] of mainEnums) {
      if (!productionEnums.has(enumName)) {
        this.errors.push(`Missing enum in production schema: ${enumName} (line ${enumDef.lineNumber} in main schema)`);
      } else {
        // Compare enum values
        const productionEnum = productionEnums.get(enumName);
        const mainValues = enumDef.values.map(v => v.name);
        const productionValues = productionEnum.values.map(v => v.name);

        for (const value of mainValues) {
          if (!productionValues.includes(value)) {
            this.errors.push(`Missing enum value in production schema: ${enumName}.${value}`);
          }
        }
      }
    }
  }

  compareModelFields(mainModels, productionModels) {
    for (const [modelName, mainModel] of mainModels) {
      if (!productionModels.has(modelName)) continue;

      const productionModel = productionModels.get(modelName);

      // Check for missing fields in production
      for (const [fieldName, field] of mainModel.fields) {
        if (!productionModel.fields.has(fieldName)) {
          this.errors.push(`Missing field in production schema: ${modelName}.${fieldName} (line ${field.lineNumber} in main schema)`);
        } else {
          // Compare field types (basic comparison)
          const productionField = productionModel.fields.get(fieldName);
          if (field.type !== productionField.type) {
            this.warnings.push(`Field type mismatch: ${modelName}.${fieldName} - Main: ${field.type}, Production: ${productionField.type}`);
          }
        }
      }
    }
  }

  generateReport() {
    log('\n' + '='.repeat(80), 'cyan');
    log('SCHEMA CONSISTENCY VALIDATION REPORT', 'bold');
    log('='.repeat(80), 'cyan');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      logSuccess('🎉 Schema consistency validation passed!');
      logInfo('Both schemas are perfectly synchronized.');
      return true;
    }

    if (this.errors.length > 0) {
      logError(`\n❌ CRITICAL ERRORS (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        log(`  ${index + 1}. ${error}`, 'red');
      });
    }

    if (this.warnings.length > 0) {
      logWarning(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        log(`  ${index + 1}. ${warning}`, 'yellow');
      });
    }

    log('\n' + '='.repeat(80), 'cyan');
    log('RECOMMENDATIONS:', 'bold');
    log('='.repeat(80), 'cyan');

    if (this.errors.length > 0) {
      logError('🚨 IMMEDIATE ACTION REQUIRED:');
      log('  1. Fix all critical errors before deployment');
      log('  2. Update production schema to match main schema');
      log('  3. Run this validation script again');
      log('  4. Test build locally before pushing to production');
    }

    if (this.warnings.length > 0) {
      logWarning('⚠️  REVIEW RECOMMENDED:');
      log('  1. Review warnings for potential issues');
      log('  2. Consider if extra models/fields are intentional');
      log('  3. Update documentation if needed');
    }

    log('\n' + '='.repeat(80), 'cyan');
    return this.errors.length === 0;
  }

  async run() {
    try {
      log('🔍 Starting schema consistency validation...', 'bold');

      // Check if schema files exist
      if (!fs.existsSync(this.mainSchemaPath)) {
        logError(`Main schema file not found: ${this.mainSchemaPath}`);
        process.exit(1);
      }

      if (!fs.existsSync(this.productionSchemaPath)) {
        logError(`Production schema file not found: ${this.productionSchemaPath}`);
        process.exit(1);
      }

      this.compareSchemas();
      const success = this.generateReport();

      if (!success) {
        logError('\n❌ Schema validation failed!');
        process.exit(1);
      } else {
        logSuccess('\n✅ Schema validation passed!');
        process.exit(0);
      }

    } catch (error) {
      logError(`Validation failed with error: ${error.message}`);
      console.error(error);
      process.exit(1);
    }
  }
}

// Run the validator
if (require.main === module) {
  const validator = new SchemaValidator();
  validator.run();
}

module.exports = SchemaValidator;
