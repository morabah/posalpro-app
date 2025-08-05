#!/usr/bin/env node

/**
 * ProposalWizard Puppeteer Test Runner
 * Runs browser-based tests for proposal creation functionality
 *
 * Usage: node scripts/test-proposal-wizard-puppeteer.js
 */

const puppeteer = require('puppeteer');

async function testProposalCreation() {
  console.log('🧪 Starting ProposalWizard Puppeteer Test...');

  let browser;
  let page;

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false to see the browser
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    page = await browser.newPage();

    // Set viewport
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

    // Navigate to proposal creation page
    console.log('🌐 Navigating to proposal creation page...');
    await page.goto('http://localhost:3000/proposals/create', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for page to load
    await page.waitForSelector('form', { timeout: 10000 });
    console.log('✅ Page loaded successfully');

    // Fill out the form
    console.log('📝 Filling out proposal form...');

    // Fill proposal title
    await page.type(
      'input[name="title"], input[placeholder*="title"], [data-testid="proposal-title"]',
      'Test Proposal via Puppeteer'
    );

    // Fill description
    await page.type(
      'textarea[name="description"], textarea[placeholder*="description"], [data-testid="proposal-description"]',
      'This is a test proposal created via Puppeteer automation'
    );

    // Select customer (try different selectors)
    const customerSelectors = [
      'select[name="customerId"]',
      '[data-testid="customer-select"]',
      'select[data-testid="customer-select"]',
      'select',
    ];

    let customerSelected = false;
    for (const selector of customerSelectors) {
      try {
        const customerSelect = await page.$(selector);
        if (customerSelect) {
          await page.click(selector);
          await page.waitForTimeout(1000);

          // Try to select first option
          const options = await page.$$(`${selector} option`);
          if (options.length > 0) {
            await page.select(
              selector,
              await page.$eval(`${selector} option:first-child`, el => el.value)
            );
            customerSelected = true;
            console.log('✅ Customer selected');
            break;
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not find customer selector: ${selector}`);
      }
    }

    if (!customerSelected) {
      console.log('⚠️ Could not select customer, continuing...');
    }

    // Set due date
    await page.type(
      'input[name="dueDate"], input[type="date"], [data-testid="due-date"]',
      '2025-12-31'
    );

    // Set priority (ensure uppercase)
    const prioritySelectors = [
      'select[name="priority"]',
      '[data-testid="priority-select"]',
      'select[data-testid="priority-select"]',
    ];

    let prioritySelected = false;
    for (const selector of prioritySelectors) {
      try {
        const prioritySelect = await page.$(selector);
        if (prioritySelect) {
          await page.select(selector, 'HIGH');
          prioritySelected = true;
          console.log('✅ Priority set to HIGH');
          break;
        }
      } catch (error) {
        console.log(`⚠️ Could not find priority selector: ${selector}`);
      }
    }

    if (!prioritySelected) {
      console.log('⚠️ Could not set priority, continuing...');
    }

    // Set estimated value
    await page.type(
      'input[name="estimatedValue"], input[type="number"], [data-testid="estimated-value"]',
      '50000'
    );

    // Look for continue/submit button
    const buttonSelectors = [
      'button[type="submit"]',
      'button:contains("Continue")',
      'button:contains("Submit")',
      'button:contains("Create")',
      '[data-testid="continue-button"]',
      '[data-testid="create-proposal-button"]',
      'button',
    ];

    let buttonClicked = false;
    for (const selector of buttonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          const buttonText = await page.$eval(selector, el => el.textContent);
          console.log(`🔍 Found button: "${buttonText}"`);

          if (
            buttonText.toLowerCase().includes('continue') ||
            buttonText.toLowerCase().includes('submit') ||
            buttonText.toLowerCase().includes('create')
          ) {
            await page.click(selector);
            buttonClicked = true;
            console.log('✅ Button clicked');
            break;
          }
        }
      } catch (error) {
        console.log(`⚠️ Could not click button with selector: ${selector}`);
      }
    }

    if (!buttonClicked) {
      console.log('⚠️ Could not find submit button');
    }

    // Wait for response
    console.log('⏳ Waiting for API response...');
    await page.waitForResponse(
      response =>
        response.url().includes('/api/proposals') && response.request().method() === 'POST',
      { timeout: 30000 }
    );

    // Check for success or error
    const successSelectors = [
      '[data-testid="success-message"]',
      '.success',
      '.alert-success',
      'div:contains("success")',
    ];

    const errorSelectors = [
      '[data-testid="error-message"]',
      '.error',
      '.alert-error',
      'div:contains("error")',
    ];

    let foundMessage = false;

    // Check for success
    for (const selector of successSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const message = await page.$eval(selector, el => el.textContent);
          console.log(`✅ Success: ${message}`);
          foundMessage = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // Check for error
    if (!foundMessage) {
      for (const selector of errorSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const message = await page.$eval(selector, el => el.textContent);
            console.log(`❌ Error: ${message}`);
            foundMessage = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
    }

    if (!foundMessage) {
      console.log('⚠️ No success or error message found');

      // Take a screenshot for debugging
      await page.screenshot({ path: 'test-results/proposal-creation-result.png' });
      console.log('📸 Screenshot saved to test-results/proposal-creation-result.png');
    }

    // Wait a bit to see the result
    await page.waitForTimeout(3000);

    console.log('✅ Proposal creation test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);

    // Take a screenshot for debugging
    if (page) {
      await page.screenshot({ path: 'test-results/proposal-creation-error.png' });
      console.log('📸 Error screenshot saved to test-results/proposal-creation-error.png');
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testProposalCreation().catch(console.error);
}

module.exports = { testProposalCreation };
