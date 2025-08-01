/**
 * PosalPro MVP2 - Browser Console React Error Monitor
 * 
 * USAGE: 
 * 1. Open your browser's Developer Tools (F12)
 * 2. Go to the Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter to start monitoring
 * 5. Navigate your application normally
 * 6. Watch for error detections in the console
 */

(function() {
  console.log('🚀 Starting Browser React Error Monitor...');
  console.log('📝 Monitoring for critical React performance issues...');
  console.log('⚠️  Navigate your application normally - errors will be detected automatically\n');
  
  let errorCounts = {
    infiniteLoops: 0,
    fastRefreshIssues: 0,
    performanceSpam: 0,
    errorBoundaries: 0,
    useEffectIssues: 0
  };
  
  let startTime = Date.now();
  let recentPerformanceLogs = [];
  
  // Override console methods to intercept error messages
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  console.error = function(...args) {
    const message = args.join(' ');
    analyzeMessage(message, 'error');
    return originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    analyzeMessage(message, 'warn');
    return originalWarn.apply(console, args);
  };
  
  console.log = function(...args) {
    const message = args.join(' ');
    analyzeMessage(message, 'log');
    return originalLog.apply(console, args);
  };
  
  function analyzeMessage(message, level) {
    const timestamp = Date.now();
    
    // 🚨 CRITICAL: Track React infinite loop errors
    if (message.includes('Maximum update depth exceeded')) {
      errorCounts.infiniteLoops++;
      originalError(`🚨 DETECTED: React infinite loop error #${errorCounts.infiniteLoops}`);
      
      if (message.includes('useAdvancedPerformanceOptimization')) {
        originalError('  📍 Location: useAdvancedPerformanceOptimization.ts:501');
      }
      if (message.includes('RealTimeAnalyticsOptimizer')) {
        originalError('  📍 Location: RealTimeAnalyticsOptimizer.tsx:434');
      }
      showCurrentStatus();
    }
    
    // 🚨 CRITICAL: Track Fast Refresh issues
    if (message.includes('[Fast Refresh] performing full reload')) {
      errorCounts.fastRefreshIssues++;
      originalWarn(`⚠️ DETECTED: Fast Refresh full reload #${errorCounts.fastRefreshIssues}`);
      originalWarn('  💡 Cause: Component imported outside React rendering tree');
      showCurrentStatus();
    }
    
    // 🚨 CRITICAL: Track performance monitoring spam
    if (message.includes('Enhanced performance monitoring') && 
        (message.includes('started') || message.includes('stopped'))) {
      recentPerformanceLogs.push(timestamp);
      
      // Check for spam (more than 20 events in 5 seconds)
      const fiveSecondsAgo = timestamp - 5000;
      recentPerformanceLogs = recentPerformanceLogs.filter(t => t > fiveSecondsAgo);
      
      if (recentPerformanceLogs.length > 20) {
        errorCounts.performanceSpam++;
        originalError(`🚨 DETECTED: Performance monitoring spam #${errorCounts.performanceSpam}`);
        originalError(`  📊 ${recentPerformanceLogs.length} events in 5 seconds`);
        showCurrentStatus();
      }
    }
    
    // 🚨 CRITICAL: Track Error Boundary activations
    if (message.includes('Error Boundary Caught Error') || 
        message.includes('The above error occurred in the')) {
      errorCounts.errorBoundaries++;
      originalError(`🚨 DETECTED: Error Boundary activation #${errorCounts.errorBoundaries}`);
      
      if (message.includes('RealTimeAnalyticsOptimizer')) {
        originalError('  📍 Failed Component: RealTimeAnalyticsOptimizer');
      }
      showCurrentStatus();
    }
    
    // 🚨 CRITICAL: Track useEffect dependency issues
    if (message.includes('useEffect either doesn\'t have a dependency array')) {
      errorCounts.useEffectIssues++;
      originalError(`🚨 DETECTED: useEffect dependency issue #${errorCounts.useEffectIssues}`);
      showCurrentStatus();
    }
  }
  
  function showCurrentStatus() {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);
    
    originalLog(`\n📊 CURRENT STATUS (${duration}s) - Total Errors: ${totalErrors}:`);
    originalLog(`🚨 Infinite Loops: ${errorCounts.infiniteLoops}`);
    originalLog(`⚠️ Fast Refresh Issues: ${errorCounts.fastRefreshIssues}`);
    originalLog(`📈 Performance Spam: ${errorCounts.performanceSpam}`);
    originalLog(`🛡️ Error Boundaries: ${errorCounts.errorBoundaries}`);
    originalLog(`🔄 useEffect Issues: ${errorCounts.useEffectIssues}\n`);
    
    if (totalErrors > 0) {
      originalLog('💡 IMMEDIATE ACTIONS NEEDED:');
      
      if (errorCounts.infiniteLoops > 0) {
        originalLog('  🚨 Fix useEffect dependency arrays in useAdvancedPerformanceOptimization.ts:501');
        originalLog('  🚨 Fix useEffect dependency arrays in RealTimeAnalyticsOptimizer.tsx:434');
      }
      
      if (errorCounts.errorBoundaries > 0) {
        originalLog('  🚨 Fix crashing RealTimeAnalyticsOptimizer component');
      }
      
      if (errorCounts.performanceSpam > 0) {
        originalLog('  ⚠️ Reduce performance monitoring frequency');
      }
      
      if (errorCounts.fastRefreshIssues > 0) {
        originalLog('  ⚠️ Fix component import/export structure');
      }
      
      originalLog('');
    }
  }
  
  // Show periodic status updates
  setInterval(() => {
    const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);
    if (totalErrors > 0) {
      showCurrentStatus();
    }
  }, 15000); // Every 15 seconds if there are errors
  
  // Add a manual status check function
  window.reactErrorStatus = function() {
    showCurrentStatus();
    return {
      errorCounts,
      totalErrors: Object.values(errorCounts).reduce((sum, count) => sum + count, 0),
      duration: Math.floor((Date.now() - startTime) / 1000)
    };
  };
  
  originalLog('✅ Monitor active! Navigate your app normally.');
  originalLog('📞 Type reactErrorStatus() anytime to see current status');
  originalLog('🔍 Critical errors will be highlighted automatically\n');
  
})(); 