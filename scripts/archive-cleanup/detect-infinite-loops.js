#!/usr/bin/env node

/**
 * PosalPro MVP2 - Infinite Loop Detection Script
 * Comprehensive analysis to detect potential infinite re-render issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class InfiniteLoopDetector {
  constructor() {
    this.issues = [];
    this.checkedFiles = 0;
    this.patterns = {
      // Dangerous patterns that can cause infinite loops
      useEffectWithUnstableDeps: /useEffect\s*\(\s*[^,]+,\s*\[[^\]]*(?:analytics|apiClient|errorHandlingService|fetch\w+|get\w+Info|update\w+|refresh\w+)[^\]]*\]/g,
      useEffectWithFunctionDeps: /useEffect\s*\(\s*[^,]+,\s*\[[^\]]*\(\s*\)\s*=>[^\]]*\]/g,
      setStateInUseEffect: /useEffect\s*\(\s*[^}]*setState[^}]*\}/g,
      useCallbackMissing: /const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*setState[^}]*\}(?!\s*,\s*\[)/g,
      directObjectInDeps: /useEffect\s*\(\s*[^,]+,\s*\[[^\]]*\{[^\]]*\]/g,
    };
  }

  async scan() {
    console.log('🔍 PosalPro MVP2 - Infinite Loop Detection\n');

    try {
      // 1. Scan all React components and hooks
      await this.scanDirectory('src');
      
      // 2. Check for specific problematic patterns
      await this.analyzePatterns();
      
      // 3. Generate report
      this.generateReport();

      console.log(`\n✅ Scan completed! Checked ${this.checkedFiles} files.`);
      
    } catch (error) {
      console.error('❌ Scan failed:', error.message);
    }
  }

  async scanDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        await this.scanDirectory(fullPath);
      } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
        await this.analyzeFile(fullPath);
      }
    }
  }

  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.checkedFiles++;

      // Skip files without React hooks
      if (!content.includes('useEffect') && !content.includes('useState')) {
        return;
      }

      const relativePath = path.relative(process.cwd(), filePath);
      
      // Check each pattern
      for (const [patternName, pattern] of Object.entries(this.patterns)) {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            this.issues.push({
              file: relativePath,
              pattern: patternName,
              code: match.substring(0, 100) + (match.length > 100 ? '...' : ''),
              severity: this.getSeverity(patternName),
              line: this.getLineNumber(content, match),
            });
          });
        }
      }

      // Specific checks for known problematic components
      if (filePath.includes('AnalyticsStorageMonitor')) {
        this.checkAnalyticsStorageMonitor(content, relativePath);
      }

    } catch (error) {
      console.warn(`⚠️  Could not analyze ${filePath}: ${error.message}`);
    }
  }

  checkAnalyticsStorageMonitor(content, filePath) {
    // Check for the specific issue we just fixed
    if (content.includes('}, [getStorageInfo])') && !content.includes('useCallback')) {
      this.issues.push({
        file: filePath,
        pattern: 'analyticsStorageMonitorIssue',
        code: 'useEffect with unstable getStorageInfo dependency',
        severity: 'HIGH',
        line: this.getLineNumber(content, 'getStorageInfo'),
      });
    }
  }

  getSeverity(patternName) {
    const severityMap = {
      useEffectWithUnstableDeps: 'HIGH',
      useEffectWithFunctionDeps: 'HIGH',
      setStateInUseEffect: 'MEDIUM',
      useCallbackMissing: 'MEDIUM',
      directObjectInDeps: 'MEDIUM',
      analyticsStorageMonitorIssue: 'CRITICAL',
    };
    return severityMap[patternName] || 'LOW';
  }

  getLineNumber(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString.substring(0, 50))) {
        return i + 1;
      }
    }
    return 'unknown';
  }

  async analyzePatterns() {
    console.log('🔍 Analyzing problematic patterns...\n');

    // Group issues by severity
    const critical = this.issues.filter(i => i.severity === 'CRITICAL');
    const high = this.issues.filter(i => i.severity === 'HIGH');
    const medium = this.issues.filter(i => i.severity === 'MEDIUM');

    console.log(`📊 Pattern Analysis Results:`);
    console.log(`   🔴 Critical: ${critical.length} issues`);
    console.log(`   🟠 High: ${high.length} issues`);
    console.log(`   🟡 Medium: ${medium.length} issues`);
    console.log(`   📁 Files scanned: ${this.checkedFiles}`);
  }

  generateReport() {
    console.log('\n📋 Detailed Issue Report:\n');

    if (this.issues.length === 0) {
      console.log('✅ No infinite loop issues detected!');
      return;
    }

    // Group by severity
    const groupedIssues = this.issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});

    // Report by severity
    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(severity => {
      if (groupedIssues[severity]) {
        console.log(`\n🔴 ${severity} ISSUES (${groupedIssues[severity].length}):`);
        groupedIssues[severity].forEach((issue, index) => {
          console.log(`\n  ${index + 1}. ${issue.file}:${issue.line}`);
          console.log(`     Pattern: ${issue.pattern}`);
          console.log(`     Code: ${issue.code}`);
          console.log(`     Fix: ${this.getSuggestion(issue.pattern)}`);
        });
      }
    });

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.checkedFiles,
        totalIssues: this.issues.length,
        critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
        high: this.issues.filter(i => i.severity === 'HIGH').length,
        medium: this.issues.filter(i => i.severity === 'MEDIUM').length,
      },
      issues: this.issues,
    };

    fs.writeFileSync('infinite-loop-detection-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: infinite-loop-detection-report.json');
  }

  getSuggestion(pattern) {
    const suggestions = {
      useEffectWithUnstableDeps: 'Use useCallback/useMemo for functions/objects in dependencies',
      useEffectWithFunctionDeps: 'Move function outside useEffect or wrap with useCallback',
      setStateInUseEffect: 'Ensure setState calls are conditional or use proper dependencies',
      useCallbackMissing: 'Wrap function with useCallback to prevent recreation',
      directObjectInDeps: 'Use useMemo for objects in dependency arrays',
      analyticsStorageMonitorIssue: 'Use useCallback for getStorageInfo function',
    };
    return suggestions[pattern] || 'Review dependency array for stability';
  }

  // Quick check method for CI/CD
  static async quickCheck() {
    console.log('⚡ Quick Infinite Loop Check...\n');
    
    const detector = new InfiniteLoopDetector();
    await detector.scanDirectory('src');
    
    const critical = detector.issues.filter(i => i.severity === 'CRITICAL');
    const high = detector.issues.filter(i => i.severity === 'HIGH');
    
    if (critical.length > 0) {
      console.log(`❌ CRITICAL: ${critical.length} infinite loop issues found`);
      critical.forEach(issue => {
        console.log(`   ${issue.file}:${issue.line} - ${issue.pattern}`);
      });
      process.exit(1);
    } else if (high.length > 0) {
      console.log(`⚠️  HIGH: ${high.length} potential infinite loop issues found`);
      console.log('   Run full scan for details: node scripts/detect-infinite-loops.js');
    } else {
      console.log('✅ No critical infinite loop issues detected');
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    InfiniteLoopDetector.quickCheck();
  } else {
    const detector = new InfiniteLoopDetector();
    detector.scan();
  }
}

module.exports = { InfiniteLoopDetector };
