# PosalPro MVP2 Customer Module Functional Test Suite

**Location:** `tests/functional/customer/`

This directory contains the comprehensive modular functional test suite for PosalPro MVP2's customer management functionality and related enterprise features, organized into focused test modules for better maintainability and organization.

## 📁 Directory Structure

```
tests/functional/customer/
├── README.md                          # This documentation
├── api-client.ts                      # Shared API client with session management
├── main-orchestrator.ts               # Main coordinator for all test modules
│
├── 🔐 Security & Compliance (7 tests)
│   ├── security-tests.ts              # SQL injection, XSS, input validation
│   ├── audit-compliance-tests.ts      # GDPR, audit trails, data retention
│   └── deployment-config-tests.ts     # SSL, environment, health checks
│
├── 🔄 Integration & Architecture (7 tests)
│   ├── integration-tests.ts           # Cross-module data flow
│   ├── schema-validation-tests.ts     # Database schema integrity
│   └── architecture-compliance-tests.ts # CORE_REQUIREMENTS.md validation
│
├── 📊 Performance & Quality (14 tests)
│   ├── load-stress-tests.ts           # Concurrent users, memory leaks
│   ├── performance-tests.ts           # Response times, pagination
│   └── mobile-accessibility-tests.ts  # WCAG 2.1 AA compliance
│
└── 📚 Functional Coverage (37 tests)
    ├── auth-tests.ts                  # Authentication & RBAC
    ├── api-tests.ts                   # Core API functionality
    ├── data-integrity-tests.ts        # Data consistency and validation
    ├── error-handling-tests.ts        # Error response and validation
    ├── field-validation-tests.ts      # Comprehensive field validation
    ├── search-filtering-tests.ts      # Search & filtering capabilities
    ├── statistics-analytics-tests.ts  # Statistics & analytics endpoints
    ├── bulk-operations-tests.ts       # Bulk operations functionality
    ├── detailed-views-tests.ts        # Customer detailed views
    ├── workflow-tests.ts              # Complete user workflows
    └── permissions-tests.ts           # Role-based access control
```

## 🚀 Running the Tests

### Run All Tests

```bash
npx tsx tests/functional/customer/main-orchestrator.ts
```

### Run Against Different Environment

```bash
npx tsx tests/functional/customer/main-orchestrator.ts http://localhost:3001
# or
npx tsx tests/functional/customer/main-orchestrator.ts --base http://localhost:3001
```

## 📋 Test Modules

### 🔐 Authentication Tests (`auth-tests.ts`)

- User login verification
- Unauthorized access handling
- Session management
- RBAC validation

### 📚 API Functionality Tests (`api-tests.ts`)

- Customer listing with pagination and sorting
- Detailed customer profile retrieval
- Customer data structure validation
- Required field presence verification

### 🔒 Data Integrity Tests (`data-integrity-tests.ts`)

- Customer chronological creation order
- Email address uniqueness validation
- Data consistency checks
- Referential integrity

### ⚡ Performance Tests (`performance-tests.ts`)

- Response time validation
- Pagination performance
- Caching behavior verification
- Load testing

### 🚨 Error Handling Tests (`error-handling-tests.ts`)

- Invalid input validation
- Error response formats
- Graceful error recovery
- Boundary condition testing

### 🔍 Field Validation Tests (`field-validation-tests.ts`)

- Database schema compliance
- Zod schema validation
- Field type verification
- Required field enforcement
- Enum value validation
- Pattern matching

## 🏗️ Architecture

### Shared Components

#### `ApiClient` Class

- **Session Management**: Automatic CSRF token handling and cookie management
- **Rate Limiting**: Built-in request throttling with retry logic
- **Issue Detection**: Schema validation error detection and infinite loop
  prevention
- **Authentication**: Automatic login and session maintenance

#### `FunctionalTestOrchestrator`

- **Module Coordination**: Orchestrates all test modules in proper order
- **Result Aggregation**: Collects and summarizes results from all modules
- **Issue Tracking**: Comprehensive schema error and infinite loop detection
- **Reporting**: Detailed test execution reports and success metrics

### Test Module Pattern

Each test module follows a consistent pattern:

```typescript
export class ModuleNameTests {
  private api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  async runTests() {
    // Reset API client tracking
    this.api.resetTracking();

    // Define test cases
    const tests = [
      {
        name: 'Test description',
        test: async () => {
          // Test implementation
          const result = await this.api.request('GET', '/api/endpoint');
          // Validation logic
          return { success: true };
        },
      },
    ];

    // Execute tests and collect results
    const results = [];
    for (const { name, test } of tests) {
      const start = Date.now();
      try {
        const result = await test();
        const issues = this.api.getDetectedIssues();
        results.push({
          test: name,
          status: 'PASS',
          duration: Date.now() - start,
          result,
          issues,
        });
      } catch (error: any) {
        const issues = this.api.getDetectedIssues();
        results.push({
          test: name,
          status: 'FAIL',
          duration: Date.now() - start,
          error: error.message,
          issues,
        });
      }
    }

    return results;
  }
}
```

## 🔧 Configuration

### Environment Variables

The test suite uses the following default configuration:

- **Base URL**: `http://localhost:3000` (configurable via command line)
- **Request Timeout**: 10 seconds
- **Max Requests Per Endpoint**: 5 (10 for architectural tests)
- **Rate Limit Retry Delay**: 2 seconds

### Rate Limiting Protection

- Automatic detection of 429 status codes
- Exponential backoff retry logic
- Request throttling to prevent API overload
- Configurable retry limits and delays

## 📊 Test Results

### Success Metrics

- **Overall Success Rate**: Percentage of passed tests
- **Schema Errors**: Count of detected validation issues
- **Infinite Loops**: Count of detected infinite request loops
- **Total Requests**: Aggregate API calls made during testing

### Module-Specific Results

Each test module provides:

- Individual test pass/fail status
- Execution duration
- Error messages for failed tests
- Schema validation issues detected
- Request count and patterns

### Detailed Reporting

The orchestrator provides comprehensive reporting including:

- Module-by-module breakdown
- Issue detection summary
- Performance metrics
- Structured logging integration

## 🐛 Debugging

### Common Issues

#### Schema Validation Errors

When tests detect schema validation errors:

1. Check API response format matches expected structure
2. Verify Zod schemas are up to date
3. Ensure database fields match API contracts

#### Infinite Loops

If infinite loop detection triggers:

1. Verify request patterns don't create circular dependencies
2. Check for missing pagination parameters
3. Ensure proper error handling prevents endless retries

#### Rate Limiting

When encountering 429 errors:

1. Tests automatically retry with delays
2. Check server rate limiting configuration
3. Consider running tests during off-peak hours

### Logging

All test execution is logged through the structured logger:

- Test start/completion events
- Individual test results
- Error conditions and stack traces
- Performance metrics and timing data

## 🔄 Migration from Monolithic Tests

This modular structure replaces the previous
`functional-test-customer.ts` file:

### Benefits

- **Maintainability**: Each module focuses on a specific concern
- **Scalability**: Easy to add new test modules
- **Parallel Execution**: Modules can run independently
- **Focused Debugging**: Issues isolated to specific modules
- **Code Reuse**: Shared ApiClient eliminates duplication

### Migration Path

1. ✅ Created modular structure
2. ✅ Split existing tests into focused modules
3. ✅ Created shared ApiClient with enhanced features
4. ✅ Implemented orchestrator for coordination
5. ✅ Verified all modules work together
6. 🔄 Consider: Adding more specialized test modules as needed

## 📈 Future Enhancements

### Planned Improvements

- **Parallel Test Execution**: Run modules concurrently for faster execution
- **Test Data Management**: Automated test data setup and teardown
- **Performance Profiling**: Detailed performance analysis and reporting
- **Integration Testing**: Cross-module integration validation
- **CI/CD Integration**: Automated test execution in deployment pipelines

### Additional Test Modules

Consider adding:

- **Security Tests**: Authentication bypass and data exposure testing
- **Load Tests**: High-concurrency performance validation
- **Accessibility Tests**: WCAG compliance verification
- **Mobile Tests**: Responsive design and touch interaction testing
- **Browser Compatibility Tests**: Cross-browser functionality validation

## 📞 Support

For questions about the test suite:

1. Check this README for configuration and usage
2. Review individual test module documentation
3. Check structured logs for detailed execution information
4. Refer to main application documentation for API specifications
