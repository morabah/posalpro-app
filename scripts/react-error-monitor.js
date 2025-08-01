#!/usr/bin/env node

/**
 * PosalPro MVP2 - React Error Monitor
 * Monitors for specific React performance issues during live application use
 * Targets the exact errors seen in production logs
 */

class ReactErrorMonitor {
  constructor() {
    this.errorCounts = {
      infiniteLoops: 0,
      fastRefreshIssues: 0,
      performanceSpam: 0,
      errorBoundaries: 0,
      useEffectIssues: 0
    };
    
    this.monitoring = false;
    this.startTime = Date.now();
    this.logBuffer = [];
    this.recentPerformanceLogs = [];
  }

  start() {
    console.log('🚀 Starting React Error Monitor...');
    console.log('📝 Monitoring for critical React performance issues...');
    console.log('⚠️  Run this while navigating your application manually');
    console.log('🔴 Press Ctrl+C to stop monitoring and generate report\n');
    
    this.monitoring = true;
    this.startTime = Date.now();
    
    // Set up process monitoring for console output
    this.setupConsoleMonitoring();
    
    // Set up graceful shutdown
    process.on('SIGINT', () => {
      this.stop();
    });
    
    // Show live monitoring status
    this.statusInterval = setInterval(() => {
      this.showStatus();
    }, 5000);
  }

  setupConsoleMonitoring() {
    // Override console methods to capture logs
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = (...args) => {
      const message = args.join(' ');
      this.analyzeLogMessage(message);
      originalConsoleLog.apply(console, args);
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      this.analyzeLogMessage(message);
      originalConsoleError.apply(console, args);
    };
    
    console.warn = (...args) => {
      const message = args.join(' ');
      this.analyzeLogMessage(message);
      originalConsoleWarn.apply(console, args);
    };
  }

  analyzeLogMessage(message) {
    if (!this.monitoring) return;
    
    const timestamp = Date.now();
    this.logBuffer.push({ message, timestamp });
    
    // 🚨 CRITICAL: Track React infinite loop errors
    if (message.includes('Maximum update depth exceeded')) {
      this.errorCounts.infiniteLoops++;
      console.log(`🚨 DETECTED: React infinite loop error #${this.errorCounts.infiniteLoops}`);
      
      // Extract component information
      if (message.includes('useAdvancedPerformanceOptimization')) {
        console.log('  📍 Location: useAdvancedPerformanceOptimization.ts');
      }
      if (message.includes('RealTimeAnalyticsOptimizer')) {
        console.log('  📍 Location: RealTimeAnalyticsOptimizer.tsx');
      }
    }
    
    // 🚨 CRITICAL: Track Fast Refresh issues
    if (message.includes('[Fast Refresh] performing full reload')) {
      this.errorCounts.fastRefreshIssues++;
      console.log(`⚠️ DETECTED: Fast Refresh full reload #${this.errorCounts.fastRefreshIssues}`);
      console.log('  💡 Cause: Component imported outside React rendering tree');
    }
    
    // 🚨 CRITICAL: Track performance monitoring spam
    if (message.includes('Enhanced performance monitoring') && 
        (message.includes('started') || message.includes('stopped'))) {
      this.recentPerformanceLogs.push(timestamp);
      
      // Check for spam (more than 20 events in 5 seconds)
      const fiveSecondsAgo = timestamp - 5000;
      this.recentPerformanceLogs = this.recentPerformanceLogs.filter(t => t > fiveSecondsAgo);
      
      if (this.recentPerformanceLogs.length > 20) {
        this.errorCounts.performanceSpam++;
        console.log(`🚨 DETECTED: Performance monitoring spam #${this.errorCounts.performanceSpam}`);
        console.log(`  📊 ${this.recentPerformanceLogs.length} events in 5 seconds`);
      }
    }
    
    // 🚨 CRITICAL: Track Error Boundary activations
    if (message.includes('Error Boundary Caught Error') || 
        message.includes('The above error occurred in the')) {
      this.errorCounts.errorBoundaries++;
      console.log(`🚨 DETECTED: Error Boundary activation #${this.errorCounts.errorBoundaries}`);
      
      if (message.includes('RealTimeAnalyticsOptimizer')) {
        console.log('  📍 Failed Component: RealTimeAnalyticsOptimizer');
      }
    }
    
    // 🚨 CRITICAL: Track useEffect dependency issues
    if (message.includes('useEffect either doesn\'t have a dependency array')) {
      this.errorCounts.useEffectIssues++;
      console.log(`🚨 DETECTED: useEffect dependency issue #${this.errorCounts.useEffectIssues}`);
    }
  }

  showStatus() {
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    console.log(`\n📊 MONITORING STATUS (${duration}s):`);
    console.log(`🚨 Infinite Loops: ${this.errorCounts.infiniteLoops}`);
    console.log(`⚠️ Fast Refresh Issues: ${this.errorCounts.fastRefreshIssues}`);
    console.log(`📈 Performance Spam: ${this.errorCounts.performanceSpam}`);
    console.log(`🛡️ Error Boundaries: ${this.errorCounts.errorBoundaries}`);
    console.log(`🔄 useEffect Issues: ${this.errorCounts.useEffectIssues}`);
    console.log(`📝 Total Log Messages: ${this.logBuffer.length}\n`);
  }

  stop() {
    console.log('\n🛑 Stopping React Error Monitor...');
    this.monitoring = false;
    
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
    
    this.generateReport();
    process.exit(0);
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const totalErrors = Object.values(this.errorCounts).reduce((sum, count) => sum + count, 0);
    
    const report = {
      timestamp: new Date().toISOString(),
      sessionDuration: Math.floor(duration / 1000),
      errorCounts: this.errorCounts,
      totalErrors,
      severity: this.calculateSeverity(),
      recommendations: this.generateRecommendations(),
      logSummary: {
        totalMessages: this.logBuffer.length,
        messagesPerSecond: Math.round((this.logBuffer.length / duration) * 1000)
      }
    };
    
    // Save report
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '..', 'react-error-monitor-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 REACT ERROR MONITORING REPORT');
    console.log('==================================');
    console.log(`⏱️  Session Duration: ${report.sessionDuration} seconds`);
    console.log(`🚨 Total Critical Errors: ${totalErrors}`);
    console.log(`📊 Severity Level: ${report.severity}`);
    
    if (totalErrors > 0) {
      console.log('\n🔍 ERROR BREAKDOWN:');
      Object.entries(this.errorCounts).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`  ${this.getErrorIcon(type)} ${type}: ${count}`);
        }
      });
      
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    } else {
      console.log('✅ No critical React errors detected during monitoring session');
    }
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }

  getErrorIcon(type) {
    const icons = {
      infiniteLoops: '🚨',
      fastRefreshIssues: '⚠️',
      performanceSpam: '📈',
      errorBoundaries: '🛡️',
      useEffectIssues: '🔄'
    };
    return icons[type] || '❓';
  }

  calculateSeverity() {
    const { infiniteLoops, errorBoundaries, useEffectIssues, fastRefreshIssues, performanceSpam } = this.errorCounts;
    
    if (infiniteLoops > 0 || errorBoundaries > 0 || useEffectIssues > 0) {
      return 'CRITICAL';
    } else if (fastRefreshIssues > 0 || performanceSpam > 0) {
      return 'HIGH';
    } else {
      return 'LOW';
    }
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.errorCounts.infiniteLoops > 0) {
      recommendations.push('🚨 CRITICAL: Fix React infinite loops in useAdvancedPerformanceOptimization.ts:501 and RealTimeAnalyticsOptimizer.tsx:434 - add proper dependency arrays to useEffect hooks');
    }
    
    if (this.errorCounts.errorBoundaries > 0) {
      recommendations.push('🚨 CRITICAL: React components are crashing - investigate RealTimeAnalyticsOptimizer component for state management issues');
    }
    
    if (this.errorCounts.useEffectIssues > 0) {
      recommendations.push('🚨 CRITICAL: Add dependency arrays to useEffect hooks to prevent infinite re-renders');
    }
    
    if (this.errorCounts.fastRefreshIssues > 0) {
      recommendations.push('⚠️ HIGH: Fix Fast Refresh issues - ensure all React components are properly exported and not mixed with non-React exports');
    }
    
    if (this.errorCounts.performanceSpam > 0) {
      recommendations.push('⚠️ HIGH: Reduce performance monitoring frequency - current implementation causes excessive logging overhead');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ No critical issues detected - application performance monitoring looks healthy');
    }
    
    return recommendations;
  }
}

// Start monitoring if script is run directly
if (require.main === module) {
  const monitor = new ReactErrorMonitor();
  monitor.start();
}

module.exports = ReactErrorMonitor; 