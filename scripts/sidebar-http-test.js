/**
 * PosalPro MVP2 - Sidebar Navigation HTTP Test
 *
 * This script tests all sidebar navigation links via HTTP:
 * 1. Extracts all navigation links from the sidebar
 * 2. Visits each link and measures load time
 * 3. Detects errors, slow responses, and failed navigation
 * 4. Generates a comprehensive report of link performance
 *
 * Usage: node scripts/sidebar-http-test.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SidebarNavigationTester {
  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.timeout = 30000; // 30 seconds timeout for page navigation
    this.slowThreshold = 2000; // 2 seconds threshold for slow page load
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        successful: 0,
        failed: 0,
        slow: 0,
      },
      links: [],
      errors: [],
    };
  }

  // Helper method for delays
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async setup() {
    console.log('🚀 Setting up sidebar navigation HTTP test...');

    try {
      this.browser = await puppeteer.launch({
        headless: false, // Visible for debugging, use 'new' for headless in newer versions
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      this.page = await this.browser.newPage();

      // Enable request interception for performance monitoring
      await this.page.setRequestInterception(true);

      // Track requests and timeouts
      this.page.on('request', request => {
        request.continue();
      });

      // Set up error tracking
      this.page.on('pageerror', error => {
        console.error(`💥 Page Error: ${error.message}`);
        this.results.errors.push({
          type: 'page_error',
          message: error.message,
          timestamp: Date.now(),
        });
      });

      // Set up console monitoring
      this.page.on('console', msg => {
        const text = msg.text();

        // Track performance violations
        if (text.includes('[Violation]')) {
          console.log(`⚠️ Performance Violation: ${text}`);
          this.results.errors.push({
            type: 'violation',
            message: text,
            timestamp: Date.now(),
          });
        }

        // Track React errors
        if (text.includes('Error:') || text.includes('Warning:')) {
          console.log(`⚠️ Console Error/Warning: ${text}`);
          this.results.errors.push({
            type: 'console_error',
            message: text,
            timestamp: Date.now(),
          });
        }
      });

      console.log('✅ Test environment setup complete');
      return true;
    } catch (error) {
      console.error('❌ Failed to set up test environment:', error);
      return false;
    }
  }

  async login() {
    try {
      console.log('🔐 Logging in to application...');
      await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle0' });

      // Wait for login form to be visible
      await this.page.waitForSelector('#email', { timeout: 10000 });

      // Fill in email
      await this.page.type('#email', 'admin@posalpro.com');
      console.log('✅ Email entered');

      // Fill in password
      await this.page.type('#password', 'ProposalPro2024!');
      console.log('✅ Password entered');

      // Handle role selection dropdown
      await this.page.click('#role');
      await this.delay(500); // Wait for dropdown to open

      // Select System Administrator role using XPath or evaluate
      const roleSelected = await this.page.evaluate(() => {
        const roleOptions = document.querySelectorAll('button[role="option"]');
        for (const option of roleOptions) {
          if (option.textContent && option.textContent.includes('System Administrator')) {
            option.click();
            return 'System Administrator';
          }
        }
        // Fallback: select first available role
        if (roleOptions.length > 0) {
          roleOptions[0].click();
          return roleOptions[0].textContent || 'First available role';
        }
        return null;
      });

      if (roleSelected) {
        console.log(`✅ Role selected: ${roleSelected}`);
      } else {
        console.error('❌ No role options found');
        return false;
      }

      await this.delay(500); // Wait for role selection to complete

      // Click login button
      const loginButton = await this.page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        console.log('🔄 Login button clicked, waiting for navigation...');

        // Wait for navigation to complete with a longer timeout
        try {
          await this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: this.timeout });
        } catch (navError) {
          // Sometimes navigation is fast, check current URL
          console.log('⚠️ Navigation timeout, checking current URL...');
        }

        // Check if we successfully logged in
        const currentUrl = await this.page.url();
        console.log(`Current URL after login: ${currentUrl}`);

        if (
          currentUrl.includes('/admin') ||
          currentUrl.includes('/dashboard') ||
          currentUrl.includes('/proposals')
        ) {
          console.log('✅ Login successful');
          return true;
        } else {
          // Check for any error messages on the page
          const errorElement = await this.page.$('.text-red-600, .error, [role="alert"]');
          if (errorElement) {
            const errorText = await errorElement.textContent();
            console.error(`❌ Login failed with error: ${errorText}`);
          } else {
            console.error(`❌ Login may have failed - unexpected URL: ${currentUrl}`);
          }
          return false;
        }
      } else {
        console.error('❌ Login button not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to login:', error.message);
      return false;
    }
  }

  /**
   * Extract all navigation links from the sidebar
   */
  async extractSidebarLinks() {
    console.log('🔍 Extracting sidebar navigation links...');

    try {
      // Make sure we're on a page with the sidebar (use current page if already logged in)
      const currentUrl = await this.page.url();
      if (
        !currentUrl.includes('/dashboard') &&
        !currentUrl.includes('/admin') &&
        !currentUrl.includes('/proposals')
      ) {
        await this.page.goto(`${this.baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
      }

      // Wait for the sidebar to be visible
      await this.page.waitForSelector('nav[aria-label="Main navigation"]', {
        timeout: this.timeout,
      });

      // Extract all navigation links
      const links = await this.page.evaluate(() => {
        const navigationLinks = [];

        // Find all links within the sidebar navigation
        const linkElements = document.querySelectorAll('nav[aria-label="Main navigation"] a');

        linkElements.forEach(link => {
          const href = link.getAttribute('href');
          const label = link.querySelector('span')?.textContent.trim() || 'Unknown Link';
          const ariaLabel = link.getAttribute('aria-label');

          navigationLinks.push({
            href,
            label,
            ariaLabel,
          });
        });

        return navigationLinks;
      });

      // Also extract collapsible navigation groups
      const groupButtons = await this.page.$$(
        'nav[aria-label="Main navigation"] button[aria-expanded]'
      );

      // Click each group button to expand and extract nested links
      for (const button of groupButtons) {
        try {
          // Check if group is already expanded
          const isExpanded = await button.evaluate(
            el => el.getAttribute('aria-expanded') === 'true'
          );

          if (!isExpanded) {
            // Click to expand
            await button.click();
            await this.delay(500); // Wait for expansion animation

            // Extract nested links
            const nestedLinks = await this.page.evaluate(() => {
              const links = [];
              // Query for nested links that weren't visible before
              const nestedElements = document.querySelectorAll(
                'nav[aria-label="Main navigation"] div[role="menu"] a'
              );

              nestedElements.forEach(link => {
                const href = link.getAttribute('href');
                const label = link.querySelector('span')?.textContent.trim() || 'Unknown Link';
                const ariaLabel = link.getAttribute('aria-label');
                const isNested = true;

                links.push({
                  href,
                  label,
                  ariaLabel,
                  isNested,
                });
              });

              return links;
            });

            links.push(...nestedLinks);
          }
        } catch (error) {
          console.error(`Error expanding navigation group:`, error.message);
        }
      }

      console.log(`✅ Found ${links.length} navigation links`);

      // Filter out invalid or duplicate links
      const uniqueLinks = [];
      const seenHrefs = new Set();

      for (const link of links) {
        if (link.href && !seenHrefs.has(link.href)) {
          seenHrefs.add(link.href);
          uniqueLinks.push(link);
        }
      }

      console.log(`🧹 Filtered to ${uniqueLinks.length} unique navigation links`);
      return uniqueLinks;
    } catch (error) {
      console.error('❌ Failed to extract sidebar links:', error.message);
      return [];
    }
  }

  /**
   * Test each navigation link
   */
  async testSidebarLinks(links) {
    console.log('\n🧪 Testing sidebar navigation links...');
    this.results.summary.total = links.length;

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      console.log(`\n🔗 Testing link ${i + 1}/${links.length}: ${link.label} (${link.href})`);

      const result = {
        label: link.label,
        href: link.href,
        ariaLabel: link.ariaLabel,
        isNested: link.isNested || false,
        loadTime: null,
        status: 'unknown',
        errors: [],
        violations: [],
      };

      try {
        // Navigate to the link
        const startTime = Date.now();

        // Reset error and violation tracking
        const pageErrors = [];
        const violations = [];

        // Set up error handler for this navigation
        const errorHandler = error => {
          pageErrors.push({
            message: error.message,
            timestamp: Date.now(),
          });
        };

        // Set up violation handler
        const consoleHandler = msg => {
          const text = msg.text();
          if (text.includes('[Violation]')) {
            violations.push({
              message: text,
              timestamp: Date.now(),
            });
          }
        };

        // Register handlers
        this.page.on('pageerror', errorHandler);
        this.page.on('console', consoleHandler);

        try {
          // Use direct navigation with timeout
          await this.page.goto(`${this.baseUrl}${link.href}`, {
            waitUntil: 'networkidle0',
            timeout: this.timeout,
          });

          // Wait an additional second for any late-loading content
          await this.delay(1000);

          // Calculate load time
          const loadTime = Date.now() - startTime;
          result.loadTime = loadTime;

          // Check if page loaded successfully
          const currentUrl = await this.page.url();
          const pageTitle = await this.page.title();

          if (currentUrl.includes('error') || pageTitle.includes('Error')) {
            result.status = 'error_page';
            result.errors.push({
              type: 'error_page',
              message: `Landed on error page: ${pageTitle}`,
              timestamp: Date.now(),
            });
            this.results.summary.failed++;
          } else {
            result.status = 'success';
            this.results.summary.successful++;

            // Check if load was slow
            if (loadTime > this.slowThreshold) {
              result.status = 'slow';
              this.results.summary.slow++;
            }
          }

          console.log(
            `✅ ${link.label} loaded in ${loadTime}ms ${result.status === 'slow' ? '(SLOW)' : ''}`
          );
        } catch (navError) {
          // Navigation failed
          result.status = 'failed';
          result.errors.push({
            type: 'navigation_error',
            message: navError.message,
            timestamp: Date.now(),
          });
          this.results.summary.failed++;

          console.error(`❌ Failed to load ${link.label}: ${navError.message}`);
        }

        // Record any errors and violations
        result.errors.push(...pageErrors);
        result.violations.push(...violations);

        // Remove handlers
        this.page.removeListener('pageerror', errorHandler);
        this.page.removeListener('console', consoleHandler);
      } catch (error) {
        // Test execution error
        result.status = 'test_error';
        result.errors.push({
          type: 'test_execution_error',
          message: error.message,
          timestamp: Date.now(),
        });
        this.results.summary.failed++;

        console.error(`❌ Error testing ${link.label}:`, error.message);
      }

      // Add result to list
      this.results.links.push(result);
    }

    return this.results;
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 Generating sidebar navigation test report...');

    // Calculate summary metrics
    const summary = this.results.summary;
    summary.successRate = `${((summary.successful / summary.total) * 100).toFixed(1)}%`;
    summary.slowRate = `${((summary.slow / summary.total) * 100).toFixed(1)}%`;
    summary.failureRate = `${((summary.failed / summary.total) * 100).toFixed(1)}%`;

    // Sort links by load time (slowest first)
    const sortedLinks = [...this.results.links].sort((a, b) => {
      if (a.status === 'failed' && b.status !== 'failed') return -1;
      if (a.status !== 'failed' && b.status === 'failed') return 1;
      return (b.loadTime || 0) - (a.loadTime || 0);
    });

    // Prepare report
    const reportData = {
      ...this.results,
      links: sortedLinks,
      problemLinks: sortedLinks.filter(link => link.status !== 'success'),
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'sidebar-navigation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    this.generateHtmlReport(reportData);

    console.log(`✅ Report saved to: ${reportPath}`);
    console.log(
      `✅ HTML report saved to: ${path.join(process.cwd(), 'sidebar-navigation-report.html')}`
    );

    return reportData;
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport(reportData) {
    const htmlPath = path.join(process.cwd(), 'sidebar-navigation-report.html');

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sidebar Navigation HTTP Test Report</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3 {
          color: #1a73e8;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          background-color: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .summary-item {
          text-align: center;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .table th, .table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .table th {
          background-color: #f5f5f5;
        }
        .success { color: #0d8050; }
        .slow { color: #d9822b; }
        .failed { color: #c23030; }
        .nested { padding-left: 20px; }
        .problems {
          background-color: #fff3f3;
          border-left: 4px solid #c23030;
          padding: 15px;
          margin-bottom: 20px;
        }
        .error-item {
          margin-bottom: 10px;
          padding: 10px;
          background-color: #ffebeb;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <h1>Sidebar Navigation HTTP Test Report</h1>
      <p>Generated: ${new Date(reportData.timestamp).toLocaleString()}</p>

      <div class="summary">
        <div class="summary-item">
          <div class="summary-value">${reportData.summary.total}</div>
          <div>Total Links</div>
        </div>
        <div class="summary-item">
          <div class="summary-value success">${reportData.summary.successful}</div>
          <div>Successful (${reportData.summary.successRate})</div>
        </div>
        <div class="summary-item">
          <div class="summary-value slow">${reportData.summary.slow}</div>
          <div>Slow (${reportData.summary.slowRate})</div>
        </div>
        <div class="summary-item">
          <div class="summary-value failed">${reportData.summary.failed}</div>
          <div>Failed (${reportData.summary.failureRate})</div>
        </div>
      </div>

      ${
        reportData.problemLinks.length > 0
          ? `
      <div class="problems">
        <h2>⚠️ Problem Links (${reportData.problemLinks.length})</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Label</th>
              <th>URL</th>
              <th>Status</th>
              <th>Load Time</th>
              <th>Errors</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.problemLinks
              .map(
                link => `
            <tr>
              <td>${link.isNested ? `<span class="nested">↳</span> ` : ''}${link.label}</td>
              <td>${link.href}</td>
              <td class="${link.status}">${link.status}</td>
              <td>${link.loadTime ? `${link.loadTime}ms` : 'N/A'}</td>
              <td>${link.errors.length > 0 ? link.errors.map(err => `<div class="error-item">${err.message}</div>`).join('') : '-'}</td>
            </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <h2>All Navigation Links</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Label</th>
            <th>URL</th>
            <th>Status</th>
            <th>Load Time</th>
          </tr>
        </thead>
        <tbody>
          ${reportData.links
            .map(
              link => `
          <tr>
            <td>${link.isNested ? `<span class="nested">↳</span> ` : ''}${link.label}</td>
            <td>${link.href}</td>
            <td class="${link.status}">${link.status}</td>
            <td>${link.loadTime ? `${link.loadTime}ms` : 'N/A'}</td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <h2>Technical Details</h2>
      <p>Test configuration:</p>
      <ul>
        <li>Base URL: ${reportData.baseUrl || 'Not specified'}</li>
        <li>Navigation Timeout: 30 seconds</li>
        <li>Slow Threshold: 2000ms</li>
      </ul>
    </body>
    </html>
    `;

    fs.writeFileSync(htmlPath, html);
  }

  /**
   * Run the full test
   */
  async run() {
    console.log('\n🚀 Starting Sidebar Navigation HTTP Test\n');

    try {
      const setupSuccess = await this.setup();
      if (!setupSuccess) {
        throw new Error('Failed to set up test environment');
      }

      const loginSuccess = await this.login();
      if (!loginSuccess) {
        throw new Error('Failed to login to application');
      }

      const links = await this.extractSidebarLinks();
      if (links.length === 0) {
        throw new Error('No sidebar links found');
      }

      await this.testSidebarLinks(links);
      const report = this.generateReport();

      console.log('\n✅ Sidebar Navigation HTTP Test Complete');
      console.log(
        `📊 Results: ${report.summary.successful} successful, ${report.summary.slow} slow, ${report.summary.failed} failed`
      );

      // Highlight problematic links
      if (report.problemLinks && report.problemLinks.length > 0) {
        console.log('\n⚠️ Problem Links:');
        report.problemLinks.forEach(link => {
          console.log(
            `- ${link.label} (${link.href}): ${link.status} ${link.loadTime ? `${link.loadTime}ms` : ''}`
          );
          if (link.errors.length > 0) {
            console.log(`  Errors: ${link.errors.map(e => e.message).join(', ')}`);
          }
        });
      }
    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      // Close the browser
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the test
(async () => {
  const tester = new SidebarNavigationTester();
  await tester.run();
})();
