#!/usr/bin/env node

/**
 * ProposalWizard Puppeteer Test Runner
 * Runs browser-based tests for proposal creation functionality
 *
 * Usage: node scripts/test-proposal-wizard-puppeteer.js
 */

const puppeteer = require('puppeteer');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function login(page) {
  await page.goto('http://localhost:3000/auth/login', {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });
  // If already logged in, dashboard will redirect quickly
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.type('input[type="email"]', 'admin@posalpro.com');
    await page.type('input[type="password"]', 'ProposalPro2024!');
    const signInBtn = await page.$('button, [type="submit"]');
    if (signInBtn) await signInBtn.click();
    await page
      .waitForResponse(resp => resp.url().includes('/api/auth/session'), { timeout: 15000 })
      .catch(() => {});
    await wait(1000);
  } catch (_) {
    // Probably already authenticated
  }
}

async function waitForWizardStep1(page) {
  await page.goto('http://localhost:3000/proposals/create', {
    waitUntil: 'networkidle0',
    timeout: 60000,
  });
  // Wait for the wizard container
  await page.waitForFunction(
    () =>
      !!document.querySelector('.form-container') ||
      !!document.querySelector('input[name="client.contactPerson"]'),
    { timeout: 30000 }
  );
}

async function fillStep1(page) {
  const titleSel =
    'input[name="details.title"], input[placeholder*="title"], [data-testid="proposal-title"]';
  const descSel =
    'textarea[name="details.description"], textarea[placeholder*="description"], [data-testid="proposal-description"]';
  const rfpSel = 'input[name="details.rfpReferenceNumber"], input[placeholder*="rfp" i]';
  const dueSel = 'input[name="details.dueDate"], input[type="date"], [data-testid="due-date"]';

  if (await page.$(titleSel)) {
    await page.type(titleSel, 'Automated E2E Proposal');
    await page.keyboard.press('Tab');
  }
  if (await page.$(descSel)) {
    await page.type(descSel, 'Automated description with enough length to satisfy validation.');
    await page.keyboard.press('Tab');
  }
  if (await page.$('input[name="client.contactPerson"]')) {
    await page.type('input[name="client.contactPerson"]', 'QA Bot');
    await page.keyboard.press('Tab');
  }
  if (await page.$('input[name="client.contactEmail"]')) {
    await page.type('input[name="client.contactEmail"]', 'qa.bot@posalpro.local');
    await page.keyboard.press('Tab');
  }
  if (await page.$(rfpSel)) {
    await page.type(rfpSel, 'RFP-2025-TEST-001');
    await page.keyboard.press('Tab');
  }
  if (await page.$(dueSel)) {
    // Set date via DOM to avoid locale typing quirks
    await page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.value = '2025-12-31';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, dueSel);
    // Focus and blur to trigger RHF onBlur mode
    await page.click(dueSel);
    await wait(100);
    await page.keyboard.press('Tab');
  }

  // Customer combobox: prefer the one under the "Select Customer" label
  let customerSelected = false;
  try {
    await page.evaluate(() => {
      const labels = Array.from(document.querySelectorAll('label'));
      const custLabel = labels.find(l =>
        (l.textContent || '').toLowerCase().includes('select customer')
      );
      if (custLabel) {
        const container = custLabel.closest('div');
        const combo = container && container.querySelector('div[role="combobox"]');
        if (combo) combo.click();
      }
    });
    await page.waitForSelector('div[role="listbox"] [role="option"]', { timeout: 5000 });
    const opts = await page.$$('div[role="listbox"] [role="option"]');
    if (opts.length > 0) {
      await opts[0].click();
    }
    await wait(500);
    // verify hidden input set
    const clientIdVal = await page.$eval(
      'input[name="client.id"]',
      el => el.getAttribute('value') || el.value || ''
    );
    if (clientIdVal && clientIdVal.length > 0) customerSelected = true;
  } catch {}
  if (!customerSelected) {
    try {
      const combos = await page.$$('div[role="combobox"]');
      if (combos.length > 0) {
        await combos[0].click();
        await page
          .waitForSelector('div[role="listbox"] [role="option"]', { timeout: 5000 })
          .catch(() => {});
        const opts = await page.$$('div[role="listbox"] [role="option"]');
        if (opts.length > 0) await opts[0].click();
        await wait(400);
      }
    } catch {}
  }

  // Force blur all key fields to trigger debounced parent update
  await page.evaluate(() => {
    const blur = sel => {
      const el = document.querySelector(sel);
      if (el && typeof el.blur === 'function') el.blur();
    };
    blur('input[name="details.title"]');
    blur('textarea[name="details.description"]');
    blur('input[name="client.contactPerson"]');
    blur('input[name="client.contactEmail"]');
    blur('input[name="details.dueDate"]');
  });
  await wait(900);
}

async function clickContinue(page) {
  // Try multiple times to allow validation to settle
  for (let attempt = 0; attempt < 20; attempt++) {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const txt = ((await (await b.getProperty('textContent')).jsonValue()) || '')
        .toString()
        .trim()
        .toLowerCase();
      if (txt.includes('continue') || txt.includes('create proposal')) {
        const isDisabled = await (await b.getProperty('disabled')).jsonValue();
        if (isDisabled) continue;
        await b.focus();
        await b.click({ delay: 20 });
        await wait(700);
        return true;
      }
    }
    // Trigger blur/validation and retry
    await page.keyboard.press('Tab');
    await wait(500);
  }
  // Final attempt: explicitly click any visible primary button
  const fallback = await page.$(
    'button:not([disabled]).bg-blue-600, button:not([disabled]).bg-blue-700'
  );
  if (fallback) {
    await fallback.click({ delay: 20 });
    await wait(700);
    return true;
  }
  return false;
}

async function waitForStepTitle(page, expectedTitle, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const title = await page.$eval('h1, h2', el => (el.textContent || '').trim());
      if ((title || '').toLowerCase().includes((expectedTitle || '').toLowerCase())) return true;
    } catch (_) {}
    await wait(300);
  }
  throw new Error(`Timeout waiting for step title '${expectedTitle}'`);
}

async function fillStep2(page) {
  // Pick first two comboboxes for teamLead and salesRep
  const combos = await page.$$('div[role="combobox"]');
  for (let i = 0; i < Math.min(2, combos.length); i++) {
    await combos[i].click();
    await page
      .waitForSelector('div[role="listbox"] [role="option"]', { timeout: 5000 })
      .catch(() => {});
    const opts = await page.$$('div[role="listbox"] [role="option"]');
    if (opts.length > 0) await opts[0].click();
    await new Promise(r => setTimeout(r, 200));
  }
}

async function fillStep3(page) {
  // Click first two "Add" buttons in Available Content without XPath
  const buttons = await page.$$('button');
  let added = 0;
  for (const b of buttons) {
    const txt = ((await (await b.getProperty('textContent')).jsonValue()) || '').toString().trim();
    if (txt.toLowerCase().includes('add')) {
      await b.click();
      added += 1;
      await wait(200);
      if (added >= 2) break;
    }
  }
}

async function fillStep5(page) {
  // Assign first section to first user if combobox present
  const combos = await page.$$('td [role="combobox"], div[role="combobox"]');
  if (combos.length > 0) {
    await combos[0].click();
    await page
      .waitForSelector('div[role="listbox"] [role="option"]', { timeout: 5000 })
      .catch(() => {});
    const opts = await page.$$('div[role="listbox"] [role="option"]');
    if (opts.length > 0) await opts[0].click();
  }
}

async function finalizeStep6(page) {
  // Check final review checkbox and click Create Proposal
  const finalCb = await page.$('input[type="checkbox"]');
  if (finalCb) await finalCb.click();
  await clickContinue(page);
}

async function navigateToEdit(page, proposalId) {
  const url = `http://localhost:3000/proposals/create?edit=${proposalId}`;
  console.log(`🔁 Reopening wizard in edit mode: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(
    () => !!document.querySelector('.form-container') || !!document.querySelector('h1'),
    { timeout: 30000 }
  );
}

async function assertStep2Prefilled(page) {
  console.log('🔎 Verifying Step 2 prefills (teamLead, salesRep, SMEs)...');
  // Navigate to Step 2 if needed
  await clickContinue(page);
  await wait(800);
  const combos = await page.$$('div[role="combobox"]');
  if (combos.length === 0) throw new Error('No combobox found on Step 2');
  // Read first two combobox texts
  const texts = [];
  for (let i = 0; i < Math.min(2, combos.length); i++) {
    const t = await page.evaluate(el => el.textContent || '', combos[i]);
    texts.push((t || '').trim());
  }
  const hasLead = texts[0] && !texts[0].toLowerCase().includes('select');
  const hasRep = texts[1] && !texts[1].toLowerCase().includes('select');
  if (!hasLead || !hasRep)
    throw new Error(`Step 2 not prefilled: lead='${texts[0]}', rep='${texts[1]}'`);
  console.log('✅ Step 2 prefilled');
}

async function assertStep3Prefilled(page) {
  console.log('🔎 Verifying Step 3 selected content...');
  await clickContinue(page);
  await wait(800);
  // Find Selected Content header and ensure count > 0
  const headerText = await page.$$eval('h3', els =>
    (els.map(e => e.textContent || '').find(t => t.includes('Selected Content')) || '').trim()
  );
  if (!headerText) throw new Error('Selected Content header not found');
  const match = headerText.match(/Selected Content\s*\((\d+)\)/i);
  const count = match ? parseInt(match[1], 10) : 0;
  if (!count || count <= 0) throw new Error(`No selected content detected: '${headerText}'`);
  console.log(`✅ Step 3 selected content count: ${count}`);
}

async function assertStep5Prefilled(page) {
  console.log('🔎 Verifying Step 5 section assignments...');
  // Skip Step 4
  await clickContinue(page);
  await wait(800);
  // On Step 5, check first assignee combobox text not Unassigned / empty
  const firstAssignee = await page.$('td [role="combobox"], div[role="combobox"]');
  if (!firstAssignee) throw new Error('No assignee combobox found on Step 5');
  const txt = await page.evaluate(el => el.textContent || '', firstAssignee);
  const label = (txt || '').trim().toLowerCase();
  if (label.length === 0 || label.includes('unassigned') || label.includes('select')) {
    throw new Error(`Step 5 not prefilled: '${txt}'`);
  }
  console.log('✅ Step 5 has assigned section(s)');
}

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

    // Ensure we are authenticated
    await login(page);
    console.log('🌐 Navigating to proposal creation page...');
    await waitForWizardStep1(page);
    console.log('✅ Wizard loaded');

    // Fill out the form
    console.log('📝 Filling out proposal form...');

    await fillStep1(page);

    await clickContinue(page);
    await waitForStepTitle(page, 'Team Assignment', 25000);

    // Wait for either next step or POST /api/proposals (final step)
    console.log('⏳ Waiting for step 2...');
    await wait(800);
    await fillStep2(page);
    await clickContinue(page);
    await wait(800);
    await fillStep3(page);
    await clickContinue(page);
    await wait(800);
    await fillStep5(page);
    await clickContinue(page);
    await wait(800);
    await finalizeStep6(page);
    // Wait for POST /api/proposals and capture created ID
    const createResp = await page.waitForResponse(
      r => r.url().includes('/api/proposals') && r.request().method() === 'POST',
      { timeout: 30000 }
    );
    let createdProposalId = '';
    try {
      const body = await createResp.json();
      createdProposalId = body?.data?.id || body?.id || '';
      console.log(`🆔 Created proposal ID: ${createdProposalId}`);
    } catch (e) {
      console.log('⚠️ Could not parse creation response JSON');
    }

    if (!createdProposalId) {
      // Try to extract from URL if redirected
      const currentUrl = page.url();
      const m = currentUrl.match(/\/proposals\/([^/?#]+)/);
      if (m) createdProposalId = m[1];
    }

    if (!createdProposalId) throw new Error('Missing created proposal ID');

    // Reopen in edit mode and verify prefills for Steps 2, 3, 5
    await navigateToEdit(page, createdProposalId);
    await assertStep2Prefilled(page);
    await assertStep3Prefilled(page);
    await assertStep5Prefilled(page);

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
      const fs = require('fs');
      fs.mkdirSync('test-results', { recursive: true });
      await page.screenshot({ path: 'test-results/proposal-creation-result.png' });
      console.log('📸 Screenshot saved to test-results/proposal-creation-result.png');
    }

    // Wait a bit to see the result
    await wait(1500);

    console.log('✅ Proposal creation test completed');
  } catch (error) {
    console.error('❌ Test failed:', error);

    // Take a screenshot for debugging
    if (page) {
      const fs = require('fs');
      fs.mkdirSync('test-results', { recursive: true });
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
