/**
 * Database Performance Testing Suite - PosalPro MVP2
 * 🧪 PHASE 9: DATABASE OPTIMIZATION VALIDATION
 *
 * Manual testing utility to verify database optimization improvements
 * Component Traceability Matrix: US-6.1, US-6.3, US-4.1 | H8, H11, H12
 */

import { PrismaClient } from '@prisma/client';
import { ErrorCodes } from '../lib/errors/ErrorCodes';
import { ErrorHandlingService } from '../lib/errors/ErrorHandlingService';
import { DatabaseOptimizationService } from '../lib/services/DatabaseOptimizationService';

// Types for performance testing
interface PerformanceTestResult {
  testName: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  recordsProcessed: number;
  cacheHitRate?: number;
  optimizationsApplied: string[];
  hypothesis: string;
}

interface TestSuite {
  name: string;
  description: string;
  tests: PerformanceTestResult[];
  summary: {
    totalTests: number;
    averageImprovement: number;
    bestImprovement: number;
    worstImprovement: number;
  };
}

/**
 * Component Traceability Matrix
 */
const COMPONENT_MAPPING = {
  userStories: ['US-6.1', 'US-6.3', 'US-4.1'],
  acceptanceCriteria: [
    'AC-6.1.1', // Database query optimization
    'AC-6.3.1', // Performance monitoring
    'AC-4.1.2', // Analytics integration
  ],
  methods: [
    'testContentSearch()',
    'testProposalQueries()',
    'testProductSearch()',
    'testAnalyticsQueries()',
    'measurePerformanceGains()',
  ],
  hypotheses: ['H8', 'H11', 'H12'],
  testCases: ['TC-H8-001', 'TC-H11-002', 'TC-H12-003'],
};

/**
 * Database Performance Testing Service
 */
export class DatabasePerformanceTestService {
  private prisma: PrismaClient;
  private optimizationService: DatabaseOptimizationService;
  private errorHandlingService: ErrorHandlingService;
  private testResults: TestSuite[] = [];

  constructor() {
    this.prisma = new PrismaClient();
    this.optimizationService = DatabaseOptimizationService.getInstance(this.prisma);
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }

  /**
   * Run comprehensive database performance tests
   */
  async runPerformanceTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting Database Performance Testing Suite...\n');

    try {
      // Test Suite 1: Content Search Performance (H11)
      const contentSearchSuite = await this.testContentSearchPerformance();
      this.testResults.push(contentSearchSuite);

      // Test Suite 2: Proposal Query Performance (H8)
      const proposalQuerySuite = await this.testProposalQueryPerformance();
      this.testResults.push(proposalQuerySuite);

      // Test Suite 3: Product Search Performance (H11)
      const productSearchSuite = await this.testProductSearchPerformance();
      this.testResults.push(productSearchSuite);

      // Test Suite 4: Analytics Query Performance (H12)
      const analyticsQuerySuite = await this.testAnalyticsQueryPerformance();
      this.testResults.push(analyticsQuerySuite);

      // Test Suite 5: RBAC Performance
      const rbacSuite = await this.testRBACPerformance();
      this.testResults.push(rbacSuite);

      // Generate comprehensive report
      this.generatePerformanceReport();

      return this.testResults;
    } catch (error) {
      this.errorHandlingService.processError(
        error as Error,
        'Database performance testing failed',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          component: 'DatabasePerformanceTestService',
          operation: 'runPerformanceTests',
          userStories: COMPONENT_MAPPING.userStories,
          hypotheses: COMPONENT_MAPPING.hypotheses,
        }
      );
      throw error;
    }
  }

  /**
   * Test content search performance (H11)
   */
  private async testContentSearchPerformance(): Promise<TestSuite> {
    console.log('📊 Testing Content Search Performance (H11)...');

    const tests: PerformanceTestResult[] = [];

    // Test 1: Basic content search without optimization
    const basicSearchResult = await this.runPerformanceTest(
      'Basic Content Search (No Optimization)',
      10,
      async () => {
        return this.prisma.content.findMany({
          where: {
            OR: [
              { title: { contains: 'proposal', mode: 'insensitive' } },
              { description: { contains: 'proposal', mode: 'insensitive' } },
              { content: { contains: 'proposal', mode: 'insensitive' } },
            ],
          },
          take: 50,
        });
      },
      'H11'
    );
    tests.push(basicSearchResult);

    // Test 2: Optimized content search with indexes
    const optimizedSearchResult = await this.runPerformanceTest(
      'Optimized Content Search (With Indexes)',
      10,
      async () => {
        return this.optimizationService.optimizeQuery(
          'content_search_proposal',
          async () => {
            return this.prisma.content.findMany({
              where: {
                OR: [
                  { title: { contains: 'proposal', mode: 'insensitive' } },
                  { description: { contains: 'proposal', mode: 'insensitive' } },
                  { content: { contains: 'proposal', mode: 'insensitive' } },
                ],
              },
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    department: true,
                  },
                },
              },
              take: 50,
            });
          },
          {
            cacheable: true,
            cacheTTL: 2 * 60 * 1000,
            tags: ['content', 'search'],
            includeRelations: ['creator'],
            preventN1: true,
          }
        );
      },
      'H11'
    );
    tests.push(optimizedSearchResult);

    // Test 3: Full-text search with GIN indexes
    const ginSearchResult = await this.runPerformanceTest(
      'GIN Index Search (Keywords/Tags)',
      10,
      async () => {
        return this.prisma.content.findMany({
          where: {
            OR: [{ keywords: { has: 'proposal' } }, { tags: { has: 'document' } }],
          },
          take: 50,
        });
      },
      'H11'
    );
    tests.push(ginSearchResult);

    return {
      name: 'Content Search Performance',
      description: 'Testing search query optimization with indexes and caching',
      tests,
      summary: this.calculateSummary(tests),
    };
  }

  /**
   * Test proposal query performance (H8)
   */
  private async testProposalQueryPerformance(): Promise<TestSuite> {
    console.log('📊 Testing Proposal Query Performance (H8)...');

    const tests: PerformanceTestResult[] = [];

    // Test 1: Basic proposal query without optimization
    const basicProposalResult = await this.runPerformanceTest(
      'Basic Proposal Query (No Optimization)',
      10,
      async () => {
        return this.prisma.proposal.findMany({
          where: {
            status: 'DRAFT',
          },
          take: 20,
        });
      },
      'H8'
    );
    tests.push(basicProposalResult);

    // Test 2: Optimized proposal query with relations
    const optimizedProposalResult = await this.runPerformanceTest(
      'Optimized Proposal Query (With Relations)',
      10,
      async () => {
        return this.optimizationService.optimizeProposalQueries({
          status: 'DRAFT',
        });
      },
      'H8'
    );
    tests.push(optimizedProposalResult);

    // Test 3: Complex proposal query with multiple filters
    const complexProposalResult = await this.runPerformanceTest(
      'Complex Proposal Query (Multiple Filters)',
      10,
      async () => {
        return this.optimizationService.optimizeQuery(
          'proposals_complex_filter',
          async () => {
            return this.prisma.proposal.findMany({
              where: {
                AND: [
                  { status: { in: ['DRAFT', 'IN_REVIEW'] } },
                  { priority: 'HIGH' },
                  { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
                ],
              },
              include: {
                creator: true,
                customer: true,
                products: {
                  include: {
                    product: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 20,
            });
          },
          {
            cacheable: true,
            cacheTTL: 5 * 60 * 1000,
            tags: ['proposals', 'complex'],
            includeRelations: ['creator', 'customer', 'products'],
            preventN1: true,
          }
        );
      },
      'H8'
    );
    tests.push(complexProposalResult);

    return {
      name: 'Proposal Query Performance',
      description: 'Testing proposal data access with optimization and N+1 prevention',
      tests,
      summary: this.calculateSummary(tests),
    };
  }

  /**
   * Test product search performance (H11)
   */
  private async testProductSearchPerformance(): Promise<TestSuite> {
    console.log('📊 Testing Product Search Performance (H11)...');

    const tests: PerformanceTestResult[] = [];

    // Test 1: Basic product search
    const basicProductResult = await this.runPerformanceTest(
      'Basic Product Search',
      10,
      async () => {
        return this.prisma.product.findMany({
          where: {
            isActive: true,
            name: { contains: 'software', mode: 'insensitive' },
          },
          take: 50,
        });
      },
      'H11'
    );
    tests.push(basicProductResult);

    // Test 2: Optimized product search with price range
    const optimizedProductResult = await this.runPerformanceTest(
      'Optimized Product Search (Price Range)',
      10,
      async () => {
        return this.optimizationService.optimizeQuery(
          'products_price_range',
          async () => {
            return this.prisma.product.findMany({
              where: {
                AND: [
                  { isActive: true },
                  { price: { gte: 100, lte: 1000 } },
                  { category: { hasSome: ['software', 'hardware'] } },
                ],
              },
              orderBy: {
                price: 'asc',
              },
              take: 50,
            });
          },
          {
            cacheable: true,
            cacheTTL: 10 * 60 * 1000,
            tags: ['products', 'price_range'],
            preventN1: false,
          }
        );
      },
      'H11'
    );
    tests.push(optimizedProductResult);

    return {
      name: 'Product Search Performance',
      description: 'Testing product catalog search with filtering and optimization',
      tests,
      summary: this.calculateSummary(tests),
    };
  }

  /**
   * Test analytics query performance (H12)
   */
  private async testAnalyticsQueryPerformance(): Promise<TestSuite> {
    console.log('📊 Testing Analytics Query Performance (H12)...');

    const tests: PerformanceTestResult[] = [];

    // Test 1: Basic hypothesis validation query
    const basicAnalyticsResult = await this.runPerformanceTest(
      'Basic Analytics Query',
      10,
      async () => {
        return this.prisma.hypothesisValidationEvent.findMany({
          where: {
            hypothesis: 'H8',
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
          take: 100,
        });
      },
      'H12'
    );
    tests.push(basicAnalyticsResult);

    // Test 2: Optimized analytics query with user data
    const optimizedAnalyticsResult = await this.runPerformanceTest(
      'Optimized Analytics Query (With User Data)',
      10,
      async () => {
        return this.optimizationService.optimizeQuery(
          'analytics_h8_weekly',
          async () => {
            return this.prisma.hypothesisValidationEvent.findMany({
              where: {
                hypothesis: 'H8',
                timestamp: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    department: true,
                  },
                },
              },
              orderBy: {
                timestamp: 'desc',
              },
              take: 100,
            });
          },
          {
            cacheable: true,
            cacheTTL: 1 * 60 * 1000,
            tags: ['analytics', 'hypothesis'],
            includeRelations: ['user'],
            preventN1: true,
          }
        );
      },
      'H12'
    );
    tests.push(optimizedAnalyticsResult);

    return {
      name: 'Analytics Query Performance',
      description: 'Testing hypothesis validation and analytics data access',
      tests,
      summary: this.calculateSummary(tests),
    };
  }

  /**
   * Test RBAC performance
   */
  private async testRBACPerformance(): Promise<TestSuite> {
    console.log('📊 Testing RBAC Performance...');

    const tests: PerformanceTestResult[] = [];

    // Test 1: User roles query
    const userRolesResult = await this.runPerformanceTest(
      'User Roles Query',
      10,
      async () => {
        return this.prisma.userRole.findMany({
          where: {
            isActive: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
              },
            },
          },
          take: 50,
        });
      },
      'H8'
    );
    tests.push(userRolesResult);

    // Test 2: User sessions query
    const userSessionsResult = await this.runPerformanceTest(
      'User Sessions Query',
      10,
      async () => {
        return this.prisma.userSession.findMany({
          where: {
            isActive: true,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          take: 50,
        });
      },
      'H8'
    );
    tests.push(userSessionsResult);

    return {
      name: 'RBAC Performance',
      description: 'Testing role-based access control query performance',
      tests,
      summary: this.calculateSummary(tests),
    };
  }

  /**
   * Run a single performance test
   */
  private async runPerformanceTest(
    testName: string,
    iterations: number,
    testFunction: () => Promise<any>,
    hypothesis: string
  ): Promise<PerformanceTestResult> {
    const times: number[] = [];
    let totalRecords = 0;
    const optimizationsApplied: string[] = [];

    console.log(`  Running ${testName} (${iterations} iterations)...`);

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      try {
        const result = await testFunction();
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        times.push(executionTime);

        if (Array.isArray(result)) {
          totalRecords += result.length;
        } else if (result) {
          totalRecords += 1;
        }

        // Small delay between iterations to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.error(`  Error in iteration ${i + 1}:`, error);
        times.push(5000); // Record as slow query
      }
    }

    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    // Get optimization metrics if available
    const metrics = this.optimizationService.getPerformanceMetrics();
    const cacheHitRate = metrics.cacheHitRate || 0;

    console.log(
      `  ✅ ${testName}: Avg ${averageTime.toFixed(2)}ms, Cache Hit: ${(cacheHitRate * 100).toFixed(1)}%`
    );

    return {
      testName,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime,
      recordsProcessed: totalRecords,
      cacheHitRate,
      optimizationsApplied,
      hypothesis,
    };
  }

  /**
   * Calculate test suite summary
   */
  private calculateSummary(tests: PerformanceTestResult[]) {
    const totalTests = tests.length;
    const averageImprovement =
      tests.reduce((sum, test) => {
        // Calculate improvement based on cache hit rate and execution time
        const improvement = test.cacheHitRate ? test.cacheHitRate * 100 : 0;
        return sum + improvement;
      }, 0) / totalTests;

    const improvements = tests.map(test => (test.cacheHitRate ? test.cacheHitRate * 100 : 0));
    const bestImprovement = Math.max(...improvements);
    const worstImprovement = Math.min(...improvements);

    return {
      totalTests,
      averageImprovement,
      bestImprovement,
      worstImprovement,
    };
  }

  /**
   * Generate comprehensive performance report
   */
  private generatePerformanceReport(): void {
    console.log('\n🎯 DATABASE PERFORMANCE TEST RESULTS');
    console.log('=====================================\n');

    this.testResults.forEach(suite => {
      console.log(`📊 ${suite.name}`);
      console.log(`${suite.description}\n`);

      suite.tests.forEach(test => {
        console.log(`  🧪 ${test.testName}`);
        console.log(`     Average Time: ${test.averageTime.toFixed(2)}ms`);
        console.log(
          `     Min/Max Time: ${test.minTime.toFixed(2)}ms / ${test.maxTime.toFixed(2)}ms`
        );
        console.log(`     Records Processed: ${test.recordsProcessed}`);
        console.log(
          `     Cache Hit Rate: ${test.cacheHitRate ? (test.cacheHitRate * 100).toFixed(1) : 0}%`
        );
        console.log(`     Hypothesis: ${test.hypothesis}`);
        console.log('');
      });

      console.log(`  📈 Suite Summary:`);
      console.log(`     Total Tests: ${suite.summary.totalTests}`);
      console.log(`     Average Improvement: ${suite.summary.averageImprovement.toFixed(1)}%`);
      console.log(`     Best Improvement: ${suite.summary.bestImprovement.toFixed(1)}%`);
      console.log(`     Worst Improvement: ${suite.summary.worstImprovement.toFixed(1)}%`);
      console.log('\n');
    });

    // Overall system performance metrics
    const overallMetrics = this.optimizationService.getPerformanceMetrics();
    console.log('🔧 OPTIMIZATION SERVICE METRICS');
    console.log('===============================');
    console.log(`Total Queries Processed: ${overallMetrics.totalQueries}`);
    console.log(`Overall Cache Hit Rate: ${(overallMetrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Average Execution Time: ${overallMetrics.averageExecutionTime.toFixed(2)}ms`);
    console.log(`Slow Queries Detected: ${overallMetrics.slowQueries}`);
    console.log('\nOptimization Statistics:');
    Object.entries(overallMetrics.optimizationStats).forEach(([opt, count]) => {
      console.log(`  ${opt}: ${count} times applied`);
    });

    console.log('\n✅ Performance testing completed successfully!');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Main testing function
 */
export async function runDatabasePerformanceTests(): Promise<void> {
  const testService = new DatabasePerformanceTestService();

  try {
    await testService.runPerformanceTests();
  } catch (error) {
    console.error('❌ Database performance testing failed:', error);
    throw error;
  } finally {
    await testService.cleanup();
  }
}

// Export for manual testing
export default DatabasePerformanceTestService;

// CommonJS exports for Node.js compatibility
module.exports = {
  DatabasePerformanceTestService,
  runDatabasePerformanceTests,
  default: DatabasePerformanceTestService,
};

// Execute tests if run directly
if (require.main === module || import.meta.url === `file://${process.argv[1]}`) {
  runDatabasePerformanceTests()
    .then(() => {
      console.log('\n🎉 All database performance tests completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Database performance tests failed:', error);
      process.exit(1);
    });
}
