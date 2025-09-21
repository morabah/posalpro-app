#!/usr/bin/env tsx

/*
 * PosalPro CLI - Validation Commands
 *
 * Handles schema validation, data consistency checks, and testing commands
 */

import { logDebug, logError, logInfo } from '../../../src/lib/logger';
import { ApiClient } from '../core/api-client';
import { CommandContext } from '../core/types';

// Schema commands
export async function handleSchemaCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();

  if (!subCommand) {
    console.log('Usage: schema <action> [options]');
    console.log('Actions: check, integrity');
    console.log('Examples:');
    console.log('  schema check          # Run schema validation checks');
    console.log('  schema integrity      # Run data integrity checks');
    return;
  }

  try {
    switch (subCommand) {
      case 'check': {
        console.log('🔍 Running schema validation checks...');

        const res = await api.request('GET', '/api/schema/check');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Schema validation completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Schema validation failed: ${res.status}`);
        }
        break;
      }
      case 'integrity': {
        console.log('🔍 Running data integrity checks...');

        const res = await api.request('GET', '/api/schema/integrity');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Data integrity check completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Data integrity check failed: ${res.status}`);
        }
        break;
      }
      case 'validate': {
        console.log('🔍 Running Zod schema validation against live data...');

        const res = await api.request('GET', '/api/schema/validate');
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Schema validation completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Schema validation failed: ${res.status}`);
        }
        break;
      }
      case 'detect-mismatch': {
        const componentName = tokens[2];
        if (!componentName) {
          console.log('Usage: schema detect-mismatch <componentName>');
          console.log('Example: schema detect-mismatch ProductForm');
          return;
        }

        console.log(`🔍 Detecting field mismatches for component: ${componentName}`);

        const res = await api.request('GET', `/api/schema/detect-mismatch?component=${encodeURIComponent(componentName)}`);
        if (res.ok) {
          const result = await res.json();
          console.log('✅ Field mismatch detection completed');
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`❌ Field mismatch detection failed: ${res.status}`);
        }
        break;
      }
      default:
        console.log(`Unknown schema action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: Schema command failed', {
      component: 'ValidationCommands',
      operation: 'schema_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
    });
    throw error;
  }
}

// Consistency commands
export async function handleConsistencyCommand(context: CommandContext): Promise<void> {
  const { api, tokens } = context;
  const subCommand = tokens[1]?.toLowerCase();
  const entity = tokens[2]?.toLowerCase();
  const id = tokens[3];

  if (!subCommand) {
    console.log('Usage: consistency <action> [entity] [id]');
    console.log('Actions: check, validate');
    console.log('Entities: proposals, customers, products, users, all');
    console.log('Examples:');
    console.log('  consistency check proposals     # Check all proposals');
    console.log('  consistency check proposals 123 # Check specific proposal');
    console.log('  consistency validate customers  # Validate all customers');
    return;
  }

  try {
    switch (subCommand) {
      case 'check': {
        if (entity === 'all') {
          console.log('🔍 Running consistency checks for all entities...');

          const res = await api.request('GET', '/api/consistency/check-all');
          if (res.ok) {
            const result = await res.json();
            console.log('✅ Consistency check completed');
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(`❌ Consistency check failed: ${res.status}`);
          }
        } else if (entity && id) {
          console.log(`🔍 Running consistency check for ${entity} ${id}...`);

          const res = await api.request('GET', `/api/consistency/check/${entity}/${id}`);
          if (res.ok) {
            const result = await res.json();
            console.log('✅ Consistency check completed');
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(`❌ Consistency check failed: ${res.status}`);
          }
        } else if (entity) {
          console.log(`🔍 Running consistency check for ${entity}...`);

          const res = await api.request('GET', `/api/consistency/check/${entity}`);
          if (res.ok) {
            const result = await res.json();
            console.log('✅ Consistency check completed');
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(`❌ Consistency check failed: ${res.status}`);
          }
        } else {
          console.log('Usage: consistency check <entity> [id]');
          console.log('Entities: proposals, customers, products, users, all');
        }
        break;
      }
      case 'validate': {
        if (entity && id) {
          console.log(`🔍 Validating ${entity} ${id}...`);

          const res = await api.request('POST', `/api/consistency/validate/${entity}/${id}`);
          if (res.ok) {
            const result = await res.json();
            console.log('✅ Validation completed');
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(`❌ Validation failed: ${res.status}`);
          }
        } else if (entity) {
          console.log(`🔍 Validating all ${entity}...`);

          const res = await api.request('POST', `/api/consistency/validate/${entity}`);
          if (res.ok) {
            const result = await res.json();
            console.log('✅ Validation completed');
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(`❌ Validation failed: ${res.status}`);
          }
        } else {
          console.log('Usage: consistency validate <entity> [id]');
          console.log('Entities: proposals, customers, products, users');
        }
        break;
      }
      default:
        console.log(`Unknown consistency action: ${subCommand}`);
        break;
    }
  } catch (error) {
    logError('CLI: Consistency command failed', {
      component: 'ValidationCommands',
      operation: 'consistency_command',
      error: error instanceof Error ? error.message : 'Unknown error',
      subCommand,
      entity,
      id,
    });
    throw error;
  }
}

// Interactive schema testing
export async function handleInteractiveCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  console.log('🧪 Starting interactive schema testing...');
  console.log('This will run comprehensive schema validation tests interactively.\n');

  try {
    const res = await api.request('POST', '/api/schema/interactive-test');
    if (res.ok) {
      const result = await res.json();
      console.log('✅ Interactive schema testing completed');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Interactive schema testing failed: ${res.status}`);
    }
  } catch (error) {
    logError('CLI: Interactive command failed', {
      component: 'ValidationCommands',
      operation: 'interactive_command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Schema transformation testing
export async function handleTransformCommand(context: CommandContext): Promise<void> {
  const { tokens } = context;

  console.log('🔄 Running schema transformation testing...');
  console.log('This will test schema transformation and migration capabilities.\n');

  try {
    const { execSync } = require('child_process');
    execSync('tsx scripts/schema-transform-test.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error('❌ Schema transformation testing failed:', (error as Error).message);
    throw error;
  }
}

// Schema compatibility testing
export async function handleCompatibilityCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  console.log('🔗 Running schema compatibility testing...');
  console.log('This will test schema compatibility across different versions.\n');

  try {
    const res = await api.request('GET', '/api/schema/compatibility');
    if (res.ok) {
      const result = await res.json();
      console.log('✅ Schema compatibility testing completed');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Schema compatibility testing failed: ${res.status}`);
    }
  } catch (error) {
    logError('CLI: Compatibility command failed', {
      component: 'ValidationCommands',
      operation: 'compatibility_command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Comprehensive schema test suite
export async function handleComprehensiveCommand(context: CommandContext): Promise<void> {
  const { api } = context;

  console.log('🎯 Running comprehensive schema test suite...');
  console.log('This will run all schema validation tests comprehensively.\n');

  try {
    const res = await api.request('GET', '/api/schema/comprehensive-test');
    if (res.ok) {
      const result = await res.json();
      console.log('✅ Comprehensive schema test suite completed');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Comprehensive schema test suite failed: ${res.status}`);
    }
  } catch (error) {
    logError('CLI: Comprehensive command failed', {
      component: 'ValidationCommands',
      operation: 'comprehensive_command',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Export all validation command handlers
export const validationCommands = {
  schema: handleSchemaCommand,
  consistency: handleConsistencyCommand,
  interactive: handleInteractiveCommand,
  transform: handleTransformCommand,
  compatibility: handleCompatibilityCommand,
  comprehensive: handleComprehensiveCommand,
};
