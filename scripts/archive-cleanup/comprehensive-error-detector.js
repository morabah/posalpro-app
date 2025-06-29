#!/usr/bin/env node

/**
 * PosalPro MVP2 - Comprehensive Error Detection
 * Detects performance issues, infinite loops, memory leaks, and other critical errors
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveErrorDetector {
  constructor() {
    this.results = {
      infiniteLoops: [],
      memoryLeaks: [],
      performanceIssues: [],
      typeErrors: [],
      securityIssues: [],
      accessibilityIssues: [],
    };
    this.checkedFiles = 0;
  }

  async detect() {
    console.log('🔍 PosalPro MVP2 - Comprehensive Error Detection\n');

    try {
      // 1. TypeScript compilation check
      await this.checkTypeScript();
      
      // 2. Infinite loop detection
      await this.detectInfiniteLoops();
      
      // 3. Memory leak detection
      await this.detectMemoryLeaks();
      
      // 4. Performance issue detection
      await this.detectPerformanceIssues();
      
      // 5. Security vulnerability scan
      await this.detectSecurityIssues();
      
      // 6. Accessibility issues
      await this.detectAccessibilityIssues();
      
      // 7. Generate comprehensive report
      this.generateReport();

    } catch (error) {
      console.error('❌ Detection failed:', error.message);
    }
  }

  async checkTypeScript() {
    console.log('🔧 Checking TypeScript compilation...');
    
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      console.log('  ✅ TypeScript: No compilation errors');
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const errors = output.split('\n').filter(line => line.includes('error TS'));
      
      this.results.typeErrors = errors.map(error => ({
        type: 'typescript',
        severity: 'HIGH',
        message: error.trim(),
        file: this.extractFileName(error),
      }));
      
      console.log(`  ❌ TypeScript: ${errors.length} compilation errors found`);
    }
  }

  async detectInfiniteLoops() {
    console.log('🔄 Detecting infinite loops...');
    
    const patterns = {
      useEffectWithUnstableDeps: /useEffect\s*\([^,]+,\s*\[[^\]]*(?:analytics|apiClient|errorHandlingService|fetch\w+)[^\]]*\]/g,
      setStateInUseEffect: /useEffect\s*\([^}]*setState[^}]*\)/g,
      missingDependencies: /useEffect\s*\([^,]+,\s*\[\s*\]\s*\)/g,
    };

    await this.scanWithPatterns('src', patterns, 'infiniteLoops');
    console.log(`  📊 Found ${this.results.infiniteLoops.length} potential infinite loop issues`);
  }

  async detectMemoryLeaks() {
    console.log('💾 Detecting memory leaks...');
    
    const patterns = {
      missingCleanup: /useEffect\s*\([^}]*(?:setInterval|setTimeout|addEventListener)[^}]*\}(?!\s*,\s*\[[^\]]*return)/g,
      unclearedIntervals: /setInterval\([^)]+\)(?![^}]*clearInterval)/g,
      unclearedTimeouts: /setTimeout\([^)]+\)(?![^}]*clearTimeout)/g,
      eventListenerLeak: /addEventListener\([^)]+\)(?![^}]*removeEventListener)/g,
    };

    await this.scanWithPatterns('src', patterns, 'memoryLeaks');
    console.log(`  📊 Found ${this.results.memoryLeaks.length} potential memory leak issues`);
  }

  async detectPerformanceIssues() {
    console.log('⚡ Detecting performance issues...');
    
    const patterns = {
      inlineObjectInRender: /return\s*[^}]*\{\s*[^}]*\}\s*(?=\}|;)/g,
      inlineFunctionInRender: /return\s*[^}]*\(\s*\)\s*=>\s*[^}]*(?=\}|;)/g,
      missingMemoization: /const\s+\w+\s*=\s*[^;]*\.map\([^)]*\)(?!\s*,\s*\[)/g,
      heavyComputationInRender: /return\s*[^}]*(?:JSON\.parse|JSON\.stringify|Object\.keys|Array\.from)[^}]*(?=\}|;)/g,
    };

    await this.scanWithPatterns('src', patterns, 'performanceIssues');
    console.log(`  �� Found ${this.results.performanceIssues.length} potential performance issues`);
  }

  async detectSecurityIssues() {
    console.log('🔒 Detecting security issues...');
    
    const patterns = {
      dangerouslySetInnerHTML: /dangerouslySetInnerHTML\s*=\s*\{\s*__html:/g,
      evalUsage: /eval\s*\(/g,
      documentWrite: /document\.write\s*\(/g,
      localStorageXSS: /localStorage\.setItem\([^)]*[^)]*\)/g,
    };

    await this.scanWithPatterns('src', patterns, 'securityIssues');
    console.log(`  📊 Found ${this.results.securityIssues.length} potential security issues`);
  }

  async detectAccessibilityIssues() {
    console.log('♿ Detecting accessibility issues...');
    
    const patterns = {
      missingAltText: /<img(?![^>]*alt\s*=)/g,
      missingAriaLabel: /<button(?![^>]*(?:aria-label|aria-labelledby))/g,
      missingFormLabels: /<input(?![^>]*(?:aria-label|aria-labelledby))(?![^>]*id\s*=\s*"[^"]*")(?![^<]*<label[^>]*for\s*=)/g,
      lowContrastColors: /(?:color|background-color)\s*:\s*#(?:ccc|ddd|eee)/g,
    };

    await this.scanWithPatterns('src', patterns, 'accessibilityIssues');
    console.log(`  📊 Found ${this.results.accessibilityIssues.length} potential accessibility issues`);
  }

  async scanWithPatterns(dir, patterns, resultKey) {
    const scanDir = (directory) => {
      const files = fs.readdirSync(directory, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(directory, file.name);
        
        if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
          scanDir(fullPath);
        } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
          this.analyzeFileWithPatterns(fullPath, patterns, resultKey);
        }
      }
    };

    scanDir(dir);
  }

  analyzeFileWithPatterns(filePath, patterns, resultKey) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(process.cwd(), filePath);
      this.checkedFiles++;

      for (const [patternName, pattern] of Object.entries(patterns)) {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            this.results[resultKey].push({
              file: relativePath,
              pattern: patternName,
              code: match.substring(0, 100) + (match.length > 100 ? '...' : ''),
              severity: this.getSeverity(patternName),
              line: this.getLineNumber(content, match),
              suggestion: this.getSuggestion(patternName),
            });
          });
        }
      }

    } catch (error) {
      // Skip files that can't be read
    }
  }

  getSeverity(patternName) {
    const highSeverity = [
      'useEffectWithUnstableDeps',
      'setStateInUseEffect',
      'unclearedIntervals',
      'evalUsage',
      'dangerouslySetInnerHTML',
    ];
    
    const mediumSeverity = [
      'missingCleanup',
      'inlineObjectInRender',
      'missingMemoization',
      'missingAltText',
      'missingAriaLabel',
    ];

    if (highSeverity.includes(patternName)) return 'HIGH';
    if (mediumSeverity.includes(patternName)) return 'MEDIUM';
    return 'LOW';
  }

  getSuggestion(patternName) {
    const suggestions = {
      useEffectWithUnstableDeps: 'Use useCallback/useMemo for dependencies',
      setStateInUseEffect: 'Add proper dependency array or conditional setState',
      missingCleanup: 'Add cleanup function in useEffect return',
      unclearedIntervals: 'Clear intervals in cleanup function',
      inlineObjectInRender: 'Move object outside render or use useMemo',
      missingMemoization: 'Use useMemo for expensive computations',
      dangerouslySetInnerHTML: 'Sanitize HTML content before rendering',
      missingAltText: 'Add alt attribute for accessibility',
      missingAriaLabel: 'Add aria-label for screen readers',
    };
    return suggestions[patternName] || 'Review and fix this pattern';
  }

  getLineNumber(content, searchString) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchString.substring(0, 30))) {
        return i + 1;
      }
    }
    return 'unknown';
  }

  extractFileName(errorString) {
    const match = errorString.match(/([^/\\]+\.tsx?)/);
    return match ? match[1] : 'unknown';
  }

  generateReport() {
    console.log('\n📋 Comprehensive Error Detection Report\n');

    const totalIssues = Object.values(this.results).reduce((sum, issues) => sum + issues.length, 0);
    
    if (totalIssues === 0) {
      console.log('✅ No critical issues detected! Application is ready for production.');
      return;
    }

    console.log('📊 Summary:');
    console.log(`   🔧 TypeScript Errors: ${this.results.typeErrors.length}`);
    console.log(`   🔄 Infinite Loop Issues: ${this.results.infiniteLoops.length}`);
    console.log(`   �� Memory Leak Issues: ${this.results.memoryLeaks.length}`);
    console.log(`   ⚡ Performance Issues: ${this.results.performanceIssues.length}`);
    console.log(`   🔒 Security Issues: ${this.results.securityIssues.length}`);
    console.log(`   ♿ Accessibility Issues: ${this.results.accessibilityIssues.length}`);
    console.log(`   📁 Files Scanned: ${this.checkedFiles}`);

    // Report critical issues first
    const criticalIssues = [];
    Object.entries(this.results).forEach(([category, issues]) => {
      const critical = issues.filter(issue => issue.severity === 'HIGH');
      if (critical.length > 0) {
        criticalIssues.push({ category, issues: critical });
      }
    });

    if (criticalIssues.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES (Must fix before production):');
      criticalIssues.forEach(({ category, issues }) => {
        console.log(`\n  ${category.toUpperCase()}:`);
        issues.slice(0, 5).forEach((issue, index) => {
          console.log(`    ${index + 1}. ${issue.file}:${issue.line}`);
          console.log(`       Pattern: ${issue.pattern}`);
          console.log(`       Fix: ${issue.suggestion}`);
        });
        if (issues.length > 5) {
          console.log(`    ... and ${issues.length - 5} more issues`);
        }
      });
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.checkedFiles,
        totalIssues,
        criticalIssues: criticalIssues.reduce((sum, cat) => sum + cat.issues.length, 0),
      },
      results: this.results,
    };

    fs.writeFileSync('comprehensive-error-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: comprehensive-error-report.json');

    // Exit with error code if critical issues found
    if (criticalIssues.length > 0) {
      console.log('\n❌ Critical issues found! Fix before deploying to production.');
      process.exit(1);
    } else {
      console.log('\n✅ No critical issues found. Application is ready for production!');
    }
  }
}

// CLI interface
if (require.main === module) {
  const detector = new ComprehensiveErrorDetector();
  detector.detect();
}

module.exports = { ComprehensiveErrorDetector };
