#!/usr/bin/env node

/**
 * UI Bridge Compliance Verification Script
 *
 * Verifies that UI components are using the new bridge architecture
 * and core patterns established in the bridge migration.
 *
 * @author PosalPro Development Team
 * @version 2.0.0
 * @since 2024-01-01
 */

const fs = require('fs');
const path = require('path');

// ====================
// Configuration
// ====================

const UI_COMPONENTS_DIR = 'src/components';
const BRIDGE_DIR = 'src/lib/bridges';
const HOOKS_DIR = 'src/hooks';

// ====================
// Compliance Patterns
// ====================

const BRIDGE_COMPLIANCE_PATTERNS = {
  // Bridge Usage Patterns
  BRIDGE_IMPORTS: /import.*ManagementBridge|import.*ApiBridge/,
  BRIDGE_HOOKS: /use\w+ManagementBridge|use\w+ApiBridge/,
  BRIDGE_CONTEXT: /ManagementBridgeProvider|BridgeProvider/,

  // Core Pattern Usage
  ERROR_HANDLING: /ErrorHandlingService|useErrorHandler/,
  ANALYTICS: /useOptimizedAnalytics|trackOptimized/,
  LOGGING: /logDebug|logInfo|logError/,
  SECURITY: /useAuth|ProtectedRoute/,

  // Forbidden Patterns (Old Architecture)
  OLD_API_CALLS: /fetch\(|axios\.|apiClient\.get\(|apiClient\.post\(/,
  OLD_STATE_MANAGEMENT: /useState.*loading|useState.*error/,
  OLD_ERROR_HANDLING: /console\.(log|error|warn)/,
  OLD_ANALYTICS: /analytics\.track\(|track\(/,
};

const COMPONENT_CATEGORIES = {
  BRIDGE_COMPONENTS: ['*Bridge.tsx', '*ManagementBridge.tsx'],
  LIST_COMPONENTS: ['*List.tsx', '*ListBridge.tsx'],
  FORM_COMPONENTS: ['*Form.tsx', '*FormBridge.tsx'],
  PAGE_COMPONENTS: ['*Page.tsx', '*PageBridge.tsx'],
  UI_COMPONENTS: ['ui/*.tsx', 'ui/**/*.tsx'],
};

// ====================
// Verification Functions
// ====================

function findComponentFiles() {
  const components = [];

  function scanDirectory(dir, category = 'general') {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath, category);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        components.push({
          path: filePath,
          category,
          filename: file,
          relativePath: path.relative(UI_COMPONENTS_DIR, filePath),
        });
      }
    });
  }

  // Scan the main components directory
  scanDirectory(UI_COMPONENTS_DIR);

  return components;
}

function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const analysis = {
    path: filePath,
    filename: path.basename(filePath),
    relativePath: path.relative(UI_COMPONENTS_DIR, filePath),
    compliance: {},
    issues: [],
    recommendations: [],
  };

  // Check Bridge Usage
  analysis.compliance.bridgeImports = BRIDGE_COMPLIANCE_PATTERNS.BRIDGE_IMPORTS.test(content);
  analysis.compliance.bridgeHooks = BRIDGE_COMPLIANCE_PATTERNS.BRIDGE_HOOKS.test(content);
  analysis.compliance.bridgeContext = BRIDGE_COMPLIANCE_PATTERNS.BRIDGE_CONTEXT.test(content);

  // Check Core Patterns
  analysis.compliance.errorHandling = BRIDGE_COMPLIANCE_PATTERNS.ERROR_HANDLING.test(content);
  analysis.compliance.analytics = BRIDGE_COMPLIANCE_PATTERNS.ANALYTICS.test(content);
  analysis.compliance.logging = BRIDGE_COMPLIANCE_PATTERNS.LOGGING.test(content);
  analysis.compliance.security = BRIDGE_COMPLIANCE_PATTERNS.SECURITY.test(content);

  // Check Forbidden Patterns
  analysis.compliance.noOldApiCalls = !BRIDGE_COMPLIANCE_PATTERNS.OLD_API_CALLS.test(content);
  analysis.compliance.noOldStateManagement =
    !BRIDGE_COMPLIANCE_PATTERNS.OLD_STATE_MANAGEMENT.test(content);
  analysis.compliance.noOldErrorHandling =
    !BRIDGE_COMPLIANCE_PATTERNS.OLD_ERROR_HANDLING.test(content);
  analysis.compliance.noOldAnalytics = !BRIDGE_COMPLIANCE_PATTERNS.OLD_ANALYTICS.test(content);

  // Generate Issues and Recommendations
  if (!analysis.compliance.bridgeImports && !analysis.compliance.bridgeHooks) {
    analysis.issues.push('Not using bridge architecture');
    analysis.recommendations.push('Import and use ManagementBridge or ApiBridge');
  }

  if (!analysis.compliance.errorHandling) {
    analysis.issues.push('Missing ErrorHandlingService integration');
    analysis.recommendations.push('Add ErrorHandlingService or useErrorHandler');
  }

  if (!analysis.compliance.analytics) {
    analysis.issues.push('Missing analytics integration');
    analysis.recommendations.push('Add useOptimizedAnalytics hook');
  }

  if (!analysis.compliance.logging) {
    analysis.issues.push('Missing structured logging');
    analysis.recommendations.push('Add logDebug/logInfo/logError calls');
  }

  if (!analysis.compliance.noOldApiCalls) {
    analysis.issues.push('Using old API call patterns');
    analysis.recommendations.push('Replace with bridge methods');
  }

  if (!analysis.compliance.noOldErrorHandling) {
    analysis.issues.push('Using console.* for error handling');
    analysis.recommendations.push('Replace with ErrorHandlingService');
  }

  return analysis;
}

function generateReport(analyses) {
  const report = {
    summary: {
      total: analyses.length,
      compliant: 0,
      nonCompliant: 0,
      bridgeComponents: 0,
      legacyComponents: 0,
    },
    categories: {},
    issues: {},
    recommendations: [],
  };

  analyses.forEach(analysis => {
    const isCompliant = analysis.issues.length === 0;
    if (isCompliant) {
      report.summary.compliant++;
    } else {
      report.summary.nonCompliant++;
    }

    if (analysis.filename.includes('Bridge')) {
      report.summary.bridgeComponents++;
    } else {
      report.summary.legacyComponents++;
    }

    // Categorize issues
    analysis.issues.forEach(issue => {
      report.issues[issue] = (report.issues[issue] || 0) + 1;
    });

    // Collect recommendations
    analysis.recommendations.forEach(rec => {
      if (!report.recommendations.includes(rec)) {
        report.recommendations.push(rec);
      }
    });
  });

  return report;
}

// ====================
// Main Execution
// ====================

console.log('🔍 UI Bridge Compliance Verification');
console.log('=====================================');
console.log('Verifying UI components are using new bridge architecture...\n');

const componentFiles = findComponentFiles();
console.log(`📁 Found ${componentFiles.length} UI components to analyze\n`);

const analyses = componentFiles.map(file => analyzeComponent(file.path));
const report = generateReport(analyses);

// ====================
// Report Output
// ====================

console.log('📊 COMPLIANCE SUMMARY');
console.log('=====================');
console.log(`Total Components: ${report.summary.total}`);
console.log(`✅ Compliant: ${report.summary.compliant}`);
console.log(`❌ Non-Compliant: ${report.summary.nonCompliant}`);
console.log(`🏗️ Bridge Components: ${report.summary.bridgeComponents}`);
console.log(`📜 Legacy Components: ${report.summary.legacyComponents}`);
console.log(
  `📈 Compliance Rate: ${((report.summary.compliant / report.summary.total) * 100).toFixed(1)}%\n`
);

if (Object.keys(report.issues).length > 0) {
  console.log('❌ ISSUES FOUND');
  console.log('===============');
  Object.entries(report.issues).forEach(([issue, count]) => {
    console.log(`- ${issue}: ${count} components`);
  });
  console.log('');
}

if (report.recommendations.length > 0) {
  console.log('💡 RECOMMENDATIONS');
  console.log('==================');
  report.recommendations.forEach(rec => {
    console.log(`- ${rec}`);
  });
  console.log('');
}

// Show non-compliant components
const nonCompliant = analyses.filter(a => a.issues.length > 0);
if (nonCompliant.length > 0) {
  console.log('🔧 NON-COMPLIANT COMPONENTS');
  console.log('===========================');
  nonCompliant.forEach(analysis => {
    console.log(`\n📄 ${analysis.relativePath}`);
    analysis.issues.forEach(issue => {
      console.log(`  ❌ ${issue}`);
    });
  });
  console.log('');
}

// Show bridge components
const bridgeComponents = analyses.filter(a => a.filename.includes('Bridge'));
if (bridgeComponents.length > 0) {
  console.log('✅ BRIDGE COMPONENTS');
  console.log('===================');
  bridgeComponents.forEach(analysis => {
    const status = analysis.issues.length === 0 ? '✅' : '⚠️';
    console.log(`${status} ${analysis.relativePath}`);
  });
  console.log('');
}

console.log('🎯 NEXT STEPS');
console.log('=============');
if (report.summary.compliant === report.summary.total) {
  console.log('🎉 All UI components are using the new bridge architecture!');
  console.log('✅ Bridge migration is complete and successful.');
} else {
  console.log('🔄 Bridge migration is in progress...');
  console.log(
    `📋 ${report.summary.nonCompliant} components need to be migrated to bridge architecture.`
  );
  console.log('💡 Focus on components with the most issues first.');
}

// Save detailed report
const detailedReport = {
  timestamp: new Date().toISOString(),
  summary: report.summary,
  analyses: analyses,
  issues: report.issues,
  recommendations: report.recommendations,
};

fs.writeFileSync('ui-bridge-compliance-report.json', JSON.stringify(detailedReport, null, 2));
console.log('\n📄 Detailed report saved to: ui-bridge-compliance-report.json');
