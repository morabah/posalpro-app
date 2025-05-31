#!/usr/bin/env node

/**
 * Code Quality Validation Script
 * Phase 1.5 - Development Scripts & Validation Tracking
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`),
};

class CodeQualityChecker {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      typescript: { passed: false, errors: 0, warnings: 0 },
      eslint: { passed: false, errors: 0, warnings: 0 },
      formatting: { passed: false, issues: 0 },
      imports: { passed: false, unused: 0, circular: 0 },
      coverage: { passed: false, percentage: 0 },
      performance: { passed: false, buildTime: 0, bundleSize: 0 },
    };
    this.metrics = {
      totalFiles: 0,
      totalLines: 0,
      complexity: 0,
    };
  }

  async run() {
    try {
      log.header('🔍 Code Quality Validation - Phase 1.5');
      console.log();

      // Run all quality checks
      await this.checkTypeScript();
      await this.checkESLint();
      await this.checkFormatting();
      await this.checkImports();
      await this.analyzeCodeMetrics();
      await this.checkPerformance();
      
      // Generate and display report
      this.generateReport();
      
      // Exit with appropriate code
      const overallPassed = this.isOverallQualityPassing();
      process.exit(overallPassed ? 0 : 1);
      
    } catch (error) {
      log.error(`Quality check failed: ${error.message}`);
      process.exit(1);
    }
  }

  async checkTypeScript() {
    log.info('Checking TypeScript compilation...');
    
    try {
      const { stdout, stderr } = await execAsync('npx tsc --noEmit --incremental false');
      
      if (stderr) {
        const errors = this.parseTypeScriptOutput(stderr);
        this.results.typescript.errors = errors.length;
        this.results.typescript.passed = false;
        
        if (errors.length > 0) {
          log.error(`TypeScript compilation failed with ${errors.length} error(s)`);
          errors.slice(0, 5).forEach(error => {
            console.log(`  ${colors.red}•${colors.reset} ${error}`);
          });
          if (errors.length > 5) {
            console.log(`  ${colors.yellow}... and ${errors.length - 5} more errors${colors.reset}`);
          }
        }
      } else {
        this.results.typescript.passed = true;
        log.success('TypeScript compilation passed');
      }
    } catch (error) {
      const errorOutput = error.stderr || error.stdout || error.message;
      const errors = this.parseTypeScriptOutput(errorOutput);
      this.results.typescript.errors = errors.length;
      this.results.typescript.passed = false;
      
      log.error(`TypeScript compilation failed with ${errors.length} error(s)`);
      if (errors.length > 0) {
        errors.slice(0, 3).forEach(error => {
          console.log(`  ${colors.red}•${colors.reset} ${error}`);
        });
      }
    }
  }

  async checkESLint() {
    log.info('Running ESLint validation...');
    
    try {
      const { stdout, stderr } = await execAsync('npx eslint src/ --format json');
      
      const results = JSON.parse(stdout);
      let totalErrors = 0;
      let totalWarnings = 0;
      
      results.forEach(file => {
        totalErrors += file.errorCount;
        totalWarnings += file.warningCount;
      });
      
      this.results.eslint.errors = totalErrors;
      this.results.eslint.warnings = totalWarnings;
      this.results.eslint.passed = totalErrors === 0;
      
      if (totalErrors === 0 && totalWarnings === 0) {
        log.success('ESLint validation passed');
      } else if (totalErrors === 0) {
        log.warning(`ESLint passed with ${totalWarnings} warning(s)`);
      } else {
        log.error(`ESLint failed with ${totalErrors} error(s) and ${totalWarnings} warning(s)`);
        
        // Show sample errors
        const filesWithErrors = results.filter(f => f.errorCount > 0).slice(0, 3);
        filesWithErrors.forEach(file => {
          console.log(`  ${colors.red}•${colors.reset} ${path.relative(process.cwd(), file.filePath)}`);
          file.messages.filter(m => m.severity === 2).slice(0, 2).forEach(msg => {
            console.log(`    Line ${msg.line}: ${msg.message}`);
          });
        });
      }
    } catch (error) {
      this.results.eslint.passed = false;
      log.error(`ESLint check failed: ${error.message}`);
    }
  }

  async checkFormatting() {
    log.info('Checking code formatting...');
    
    try {
      const { stdout } = await execAsync('npx prettier --list-different src/');
      
      if (stdout.trim()) {
        const unformattedFiles = stdout.trim().split('\n').filter(f => f);
        this.results.formatting.issues = unformattedFiles.length;
        this.results.formatting.passed = false;
        
        log.error(`${unformattedFiles.length} file(s) need formatting`);
        unformattedFiles.slice(0, 5).forEach(file => {
          console.log(`  ${colors.red}•${colors.reset} ${file}`);
        });
        
        if (unformattedFiles.length > 5) {
          console.log(`  ${colors.yellow}... and ${unformattedFiles.length - 5} more files${colors.reset}`);
        }
      } else {
        this.results.formatting.passed = true;
        log.success('Code formatting is consistent');
      }
    } catch (error) {
      if (error.code === 1 && error.stdout) {
        // Prettier found formatting issues
        const unformattedFiles = error.stdout.trim().split('\n').filter(f => f);
        this.results.formatting.issues = unformattedFiles.length;
        this.results.formatting.passed = false;
        
        log.error(`${unformattedFiles.length} file(s) need formatting`);
      } else {
        this.results.formatting.passed = false;
        log.error(`Formatting check failed: ${error.message}`);
      }
    }
  }

  async checkImports() {
    log.info('Analyzing import usage...');
    
    try {
      // This is a simplified import analysis
      // In a real implementation, you might use tools like madge or eslint-plugin-import
      const srcPath = path.join(process.cwd(), 'src');
      const files = this.getAllTypeScriptFiles(srcPath);
      
      let unusedImports = 0;
      let circularDeps = 0;
      
      // Simple check for unused imports (this is basic - real tools would be more sophisticated)
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const imports = content.match(/^import\s+.*from\s+['"].*['"];?$/gm) || [];
        
        // Very basic unused import detection
        imports.forEach(importLine => {
          const match = importLine.match(/import\s+(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))/);
          if (match) {
            const importedNames = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2] || match[3]];
            importedNames.forEach(name => {
              if (name && !content.includes(name.replace(/\s+as\s+\w+/, ''))) {
                unusedImports++;
              }
            });
          }
        });
      }
      
      this.results.imports.unused = unusedImports;
      this.results.imports.circular = circularDeps;
      this.results.imports.passed = unusedImports === 0 && circularDeps === 0;
      
      if (this.results.imports.passed) {
        log.success('Import analysis passed');
      } else {
        log.warning(`Found ${unusedImports} potentially unused import(s)`);
      }
    } catch (error) {
      this.results.imports.passed = false;
      log.error(`Import analysis failed: ${error.message}`);
    }
  }

  async analyzeCodeMetrics() {
    log.info('Analyzing code metrics...');
    
    try {
      const srcPath = path.join(process.cwd(), 'src');
      const files = this.getAllTypeScriptFiles(srcPath);
      
      this.metrics.totalFiles = files.length;
      
      let totalLines = 0;
      let complexityScore = 0;
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
        totalLines += lines;
        
        // Simple complexity calculation (count if/for/while/switch statements)
        const complexityMatches = content.match(/(if|for|while|switch|catch)\s*\(/g) || [];
        complexityScore += complexityMatches.length;
      });
      
      this.metrics.totalLines = totalLines;
      this.metrics.complexity = complexityScore;
      
      log.success(`Analyzed ${files.length} files (${totalLines} lines, complexity score: ${complexityScore})`);
    } catch (error) {
      log.error(`Code metrics analysis failed: ${error.message}`);
    }
  }

  async checkPerformance() {
    log.info('Checking build performance...');
    
    try {
      const buildStart = Date.now();
      
      // Run a build to check performance (removed --dry-run as it's not supported)
      await execAsync('npx next build', { timeout: 60000 });
      
      const buildTime = Date.now() - buildStart;
      this.results.performance.buildTime = buildTime;
      this.results.performance.passed = buildTime < 30000; // 30 seconds threshold
      
      if (this.results.performance.passed) {
        log.success(`Build performance check passed (${buildTime}ms)`);
      } else {
        log.warning(`Build took ${buildTime}ms (target: <30s)`);
      }
    } catch (error) {
      this.results.performance.passed = false;
      log.error(`Performance check failed: ${error.message}`);
    }
  }

  parseTypeScriptOutput(output) {
    if (!output) return [];
    
    const lines = output.split('\n');
    const errors = [];
    
    lines.forEach(line => {
      if (line.includes('error TS') || line.includes('Error:')) {
        errors.push(line.trim());
      }
    });
    
    return errors;
  }

  getAllTypeScriptFiles(dir) {
    const files = [];
    
    const traverse = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          traverse(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath);
        }
      });
    };
    
    traverse(dir);
    return files;
  }

  generateReport() {
    const elapsed = Date.now() - this.startTime;
    
    console.log();
    log.header('📊 Code Quality Report');
    console.log();
    
    // Quality checks summary
    const checks = [
      { name: 'TypeScript Compilation', result: this.results.typescript },
      { name: 'ESLint Validation', result: this.results.eslint },
      { name: 'Code Formatting', result: this.results.formatting },
      { name: 'Import Analysis', result: this.results.imports },
      { name: 'Build Performance', result: this.results.performance },
    ];

    checks.forEach(check => {
      const status = check.result.passed ? '✓' : '✗';
      const color = check.result.passed ? colors.green : colors.red;
      console.log(`  ${color}${status}${colors.reset} ${check.name}`);
      
      // Show additional details
      if (check.name === 'TypeScript Compilation' && check.result.errors > 0) {
        console.log(`    ${colors.red}${check.result.errors} error(s)${colors.reset}`);
      } else if (check.name === 'ESLint Validation') {
        if (check.result.errors > 0 || check.result.warnings > 0) {
          console.log(`    ${colors.red}${check.result.errors} error(s)${colors.reset}, ${colors.yellow}${check.result.warnings} warning(s)${colors.reset}`);
        }
      } else if (check.name === 'Code Formatting' && check.result.issues > 0) {
        console.log(`    ${colors.red}${check.result.issues} file(s) need formatting${colors.reset}`);
      } else if (check.name === 'Import Analysis' && check.result.unused > 0) {
        console.log(`    ${colors.yellow}${check.result.unused} potentially unused import(s)${colors.reset}`);
      } else if (check.name === 'Build Performance') {
        console.log(`    Build time: ${this.results.performance.buildTime}ms`);
      }
    });

    console.log();
    
    // Code metrics
    log.header('📈 Code Metrics');
    console.log(`  Files analyzed: ${this.metrics.totalFiles}`);
    console.log(`  Total lines: ${this.metrics.totalLines}`);
    console.log(`  Complexity score: ${this.metrics.complexity}`);
    console.log();
    
    // Overall result
    const passedCount = checks.filter(c => c.result.passed).length;
    const totalCount = checks.length;
    
    if (passedCount === totalCount) {
      log.success(`All quality checks passed (${passedCount}/${totalCount}) in ${elapsed}ms`);
    } else {
      log.error(`${passedCount}/${totalCount} quality checks passed in ${elapsed}ms`);
    }
    
    console.log();
  }

  isOverallQualityPassing() {
    return Object.values(this.results).every(result => result.passed);
  }
}

// Run the quality checker
if (require.main === module) {
  const checker = new CodeQualityChecker();
  checker.run().catch((error) => {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = CodeQualityChecker; 