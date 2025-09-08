#!/usr/bin/env node

/**
 * "Any" Implementation Summary & Action Plan
 * Provides actionable insights for fixing "any" types
 */

const fs = require('fs');

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function main() {
  console.log(`${colors.bold}${colors.cyan}📋 "ANY" IMPLEMENTATION SUMMARY & ACTION PLAN${colors.reset}\n`);

  // Check if detailed report exists
  if (!fs.existsSync('any-implementation-report.json')) {
    console.log(`${colors.yellow}⚠️  Detailed report not found. Run: node scripts/detect-any-implementations.js${colors.reset}`);
    return;
  }

  const report = JSON.parse(fs.readFileSync('any-implementation-report.json', 'utf8'));

  console.log(`${colors.bold}📊 CURRENT STATUS${colors.reset}`);
  console.log(`${colors.red}Total Files with "any" types: ${report.summary.totalFiles}${colors.reset}`);
  console.log(`${colors.yellow}Total "any" implementations: ${report.summary.totalAnyCount}${colors.reset}`);
  console.log(`${colors.red}Critical files: ${report.summary.criticalFiles}${colors.reset}`);
  console.log(`${colors.magenta}High priority files: ${report.summary.highPriorityFiles}${colors.reset}\n`);

  // Priority-based action plan
  console.log(`${colors.bold}🎯 PRIORITY-BASED ACTION PLAN${colors.reset}\n`);

  // Phase 1: Critical Infrastructure
  const criticalFiles = report.results.filter(r => r.criticality.includes('CRITICAL'));
  const topCritical = criticalFiles.slice(0, 10);

  console.log(`${colors.bold}${colors.red}PHASE 1: CRITICAL INFRASTRUCTURE (${topCritical.length} files)${colors.reset}`);
  console.log(`${colors.yellow}Focus: Core libraries, API routes, authentication, security${colors.reset}\n`);

  topCritical.forEach((file, index) => {
    const patterns = Object.entries(file.patterns)
      .filter(([, count]) => count > 0)
      .map(([pattern, count]) => `${pattern}(${count})`)
      .join(', ');

    console.log(`${index + 1}. ${colors.red}${file.file}${colors.reset}`);
    console.log(`   ${colors.yellow}${file.totalAnyCount} any types${colors.reset} - ${patterns}`);
    console.log(`   ${colors.cyan}Priority: Fix typeAnnotation and typeAssertions first${colors.reset}\n`);
  });

  // Phase 2: High Priority Components
  const highFiles = report.results.filter(r => r.criticality.includes('HIGH'));
  const topHigh = highFiles.slice(0, 10);

  console.log(`${colors.bold}${colors.magenta}PHASE 2: HIGH PRIORITY COMPONENTS (${topHigh.length} files)${colors.reset}`);
  console.log(`${colors.yellow}Focus: Services, components, hooks, features${colors.reset}\n`);

  topHigh.forEach((file, index) => {
    const patterns = Object.entries(file.patterns)
      .filter(([, count]) => count > 0)
      .map(([pattern, count]) => `${pattern}(${count})`)
      .join(', ');

    console.log(`${index + 1}. ${colors.magenta}${file.file}${colors.reset}`);
    console.log(`   ${colors.yellow}${file.totalAnyCount} any types${colors.reset} - ${patterns}\n`);
  });

  // Pattern-specific recommendations
  console.log(`${colors.bold}🔧 PATTERN-SPECIFIC FIXES${colors.reset}\n`);

  const patternFixes = {
    typeAnnotation: {
      description: 'Variable/parameter type annotations',
      fix: 'Create proper interfaces and types',
      example: 'const data: any → const data: UserData',
      priority: 'HIGH'
    },
    typeAssertions: {
      description: 'Type assertions with "as any"',
      fix: 'Use proper type guards and interfaces',
      example: 'data as any → data as UserData',
      priority: 'HIGH'
    },
    recordTypes: {
      description: 'Record<string, any> types',
      fix: 'Use Record<string, unknown> or specific interfaces',
      example: 'Record<string, any> → Record<string, unknown>',
      priority: 'MEDIUM'
    },
    arrayTypes: {
      description: 'Array<any> or any[] types',
      fix: 'Define proper array element types',
      example: 'any[] → UserData[]',
      priority: 'MEDIUM'
    },
    functionParams: {
      description: 'Function parameters with any',
      fix: 'Create proper parameter interfaces',
      example: 'function(data: any) → function(data: UserData)',
      priority: 'HIGH'
    },
    interfaceProperties: {
      description: 'Interface properties with any',
      fix: 'Define specific property types',
      example: 'interface User { data: any } → interface User { data: UserData }',
      priority: 'HIGH'
    }
  };

  Object.entries(patternFixes).forEach(([pattern, info]) => {
    const count = report.patternStats[pattern] || 0;
    if (count > 0) {
      const priorityColor = info.priority === 'HIGH' ? colors.red : colors.yellow;
      console.log(`${priorityColor}${pattern} (${count} occurrences):${colors.reset}`);
      console.log(`  ${colors.cyan}Description:${colors.reset} ${info.description}`);
      console.log(`  ${colors.green}Fix:${colors.reset} ${info.fix}`);
      console.log(`  ${colors.blue}Example:${colors.reset} ${info.example}`);
      console.log(`  ${priorityColor}Priority:${colors.reset} ${info.priority}\n`);
    }
  });

  // Quick wins
  console.log(`${colors.bold}⚡ QUICK WINS (Low effort, high impact)${colors.reset}\n`);
  console.log(`${colors.green}1. Replace Record<string, any> with Record<string, unknown>${colors.reset}`);
  console.log(`${colors.green}2. Fix typeAssertions in error handling${colors.reset}`);
  console.log(`${colors.green}3. Add proper return types to functions${colors.reset}`);
  console.log(`${colors.green}4. Create interfaces for API response objects${colors.reset}`);
  console.log(`${colors.green}5. Fix any[] to proper array types${colors.reset}\n`);

  // Tools and commands
  console.log(`${colors.bold}🛠️  TOOLS & COMMANDS${colors.reset}\n`);
  console.log(`${colors.blue}Quick check:${colors.reset} node scripts/quick-any-check.js`);
  console.log(`${colors.blue}Detailed analysis:${colors.reset} node scripts/detect-any-implementations.js`);
  console.log(`${colors.blue}Type checking:${colors.reset} npm run type-check`);
  console.log(`${colors.blue}Linting:${colors.reset} npm run lint`);
  console.log(`${colors.blue}Search specific pattern:${colors.reset} grep -r "Record<string, any>" src/`);
  console.log(`${colors.blue}Search type assertions:${colors.reset} grep -r "as any" src/`);
  console.log(`${colors.blue}Search type annotations:${colors.reset} grep -r ": any" src/`);

  // Progress tracking
  const estimatedTotal = report.summary.totalAnyCount;
  const estimatedTime = Math.ceil(estimatedTotal / 10); // 10 fixes per hour estimate

  console.log(`\n${colors.bold}📈 ESTIMATED EFFORT${colors.reset}`);
  console.log(`${colors.yellow}Total fixes needed: ${estimatedTotal}${colors.reset}`);
  console.log(`${colors.yellow}Estimated time: ${estimatedTime} hours${colors.reset}`);
  console.log(`${colors.yellow}Recommended approach: 2-3 files per day${colors.reset}`);
  console.log(`${colors.yellow}Target completion: ${Math.ceil(estimatedTotal / 20)} days${colors.reset}\n`);

  console.log(`${colors.bold}${colors.green}✅ Ready to start fixing! Begin with Phase 1 critical files.${colors.reset}`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
