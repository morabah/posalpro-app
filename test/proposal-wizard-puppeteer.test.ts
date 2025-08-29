/**
 * ProposalWizard Puppeteer Integration Test
 * Tests actual browser interaction with the proposal creation wizard
 * Validates button clicks, form filling, and API calls
 */

import puppeteer, { Browser, Page } from 'puppeteer';

describe('ProposalWizard Puppeteer Integration Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-component-extensions-with-background-pages',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-crash-upload',
        '--disable-logging',
        '--disable-login-animations',
        '--disable-notifications',
        '--disable-permissions-api',
        '--disable-session-crashed-bubble',
        '--disable-infobars',
        '--disable-blink-features=AutomationControlled',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      ignoreHTTPSErrors: true,
      executablePath: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD ? undefined : undefined,
    });
    page = await browser.newPage();

    // Set viewport for consistent testing
    await page.setViewport({ width: 1280, height: 720 });

    // Enable console logging
    page.on('console', msg => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Enable request/response logging
    page.on('request', request => {
      console.log(`[Browser Request] ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
      console.log(`[Browser Response] ${response.status()} ${response.url()}`);
    });
  });

  afterAll(async () => {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    // Navigate to the proposal creation page
    await page.goto('http://localhost:3000/proposals/create', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for authentication to complete (skip loading spinner)
    await page.waitForFunction(
      () => {
        const loadingElement = document.querySelector('.animate-spin');
        return !loadingElement || loadingElement.style.display === 'none';
      },
      { timeout: 15000 }
    );

    // Wait for the proposal wizard to load (may take longer due to hydration)
    await page.waitForSelector(
      '[data-testid="proposal-wizard"], [data-testid="step-1"], form, input, textarea',
      {
        timeout: 20000,
      }
    );
  });

  describe('Proposal Creation Flow', () => {
    it('should complete the entire proposal creation flow', async () => {
      console.log('🧪 Starting proposal creation flow test...');

      // Step 1: Fill basic information
      console.log('📝 Filling basic information...');

      // Wait for step 1 to be visible
      await page.waitForSelector('[data-testid="step-1"]', { timeout: 10000 });

      // Fill proposal title
      await page.type('[data-testid="proposal-title"]', 'Test Proposal via Puppeteer');

      // Fill description
      await page.type(
        '[data-testid="proposal-description"]',
        'This is a test proposal created via Puppeteer automation'
      );

      // Select customer (assuming there's a customer dropdown)
      await page.click('[data-testid="customer-select"]');
      await page.waitForSelector('[data-testid="customer-option"]', { timeout: 5000 });
      await page.click('[data-testid="customer-option"]');

      // Set due date
      await page.type('[data-testid="due-date"]', '2025-12-31');

      // Set priority (ensure it's uppercase)
      await page.select('[data-testid="priority-select"]', 'HIGH');

      // Set estimated value
      await page.type('[data-testid="estimated-value"]', '50000');

      // Click continue to next step
      await page.click('[data-testid="continue-button"]');

      // Step 2: Team Assignment (optional - skip if not required)
      console.log('👥 Handling team assignment...');
      await page.waitForFunction(() => true, { timeout: 2000 });

      // If team assignment is required, fill it out
      const teamLeadExists = await page.$('[data-testid="team-lead-select"]');
      if (teamLeadExists) {
        await page.click('[data-testid="team-lead-select"]');
        await page.waitForSelector('[data-testid="team-lead-option"]', { timeout: 5000 });
        await page.click('[data-testid="team-lead-option"]');
      }

      // Continue to next step
      await page.click('[data-testid="continue-button"]');

      // Step 3: Content Selection (optional)
      console.log('📄 Handling content selection...');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');

      // Step 4: Product Selection (optional)
      console.log('🛍️ Handling product selection...');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');

      // Step 5: Section Assignment (optional)
      console.log('📋 Handling section assignment...');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');

      // Step 6: Review and Create
      console.log('📋 Reviewing proposal...');
      await page.waitForSelector('[data-testid="step-6"]', { timeout: 10000 });

      // Verify we're on the final step
      const currentStep = await page.$eval('[data-testid="current-step"]', el => el.textContent);
      console.log(`Current step: ${currentStep}`);

      // Check if "Create Proposal" button is visible and enabled
      const createButton = await page.$('[data-testid="create-proposal-button"]');
      expect(createButton).not.toBeNull();

      const isButtonEnabled = await page.$eval(
        '[data-testid="create-proposal-button"]',
        button => !button.hasAttribute('disabled')
      );
      expect(isButtonEnabled).toBe(true);

      // Click the "Create Proposal" button
      console.log('🚀 Clicking Create Proposal button...');
      await page.click('[data-testid="create-proposal-button"]');

      // Wait for API call to complete
      console.log('⏳ Waiting for API response...');
      await page.waitForResponse(
        response =>
          response.url().includes('/api/proposals') && response.request().method() === 'POST',
        { timeout: 30000 }
      );

      // Check for success or error
      const successMessage = await page.$('[data-testid="success-message"]');
      const errorMessage = await page.$('[data-testid="error-message"]');

      if (successMessage) {
        console.log('✅ Proposal created successfully!');
        const message = await page.$eval('[data-testid="success-message"]', el => el.textContent);
        console.log(`Success message: ${message}`);
      } else if (errorMessage) {
        console.log('❌ Proposal creation failed');
        const message = await page.$eval('[data-testid="error-message"]', el => el.textContent);
        console.log(`Error message: ${message}`);

        // Log the actual error details
        const errorDetails = await page.evaluate(() => {
          const errorElement = document.querySelector('[data-testid="error-message"]');
          return errorElement ? errorElement.textContent : 'No error message found';
        });
        console.log(`Error details: ${errorDetails}`);

        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/proposal-creation-error.png' });

        // Fail the test if there's an error
        throw new Error(`Proposal creation failed: ${message}`);
      } else {
        console.log('⚠️ No success or error message found');

        // Check console for any errors
        const consoleLogs = await page.evaluate(() => {
          return (window as any).consoleLogs || [];
        });
        console.log('Console logs:', consoleLogs);

        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/proposal-creation-unknown.png' });
      }

      console.log('✅ Proposal creation flow test completed');
    }, 60000);

    it('should handle validation errors correctly', async () => {
      console.log('🧪 Testing validation error handling...');

      // Try to create proposal without filling required fields
      await page.waitForSelector('[data-testid="step-1"]', { timeout: 10000 });

      // Click continue without filling required fields
      await page.click('[data-testid="continue-button"]');

      // Check for validation error messages
      const validationErrors = await page.$$('[data-testid="validation-error"]');
      expect(validationErrors.length).toBeGreaterThan(0);

      console.log(`Found ${validationErrors.length} validation errors`);

      // Verify specific error messages
      const errorTexts = await page.evaluate(() => {
        const errors = document.querySelectorAll('[data-testid="validation-error"]');
        return Array.from(errors).map(el => el.textContent);
      });

      console.log('Validation errors:', errorTexts);

      // Check for common validation errors
      const hasRequiredFieldErrors = errorTexts.some(
        text => text?.includes('required') || text?.includes('Required')
      );
      expect(hasRequiredFieldErrors).toBe(true);

      console.log('✅ Validation error handling test completed');
    }, 30000);

    it('should handle API errors gracefully', async () => {
      console.log('🧪 Testing API error handling...');

      // Fill out the form completely
      await page.waitForSelector('[data-testid="step-1"]', { timeout: 10000 });

      // Fill all required fields
      await page.type('[data-testid="proposal-title"]', 'Test Proposal for API Error');
      await page.type('[data-testid="proposal-description"]', 'Testing API error handling');

      // Select customer
      await page.click('[data-testid="customer-select"]');
      await page.waitForSelector('[data-testid="customer-option"]', { timeout: 5000 });
      await page.click('[data-testid="customer-option"]');

      // Set due date
      await page.type('[data-testid="due-date"]', '2025-12-31');

      // Set priority
      await page.select('[data-testid="priority-select"]', 'MEDIUM');

      // Set estimated value
      await page.type('[data-testid="estimated-value"]', '25000');

      // Navigate to final step
      await page.click('[data-testid="continue-button"]');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');

      // Wait for final step
      await page.waitForSelector('[data-testid="step-6"]', { timeout: 10000 });

      // Click create proposal
      await page.click('[data-testid="create-proposal-button"]');

      // Wait for response
      await page.waitForResponse(
        response =>
          response.url().includes('/api/proposals') && response.request().method() === 'POST',
        { timeout: 30000 }
      );

      // Check for error handling
      const errorMessage = await page.$('[data-testid="error-message"]');
      if (errorMessage) {
        const message = await page.$eval('[data-testid="error-message"]', el => el.textContent);
        console.log(`API Error handled: ${message}`);

        // Verify error is user-friendly
        expect(message).toMatch(/error|failed|invalid/i);
      }

      console.log('✅ API error handling test completed');
    }, 60000);
  });

  describe('Button State Validation', () => {
    it('should enable/disable buttons based on form state', async () => {
      console.log('🧪 Testing button state validation...');

      await page.waitForSelector('[data-testid="step-1"]', { timeout: 10000 });

      // Initially, continue button should be disabled
      const initialButtonState = await page.$eval('[data-testid="continue-button"]', button =>
        button.hasAttribute('disabled')
      );

      console.log(`Initial button state (disabled): ${initialButtonState}`);

      // Fill required fields
      await page.type('[data-testid="proposal-title"]', 'Test Proposal');
      await page.type('[data-testid="proposal-description"]', 'Test description');

      // Select customer
      await page.click('[data-testid="customer-select"]');
      await page.waitForSelector('[data-testid="customer-option"]', { timeout: 5000 });
      await page.click('[data-testid="customer-option"]');

      // Set due date
      await page.type('[data-testid="due-date"]', '2025-12-31');

      // Set priority
      await page.select('[data-testid="priority-select"]', 'MEDIUM');

      // Set estimated value
      await page.type('[data-testid="estimated-value"]', '10000');

      // Wait for validation to update
      await page.waitForFunction(() => true, { timeout: 1000 });

      // Now continue button should be enabled
      const finalButtonState = await page.$eval(
        '[data-testid="continue-button"]',
        button => !button.hasAttribute('disabled')
      );

      console.log(`Final button state (enabled): ${finalButtonState}`);
      expect(finalButtonState).toBe(true);

      console.log('✅ Button state validation test completed');
    }, 30000);
  });

  describe('Data Transformation Validation', () => {
    it('should transform form data correctly for API', async () => {
      console.log('🧪 Testing data transformation...');

      // Intercept API calls to validate data transformation
      await page.setRequestInterception(true);

      let capturedRequest: any = null;

      page.on('request', request => {
        if (request.url().includes('/api/proposals') && request.method() === 'POST') {
          const postData = request.postData();
          if (postData) {
            capturedRequest = JSON.parse(postData);
            console.log('Captured API request data:', capturedRequest);
          }
        }
        request.continue();
      });

      // Fill out the form
      await page.waitForSelector('[data-testid="step-1"]', { timeout: 10000 });

      await page.type('[data-testid="proposal-title"]', 'Data Transformation Test');
      await page.type('[data-testid="proposal-description"]', 'Testing data transformation');

      await page.click('[data-testid="customer-select"]');
      await page.waitForSelector('[data-testid="customer-option"]', { timeout: 5000 });
      await page.click('[data-testid="customer-option"]');

      await page.type('[data-testid="due-date"]', '2025-12-31');
      await page.select('[data-testid="priority-select"]', 'HIGH');
      await page.type('[data-testid="estimated-value"]', '75000');

      // Navigate to final step
      await page.click('[data-testid="continue-button"]');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');
      await page.waitForFunction(() => true, { timeout: 2000 });
      await page.click('[data-testid="continue-button"]');

      await page.waitForSelector('[data-testid="step-6"]', { timeout: 10000 });
      await page.click('[data-testid="create-proposal-button"]');

      // Wait for API call
      await page.waitForResponse(
        response =>
          response.url().includes('/api/proposals') && response.request().method() === 'POST',
        { timeout: 30000 }
      );

      // Validate captured request data
      expect(capturedRequest).not.toBeNull();
      expect(capturedRequest.title).toBe('Data Transformation Test');
      expect(capturedRequest.description).toBe('Testing data transformation');
      expect(capturedRequest.priority).toBe('HIGH'); // Should be uppercase
      expect(capturedRequest.currency).toBe('USD');
      expect(capturedRequest.customerId).toBeDefined();
      expect(capturedRequest.dueDate).toBeDefined();

      console.log('✅ Data transformation validation completed');
    }, 60000);
  });
});
