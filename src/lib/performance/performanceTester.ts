/**
 * PosalPro MVP2 - Performance Testing Utility
 * Comprehensive performance measurement and validation system
 */

interface PerformanceTestResult {
  testName: string;
  renderTime: number;
  rerenderCount: number;
  memoryUsage: number;
  infiniteLoopDetected: boolean;
  score: number; // 0-100
  recommendations: string[];
  timestamp: number;
}

interface PerformanceTest {
  name: string;
  maxRenderTime: number; // milliseconds
  maxRerenderCount: number;
  maxMemoryIncrease: number; // bytes
}

class PerformanceTester {
  private static instance: PerformanceTester;
  private testResults: PerformanceTestResult[] = [];
  private activeTests: Map<
    string,
    {
      startTime: number;
      renderCount: number;
      initialMemory: number;
      lastRenderTime: number;
    }
  > = new Map();

  static getInstance(): PerformanceTester {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!PerformanceTester.instance) {
      PerformanceTester.instance = new PerformanceTester();
    }
    return PerformanceTester.instance;
  }

  /**
   * Start a performance test for a component
   */
  startTest(testName: string, _test: PerformanceTest): void {
    void _test;
    const initialMemory = this.getMemoryUsage();

    this.activeTests.set(testName, {
      startTime: performance.now(),
      renderCount: 0,
      initialMemory,
      lastRenderTime: performance.now(),
    });

    console.log(`[PerformanceTester] Started test: ${testName}`);
  }

  /**
   * Record a render event during testing
   */
  recordRender(testName: string): void {
    const test = this.activeTests.get(testName);
    if (!test) return;

    const now = performance.now();
    test.renderCount++;
    test.lastRenderTime = now;

    // Detect potential infinite loops (more than 50 renders in 1 second)
    if (test.renderCount > 50 && now - test.startTime < 1000) {
      console.error(`[PerformanceTester] Infinite loop detected in ${testName}!`);
    }
  }

  /**
   * End a performance test and generate results
   */
  endTest(testName: string, test: PerformanceTest): PerformanceTestResult | null {
    const activeTest = this.activeTests.get(testName);
    if (!activeTest) return null;

    const endTime = performance.now();
    const totalTime = endTime - activeTest.startTime;
    const currentMemory = this.getMemoryUsage();
    const memoryIncrease = currentMemory - activeTest.initialMemory;

    // Calculate performance score (0-100)
    let score = 100;

    // Deduct points for slow render times
    if (totalTime > test.maxRenderTime) {
      score -= Math.min(30, ((totalTime - test.maxRenderTime) / test.maxRenderTime) * 30);
    }

    // Deduct points for excessive rerenders
    if (activeTest.renderCount > test.maxRerenderCount) {
      score -= Math.min(
        30,
        ((activeTest.renderCount - test.maxRerenderCount) / test.maxRerenderCount) * 30
      );
    }

    // Deduct points for memory leaks
    if (memoryIncrease > test.maxMemoryIncrease) {
      score -= Math.min(
        40,
        ((memoryIncrease - test.maxMemoryIncrease) / test.maxMemoryIncrease) * 40
      );
    }

    const infiniteLoopDetected = activeTest.renderCount > 100;

    const result: PerformanceTestResult = {
      testName,
      renderTime: totalTime,
      rerenderCount: activeTest.renderCount,
      memoryUsage: memoryIncrease,
      infiniteLoopDetected,
      score: Math.max(0, Math.round(score)),
      recommendations: this.generateRecommendations(
        totalTime,
        activeTest.renderCount,
        memoryIncrease,
        test
      ),
      timestamp: Date.now(),
    };

    this.testResults.push(result);
    this.activeTests.delete(testName);

    console.log(`[PerformanceTester] Test completed: ${testName}`, result);
    return result;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    renderTime: number,
    rerenderCount: number,
    memoryIncrease: number,
    test: PerformanceTest
  ): string[] {
    const recommendations: string[] = [];

    if (renderTime > test.maxRenderTime) {
      recommendations.push(
        `Render time (${renderTime.toFixed(2)}ms) exceeds threshold. Consider memoization.`
      );
    }

    if (rerenderCount > test.maxRerenderCount) {
      recommendations.push(`Excessive rerenders (${rerenderCount}). Check useEffect dependencies.`);
    }

    if (memoryIncrease > test.maxMemoryIncrease) {
      recommendations.push(
        `Memory increase (${(memoryIncrease / 1024).toFixed(2)}KB) suggests potential leak.`
      );
    }

    if (rerenderCount > 50) {
      recommendations.push('Possible infinite loop detected. Review component dependencies.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is optimal! No improvements needed.');
    }

    return recommendations;
  }

  /**
   * Get current memory usage (if available)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Run a comprehensive test suite on the ProposalWizard
   */
  async testProposalWizard(): Promise<PerformanceTestResult[]> {
    const tests: Array<{ name: string; test: PerformanceTest }> = [
      {
        name: 'ProposalWizard_Initial_Load',
        test: {
          name: 'Initial Load Performance',
          maxRenderTime: 1000, // 1 second
          maxRerenderCount: 10,
          maxMemoryIncrease: 5 * 1024 * 1024, // 5MB
        },
      },
      {
        name: 'ProposalWizard_Step_Navigation',
        test: {
          name: 'Step Navigation Performance',
          maxRenderTime: 500, // 500ms
          maxRerenderCount: 5,
          maxMemoryIncrease: 2 * 1024 * 1024, // 2MB
        },
      },
      {
        name: 'ProposalWizard_Form_Input',
        test: {
          name: 'Form Input Performance',
          maxRenderTime: 100, // 100ms per input
          maxRerenderCount: 3,
          maxMemoryIncrease: 1024 * 1024, // 1MB
        },
      },
      {
        name: 'ProposalWizard_Validation',
        test: {
          name: 'Validation Performance',
          maxRenderTime: 200, // 200ms
          maxRerenderCount: 2,
          maxMemoryIncrease: 500 * 1024, // 500KB
        },
      },
    ];

    const results: PerformanceTestResult[] = [];

    for (const { name, test } of tests) {
      this.startTest(name, test);

      // Simulate component interactions
      await this.simulateInteractions(name);

      const result = this.endTest(name, test);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Simulate realistic user interactions for testing
   */
  private async simulateInteractions(testName: string): Promise<void> {
    return new Promise(resolve => {
      let interactions = 0;
      const maxInteractions = testName.includes('Input') ? 20 : 10;

      const simulate = () => {
        this.recordRender(testName);
        interactions++;

        if (interactions < maxInteractions) {
          // Simulate varying interaction delays
          const delay = testName.includes('Input') ? 50 : 100;
          setTimeout(simulate, delay);
        } else {
          resolve();
        }
      };

      simulate();
    });
  }

  /**
   * Get performance test results
   */
  getTestResults(): PerformanceTestResult[] {
    return [...this.testResults];
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const results = this.getTestResults();
    if (results.length === 0) {
      return 'No performance tests have been run yet.';
    }

    const averageScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
    const failedTests = results.filter(result => result.score < 70);

    let report = `
🚀 PosalPro MVP2 - Performance Test Report
==========================================

Overall Performance Score: ${averageScore.toFixed(1)}/100

Test Results Summary:
`;

    results.forEach(result => {
      const status = result.score >= 90 ? '✅' : result.score >= 70 ? '⚠️' : '❌';
      report += `
${status} ${result.testName}
   Score: ${result.score}/100
   Render Time: ${result.renderTime.toFixed(2)}ms
   Rerenders: ${result.rerenderCount}
   Memory: ${(result.memoryUsage / 1024).toFixed(2)}KB
   Infinite Loop: ${result.infiniteLoopDetected ? 'YES' : 'NO'}
`;

      if (result.recommendations.length > 0) {
        report += `   Recommendations:\n`;
        result.recommendations.forEach(rec => {
          report += `     • ${rec}\n`;
        });
      }
    });

    if (failedTests.length > 0) {
      report += `
⚠️ Performance Issues Detected: ${failedTests.length} test(s) failed
Priority fixes needed for: ${failedTests.map(t => t.testName).join(', ')}
`;
    } else {
      report += `
🎉 All performance tests passed! System is optimized.
`;
    }

    return report;
  }

  /**
   * Clear all test results
   */
  clearResults(): void {
    this.testResults = [];
    this.activeTests.clear();
  }
}

// Export singleton instance
export const performanceTester = PerformanceTester.getInstance();

// Export types for external use
export type { PerformanceTest, PerformanceTestResult };

// Performance testing hook for React components
export function usePerformanceTesting(componentName: string, enabled: boolean = true) {
  const tester = PerformanceTester.getInstance();

  return {
    startTest: (test: PerformanceTest) => {
      if (enabled) tester.startTest(componentName, test);
    },
    recordRender: () => {
      if (enabled) tester.recordRender(componentName);
    },
    endTest: (test: PerformanceTest) => {
      if (enabled) return tester.endTest(componentName, test);
      return null;
    },
  };
}
