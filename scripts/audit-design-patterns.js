#!/usr/bin/env node

/**
 * PosalPro MVP2 - Design Patterns Audit Script
 * Comprehensive audit to identify code not following established design patterns
 *
 * Usage: npm run audit:patterns
 *
 * This script audits:
 * 1. Singleton Pattern Compliance
 * 2. Design System Usage
 * 3. Error Handling Patterns
 * 4. Provider Pattern Usage
 * 5. Hook Pattern Compliance
 * 6. Component Architecture Patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Audit results storage
const auditResults = {
  singleton: { compliant: [], nonCompliant: [], recommendations: [] },
  designSystem: { compliant: [], nonCompliant: [], recommendations: [] },
  errorHandling: { compliant: [], nonCompliant: [], recommendations: [] },
  providers: { compliant: [], nonCompliant: [], recommendations: [] },
  hooks: { compliant: [], nonCompliant: [], recommendations: [] },
  components: { compliant: [], nonCompliant: [], recommendations: [] },
  summary: { total: 0, compliant: 0, nonCompliant: 0, score: 0 }
};

/**
 * Utility functions
 */
function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSection(message) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`  ${message}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

/**
 * File discovery utilities
 */
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules, .git, and other non-source directories
        if (!['node_modules', '.git', '.next', 'dist', 'build', 'coverage'].includes(item)) {
          traverse(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Singleton Pattern Audit
 */
function auditSingletonPattern(files) {
  logSection('Singleton Pattern Audit');

  const singletonPatterns = [
    /private static instance:/,
    /static getInstance\(\):/,
    /if \(!.*\.instance\)/,
    /.*\.instance = new/
  ];

  const nonSingletonPatterns = [
    /new \w+\(\)/g,
    /export class \w+ {/g
  ];

  let singletonCompliant = 0;
  let singletonNonCompliant = 0;

  for (const file of files) {
    if (file.includes('src/lib/') || file.includes('src/services/') || file.includes('src/hooks/')) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      // Check if file implements singleton pattern
      const hasSingletonPattern = singletonPatterns.every(pattern => pattern.test(content));
      const hasNewInstantiations = nonSingletonPatterns.some(pattern => {
        const matches = content.match(pattern);
        return matches && matches.length > 0;
      });

      if (hasSingletonPattern) {
        auditResults.singleton.compliant.push({
          file,
          pattern: 'Singleton Pattern',
          details: 'Properly implements singleton with private static instance and getInstance()'
        });
        singletonCompliant++;
      } else if (hasNewInstantiations && content.includes('class ') && content.includes('export')) {
        auditResults.singleton.nonCompliant.push({
          file,
          pattern: 'Missing Singleton Pattern',
          details: 'Class with new instantiations should use singleton pattern',
          recommendation: 'Implement singleton pattern with private static instance and getInstance() method'
        });
        singletonNonCompliant++;
      }
    }
  }

  logSuccess(`Singleton Pattern: ${singletonCompliant} compliant, ${singletonNonCompliant} non-compliant`);

  // Add recommendations
  if (singletonNonCompliant > 0) {
    auditResults.singleton.recommendations.push(
      'Implement singleton pattern for service classes in src/lib/ and src/services/',
      'Use private static instance and public static getInstance() method',
      'Follow ErrorHandlingService pattern as reference'
    );
  }
}

/**
 * Design System Usage Audit
 */
function auditDesignSystemUsage(files) {
  logSection('Design System Usage Audit');

  const designSystemComponents = [
    'Card', 'Button', 'Badge', 'Input', 'Select', 'Textarea',
    'Checkbox', 'Radio', 'Switch', 'Tabs', 'Modal', 'Tooltip',
    'Alert', 'Toast', 'Avatar', 'Breadcrumbs', 'Table', 'Pagination'
  ];

  const manualStylingPatterns = [
    /bg-white border border-gray-200 rounded-lg/,
    /bg-blue-600 hover:bg-blue-700/,
    /bg-gray-600 hover:bg-gray-700/,
    /bg-red-600 hover:bg-red-700/,
    /border border-gray-300 rounded-md/,
    /px-4 py-2 text-sm font-medium rounded-md/
  ];

  let designSystemCompliant = 0;
  let designSystemNonCompliant = 0;

  for (const file of files) {
    if (file.includes('src/app/') || file.includes('src/components/')) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for design system component usage
      const usesDesignSystem = designSystemComponents.some(component =>
        content.includes(`from '@/components/ui/${component}'`) ||
        content.includes(`from '@/components/ui/forms/${component}'`)
      );

      // Check for manual styling patterns
      const hasManualStyling = manualStylingPatterns.some(pattern => pattern.test(content));

      if (usesDesignSystem && !hasManualStyling) {
        auditResults.designSystem.compliant.push({
          file,
          pattern: 'Design System Usage',
          details: 'Uses design system components and avoids manual styling'
        });
        designSystemCompliant++;
      } else if (hasManualStyling) {
        auditResults.designSystem.nonCompliant.push({
          file,
          pattern: 'Manual Styling Detected',
          details: 'Uses manual Tailwind classes instead of design system components',
          recommendation: 'Replace manual styling with design system components from @/components/ui/'
        });
        designSystemNonCompliant++;
      }
    }
  }

  logSuccess(`Design System: ${designSystemCompliant} compliant, ${designSystemNonCompliant} non-compliant`);

  // Add recommendations
  if (designSystemNonCompliant > 0) {
    auditResults.designSystem.recommendations.push(
      'Replace manual Tailwind classes with design system components',
      'Use Card component instead of bg-white border border-gray-200 rounded-lg',
      'Use Button component with variants instead of manual button styling',
      'Import components from @/components/ui/ and @/components/ui/forms/',
      'Use design tokens from @/design-system/tokens'
    );
  }
}

/**
 * Error Handling Pattern Audit
 */
function auditErrorHandling(files) {
  logSection('Error Handling Pattern Audit');

  const errorHandlingPatterns = [
    /ErrorHandlingService\.getInstance\(\)/,
    /useErrorHandler/,
    /processError\(/,
    /StandardError/,
    /ErrorCodes/
  ];

  const antiPatterns = [
    /console\.error\(/,
    /throw new Error\(/,
    /catch \(error\) {/,
    /\.catch\(/
  ];

  let errorHandlingCompliant = 0;
  let errorHandlingNonCompliant = 0;

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    // Check for proper error handling
    const usesErrorHandling = errorHandlingPatterns.some(pattern => pattern.test(content));
    const hasAntiPatterns = antiPatterns.some(pattern => pattern.test(content));

    if (usesErrorHandling && !hasAntiPatterns) {
      auditResults.errorHandling.compliant.push({
        file,
        pattern: 'Error Handling Pattern',
        details: 'Uses ErrorHandlingService and standardized error handling'
      });
      errorHandlingCompliant++;
    } else if (hasAntiPatterns) {
      auditResults.errorHandling.nonCompliant.push({
        file,
        pattern: 'Non-Standard Error Handling',
        details: 'Uses console.error or direct error throwing instead of ErrorHandlingService',
        recommendation: 'Use ErrorHandlingService.getInstance().processError() for all error handling'
      });
      errorHandlingNonCompliant++;
    }
  }

  logSuccess(`Error Handling: ${errorHandlingCompliant} compliant, ${errorHandlingNonCompliant} non-compliant`);

  // Add recommendations
  if (errorHandlingNonCompliant > 0) {
    auditResults.errorHandling.recommendations.push(
      'Replace console.error with ErrorHandlingService.getInstance().processError()',
      'Use useErrorHandler hook in React components',
      'Use StandardError and ErrorCodes for consistent error handling',
      'Follow the established error handling patterns from CORE_REQUIREMENTS.md'
    );
  }
}

/**
 * Provider Pattern Audit
 */
function auditProviderPattern(files) {
  logSection('Provider Pattern Audit');

  const providerPatterns = [
    /Provider/,
    /createContext/,
    /useContext/,
    /Context\.Provider/
  ];

  let providerCompliant = 0;
  let providerNonCompliant = 0;

  for (const file of files) {
    if (file.includes('src/components/providers/') || file.includes('src/app/')) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for provider pattern usage
      const usesProviderPattern = providerPatterns.some(pattern => pattern.test(content));

      if (usesProviderPattern) {
        auditResults.providers.compliant.push({
          file,
          pattern: 'Provider Pattern',
          details: 'Uses React Context and Provider pattern'
        });
        providerCompliant++;
      } else if (content.includes('useState') && content.includes('export')) {
        auditResults.providers.nonCompliant.push({
          file,
          pattern: 'Missing Provider Pattern',
          details: 'Component with state should use Provider pattern for global state',
          recommendation: 'Implement Provider pattern for global state management'
        });
        providerNonCompliant++;
      }
    }
  }

  logSuccess(`Provider Pattern: ${providerCompliant} compliant, ${providerNonCompliant} non-compliant`);
}

/**
 * Hook Pattern Audit
 */
function auditHookPattern(files) {
  logSection('Hook Pattern Audit');

  const hookPatterns = [
    /use[A-Z][a-zA-Z]*/,
    /export function use/,
    /export const use/
  ];

  const customHooks = [
    'useApiClient', 'useAuth', 'useErrorHandler', 'useOptimizedAnalytics',
    'useTierSettings', 'usePerformanceOptimization'
  ];

  let hookCompliant = 0;
  let hookNonCompliant = 0;

  for (const file of files) {
    if (file.includes('src/hooks/')) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for hook pattern usage
      const usesHookPattern = hookPatterns.some(pattern => pattern.test(content));
      const isCustomHook = customHooks.some(hook => content.includes(hook));

      if (usesHookPattern || isCustomHook) {
        auditResults.hooks.compliant.push({
          file,
          pattern: 'Hook Pattern',
          details: 'Properly implements custom React hook'
        });
        hookCompliant++;
      } else {
        auditResults.hooks.nonCompliant.push({
          file,
          pattern: 'Non-Hook Pattern',
          details: 'File in hooks directory should implement hook pattern',
          recommendation: 'Implement proper React hook pattern with use prefix'
        });
        hookNonCompliant++;
      }
    }
  }

  logSuccess(`Hook Pattern: ${hookCompliant} compliant, ${hookNonCompliant} non-compliant`);
}

/**
 * Component Architecture Audit
 */
function auditComponentArchitecture(files) {
  logSection('Component Architecture Audit');

  const componentPatterns = [
    /export.*function/,
    /export.*const/,
    /interface.*Props/,
    /forwardRef/,
    /memo\(/
  ];

  const antiPatterns = [
    /any/,
    /console\.log/,
    /innerHTML/,
    /dangerouslySetInnerHTML/
  ];

  let componentCompliant = 0;
  let componentNonCompliant = 0;

  for (const file of files) {
    if (file.includes('src/components/') && !file.includes('src/components/ui/')) {
      const content = fs.readFileSync(file, 'utf8');

      // Check for component patterns
      const usesComponentPattern = componentPatterns.some(pattern => pattern.test(content));
      const hasAntiPatterns = antiPatterns.some(pattern => pattern.test(content));

      if (usesComponentPattern && !hasAntiPatterns) {
        auditResults.components.compliant.push({
          file,
          pattern: 'Component Architecture',
          details: 'Follows proper component architecture patterns'
        });
        componentCompliant++;
      } else if (hasAntiPatterns) {
        auditResults.components.nonCompliant.push({
          file,
          pattern: 'Component Anti-Patterns',
          details: 'Uses anti-patterns like any types or console.log',
          recommendation: 'Remove any types, console.log, and other anti-patterns'
        });
        componentNonCompliant++;
      }
    }
  }

  logSuccess(`Component Architecture: ${componentCompliant} compliant, ${componentNonCompliant} non-compliant`);
}

/**
 * Generate detailed report
 */
function generateReport() {
  logHeader('DESIGN PATTERNS AUDIT REPORT');

  // Calculate summary
  const categories = ['singleton', 'designSystem', 'errorHandling', 'providers', 'hooks', 'components'];

  for (const category of categories) {
    const compliant = auditResults[category].compliant.length;
    const nonCompliant = auditResults[category].nonCompliant.length;
    const total = compliant + nonCompliant;

    auditResults.summary.total += total;
    auditResults.summary.compliant += compliant;
    auditResults.summary.nonCompliant += nonCompliant;
  }

  auditResults.summary.score = auditResults.summary.total > 0
    ? Math.round((auditResults.summary.compliant / auditResults.summary.total) * 100)
    : 0;

  // Print summary
  logSection('AUDIT SUMMARY');
  log(`Total Files Audited: ${auditResults.summary.total}`, 'white');
  log(`Compliant: ${auditResults.summary.compliant}`, 'green');
  log(`Non-Compliant: ${auditResults.summary.nonCompliant}`, 'red');
  log(`Compliance Score: ${auditResults.summary.score}%`, auditResults.summary.score >= 80 ? 'green' : 'yellow');

  // Print detailed results
  for (const category of categories) {
    const results = auditResults[category];

    if (results.nonCompliant.length > 0) {
      logSection(`${category.toUpperCase()} - NON-COMPLIANT FILES`);

      for (const item of results.nonCompliant) {
        logError(`${path.relative(process.cwd(), item.file)}`);
        logInfo(`  Pattern: ${item.pattern}`);
        logInfo(`  Details: ${item.details}`);
        if (item.recommendation) {
          logWarning(`  Recommendation: ${item.recommendation}`);
        }
      }

      if (results.recommendations.length > 0) {
        logSection(`${category.toUpperCase()} - RECOMMENDATIONS`);
        for (const rec of results.recommendations) {
          logInfo(`• ${rec}`);
        }
      }
    }
  }

  // Print compliance files
  logSection('COMPLIANT FILES (GOOD EXAMPLES)');
  for (const category of categories) {
    const results = auditResults[category];
    if (results.compliant.length > 0) {
      logInfo(`${category.toUpperCase()}:`);
      for (const item of results.compliant.slice(0, 3)) { // Show first 3 examples
        logSuccess(`  ${path.relative(process.cwd(), item.file)}`);
      }
      if (results.compliant.length > 3) {
        logInfo(`  ... and ${results.compliant.length - 3} more`);
      }
    }
  }

  // Print action items
  if (auditResults.summary.nonCompliant > 0) {
    logSection('ACTION ITEMS');
    logWarning('1. Review non-compliant files and implement recommended patterns');
    logWarning('2. Update CORE_REQUIREMENTS.md with any new patterns discovered');
    logWarning('3. Add new patterns to LESSONS_LEARNED.md');
    logWarning('4. Create migration plan for non-compliant files');
    logWarning('5. Run audit again after implementing fixes');
  } else {
    logSuccess('🎉 All files are compliant with established design patterns!');
  }

  // Save report to file
  const reportPath = path.join(process.cwd(), 'audit-design-patterns-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  logInfo(`\nDetailed report saved to: ${reportPath}`);
}

/**
 * Main audit function
 */
function runAudit() {
  try {
    logHeader('POSALPRO MVP2 - DESIGN PATTERNS AUDIT');
    logInfo('Scanning codebase for design pattern compliance...');

    // Find all relevant files
    const sourceDir = path.join(process.cwd(), 'src');
    const files = findFiles(sourceDir);

    logInfo(`Found ${files.length} files to audit`);

    // Run all audits
    auditSingletonPattern(files);
    auditDesignSystemUsage(files);
    auditErrorHandling(files);
    auditProviderPattern(files);
    auditHookPattern(files);
    auditComponentArchitecture(files);

    // Generate report
    generateReport();

    // Exit with appropriate code
    process.exit(auditResults.summary.nonCompliant > 0 ? 1 : 0);

  } catch (error) {
    logError(`Audit failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  runAudit();
}

module.exports = { runAudit, auditResults };
