#!/usr/bin/env node

/**
 * TypeScript Compilation Performance Monitor
 * Monitors and optimizes TypeScript compilation performance
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TSPerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.memoryUsage = [];
    this.checkInterval = null;
  }

  startMonitoring() {
    console.log('🚀 Starting TypeScript compilation performance monitoring...\n');

    this.checkInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsage.push({
        timestamp: Date.now(),
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      });
    }, 1000);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    const duration = Date.now() - this.startTime;
    const maxMemory = Math.max(...this.memoryUsage.map(m => m.heapUsed));

    console.log('\n📊 TypeScript Compilation Performance Report:');
    console.log('='.repeat(50));
    console.log(`⏱️  Total Duration: ${Math.round(duration / 1000)}s`);
    console.log(`🧠 Peak Memory Usage: ${maxMemory}MB`);
    console.log(`📈 Memory Efficiency: ${this.calculateMemoryEfficiency()}%`);

    if (maxMemory > 2048) {
      console.log('⚠️  High memory usage detected. Consider:');
      console.log('   - Increasing Node.js memory limit: --max-old-space-size=8192');
      console.log('   - Using tsconfig.build.json for optimized compilation');
      console.log('   - Running incremental builds: tsc --build');
    }

    if (duration > 60000) {
      // 1 minute
      console.log('⚠️  Slow compilation detected. Consider:');
      console.log('   - Using --skipLibCheck flag');
      console.log('   - Excluding unnecessary files in tsconfig');
      console.log('   - Using project references for incremental compilation');
    }
  }

  calculateMemoryEfficiency() {
    if (this.memoryUsage.length === 0) return 100;

    const avgMemory =
      this.memoryUsage.reduce((sum, m) => sum + m.heapUsed, 0) / this.memoryUsage.length;
    const maxMemory = Math.max(...this.memoryUsage.map(m => m.heapUsed));

    return Math.round((avgMemory / maxMemory) * 100);
  }

  async runTypeCheck() {
    this.startMonitoring();

    try {
      console.log('🔍 Running optimized TypeScript compilation...\n');

      // Run with optimized settings
      const result = execSync(
        'NODE_OPTIONS="--max-old-space-size=4096" npx tsc -p tsconfig.build.json --noEmit --skipLibCheck',
        {
          stdio: 'inherit',
          timeout: 300000, // 5 minutes timeout
        }
      );

      console.log('\n✅ TypeScript compilation completed successfully!');
      return true;
    } catch (error) {
      console.log('\n❌ TypeScript compilation failed');
      console.log('Error:', error.message);
      return false;
    } finally {
      this.stopMonitoring();
    }
  }

  generateRecommendations() {
    console.log('\n💡 Performance Optimization Recommendations:');
    console.log('='.repeat(50));

    const recommendations = [
      '1. Use npm run type-check:fast for quick checks during development',
      '2. Use npm run type-check:incremental for full project builds',
      '3. Consider excluding test files during development builds',
      '4. Use --skipLibCheck to skip type checking of declaration files',
      '5. Enable incremental compilation with --incremental flag',
      '6. Use project references to build only changed parts',
      '7. Consider using SWC or esbuild for faster transpilation',
    ];

    recommendations.forEach(rec => console.log(`   ${rec}`));
  }
}

// CLI interface
async function main() {
  const monitor = new TSPerformanceMonitor();

  if (process.argv.includes('--help')) {
    console.log('TypeScript Performance Monitor');
    console.log('Usage: node scripts/ts-performance.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help          Show this help message');
    console.log('  --recommendations  Show optimization recommendations');
    console.log('  --check-only       Run type check without monitoring');
    return;
  }

  if (process.argv.includes('--recommendations')) {
    monitor.generateRecommendations();
    return;
  }

  if (process.argv.includes('--check-only')) {
    console.log('Running TypeScript type check...');
    const success = await monitor.runTypeCheck();
    process.exit(success ? 0 : 1);
    return;
  }

  // Default: run with monitoring
  await monitor.runTypeCheck();
  monitor.generateRecommendations();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TSPerformanceMonitor;




