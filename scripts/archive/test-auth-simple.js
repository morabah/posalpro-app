const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@posalpro.com',
  password: 'ProposalPro2024!',
};

async function testAuthentication() {
  console.log('🧪 Testing authentication with database connection...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();

  try {
    // Navigate to login page
    console.log('📄 Loading login page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });

    // Fill login form
    console.log('📝 Filling login form...');
    await page.type('input[type="email"]', TEST_USER.email);
    await page.type('input[type="password"]', TEST_USER.password);

    // Set role via hidden input
    console.log('👤 Setting role...');
    await page.evaluate(() => {
      const roleInput = document.querySelector('input[name="role"]');
      if (roleInput) {
        roleInput.value = 'System Administrator';
        roleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Submit form
    console.log('🚀 Submitting form...');
    await page.click('button[type="submit"]');

    // Wait for navigation
    console.log('⏳ Waiting for authentication...');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });

    // Check result
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Authentication successful! Database transaction working.');
      return true;
    } else {
      console.log('❌ Authentication failed. Still on login page.');

      // Check for error messages
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .alert-error, [data-testid="error-message"]');
        return errorEl ? errorEl.textContent : null;
      });

      if (errorMessage) {
        console.log('Error message:', errorMessage);
      }

      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthentication().then(success => {
  if (success) {
    console.log('🎉 Database transaction timeout issue RESOLVED!');
    process.exit(0);
  } else {
    console.log('💥 Database transaction timeout issue still exists.');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Test error:', error);
  process.exit(1);
});

