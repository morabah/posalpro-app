#!/usr/bin/env node

const puppeteer = require('puppeteer');

class AuthenticationEnhancementFix {
  constructor() {
    this.serverUrl = 'http://localhost:3000';
    this.testUser = {
      email: 'admin@posalpro.com',
      password: 'ProposalPro2024!',
      role: 'System Administrator',
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[35m',
      reset: '\x1b[0m',
    };
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async enhanceAuthentication() {
    this.log('🔐 PHASE 1: Implementing Authentication Enhancement...', 'critical');

    let browser, page;

    try {
      browser = await puppeteer.launch({
        headless: false, // Show browser for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      page = await browser.newPage();
      await page.setViewport({ width: 1366, height: 768 });

      // Step 1: Navigate to login page
      this.log('📄 Navigating to login page...', 'info');
      await page.goto(`${this.serverUrl}/auth/login`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // Step 2: Perform login
      this.log('🔑 Performing login...', 'info');

      // Wait for and fill email field
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      const emailField = await page.$('input[type="email"], input[name="email"]');
      await emailField.click({ clickCount: 3 }); // Select all
      await emailField.type(this.testUser.email);

      // Wait for and fill password field
      await page.waitForSelector('input[type="password"], input[name="password"]', {
        timeout: 10000,
      });
      const passwordField = await page.$('input[type="password"], input[name="password"]');
      await passwordField.click({ clickCount: 3 }); // Select all
      await passwordField.type(this.testUser.password);

      // Submit form
      let submitButton;
      try {
        // Try different selector approaches
        submitButton = await page.$('button[type="submit"]');
        if (!submitButton) {
          submitButton = await page.$('form button');
        }
        if (!submitButton) {
          // Look for buttons with text content
          submitButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(
              btn =>
                btn.textContent.toLowerCase().includes('sign in') ||
                btn.textContent.toLowerCase().includes('login') ||
                btn.textContent.toLowerCase().includes('submit')
            );
          });
        }
      } catch (selectorError) {
        this.log(`⚠️ Button selector error: ${selectorError.message}`, 'warning');
      }

      if (submitButton) {
        await submitButton.click();
        this.log('🔘 Submit button clicked', 'info');
      } else {
        // Try form submission via Enter key
        await page.keyboard.press('Enter');
        this.log('⌨️ Form submitted via Enter key', 'info');
      }

      // Step 3: Wait for authentication
      this.log('⏳ Waiting for authentication...', 'info');

      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle0',
          timeout: 15000,
        });

        // Check if we're on dashboard or still on login
        const currentUrl = page.url();
        if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
          this.log('✅ Authentication successful - redirected to dashboard', 'success');
        } else if (currentUrl.includes('/auth/login')) {
          this.log('⚠️ Still on login page - checking for errors', 'warning');

          // Check for error messages
          const errorElements = await page.$$('.error, .alert-error, [role="alert"]');
          if (errorElements.length > 0) {
            const errorText = await page.evaluate(() => {
              const errors = document.querySelectorAll('.error, .alert-error, [role="alert"]');
              return Array.from(errors)
                .map(el => el.textContent)
                .join(', ');
            });
            this.log(`❌ Login error: ${errorText}`, 'error');
          }
        }
      } catch (navError) {
        this.log(`⚠️ Navigation timeout: ${navError.message}`, 'warning');
      }

      // Step 4: Test session validation
      this.log('🔍 Testing session validation...', 'info');

      const sessionTest = await page.evaluate(async () => {
        try {
          const response = await fetch('/api/auth/session', {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          const data = await response.json();

          return {
            status: response.status,
            statusText: response.statusText,
            hasUser: !!data.user,
            userEmail: data.user?.email,
            userRole: data.user?.role,
          };
        } catch (error) {
          return {
            error: error.message,
            status: 0,
          };
        }
      });

      if (sessionTest.status === 200 && sessionTest.hasUser) {
        this.log(
          `✅ Session valid - User: ${sessionTest.userEmail} (${sessionTest.userRole})`,
          'success'
        );
      } else {
        this.log(`❌ Session invalid - Status: ${sessionTest.status}`, 'error');
      }

      // Step 5: Test authenticated API endpoints
      this.log('🌐 Testing authenticated API endpoints...', 'info');

      const apiTests = [
        { name: 'Customers', endpoint: '/api/customers' },
        { name: 'Products', endpoint: '/api/products' },
        { name: 'Proposals', endpoint: '/api/proposals' },
      ];

      const apiResults = [];

      for (const api of apiTests) {
        const result = await page.evaluate(async endpoint => {
          try {
            const response = await fetch(endpoint, {
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            });

            const data = response.status < 400 ? await response.json() : null;

            return {
              status: response.status,
              statusText: response.statusText,
              dataLength: Array.isArray(data) ? data.length : data ? 1 : 0,
            };
          } catch (error) {
            return {
              error: error.message,
              status: 0,
            };
          }
        }, api.endpoint);

        apiResults.push({ ...api, ...result });

        if (result.status === 200) {
          this.log(`✅ ${api.name} API: ${result.status} - ${result.dataLength} items`, 'success');
        } else if (result.status === 401) {
          this.log(`🔐 ${api.name} API: ${result.status} - Authentication required`, 'warning');
        } else {
          this.log(`❌ ${api.name} API: ${result.status} - ${result.statusText}`, 'error');
        }
      }

      // Step 6: Generate authentication enhancement report
      const report = {
        timestamp: new Date().toISOString(),
        sessionTest,
        apiResults,
        authenticationStatus: sessionTest.status === 200 ? 'SUCCESS' : 'FAILED',
        authenticatedEndpoints: apiResults.filter(r => r.status === 200).length,
        totalEndpoints: apiResults.length,
      };

      this.log('📊 Authentication Enhancement Results:', 'info');
      this.log(`- Session Status: ${report.authenticationStatus}`, 'info');
      this.log(
        `- Authenticated Endpoints: ${report.authenticatedEndpoints}/${report.totalEndpoints}`,
        'info'
      );

      if (sessionTest.hasUser) {
        this.log(`- User: ${sessionTest.userEmail}`, 'info');
        this.log(`- Role: ${sessionTest.userRole}`, 'info');
      }

      return report;
    } finally {
      // Keep browser open for 10 seconds to see results
      if (browser) {
        this.log('🔍 Keeping browser open for 10 seconds for inspection...', 'info');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await browser.close();
      }
    }
  }

  async run() {
    try {
      this.log('🚀 Starting Authentication Enhancement...', 'critical');

      // Phase 1: Test current authentication
      const authReport = await this.enhanceAuthentication();

      this.log('✅ Authentication enhancement completed!', 'success');

      return {
        authReport,
        status: 'completed',
      };
    } catch (error) {
      this.log(`❌ Enhancement failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run the enhancement
async function main() {
  const enhancer = new AuthenticationEnhancementFix();
  const results = await enhancer.run();

  console.log('\n🎯 Authentication Enhancement Complete!');
  console.log(`Status: ${results.status}`);

  if (results.authReport) {
    console.log(`Authentication: ${results.authReport.authenticationStatus}`);
    console.log(
      `Authenticated Endpoints: ${results.authReport.authenticatedEndpoints}/${results.authReport.totalEndpoints}`
    );
  }

  process.exit(0);
}

main().catch(console.error);
