#!/usr/bin/env node

/**
 * Bridge Template Testing Script
 * 
 * Tests updated bridge templates against common implementation issues:
 * - Array safety patterns
 * - Context error handling
 * - Infinite loop prevention
 * - Hydration error fixes
 * - API response format handling
 * - Authentication error handling
 */

const fs = require('fs');
const path = require('path');

// Test patterns for common issues
const CRITICAL_PATTERNS = {
  // Array Safety Tests
  ARRAY_SAFETY: {
    'Array.isArray check': /Array\.isArray\([^)]+\)/g,
    'Safe array access': /\?\.\s*length|\.length\s*\?\s*/g,
    'Array wrapping': /\[\s*[^[\]]*\s*\]/g,
    'Fallback empty array': /\|\|\s*\[\]/g,
  },
  
  // Context Error Handling Tests
  CONTEXT_SAFETY: {
    'User null check': /!user\s*&&|user\s*\?/g,
    'Session validation': /session\?\./g,
    'Auth state check': /requireAuth/g,
    'Fallback error handling': /catch\s*\([^)]*\)\s*{[^}]*fallback/gi,
  },
  
  // Infinite Loop Prevention Tests
  INFINITE_LOOP_PREVENTION: {
    'Empty dependency arrays': /useEffect\([^,]*,\s*\[\s*\]/g,
    'Deferred calls': /setTimeout\([^,]*,\s*0\)/g,
    'Stable callbacks': /useCallback\(/g,
    'Memoized values': /useMemo\(/g,
  },
  
  // Hydration Error Prevention Tests
  HYDRATION_SAFETY: {
    'No client detection': /(?!.*\/\/).*isClient|typeof window/g,
    'SSR safe rendering': /loading.*\?/g,
    'Progressive enhancement': /useEffect.*\[\]/g,
  },
  
  // API Response Format Handling Tests
  API_RESPONSE_HANDLING: {
    'Response validation': /response.*typeof.*object/g,
    'Data wrapping': /response\s*=\s*{[^}]*success.*data/g,
    'Format handling': /flattened.*response/gi,
    'Error format check': /Invalid.*response.*format/g,
  },
  
  // Authentication Error Handling Tests
  AUTH_ERROR_HANDLING: {
    'Auth error detection': /token.*expired|permission.*access|unauthorized|session/gi,
    'User-friendly messages': /Please.*log.*in|Authentication.*required/gi,
    'Error categorization': /isAuthError/g,
    'Fallback messaging': /fallback.*message/gi,
  }
};

// Anti-patterns to avoid
const ANTI_PATTERNS = {
  'Console logs': /console\.(log|warn|error|debug)/g,
  'Any types': /:\s*any\b/g,
  'Direct bridge calls in render': /(?!.*useEffect).*bridge\.[a-zA-Z]+\(/g,
  'Unstable dependencies': /useEffect.*\[.*\w+.*\]/g,
  'Client-only rendering': /typeof window !== ['"]undefined['"]/g,
};

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const results = {
    file: path.relative(process.cwd(), filePath),
    patterns: {},
    antiPatterns: {},
    score: 0,
    maxScore: 0,
    issues: [],
    improvements: []
  };

  // Test critical patterns
  Object.entries(CRITICAL_PATTERNS).forEach(([category, patterns]) => {
    results.patterns[category] = {};
    Object.entries(patterns).forEach(([name, regex]) => {
      const matches = content.match(regex) || [];
      results.patterns[category][name] = {
        found: matches.length,
        matches: matches.slice(0, 3) // Show first 3 matches
      };
      
      if (matches.length > 0) {
        results.score += 2;
        results.improvements.push(`✅ ${category}: ${name} implemented (${matches.length} instances)`);
      } else {
        results.issues.push(`❌ ${category}: Missing ${name}`);
      }
      results.maxScore += 2;
    });
  });

  // Test anti-patterns
  Object.entries(ANTI_PATTERNS).forEach(([name, regex]) => {
    const matches = content.match(regex) || [];
    results.antiPatterns[name] = {
      found: matches.length,
      matches: matches.slice(0, 3)
    };
    
    if (matches.length > 0) {
      results.issues.push(`⚠️ Anti-pattern found: ${name} (${matches.length} instances)`);
      results.score -= 1; // Penalty for anti-patterns
    }
  });

  return results;
}

function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 BRIDGE TEMPLATE COMPLIANCE REPORT');
  console.log('='.repeat(80));

  let totalScore = 0;
  let totalMaxScore = 0;
  let totalIssues = 0;
  let totalImprovements = 0;

  results.forEach(result => {
    const percentage = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
    const status = percentage >= 80 ? '🟢' : percentage >= 60 ? '🟡' : '🔴';
    
    console.log(`\n${status} ${result.file}`);
    console.log(`   Score: ${result.score}/${result.maxScore} (${percentage}%)`);
    
    if (result.improvements.length > 0) {
      console.log(`   Improvements (${result.improvements.length}):`);
      result.improvements.slice(0, 5).forEach(improvement => {
        console.log(`     ${improvement}`);
      });
      if (result.improvements.length > 5) {
        console.log(`     ... and ${result.improvements.length - 5} more`);
      }
    }
    
    if (result.issues.length > 0) {
      console.log(`   Issues (${result.issues.length}):`);
      result.issues.slice(0, 5).forEach(issue => {
        console.log(`     ${issue}`);
      });
      if (result.issues.length > 5) {
        console.log(`     ... and ${result.issues.length - 5} more`);
      }
    }

    totalScore += result.score;
    totalMaxScore += result.maxScore;
    totalIssues += result.issues.length;
    totalImprovements += result.improvements.length;
  });

  // Overall summary
  const overallPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  const overallStatus = overallPercentage >= 80 ? '🟢 EXCELLENT' : 
                       overallPercentage >= 60 ? '🟡 GOOD' : '🔴 NEEDS WORK';

  console.log('\n' + '='.repeat(80));
  console.log('📊 OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Status: ${overallStatus}`);
  console.log(`Overall Score: ${totalScore}/${totalMaxScore} (${overallPercentage}%)`);
  console.log(`Total Improvements: ${totalImprovements}`);
  console.log(`Total Issues: ${totalIssues}`);
  console.log(`Files Analyzed: ${results.length}`);

  // Recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  if (overallPercentage >= 80) {
    console.log('✅ Templates are well-implemented with critical fixes applied');
    console.log('✅ Ready for production use with minimal risk');
  } else if (overallPercentage >= 60) {
    console.log('⚠️ Templates have good coverage but need some improvements');
    console.log('⚠️ Address remaining issues before production deployment');
  } else {
    console.log('❌ Templates need significant improvements');
    console.log('❌ Critical patterns missing - high risk for implementation issues');
  }

  return {
    overallScore: overallPercentage,
    totalIssues,
    totalImprovements,
    filesAnalyzed: results.length
  };
}

// Main execution
function main() {
  const bridgeTemplateDir = path.join(process.cwd(), 'templates/design-patterns/bridge');
  
  if (!fs.existsSync(bridgeTemplateDir)) {
    console.error('❌ Bridge template directory not found:', bridgeTemplateDir);
    process.exit(1);
  }

  const templateFiles = [
    'api-bridge.template.ts',
    'management-bridge.template.tsx',
    'bridge-page.template.tsx'
  ].map(file => path.join(bridgeTemplateDir, file))
   .filter(file => fs.existsSync(file));

  if (templateFiles.length === 0) {
    console.error('❌ No bridge template files found');
    process.exit(1);
  }

  console.log('🧪 Testing bridge templates against common implementation issues...');
  console.log(`📁 Analyzing ${templateFiles.length} template files`);

  const results = templateFiles.map(analyzeFile);
  const summary = generateReport(results);

  // Exit with appropriate code
  process.exit(summary.overallScore >= 80 ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { analyzeFile, generateReport, CRITICAL_PATTERNS, ANTI_PATTERNS };
