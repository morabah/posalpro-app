#!/usr/bin/env node

/**
 * 🧹 POSALPRO MVP2 - COMPREHENSIVE SCRIPT CLEANUP
 * Analyzes and removes redundant scripts while preserving essential functionality
 * Based on existing CLEANUP_REDUNDANT_FILES.md analysis
 */

const fs = require('fs');
const path = require('path');

class ScriptCleanupManager {
  constructor() {
    this.scriptsDir = 'scripts';
    this.analysis = {
      total: 0,
      toDelete: [],
      toKeep: [],
      toMerge: [],
      empty: [],
      redundant: [],
      essential: []
    };
    this.backupDir = 'scripts/archive-cleanup';
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]}[CLEANUP] ${message}${colors.reset}`);
  }

  async analyzeScripts() {
    this.log('🔍 Analyzing all scripts for redundancy...', 'info');
    
    const files = fs.readdirSync(this.scriptsDir).filter(f => 
      f.endsWith('.js') && !f.includes('cleanup-redundant-scripts')
    );
    
    this.analysis.total = files.length;
    
    for (const file of files) {
      const filePath = path.join(this.scriptsDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const analysis = {
        name: file,
        size: stats.size,
        lines: content.split('\n').length,
        isEmpty: content.trim().length === 0,
        isRedundant: this.checkRedundancy(file, content),
        category: this.categorizeScript(file, content)
      };
      
      this.categorizeForCleanup(analysis);
    }
    
    this.logAnalysisResults();
  }

  checkRedundancy(filename, content) {
    // Check for empty or minimal files
    if (content.trim().length < 50) return 'empty';
    
    // Check for specific redundant patterns
    const redundantPatterns = [
      'debug-auth',
      'test-auth',
      'manual-auth',
      'simple-',
      'quick-',
      'basic-'
    ];
    
    return redundantPatterns.some(pattern => filename.includes(pattern)) ? 'redundant' : false;
  }

  categorizeScript(filename, content) {
    // Essential scripts (referenced in package.json or core functionality)
    const essential = [
      'dev-clean.sh',
      'deploy.sh',
      'update-version-history.js',
      'deployment-info.js',
      'audit-duplicates.js',
      'setup-production.sh',
      'demo-port-management.sh',
      'comprehensive-real-world-test.js'
    ];
    
    if (essential.includes(filename)) return 'essential';
    
    // Performance scripts
    if (filename.includes('performance') || filename.includes('optimization')) {
      return 'performance';
    }
    
    // Testing scripts
    if (filename.includes('test') || filename.includes('verify')) {
      return 'testing';
    }
    
    // Database scripts
    if (filename.includes('database') || filename.includes('db')) {
      return 'database';
    }
    
    // Auth scripts
    if (filename.includes('auth')) {
      return 'auth';
    }
    
    // Fix/repair scripts
    if (filename.includes('fix') || filename.includes('repair')) {
      return 'fix';
    }
    
    return 'misc';
  }

  categorizeForCleanup(analysis) {
    if (analysis.isEmpty) {
      this.analysis.empty.push(analysis);
      this.analysis.toDelete.push(analysis);
    } else if (analysis.isRedundant) {
      this.analysis.redundant.push(analysis);
      this.analysis.toDelete.push(analysis);
    } else if (analysis.category === 'essential') {
      this.analysis.essential.push(analysis);
      this.analysis.toKeep.push(analysis);
    } else {
      // Further analysis needed
      this.analyzeForMerging(analysis);
    }
  }

  analyzeForMerging(analysis) {
    // Specific files to delete (redundant/outdated)
    const redundantFiles = [
      'test-performance-violations.js',
      'simple-performance-test.js', 
      'enhanced-performance-test.js',
      'quick-performance-test.js',
      'fix-performance-violations.js',
      'emergency-performance-fix.js',
      'apply-performance-optimizations.js',
      'performance-monitor.js',
      'performance-enhancement.js',
      'fix-performance-issues.js',
      'performance-optimizer.js',
      'verify-infinite-loop-fixes-final.js',
      'fix-validation-dashboard.js',
      'validate-imports.js',
      'fix-infinite-loops.js',
      'final-performance-validation.js',
      'critical-performance-fix.js',
      'button-response-test.js',
      'database-performance-optimization.js',
      'quick-status-check.js',
      'verify-fixes.js',
      'comprehensive-auth-performance-fix.js',
      'comprehensive-codebase-fix.js',
      'smart-bottleneck-test.js',
      'apply-critical-fixes.js',
      'bottleneck-detection-fix-cycle.js',
      'error-detection-and-fix.js',
      'auth-enhancement-fix.js',
      'quick-fix-remaining-issues.js',
      'pre-production-test.js',
      'comprehensive-error-detector.js',
      'detect-infinite-loops.js',
      'fix-all-imports.js',
      'verify-infinite-loop-fixes.js',
      'fix-remaining-infinite-loops.js',
      'optimize-database-performance.js'
    ];

    if (redundantFiles.includes(analysis.name)) {
      this.analysis.toDelete.push(analysis);
      this.analysis.redundant.push(analysis);
    } else {
      this.analysis.toKeep.push(analysis);
    }
  }

  logAnalysisResults() {
    this.log('\n📊 SCRIPT ANALYSIS RESULTS', 'info');
    this.log(`Total Scripts: ${this.analysis.total}`, 'info');
    this.log(`To Delete: ${this.analysis.toDelete.length}`, 'warning');
    this.log(`To Keep: ${this.analysis.toKeep.length}`, 'success');
    this.log(`Empty Files: ${this.analysis.empty.length}`, 'error');
    this.log(`Redundant: ${this.analysis.redundant.length}`, 'warning');
    this.log(`Essential: ${this.analysis.essential.length}`, 'success');
    
    this.log('\n🗑️  FILES TO DELETE:', 'warning');
    this.analysis.toDelete.forEach(script => {
      const reason = script.isEmpty ? '(empty)' : 
                   script.isRedundant ? '(redundant)' : '(consolidated)';
      this.log(`  - ${script.name} ${reason}`, 'warning');
    });
    
    this.log('\n✅ ESSENTIAL FILES TO KEEP:', 'success');
    this.analysis.essential.forEach(script => {
      this.log(`  - ${script.name}`, 'success');
    });
  }

  async createBackup() {
    this.log('📦 Creating backup of scripts to be deleted...', 'info');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    for (const script of this.analysis.toDelete) {
      const sourcePath = path.join(this.scriptsDir, script.name);
      const backupPath = path.join(this.backupDir, script.name);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        this.log(`  Backed up: ${script.name}`, 'info');
      }
    }
    
    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      totalDeleted: this.analysis.toDelete.length,
      deletedFiles: this.analysis.toDelete.map(s => ({
        name: s.name,
        size: s.size,
        reason: s.isEmpty ? 'empty' : s.isRedundant ? 'redundant' : 'consolidated'
      }))
    };
    
    fs.writeFileSync(
      path.join(this.backupDir, 'cleanup-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  async performCleanup() {
    this.log('🧹 Performing cleanup...', 'warning');
    
    let deletedCount = 0;
    
    for (const script of this.analysis.toDelete) {
      const filePath = path.join(this.scriptsDir, script.name);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          this.log(`  Deleted: ${script.name}`, 'success');
          deletedCount++;
        } catch (error) {
          this.log(`  Failed to delete ${script.name}: ${error.message}`, 'error');
        }
      }
    }
    
    this.log(`\n✅ Cleanup completed! Deleted ${deletedCount} redundant scripts.`, 'success');
    
    // Update the README
    this.updateCleanupDocumentation(deletedCount);
  }

  updateCleanupDocumentation(deletedCount) {
    const summary = `# Script Cleanup Summary

**Date**: ${new Date().toISOString()}
**Deleted Scripts**: ${deletedCount}
**Backup Location**: ${this.backupDir}

## Cleanup Results

- **Total Scripts Analyzed**: ${this.analysis.total}
- **Scripts Deleted**: ${this.analysis.toDelete.length}
- **Scripts Kept**: ${this.analysis.toKeep.length}
- **Empty Files Removed**: ${this.analysis.empty.length}
- **Redundant Files Removed**: ${this.analysis.redundant.length}

## Essential Scripts Preserved

${this.analysis.essential.map(s => `- ${s.name}`).join('\n')}

## Backup Information

All deleted scripts are backed up in \`${this.backupDir}\` with a manifest file for recovery if needed.

## Next Steps

1. Verify essential scripts still work: \`npm run dev:smart\`
2. Test deployment scripts: \`npm run deploy:dry-run\`
3. Check audit functionality: \`npm run audit:duplicates\`
`;

    fs.writeFileSync(path.join(this.scriptsDir, 'CLEANUP_SUMMARY.md'), summary);
    this.log(`📝 Created cleanup summary: scripts/CLEANUP_SUMMARY.md`, 'info');
  }

  async run() {
    try {
      this.log('🚀 Starting comprehensive script cleanup...', 'info');
      
      await this.analyzeScripts();
      
      if (this.analysis.toDelete.length === 0) {
        this.log('✅ No redundant scripts found. Cleanup not needed.', 'success');
        return;
      }
      
      await this.createBackup();
      await this.performCleanup();
      
      this.log('\n🎉 Script cleanup completed successfully!', 'success');
      this.log('💡 Run `npm run dev:smart` to verify everything still works.', 'info');
      
    } catch (error) {
      this.log(`❌ Cleanup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Execute cleanup
if (require.main === module) {
  const cleanup = new ScriptCleanupManager();
  cleanup.run();
}

module.exports = ScriptCleanupManager;
