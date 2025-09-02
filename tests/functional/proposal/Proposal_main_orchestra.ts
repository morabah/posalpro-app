#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Proposal Module Functional Test Suite Orchestrator
 * Main coordinator for all proposal-focused functional test modules
 */

import { logInfo } from '../../../src/lib/logger';
import { ApiClient } from './api-client';
import { ApiTests } from './api-tests';
import { ArchitectureComplianceTests } from './architecture-compliance-tests';
import { AuthTests } from './auth-tests';
import { AuditComplianceTests } from './audit-compliance-tests';
import { BulkOperationsTests } from './bulk-operations-tests';
import { DataIntegrityTests } from './data-integrity-tests';
import { DeploymentConfigTests } from './deployment-config-tests';
import { DetailedViewsTests } from './detailed-views-tests';
import { ErrorHandlingTests } from './error-handling-tests';
import { FieldValidationTests } from './field-validation-tests';
import { IntegrationTests } from './integration-tests';
import { LoadStressTests } from './load-stress-tests';
import { MobileAccessibilityTests } from './mobile-accessibility-tests';
import { PerformanceTests } from './performance-tests';
import { PermissionsTests } from './permissions-tests';
import { SchemaValidationTests } from './schema-validation-tests';
import { SearchFilteringTests } from './search-filtering-tests';
import { SecurityTests } from './security-tests';
import { StatisticsAnalyticsTests } from './statistics-analytics-tests';
import { WorkflowTests } from './workflow-tests';

export class ProposalFunctionalTestOrchestrator {
  private api: ApiClient;
  private testResults: Array<{
    module: string;
    tests: any[];
    totalTests: number;
    passed: number;
    failed: number;
    timeout: number;
    skipped: number;
    duration: number;
    schemaErrors: number;
    infiniteLoops: number;
    totalRequests: number;
  }> = [];

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.api = new ApiClient(baseUrl);
  }

  // Sequential execution for race-condition prone tests
  private async runSequentialTests(testModules: Array<{ name: string; runner: () => Promise<any[]> }>) {
    const results = [];
    for (const { name, runner } of testModules) {
      console.log(`\n🔄 Running ${name} (sequential to avoid race conditions)...`);
      const start = Date.now();
      try {
        const tests = await runner();
        const duration = Date.now() - start;
        results.push({ name, tests, duration, status: 'completed' });
        console.log(`✅ ${name} completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - start;
        results.push({ name, tests: [], duration, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
        console.log(`❌ ${name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    return results;
  }

  // Authentication method with fallback to test mode
  private async authenticate(): Promise<boolean> {
    try {
      console.log('🔐 Attempting real authentication...');
      const loginSuccess = await this.api.login('admin@posalpro.com', 'ProposalPro2024!');
      if (loginSuccess) {
        console.log('✅ Real authentication successful');
        return true;
      } else {
        console.log('⚠️ Real authentication failed, falling back to test mode...');
        return await this.testModeAuth();
      }
    } catch (error) {
      console.log('⚠️ Real authentication error, falling back to test mode...');
      return await this.testModeAuth();
    }
  }

  // Test mode authentication for development testing
  private async testModeAuth(): Promise<boolean> {
    try {
      console.log('🔧 Using test mode authentication bypass');
      const testAuthSuccess = await this.api.testModeAuth();
      if (testAuthSuccess) {
        console.log('✅ Test mode authentication successful');
        return true;
      } else {
        console.log('❌ Test mode authentication failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Test mode authentication error:', error);
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting PosalPro MVP2 Proposal Module Functional Test Suite');
    console.log('===============================================');
    console.log(`🌐 Testing against: ${this.api['baseUrl']}`);

    // Try to authenticate first
    console.log('\n🔐 Authenticating...');
    const authSuccess = await this.authenticate();

    if (!authSuccess) {
      console.error('❌ Authentication failed. Cannot run tests.');
      return;
    }
    console.log('✅ Authentication successful');

    // Run all test modules (non-race-condition prone tests in parallel)
    await this.runAuthTests();
    await this.runApiTests();
    await this.runDataIntegrityTests();
    await this.runPerformanceTests();
    await this.runErrorHandlingTests();
    await this.runFieldValidationTests();
    await this.runSearchFilteringTests();
    await this.runStatisticsAnalyticsTests();
    await this.runDetailedViewsTests();
    await this.runArchitectureComplianceTests();
    await this.runSecurityTests();
    await this.runIntegrationTests();
    await this.runLoadStressTests();
    await this.runSchemaValidationTests();
    await this.runMobileAccessibilityTests();
    await this.runDeploymentConfigTests();
    await this.runAuditComplianceTests();

    // Run race-condition prone tests sequentially
    console.log('\n🔄 Running race-condition prone tests sequentially...');
    const sequentialResults = await this.runSequentialTests([
      { name: 'Bulk Operations', runner: () => this.runBulkOperationsTests() },
      { name: 'Workflow', runner: () => this.runWorkflowTests() },
      { name: 'Permissions', runner: () => this.runPermissionsTests() },
    ]);

    // Add sequential results to main results
    for (const result of sequentialResults) {
      if (result.status === 'completed') {
        // The individual test runners already added results to this.testResults
        console.log(`✅ ${result.name} completed successfully`);
      } else {
        console.log(`❌ ${result.name} failed: ${result.error}`);
      }
    }

    this.printSummary();
  }

  private async runAuthTests() {
    const start = Date.now();
    const authTests = new AuthTests(this.api);
    const results = await authTests.runTests();
    this.recordModuleResults('Authentication', results, start);
  }

  private async runApiTests() {
    const start = Date.now();
    const apiTests = new ApiTests(this.api);
    const results = await apiTests.runTests();
    this.recordModuleResults('API Functionality', results, start);
  }

  private async runDataIntegrityTests() {
    const start = Date.now();
    const dataTests = new DataIntegrityTests(this.api);
    const results = await dataTests.runTests();
    this.recordModuleResults('Data Integrity', results, start);
  }

  private async runPerformanceTests() {
    const start = Date.now();
    const perfTests = new PerformanceTests(this.api);
    const results = await perfTests.runTests();
    this.recordModuleResults('Performance', results, start);
  }

  private async runErrorHandlingTests() {
    const start = Date.now();
    const errorTests = new ErrorHandlingTests(this.api);
    const results = await errorTests.runTests();
    this.recordModuleResults('Error Handling', results, start);
  }

  private async runFieldValidationTests() {
    const start = Date.now();
    const fieldTests = new FieldValidationTests(this.api);
    const results = await fieldTests.runTests();
    this.recordModuleResults('Field Validation', results, start);
  }

  private async runSearchFilteringTests() {
    const start = Date.now();
    const searchTests = new SearchFilteringTests(this.api);
    const results = await searchTests.runTests();
    this.recordModuleResults('Search & Filtering', results, start);
  }

  private async runStatisticsAnalyticsTests() {
    const start = Date.now();
    const statsTests = new StatisticsAnalyticsTests(this.api);
    const results = await statsTests.runTests();
    this.recordModuleResults('Statistics & Analytics', results, start);
  }

  private async runBulkOperationsTests() {
    const start = Date.now();
    const bulkTests = new BulkOperationsTests(this.api);
    const results = await bulkTests.runTests();
    this.recordModuleResults('Bulk Operations', results, start);
  }

  private async runDetailedViewsTests() {
    const start = Date.now();
    const detailedTests = new DetailedViewsTests(this.api);
    const results = await detailedTests.runTests();
    this.recordModuleResults('Detailed Views', results, start);
  }

  private async runWorkflowTests() {
    const start = Date.now();
    const workflowTests = new WorkflowTests(this.api);
    const results = await workflowTests.runTests();
    this.recordModuleResults('Workflow Tests', results, start);
  }

  private async runPermissionsTests() {
    const start = Date.now();
    const permissionsTests = new PermissionsTests(this.api);
    const results = await permissionsTests.runTests();
    this.recordModuleResults('Permissions', results, start);
  }

  private async runArchitectureComplianceTests() {
    const start = Date.now();
    const architectureTests = new ArchitectureComplianceTests(this.api);
    const results = await architectureTests.runTests();
    this.recordModuleResults('Architecture Compliance', results, start);
  }

  private async runSecurityTests() {
    const start = Date.now();
    const securityTests = new SecurityTests(this.api);
    const results = await securityTests.runTests();
    this.recordModuleResults('Security', results, start);
  }

  private async runIntegrationTests() {
    const start = Date.now();
    const integrationTests = new IntegrationTests(this.api);
    const results = await integrationTests.runTests();
    this.recordModuleResults('Integration', results, start);
  }

  private async runLoadStressTests() {
    const start = Date.now();
    const loadStressTests = new LoadStressTests(this.api);
    const results = await loadStressTests.runTests();
    this.recordModuleResults('Load & Stress', results, start);
  }

  private async runSchemaValidationTests() {
    const start = Date.now();
    const schemaValidationTests = new SchemaValidationTests(this.api);
    const results = await schemaValidationTests.runTests();
    this.recordModuleResults('Schema Validation', results, start);
  }

  private async runMobileAccessibilityTests() {
    const start = Date.now();
    const mobileAccessibilityTests = new MobileAccessibilityTests(this.api);
    const results = await mobileAccessibilityTests.runTests();
    this.recordModuleResults('Mobile & Accessibility', results, start);
  }

  private async runDeploymentConfigTests() {
    const start = Date.now();
    const deploymentConfigTests = new DeploymentConfigTests(this.api);
    const results = await deploymentConfigTests.runTests();
    this.recordModuleResults('Deployment & Configuration', results, start);
  }

  private async runAuditComplianceTests() {
    const start = Date.now();
    const auditComplianceTests = new AuditComplianceTests(this.api);
    const results = await auditComplianceTests.runTests();
    this.recordModuleResults('Audit & Compliance', results, start);
  }

  private recordModuleResults(moduleName: string, testResults: any[], startTime: number) {
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const timeout = testResults.filter(r => r.status === 'TIMEOUT').length;
    const skipped = testResults.filter(r => r.status === 'SKIP').length;
    const schemaErrors = testResults.reduce(
      (sum, r) => sum + (r.issues?.schemaErrors?.length || 0),
      0
    );
    const infiniteLoops = testResults.reduce(
      (sum, r) => sum + (r.issues?.infiniteLoopDetected ? 1 : 0),
      0
    );
    const totalRequests = testResults.reduce(
      (sum, r) =>
        sum +
        (r.issues?.requestCounts
          ? Object.values(r.issues.requestCounts).reduce((a: any, b: any) => a + b, 0)
          : 0),
      0
    );

    this.testResults.push({
      module: moduleName,
      tests: testResults,
      totalTests: testResults.length,
      passed,
      failed,
      timeout,
      skipped,
      duration: Date.now() - startTime,
      schemaErrors,
      infiniteLoops,
      totalRequests,
    });
  }

  printSummary() {
    console.log('\n📊 Functional Test Suite Summary');
    console.log('=================================');

    const totalTests = this.testResults.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = this.testResults.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.testResults.reduce((sum, r) => sum + r.failed, 0);
    const totalTimeout = this.testResults.reduce((sum, r) => sum + r.timeout, 0);
    const totalSkipped = this.testResults.reduce((sum, r) => sum + r.skipped, 0);
    const totalSchemaErrors = this.testResults.reduce((sum, r) => sum + r.schemaErrors, 0);
    const totalInfiniteLoops = this.testResults.reduce((sum, r) => sum + r.infiniteLoops, 0);
    const totalRequests = this.testResults.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📋 Overall Results:`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏰ Timeout: ${totalTimeout}`);
    console.log(`⏭️ Skipped: ${totalSkipped}`);

    console.log(`\n🔍 Issue Detection:`);
    console.log(`📋 Schema Errors Detected: ${totalSchemaErrors}`);
    console.log(`🔄 Infinite Loops Detected: ${totalInfiniteLoops}`);
    console.log(`📊 Total Requests Made: ${totalRequests}`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);

    console.log(`\n📊 Module Breakdown:`);
    this.testResults.forEach(result => {
      const moduleSuccessRate =
        result.totalTests > 0
          ? ((result.passed / (result.totalTests - result.skipped)) * 100).toFixed(1)
          : '0.0';
      console.log(
        `${result.module}: ${result.passed}/${result.totalTests} (${moduleSuccessRate}%) - ${result.duration}ms`
      );
    });

    if (totalFailed > 0) {
      console.log('\n❌ Failed Tests by Module:');
      this.testResults.forEach(result => {
        if (result.failed > 0) {
          console.log(`\n${result.module}:`);
          result.tests
            .filter(t => t.status === 'FAIL' || t.status === 'TIMEOUT')
            .forEach(t => console.log(`   - ${t.test}: ${t.error}`));
        }
      });
    }

    const overallSuccessRate =
      totalTests > 0 ? ((totalPassed / (totalTests - totalSkipped)) * 100).toFixed(1) : '0.0';
    console.log(`\n🎯 Overall Success Rate: ${overallSuccessRate}%`);

    // Log to structured logger
    logInfo('Functional Test Suite Completed', {
      component: 'ProposalFunctionalTestOrchestrator',
      operation: 'test_summary',
      totalTests,
      totalPassed,
      totalFailed,
      totalTimeout,
      totalSkipped,
      totalSchemaErrors,
      totalInfiniteLoops,
      totalRequests,
      totalDuration,
      overallSuccessRate: parseFloat(overallSuccessRate),
      userStory: 'US-3.1',
      hypothesis: 'H3',
    });
  }
}

// CLI runner
async function main() {
  const args = process.argv.slice(2);
  const baseUrl =
    args.find((arg, i) => args[i - 1] === '--base') || args[1] || 'http://localhost:3000';

  console.log(`🌐 Testing against: ${baseUrl}`);

  const orchestrator = new ProposalFunctionalTestOrchestrator(baseUrl);
  await orchestrator.runAllTests();

  // Exit with code based on test results
  const hasFailures = orchestrator['testResults'].some(r => r.failed > 0 || r.timeout > 0);
  const hasIssues = orchestrator['testResults'].some(
    r => r.schemaErrors > 0 || r.infiniteLoops > 0
  );
  process.exit(hasFailures || hasIssues ? 1 : 0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('💥 Proposal functional test suite failed:', error);
    process.exit(1);
  });
}

// Export is already done with the class declaration above
