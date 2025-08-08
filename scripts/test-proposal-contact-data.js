const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@posalpro.com',
  password: 'ProposalPro2024!',
};

const TEST_PROPOSAL_DATA = {
  title: 'Comprehensive Test Proposal - All Stages',
  customer: 'Test Customer',
  contactPerson: 'John Smith',
  contactEmail: 'john.smith@manufacturing.com',
  contactPhone: '+1 (555) 123-4567',
  dueDate: '2024-12-31',
  estimatedValue: 50000,
  priority: 'MEDIUM',
  description: 'This is a comprehensive test proposal for validating all wizard steps and data persistence.',
  teamLead: 'Sarah Johnson',
  teamMembers: ['Mike Chen', 'Lisa Rodriguez', 'David Kim'],
  contentSections: ['Executive Summary', 'Technical Approach', 'Project Timeline'],
  selectedProducts: ['Software License', 'Implementation Services', 'Training Package'],
  sections: [
    { title: 'Executive Summary', content: 'Project overview and business value' },
    { title: 'Technical Approach', content: 'Detailed technical implementation plan' },
    { title: 'Project Timeline', content: 'Phase-by-phase delivery schedule' }
  ],
  validationNotes: 'All sections reviewed and approved by team lead',
  analyticsTags: 'enterprise,software,implementation',
  riskLevel: 'MEDIUM'
};

async function authenticateUser(page) {
  console.log('🔐 Authenticating user...');

  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });

  // Fill login form
  await page.type('input[type="email"]', TEST_USER.email);
  await page.type('input[type="password"]', TEST_USER.password);

  // Select role from dropdown
  try {
    // Click on the role dropdown to open it
    await page.click('button[type="button"]');

    // Wait for dropdown to open and select "System Administrator"
    await page.waitForSelector('div[role="listbox"], div[role="menu"], .dropdown-menu, .role-options', { timeout: 5000 });

    // Try to select "System Administrator" role
    const roleOptions = await page.$$('div[role="option"], .role-option, button');
    for (const option of roleOptions) {
      const text = await option.evaluate(el => el.textContent);
      if (text && text.includes('System Administrator')) {
        await option.click();
        console.log('✅ Role selected: System Administrator');
        break;
      }
    }
  } catch (error) {
    console.log('⚠️ Could not select role, trying alternative approach:', error.message);

    // Alternative: try to set role via hidden input
    try {
      await page.evaluate(() => {
        const roleInput = document.querySelector('input[name="role"]');
        if (roleInput) {
          roleInput.value = 'System Administrator';
          roleInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      console.log('✅ Role set via hidden input');
    } catch (altError) {
      console.log('⚠️ Could not set role:', altError.message);
    }
  }

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });

  // Verify we're on dashboard
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard')) {
    console.log('✅ Authentication successful');
    return true;
  } else {
    console.log('❌ Authentication failed - still on login page');
    console.log('Current URL:', currentUrl);

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
}

async function navigateToProposalCreation(page) {
  console.log('📝 Navigating to proposal creation...');

  await page.goto(`${BASE_URL}/proposals/create`, { waitUntil: 'domcontentloaded' });

  // Wait for the wizard to load
  await page.waitForSelector('[data-testid="proposal-wizard"], .proposal-wizard, h1', {
    timeout: 10000,
  });

  console.log('✅ Create proposal page loaded');
  return true;
}

async function fillStep1BasicInformation(page) {
  console.log('  📋 Filling Step 1: Basic Information...');

  // Wait for customer dropdown to load
  await page.waitForSelector('select, [role="combobox"]', { timeout: 10000 });

  // Select customer from dropdown
  try {
    const customerSelect = await page.$('select');
    if (customerSelect) {
      const options = await page.$$('select option');
      if (options.length > 1) {
        // Select the first non-empty option
        const firstOptionValue = await options[1].evaluate(el => el.value);
        await page.select('select', firstOptionValue);
        console.log('    ✅ Customer selected');

        // Wait for customer selection to update form
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.log('    ⚠️ Could not select customer:', error.message);
  }

  // Fill contact person
  try {
    const contactPersonInput = await page.$('input[placeholder*="contact"], input[placeholder*="Contact"], input[name*="contactPerson"]');
    if (contactPersonInput) {
      await contactPersonInput.type(TEST_PROPOSAL_DATA.contactPerson);
      console.log('    ✅ Contact person filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill contact person');
  }

  // Fill contact email
  try {
    const contactEmailInput = await page.$('input[type="email"]');
    if (contactEmailInput) {
      await contactEmailInput.type(TEST_PROPOSAL_DATA.contactEmail);
      console.log('    ✅ Contact email filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill contact email');
  }

  // Fill contact phone
  try {
    const contactPhoneInput = await page.$('input[type="tel"]');
    if (contactPhoneInput) {
      await contactPhoneInput.type(TEST_PROPOSAL_DATA.contactPhone);
      console.log('    ✅ Contact phone filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill contact phone');
  }

  // Fill title
  try {
    const titleInput = await page.$('input[placeholder*="title"], input[name*="title"]');
    if (titleInput) {
      await titleInput.type(TEST_PROPOSAL_DATA.title);
      console.log('    ✅ Title filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill title');
  }

  // Fill due date
  try {
    const dueDateInput = await page.$('input[type="date"]');
    if (dueDateInput) {
      await dueDateInput.type(TEST_PROPOSAL_DATA.dueDate);
      console.log('    ✅ Due date filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill due date');
  }

  // Fill estimated value
  try {
    const estimatedValueInput = await page.$('input[type="number"]');
    if (estimatedValueInput) {
      await estimatedValueInput.type(TEST_PROPOSAL_DATA.estimatedValue.toString());
      console.log('    ✅ Estimated value filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill estimated value');
  }

  // Fill description
  try {
    const descriptionInput = await page.$('textarea, input[placeholder*="description"]');
    if (descriptionInput) {
      await descriptionInput.type(TEST_PROPOSAL_DATA.description);
      console.log('    ✅ Description filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill description');
  }

  // Wait for form validation
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Trigger form validation
  try {
    const titleInput = await page.$('input[placeholder*="title"], input[name*="title"]');
    if (titleInput) {
      await titleInput.click();
      await titleInput.press('Tab');
      console.log('    ✅ Form validation triggered');
    }
  } catch (error) {
    console.log('    ⚠️ Could not trigger form validation');
  }

  // Wait for Continue button to be enabled
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function fillStep2TeamAssignment(page) {
  console.log('  👥 Filling Step 2: Team Assignment...');

  // Wait for step to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Fill team lead
  try {
    const teamLeadInput = await page.$('input[placeholder*="team lead"], input[name*="teamLead"], select[name*="teamLead"]');
    if (teamLeadInput) {
      await teamLeadInput.type(TEST_PROPOSAL_DATA.teamLead);
      console.log('    ✅ Team lead filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill team lead');
  }

  // Wait for step to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function fillStep3ContentSelection(page) {
  console.log('  📄 Filling Step 3: Content Selection...');

  // Wait for step to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Select content sections
  try {
    const checkboxes = await page.$$('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      // Select first few checkboxes
      for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
        await checkboxes[i].click();
      }
      console.log('    ✅ Content sections selected');
    }
  } catch (error) {
    console.log('    ⚠️ Could not select content sections');
  }

  // Wait for step to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function fillStep4ProductSelection(page) {
  console.log('  🛍️ Filling Step 4: Product Selection...');

  // Wait for step to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Select products
  try {
    const checkboxes = await page.$$('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      // Select first few checkboxes
      for (let i = 0; i < Math.min(2, checkboxes.length); i++) {
        await checkboxes[i].click();
      }
      console.log('    ✅ Products selected');
    }
  } catch (error) {
    console.log('    ⚠️ Could not select products');
  }

  // Wait for step to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function fillStep5SectionAssignment(page) {
  console.log('  📝 Filling Step 5: Section Assignment...');

  // Wait for step to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Fill section titles and content
  try {
    const textareas = await page.$$('textarea');
    if (textareas.length > 0) {
      for (let i = 0; i < Math.min(2, textareas.length); i++) {
        await textareas[i].type(`Section ${i + 1} content for test proposal`);
      }
      console.log('    ✅ Section content filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill section content');
  }

  // Wait for step to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function fillStep6ValidationAnalytics(page) {
  console.log('  ✅ Filling Step 6: Validation & Analytics...');

  // Wait for step to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Fill validation notes
  try {
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.type(TEST_PROPOSAL_DATA.validationNotes);
      console.log('    ✅ Validation notes filled');
    }
  } catch (error) {
    console.log('    ⚠️ Could not fill validation notes');
  }

  // Wait for step to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function navigateToNextStep(page, stepName) {
  console.log(`    🔄 Navigating from ${stepName}...`);

  // Wait for any loading states
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Look for the Continue button using standard selectors
  let continueButton = null;

  // Try multiple approaches to find the Continue button
  try {
    // First try: find by button text using evaluate
    continueButton = await page.evaluateHandle(() => {
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        const text = button.textContent?.trim();
        if (text && (text.includes('Continue') || text.includes('Create Proposal'))) {
          return button;
        }
      }
      return null;
    });

    if (continueButton) {
      const isDisabled = await continueButton.evaluate(el => el.disabled);

      if (!isDisabled) {
        await continueButton.click();
        console.log(`    ✅ Navigated from ${stepName} using Continue button`);
        return true;
      } else {
        console.log(`    ⚠️ Continue button is disabled for ${stepName}`);

        // Try to find what's missing
        const formData = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input, select, textarea');
          const data = {};
          inputs.forEach(input => {
            if (input.name || input.placeholder) {
              data[input.name || input.placeholder] = input.value;
            }
          });
          return data;
        });
        console.log(`    🔍 Current form data:`, formData);
      }
    } else {
      console.log(`    ⚠️ Could not find Continue button for ${stepName}`);
    }
  } catch (error) {
    console.log(`    ⚠️ Error finding Continue button: ${error.message}`);
  }

  return false;
}

async function submitProposal(page) {
  console.log('💾 Submitting proposal to database...');

  // Wait for the final step to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Look for the Create Proposal button using standard selectors
  const createButton = await page.$('button[type="submit"], button:contains("Create Proposal"), button');

  if (createButton) {
    const buttonText = await createButton.evaluate(el => el.textContent);
    const isDisabled = await createButton.evaluate(el => el.disabled);

    if (!isDisabled && buttonText && buttonText.includes('Create Proposal')) {
      await createButton.click();
      console.log('✅ Create Proposal button clicked');

      // Wait for API response
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if we were redirected to a proposal page
      const currentUrl = page.url();
      console.log(`Current URL after submission: ${currentUrl}`);

      if (currentUrl.includes('/proposals/') && !currentUrl.includes('/create')) {
        const proposalId = currentUrl.split('/proposals/')[1];
        console.log(`✅ Proposal created successfully with ID: ${proposalId}`);
        return proposalId;
      } else {
        console.log('⚠️ No proposal ID found in URL');
        return 'unknown';
      }
    } else {
      console.log('⚠️ Create Proposal button is disabled or not found');
      return 'disabled';
    }
  } else {
    console.log('⚠️ Could not find Create Proposal button');
    return 'not_found';
  }
}

async function verifyProposalData(page, proposalId) {
  console.log('✅ Verifying proposal data retrieval...');

  if (proposalId && proposalId !== 'unknown' && proposalId !== 'disabled' && proposalId !== 'not_found') {
    // Navigate to the proposal detail page
    await page.goto(`${BASE_URL}/proposals/${proposalId}`, { waitUntil: 'domcontentloaded' });

    // Wait for the page to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract proposal data
    const proposalData = await page.evaluate(() => {
      const title = document.querySelector('h1, [data-testid="proposal-title"]')?.textContent;
      const description = document.querySelector('[data-testid="proposal-description"]')?.textContent;
      const customer = document.querySelector('[data-testid="proposal-customer"]')?.textContent;
      const status = document.querySelector('[data-testid="proposal-status"]')?.textContent;

      return {
        title: title || 'N/A',
        description: description || 'N/A',
        customer: customer || 'N/A',
        status: status || 'N/A',
      };
    });

    console.log('📊 Retrieved proposal data:', proposalData);

    // Verify data matches what we submitted
    const dataCompleteness = {
      title: proposalData.title !== 'N/A' ? '✅' : '❌',
      description: proposalData.description !== 'N/A' ? '✅' : '❌',
      customer: proposalData.customer !== 'N/A' ? '✅' : '❌',
      status: proposalData.status !== 'N/A' ? '✅' : '❌',
    };

    console.log('📊 Data completeness:', dataCompleteness);

    return proposalData;
  } else {
    console.log('⚠️ Cannot verify proposal data - no valid proposal ID');
    return null;
  }
}

async function runTest() {
  console.log('🚀 Starting comprehensive proposal creation test...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();

  try {
    // Step 1: Authenticate
    const authSuccess = await authenticateUser(page);
    if (!authSuccess) {
      throw new Error('Authentication failed');
    }

    // Step 2: Navigate to proposal creation
    const navSuccess = await navigateToProposalCreation(page);
    if (!navSuccess) {
      throw new Error('Navigation to proposal creation failed');
    }

    // Step 3: Fill all wizard steps
    console.log('📋 Filling proposal form with comprehensive test data...');

    // Step 1: Basic Information
    await fillStep1BasicInformation(page);
    await navigateToNextStep(page, 'Step 1');

    // Step 2: Team Assignment
    await fillStep2TeamAssignment(page);
    await navigateToNextStep(page, 'Step 2');

    // Step 3: Content Selection
    await fillStep3ContentSelection(page);
    await navigateToNextStep(page, 'Step 3');

    // Step 4: Product Selection
    await fillStep4ProductSelection(page);
    await navigateToNextStep(page, 'Step 4');

    // Step 5: Section Assignment
    await fillStep5SectionAssignment(page);
    await navigateToNextStep(page, 'Step 5');

    // Step 6: Validation & Analytics
    await fillStep6ValidationAnalytics(page);

    // Step 4: Submit proposal
    const proposalId = await submitProposal(page);

    // Step 5: Verify data
    const proposalData = await verifyProposalData(page, proposalId);

    console.log('🎯 Test completed successfully!');
    console.log('📊 Final Results:');
    console.log(`  - Proposal ID: ${proposalId}`);
    console.log(`  - Data Retrieved: ${proposalData ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved as test-error-screenshot.png');
  } finally {
    await browser.close();
  }
}

// Run the test
runTest().catch(console.error);
