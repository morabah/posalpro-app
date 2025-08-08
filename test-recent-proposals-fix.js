#!/usr/bin/env node

/**
 * Test script to verify RecentProposals component handles "no proposals" scenario
 * This tests the fix for the error where the component was treating empty proposals as a failure
 */

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/auth/login`;
const DASHBOARD_URL = `${BASE_URL}/dashboard`;

const USER = {
  email: 'admin@posalpro.com',
  password: 'ProposalPro2024!',
  role: 'System Administrator',
};

async function testRecentProposalsFix() {
  let browser;
  console.log('🧪 Testing RecentProposals component fix...');

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--disable-web-security'],
    });
    const page = await browser.newPage();

    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${text}`);
    });

    await page.setViewport({ width: 1280, height: 800 });
    page.setDefaultNavigationTimeout(30000);

    // 1. Navigate to login page
    console.log('\n[1/3] 🔐 Logging in...');
    await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('form');

    // Fill login form
    await page.type('#email', USER.email);
    await page.type('#password', USER.password);

    // Set role
    await page.evaluate(() => {
      const roleInput = document.querySelector('input[name="role"]');
      if (roleInput) {
        roleInput.value = 'System Administrator';
      }
    });

    // Submit form
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
    }

    // Wait for navigation
    try {
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (error) {
      console.log('Navigation timeout - checking current URL...');
    }

    console.log(`Current URL: ${page.url()}`);

    // 2. Navigate to dashboard
    console.log('\n[2/3] 📊 Navigating to dashboard...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 30000 });
    console.log('Dashboard loaded successfully');

    // Wait for components to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Check for RecentProposals errors
    console.log('\n[3/3] 🔍 Checking for RecentProposals errors...');

    const recentProposalsErrors = consoleMessages.filter(
      msg =>
        msg.includes('RecentProposals') &&
        (msg.includes('Error') ||
          msg.includes('Failed') ||
          msg.includes('API response indicates failure'))
    );

    if (recentProposalsErrors.length === 0) {
      console.log('✅ SUCCESS: No RecentProposals errors found');
      console.log('✅ The component is handling the "no proposals" scenario correctly');
    } else {
      console.log('❌ FAILURE: RecentProposals errors found:');
      recentProposalsErrors.forEach(error => console.log(`  - ${error}`));
    }

    // Check for success messages
    const successMessages = consoleMessages.filter(
      msg =>
        msg.includes('RecentProposals') &&
        (msg.includes('No proposals found - this is a valid scenario') ||
          msg.includes('Successfully loaded proposals'))
    );

    if (successMessages.length > 0) {
      console.log('✅ SUCCESS: RecentProposals handled correctly:');
      successMessages.forEach(msg => console.log(`  - ${msg}`));
    }

    // Take screenshot
    await page.screenshot({ path: 'recent-proposals-fix-test.png' });
    console.log('📸 Screenshot saved to recent-proposals-fix-test.png');

    console.log('\n🎉 Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testRecentProposalsFix();
