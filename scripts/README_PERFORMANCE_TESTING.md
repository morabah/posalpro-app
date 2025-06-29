# PosalPro MVP2 - CLI Performance Testing

## Overview

The CLI Performance Testing Framework integrates all tests from the web UI
performance dashboard (`/performance/test`) into an automated command-line
interface. This enables continuous integration testing, performance regression
detection, and automated reporting.

## Quick Start

```bash
# 1. Start the development server
npm run dev:smart

# 2. Run the comprehensive CLI performance tests
./scripts/run-performance-tests.sh

# Alternative: Run directly
node scripts/comprehensive-real-world-test.js
```

## Test Categories

The CLI framework executes **17 total tests** across 3 main categories:

### Performance Tests (4 tests)

- **ProposalWizard_Initial_Load**: Initial component loading performance
- **ProposalWizard_Step_Navigation**: Step transition performance
- **ProposalWizard_Form_Input**: Form input responsiveness
- **ProposalWizard_Validation**: Form validation speed

### Sidebar Tests (7 tests)

- **Navigation Item Rendering**: Menu rendering performance
- **Role-Based Access Control**: RBAC functionality
- **Expand/Collapse Functionality**: Menu interaction performance
- **Navigation Performance**: Overall navigation speed
- **Mobile Responsiveness**: Mobile layout adaptation
- **Accessibility Compliance**: WCAG 2.1 AA compliance
- **State Management**: Navigation state handling

### Component Tests (6 tests)

- **Form Fields**: Input field performance and validation
- **Tab Components**: Tab switching and content loading
- **Button Components**: Button interaction responsiveness
- **Modal Components**: Modal rendering and interaction
- **Data Table Components**: Table rendering and sorting
- **Search Components**: Search functionality performance

## Performance Scoring

### Scoring System (0-100)

- **90-100**: Excellent performance
- **70-89**: Good performance
- **50-69**: Acceptable performance
- **< 50**: Critical performance issues (requires immediate attention)

### Performance Thresholds

- **Critical**: Scores < 50 or render times > 1000ms
- **Warning**: Render times > 500ms
- **Good**: Scores ≥ 80 with render times < 200ms

## Generated Reports

### 1. HTML Report

- **Location**: `docs/posalpro_test_report_[timestamp].html`
- **Features**: Interactive dashboard matching web UI format
- **Includes**: Score visualization, test categorization, critical issue
  highlighting

### 2. Markdown Report

- **Location**: `real-world-performance-report.md`
- **Features**: Comprehensive text-based report
- **Includes**: Executive summary, performance analysis, recommendations

### 3. Raw Data

- **Location**: `real-world-test-data.json`
- **Features**: Complete test results in JSON format
- **Use Case**: CI/CD integration, custom analysis

## Example Report Analysis

```
📊 Executive Summary
- Total Tests: 17
- Passed: 14 ✅
- Failed: 3 ❌
- Success Rate: 82.4%
- Average Render Time: 408.9ms
- WCAG Compliance: 100.0%

🚨 Critical Issues Detected
- ProposalWizard_Step_Navigation: Score 45 (Critical)
- ProposalWizard_Form_Input: Score 40 (Critical)
- ProposalWizard_Validation: Score 40 (Critical)
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Performance Tests
  run: |
    npm run dev:smart &
    sleep 10
    ./scripts/run-performance-tests.sh

- name: Upload Test Reports
  uses: actions/upload-artifact@v3
  with:
    name: performance-reports
    path: |
      docs/posalpro_test_report_*.html
      real-world-performance-report.md
      real-world-test-data.json
```

## Dependencies

- **Puppeteer**: Browser automation (auto-installed if missing)
- **Node.js**: JavaScript runtime
- **Development Server**: Must be running on localhost:3000

## Troubleshooting

### Common Issues

1. **Server Not Running**

   ```bash
   ❌ Server not running on localhost:3000
   📋 Please start the server first: npm run dev:smart
   ```

2. **Puppeteer Installation Issues**

   ```bash
   # Manual installation
   npm install puppeteer --save-dev
   ```

3. **Permission Issues**
   ```bash
   chmod +x scripts/run-performance-tests.sh
   ```

### Performance Issues

1. **High Render Times**: Check for infinite loops or memory leaks
2. **Low Scores**: Review component optimization (memoization, lazy loading)
3. **Critical Issues**: Immediate investigation required for scores < 50

## Advanced Usage

### Custom Test Execution

```javascript
// Run specific test category
const tester = new RealWorldTestFramework();
await tester.runPerformanceTestSuite();
await tester.runSidebarTestSuite();
await tester.runComponentTestSuite();
```

### Custom Reporting

```javascript
// Generate custom reports
const results = await tester.generateComprehensiveReport();
console.log(`Success Rate: ${results.summary.successRate}%`);
```

## Performance Benchmarks

### Expected Performance Ranges

- **ProposalWizard Tests**: 500-1000ms (complex form interactions)
- **Sidebar Tests**: 50-400ms (navigation and UI interactions)
- **Component Tests**: 100-750ms (varies by component complexity)

### Critical Thresholds

- **Memory Usage**: < 10MB per test suite
- **WCAG Compliance**: 100% (no accessibility violations)
- **Browser Errors**: 0 JavaScript errors

## Future Enhancements

- [ ] Integration with performance monitoring services
- [ ] Automated performance regression alerts
- [ ] Visual regression testing
- [ ] Load testing capabilities
- [ ] Performance budgets and enforcement

---

**Note**: This CLI framework mirrors the exact tests available in the web UI at
`/performance/test`, enabling consistent performance validation across
development workflows.
