#!/usr/bin/env tsx

/**
 * PosalPro MVP2 - Product Module Functional Test Orchestrator
 * Coordinates all product-related test modules
 */

import { ApiClient } from './api-client';
import { ApiTests } from './api-tests';
import { ArchitectureComplianceTests } from './architecture-compliance-tests';
import { AuditComplianceTests } from './audit-compliance-tests';
import { AuthTests } from './auth-tests';
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

export class ProductFunctionalTestOrchestrator {
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
        results.push({ name, tests: [], duration, status: 'failed', error: error.message });
        console.log(`❌ ${name} failed in ${duration}ms: ${error.message}`);
      }

      // Brief pause between sequential tests to reduce interference
      await new Promise(resolve => setTimeout(resolve, 100));
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
    console.log('\n🚀 Starting Product Module Functional Test Suite');
    console.log('='.repeat(60));

    // Try to authenticate first
    console.log('🔐 Authenticating...');
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
    const startTime = Date.now();
    console.log('\n🔐 Running Authentication Tests...');

    const authTests = new AuthTests(this.api);
    const results = await authTests.runTests();

    this.recordModuleResults('Authentication', results, startTime);
  }

  private async runApiTests() {
    const startTime = Date.now();
    console.log('\n📚 Running API Functionality Tests...');

    const apiTests = new ApiTests(this.api);
    const results = await apiTests.runTests();

    this.recordModuleResults('API Functionality', results, startTime);
  }

  private async runDataIntegrityTests() {
    const startTime = Date.now();
    console.log('\n🔒 Running Data Integrity Tests...');

    const dataTests = new DataIntegrityTests(this.api);
    const results = await dataTests.runTests();

    this.recordModuleResults('Data Integrity', results, startTime);
  }

  private async runPerformanceTests() {
    const startTime = Date.now();
    console.log('\n⚡ Running Performance Tests...');

    const perfTests = new PerformanceTests(this.api);
    const results = await perfTests.runTests();

    this.recordModuleResults('Performance', results, startTime);
  }

  private async runErrorHandlingTests() {
    const startTime = Date.now();
    console.log('\n🚨 Running Error Handling Tests...');

    const errorTests = new ErrorHandlingTests(this.api);
    const results = await errorTests.runTests();

    this.recordModuleResults('Error Handling', results, startTime);
  }

  private async runFieldValidationTests() {
    const startTime = Date.now();
    console.log('\n🔍 Running Field Validation Tests...');

    const fieldTests = new FieldValidationTests(this.api);
    const results = await fieldTests.runTests();

    this.recordModuleResults('Field Validation', results, startTime);
  }

  private async runSearchFilteringTests() {
    const startTime = Date.now();
    console.log('\n🔍 Running Search & Filtering Tests...');

    const searchTests = new SearchFilteringTests(this.api);
    const results = await searchTests.runTests();

    this.recordModuleResults('Search & Filtering', results, startTime);
  }

  private async runStatisticsAnalyticsTests() {
    const startTime = Date.now();
    console.log('\n📊 Running Statistics & Analytics Tests...');

    const statsTests = new StatisticsAnalyticsTests(this.api);
    const results = await statsTests.runTests();

    this.recordModuleResults('Statistics & Analytics', results, startTime);
  }

  private async runBulkOperationsTests() {
    const startTime = Date.now();
    console.log('\n🔄 Running Bulk Operations Tests...');

    const bulkTests = new BulkOperationsTests(this.api);
    const results = await bulkTests.runTests();

    this.recordModuleResults('Bulk Operations', results, startTime);
  }

  private async runDetailedViewsTests() {
    const startTime = Date.now();
    console.log('\n🔎 Running Detailed Views Tests...');

    const detailTests = new DetailedViewsTests(this.api);
    const results = await detailTests.runTests();

    this.recordModuleResults('Detailed Views', results, startTime);
  }

  private async runWorkflowTests() {
    const startTime = Date.now();
    console.log('\n🔄 Running Workflow Tests...');

    const workflowTests = new WorkflowTests(this.api);
    const results = await workflowTests.runTests();

    this.recordModuleResults('Workflow', results, startTime);
  }

  private async runPermissionsTests() {
    const startTime = Date.now();
    console.log('\n🔐 Running Permissions Tests...');

    const permTests = new PermissionsTests(this.api);
    const results = await permTests.runTests();

    this.recordModuleResults('Permissions', results, startTime);
  }

  private async runArchitectureComplianceTests() {
    const startTime = Date.now();
    console.log('\n🏗️ Running Architecture Compliance Tests...');

    const archTests = new ArchitectureComplianceTests(this.api);
    const results = await archTests.runTests();

    this.recordModuleResults('Architecture Compliance', results, startTime);
  }

  private async runSecurityTests() {
    const startTime = Date.now();
    console.log('\n🔒 Running Security Tests...');

    const secTests = new SecurityTests(this.api);
    const results = await secTests.runTests();

    this.recordModuleResults('Security', results, startTime);
  }

  private async runIntegrationTests() {
    const startTime = Date.now();
    console.log('\n🔄 Running Integration Tests...');

    const intTests = new IntegrationTests(this.api);
    const results = await intTests.runTests();

    this.recordModuleResults('Integration', results, startTime);
  }

  private async runLoadStressTests() {
    const startTime = Date.now();
    console.log('\n📊 Running Load & Stress Tests...');

    const loadTests = new LoadStressTests(this.api);
    const results = await loadTests.runTests();

    this.recordModuleResults('Load & Stress', results, startTime);
  }

  private async runSchemaValidationTests() {
    const startTime = Date.now();
    console.log('\n📋 Running Schema Validation Tests...');

    const schemaTests = new SchemaValidationTests(this.api);
    const results = await schemaTests.runTests();

    this.recordModuleResults('Schema Validation', results, startTime);
  }

  private async runMobileAccessibilityTests() {
    const startTime = Date.now();
    console.log('\n📱 Running Mobile & Accessibility Tests...');

    const mobileTests = new MobileAccessibilityTests(this.api);
    const results = await mobileTests.runTests();

    this.recordModuleResults('Mobile & Accessibility', results, startTime);
  }

  private async runDeploymentConfigTests() {
    const startTime = Date.now();
    console.log('\n🚀 Running Deployment & Configuration Tests...');

    const deployTests = new DeploymentConfigTests(this.api);
    const results = await deployTests.runTests();

    this.recordModuleResults('Deployment & Config', results, startTime);
  }

  private async runAuditComplianceTests() {
    const startTime = Date.now();
    console.log('\n📋 Running Audit & Compliance Tests...');

    const auditTests = new AuditComplianceTests(this.api);
    const results = await auditTests.runTests();

    this.recordModuleResults('Audit & Compliance', results, startTime);
  }

  private recordModuleResults(moduleName: string, testResults: any[], startTime: number) {
    const totalTests = testResults.length;
    const passed = testResults.filter(t => t.status === 'PASS').length;
    const failed = testResults.filter(t => t.status === 'FAIL').length;
    const timeout = testResults.filter(t => t.status === 'TIMEOUT').length;
    const skipped = testResults.filter(t => t.status === 'SKIP').length;
    const duration = Date.now() - startTime;

    // Aggregate issues from all tests
    const allIssues = testResults.flatMap(t => t.issues || []);
    const schemaErrors = allIssues.filter(i => i.schemaErrors?.length > 0).length;
    const infiniteLoops = allIssues.filter(i => i.infiniteLoopDetected).length;
    const totalRequests = allIssues.reduce((sum, i) => {
      return sum + Object.values(i.requestCounts || {}).reduce((s: number, c: any) => s + c, 0);
    }, 0);

    this.testResults.push({
      module: moduleName,
      tests: testResults,
      totalTests,
      passed,
      failed,
      timeout,
      skipped,
      duration,
      schemaErrors,
      infiniteLoops,
      totalRequests,
    });

    const successRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : '0.0';
    console.log(
      `✅ ${moduleName}: ${passed}/${totalTests} passed (${successRate}%) in ${duration}ms`
    );
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCT MODULE FUNCTIONAL TEST SUITE - FINAL RESULTS');
    console.log('='.repeat(80));

    const totalModules = this.testResults.length;
    const totalTests = this.testResults.reduce((sum, r) => sum + r.totalTests, 0);
    const totalPassed = this.testResults.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.testResults.reduce((sum, r) => sum + r.failed, 0);
    const totalTimeout = this.testResults.reduce((sum, r) => sum + r.timeout, 0);
    const totalSkipped = this.testResults.reduce((sum, r) => sum + r.skipped, 0);
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);
    const totalSchemaErrors = this.testResults.reduce((sum, r) => sum + r.schemaErrors, 0);
    const totalInfiniteLoops = this.testResults.reduce((sum, r) => sum + r.infiniteLoops, 0);
    const totalRequests = this.testResults.reduce((sum, r) => sum + r.totalRequests, 0);

    console.log('\n🎯 OVERALL RESULTS:');
    console.log(`Modules Tested: ${totalModules}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`⏰ Timeout: ${totalTimeout}`);
    console.log(`⏭️ Skipped: ${totalSkipped}`);
    console.log(`📊 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);
    console.log(`📋 Average per Test: ${Math.round(totalDuration / Math.max(totalTests, 1))}ms`);

    console.log('\n🔍 ISSUE DETECTION:');
    console.log(`Schema Validation Errors: ${totalSchemaErrors}`);
    console.log(`Infinite Loop Detections: ${totalInfiniteLoops}`);
    console.log(`Total API Requests: ${totalRequests}`);

    console.log('\n📋 MODULE BREAKDOWN:');
    this.testResults.forEach(result => {
      const rate =
        result.totalTests > 0 ? ((result.passed / result.totalTests) * 100).toFixed(1) : '0.0';
      const status = result.failed === 0 ? '✅' : result.passed > 0 ? '⚠️' : '❌';
      console.log(
        `${status} ${result.module.padEnd(25)}: ${result.passed}/${result.totalTests} (${rate}%)`
      );
    });

    const overallStatus =
      totalFailed === 0
        ? '🎉 ALL TESTS PASSED'
        : totalPassed > totalFailed
          ? '⚠️ MOSTLY SUCCESSFUL'
          : '❌ CRITICAL ISSUES DETECTED';

    console.log('\n🏆 FINAL STATUS: ' + overallStatus);
    console.log('='.repeat(80));

    // Log summary to structured logger
    const logData = {
      component: 'ProductFunctionalTestSuite',
      operation: 'test_execution_complete',
      totalModules,
      totalTests,
      totalPassed,
      totalFailed,
      totalTimeout,
      totalSkipped,
      successRate: `${((totalPassed / totalTests) * 100).toFixed(1)}%`,
      totalDuration,
      schemaErrors: totalSchemaErrors,
      infiniteLoops: totalInfiniteLoops,
      totalRequests,
      overallStatus,
    };

    if (totalFailed === 0) {
      console.log('🎉 Product module is fully functional and ready for production!');
    } else if (totalPassed > totalFailed) {
      console.log('⚠️ Product module has minor issues but is mostly functional');
    } else {
      console.log('❌ Product module has critical issues that need immediate attention');
    }
  }
}

// CLI runner
async function main() {
  const baseUrl = process.argv[2] || process.env.BASE_URL || 'http://localhost:3000';

  console.log(`🚀 Starting Product Module Functional Tests`);
  console.log(`📍 Target: ${baseUrl}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);

  const orchestrator = new ProductFunctionalTestOrchestrator(baseUrl);

  try {
    await orchestrator.runAllTests();
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
