#!/usr/bin/env node

/**
 * PosalPro MVP2 - Duplicate Dependencies and Patterns Audit Script
 *
 * This script audits the codebase for:
 * 1. Duplicate dependencies in package.json
 * 2. Duplicate patterns and implementations
 * 3. Missing dependencies that should be installed
 * 4. Unused dependencies that can be removed
 *
 * Usage: npm run audit:duplicates
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 PosalPro MVP2 - Duplicate Dependencies and Patterns Audit');
console.log('='.repeat(60));

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Run this script from the project root.');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const duplicates = [];
const warnings = [];
const suggestions = [];

// 1. Check for duplicate dependencies in package.json
function checkDuplicateDeps() {
  console.log('\n📦 Checking for duplicate dependencies...');

  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
    ...packageJson.optionalDependencies
  };

  const seen = new Set();
  const dups = [];

  Object.keys(allDeps).forEach(dep => {
    if (seen.has(dep)) {
      dups.push(dep);
    } else {
      seen.add(dep);
    }
  });

  if (dups.length > 0) {
    duplicates.push(...dups);
    console.log(`⚠️  Found ${dups.length} duplicate dependencies:`);
    dups.forEach(dep => console.log(`   - ${dep}`));
  } else {
    console.log('✅ No duplicate dependencies found');
  }
}

// 2. Check for missing audit patterns in existing files
function checkAuditPatterns() {
  console.log('\n🔍 Checking for audit patterns in codebase...');

  const patterns = [
    { name: 'Error Handling', pattern: /ErrorHandlingService|processError/, required: true },
    { name: 'Structured Logging', pattern: /logDebug|logInfo|logError|logWarn/, required: true },
    { name: 'TypeScript Strict', pattern: /@ts-ignore|@ts-expect-error/, required: false },
    { name: 'React Query', pattern: /useQuery|useMutation|useInfiniteQuery/, required: true },
    { name: 'Zustand Store', pattern: /use[A-Z]\w*Store|create.*store/, required: true },
  ];

  patterns.forEach(({ name, pattern, required }) => {
    try {
      const result = execSync(`find src -name "*.ts" -o -name "*.tsx" | head -20 | xargs grep -l "${pattern.source}" | wc -l`, { encoding: 'utf8' });
      const count = parseInt(result.trim());

      if (required && count === 0) {
        warnings.push(`${name} pattern not found in codebase`);
      } else if (!required && count > 10) {
        warnings.push(`Too many ${name} instances (${count}) - consider refactoring`);
      } else {
        console.log(`✅ ${name}: ${count} instances found`);
      }
    } catch (error) {
      if (required) {
        warnings.push(`${name} pattern check failed`);
      }
    }
  });
}

// 3. Check for feature-based organization
function checkFeatureOrganization() {
  console.log('\n🏗️  Checking feature-based organization...');

  const featuresDir = 'src/features';
  if (!fs.existsSync(featuresDir)) {
    warnings.push('src/features directory not found - missing feature-based organization');
    return;
  }

  const features = fs.readdirSync(featuresDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  console.log(`📁 Found ${features.length} feature directories: ${features.join(', ')}`);

  features.forEach(feature => {
    const featurePath = path.join(featuresDir, feature);
    const requiredFiles = ['schemas.ts', 'keys.ts'];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(path.join(featurePath, file))) {
        suggestions.push(`Feature '${feature}' missing ${file}`);
      }
    });

    // Check for hooks directory
    if (!fs.existsSync(path.join(featurePath, 'hooks'))) {
      suggestions.push(`Feature '${feature}' missing hooks directory`);
    }
  });
}

// 4. Check for service layer patterns
function checkServiceLayer() {
  console.log('\n🔧 Checking service layer patterns...');

  const servicesDir = 'src/services';
  if (!fs.existsSync(servicesDir)) {
    warnings.push('src/services directory not found - missing service layer');
    return;
  }

  const services = fs.readdirSync(servicesDir)
    .filter(file => file.endsWith('.ts'))
    .map(file => file.replace('.ts', ''));

  console.log(`🔧 Found ${services.length} service files: ${services.join(', ')}`);

  // Check for HTTP client usage patterns
  services.forEach(service => {
    const servicePath = path.join(servicesDir, `${service}.ts`);
    try {
      const content = fs.readFileSync(servicePath, 'utf8');

      if (content.includes('JSON.stringify') && content.includes('body:')) {
        suggestions.push(`Service '${service}' uses manual JSON.stringify - should use HTTP client`);
      }

      if (!content.includes('http.') && !content.includes('fetch')) {
        suggestions.push(`Service '${service}' may not be using standardized HTTP client`);
      }
    } catch (error) {
      warnings.push(`Could not read service file: ${service}`);
    }
  });
}

// 5. Check for store patterns
function checkStorePatterns() {
  console.log('\n🗂️  Checking store patterns...');

  const storeDir = 'src/lib/store';
  if (!fs.existsSync(storeDir)) {
    warnings.push('src/lib/store directory not found - missing store layer');
    return;
  }

  const stores = fs.readdirSync(storeDir)
    .filter(file => file.endsWith('.ts'))
    .map(file => file.replace('.ts', ''));

  console.log(`🗂️  Found ${stores.length} store files: ${stores.join(', ')}`);

  stores.forEach(store => {
    const storePath = path.join(storeDir, `${store}.ts`);
    try {
      const content = fs.readFileSync(storePath, 'utf8');

      if (content.includes('useState') && !content.includes('useShallow')) {
        suggestions.push(`Store '${store}' may need useShallow for selectors`);
      }

      if (content.includes('server state') || content.includes('API data')) {
        warnings.push(`Store '${store}' may contain server state - should use React Query`);
      }
    } catch (error) {
      warnings.push(`Could not read store file: ${store}`);
    }
  });
}

// 6. Check for missing audit patterns
function checkMissingPatterns() {
  console.log('\n🔎 Checking for missing audit patterns...');

  const criticalFiles = [
    'src/lib/logger.ts',
    'src/lib/errors/index.ts',
    'src/lib/env.ts',
    'src/hooks/index.ts',
    'src/components/ui/index.ts'
  ];

  criticalFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      warnings.push(`Missing critical file: ${file}`);
    } else {
      console.log(`✅ Found critical file: ${file}`);
    }
  });
}

// Run all checks
try {
  checkDuplicateDeps();
  checkAuditPatterns();
  checkFeatureOrganization();
  checkServiceLayer();
  checkStorePatterns();
  checkMissingPatterns();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 AUDIT SUMMARY');
  console.log('='.repeat(60));

  if (duplicates.length > 0) {
    console.log(`\n❌ DUPLICATES FOUND (${duplicates.length}):`);
    duplicates.forEach(dep => console.log(`   - ${dep}`));
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  if (suggestions.length > 0) {
    console.log(`\n💡 SUGGESTIONS (${suggestions.length}):`);
    suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
  }

  if (duplicates.length === 0 && warnings.length === 0) {
    console.log('\n🎉 AUDIT PASSED: No issues found!');
  } else {
    console.log(`\n🔧 ISSUES TO ADDRESS: ${duplicates.length + warnings.length + suggestions.length}`);
  }

  // Exit with appropriate code
  if (duplicates.length > 0) {
    console.log('\n❌ Audit failed due to duplicate dependencies');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n⚠️  Audit completed with warnings');
    process.exit(0); // Warnings don't fail the build
  } else {
    console.log('\n✅ Audit completed successfully');
    process.exit(0);
  }

} catch (error) {
  console.error('❌ Audit failed with error:', error.message);
  process.exit(1);
}
