#!/usr/bin/env tsx

/**
 * Test Proposal Update Fix
 *
 * This script simulates the exact same payload that the wizard sends when updating a proposal
 * to verify that the product data is properly saved to the database.
 *
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 */

import { prisma } from '../src/lib/db/prisma';
import { logError, logInfo } from '../src/lib/logger';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

interface TestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Authentication helper class (simplified from app-cli.ts)
class AuthHelper {
  private jar: any;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.jar = new (require('tough-cookie').CookieJar)();
  }

  async login(email: string, password: string, role?: string) {
    logInfo('CLI: Login attempt started', {
      component: 'TestProposalUpdateFix',
      operation: 'login',
      email,
      role,
    });

    // Step 1: Get CSRF token
    const csrfRes = await fetch(`${this.baseUrl}/api/auth/csrf`);
    if (csrfRes.status !== 200) {
      throw new Error(`CSRF fetch failed (${csrfRes.status})`);
    }

    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;

    logInfo('CLI: CSRF token retrieved', {
      component: 'TestProposalUpdateFix',
      operation: 'login_csrf_success',
      csrfToken: csrfToken ? 'present' : 'missing',
    });

    // Step 2: Login with credentials
    const loginRes = await fetch(`${this.baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email,
        password,
        csrfToken,
        callbackUrl: `${this.baseUrl}/dashboard`,
        json: 'true',
      }),
      credentials: 'include',
    });

    if (loginRes.status !== 302 && loginRes.status !== 200) {
      const text = await loginRes.text();
      throw new Error(`Login failed (${loginRes.status}): ${text}`);
    }

    logInfo('CLI: Login successful', {
      component: 'TestProposalUpdateFix',
      operation: 'login_success',
      status: loginRes.status,
      email,
      role,
    });
  }

  async makeAuthenticatedRequest(url: string, options: any = {}) {
    const cookies = await this.jar.getCookieString(url);

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Cookie: cookies,
      },
      credentials: 'include',
    });
  }
}

async function testProposalUpdateFix(): Promise<void> {
  console.log('🧪 Testing Proposal Update Fix');
  console.log('='.repeat(60));
  console.log('This test simulates the exact wizard payload structure');
  console.log('to verify that product data is properly saved to the database.');
  console.log('');

  const results: TestResult[] = [];
  const auth = new AuthHelper(BASE_URL);

  try {
    // Step 1: Get test data
    console.log('📋 Step 1: Retrieving test data...');
    const customer = await prisma.customer.findFirst();
    const products = await prisma.product.findMany({ take: 3 });
    const user = await prisma.user.findFirst();

    if (!customer || !products.length || !user) {
      throw new Error('Missing test data: customer, products, or user');
    }

    results.push({
      step: 'Get Test Data',
      success: true,
      message: `Found customer: ${customer.name}, ${products.length} products, user: ${user.name}`,
      data: { customerId: customer.id, productCount: products.length, userId: user.id },
    });

    console.log('✅ Test data retrieved successfully');
    console.log(`   Customer: ${customer.name} (${customer.id})`);
    console.log(`   Products: ${products.length} found`);
    console.log(`   User: ${user.name} (${user.id})`);

    // Step 2: Authenticate
    console.log('\n📋 Step 2: Authenticating...');
    try {
      await auth.login(user.email, user.password || 'password123');
      results.push({
        step: 'Authentication',
        success: true,
        message: `Authenticated as ${user.email}`,
        data: { email: user.email, role: user.department },
      });
      console.log('✅ Authentication successful');
    } catch (authError) {
      console.log('⚠️ Authentication failed, trying without auth...');
      results.push({
        step: 'Authentication',
        success: false,
        message: `Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`,
        error: authError instanceof Error ? authError.message : 'Unknown error',
      });
    }

    // Step 3: Create a test proposal
    console.log('\n📋 Step 3: Creating test proposal...');
    const testProposal = await prisma.proposal.create({
      data: {
        title: 'Test Proposal for Update Fix',
        description: 'Testing the proposal update fix with wizard payload',
        customerId: customer.id,
        createdBy: user.id,
        status: 'DRAFT',
        priority: 'MEDIUM',
        value: 100000,
        currency: 'USD',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        customer: true,
        products: {
          include: {
            product: true,
          },
        },
        sections: true,
      },
    });

    results.push({
      step: 'Create Test Proposal',
      success: true,
      message: `Created proposal: ${testProposal.id}`,
      data: { proposalId: testProposal.id, initialProductCount: testProposal.products.length },
    });

    console.log('✅ Test proposal created successfully');
    console.log(`   Proposal ID: ${testProposal.id}`);
    console.log(`   Initial products: ${testProposal.products.length}`);

    // Step 4: Create the exact wizard payload structure
    console.log('\n📋 Step 4: Creating wizard payload structure...');

    // This is the EXACT same structure that the wizard sends
    const wizardPayload = {
      title: 'Updated Test Proposal',
      description: 'Updated description for testing',
      customerId: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'HIGH' as const,
      value: 150000,
      currency: 'USD',
      projectType: 'RFP',
      tags: ['test', 'wizard', 'updated'],
      teamData: {
        teamLead: user.id,
        salesRepresentative: user.id,
        subjectMatterExperts: {
          TECHNICAL: user.id,
          FINANCIAL: user.id,
        },
        executiveReviewers: [user.id],
        teamMembers: [
          {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        ],
      },
      contentData: {
        selectedTemplates: ['executive-summary', 'technical-specs'],
        customContent: [
          {
            id: 'custom-1',
            title: 'Custom Section',
            content: 'This is custom content for testing',
            type: 'text',
          },
        ],
        contentLibrary: [
          {
            id: 'executive-summary',
            title: 'Executive Summary',
            category: 'Overview',
            isSelected: true,
          },
          {
            id: 'technical-specs',
            title: 'Technical Specifications',
            category: 'Technical',
            isSelected: true,
          },
        ],
      },
      productData: {
        products: products.map((product, index) => ({
          id: `wizard-product-${index}`,
          productId: product.id,
          name: product.name,
          quantity: (index + 1) * 2, // Different quantities for testing
          unitPrice: 15000 + index * 3000, // Different prices
          total: (index + 1) * 2 * (15000 + index * 3000),
          discount: index * 5, // Different discounts
          category: product.category[0] || 'General',
          configuration: {
            customField: `test-config-${index}`,
            options: [`option-${index}-1`, `option-${index}-2`],
          },
          included: true,
        })),
        totalValue: products.reduce(
          (sum, _, index) => sum + (index + 1) * 2 * (15000 + index * 3000),
          0
        ),
        searchQuery: 'test search',
        selectedCategory: 'All',
      },
      sectionData: {
        sections: [
          {
            id: 'section-1',
            type: 'TEXT',
            order: 1,
            title: 'Updated Introduction',
            content: 'This is an updated introduction section for testing.',
            isRequired: true,
          },
          {
            id: 'section-2',
            type: 'TEXT',
            order: 2,
            title: 'Technical Overview',
            content: 'This is a technical overview section for testing.',
            isRequired: false,
          },
        ],
        sectionTemplates: [
          {
            id: 'intro',
            title: 'Introduction',
            content: 'Introduction section template...',
            category: 'Overview',
          },
          {
            id: 'technical',
            title: 'Technical Overview',
            content: 'Technical overview section template...',
            category: 'Technical',
          },
        ],
      },
      reviewData: {
        validationChecklist: [
          {
            id: 'basic-info',
            title: 'Basic Information',
            isChecked: true,
            isRequired: true,
          },
          {
            id: 'team-assignment',
            title: 'Team Assignment',
            isChecked: true,
            isRequired: true,
          },
          {
            id: 'product-selection',
            title: 'Product Selection',
            isChecked: true,
            isRequired: true,
          },
        ],
        totalProducts: products.length,
        totalValue: products.reduce(
          (sum, _, index) => sum + (index + 1) * 2 * (15000 + index * 3000),
          0
        ),
        totalSections: 2,
      },
    };

    results.push({
      step: 'Create Wizard Payload',
      success: true,
      message: `Created wizard payload with ${wizardPayload.productData.products.length} products`,
      data: {
        productCount: wizardPayload.productData.products.length,
        sectionCount: wizardPayload.sectionData.sections.length,
        totalValue: wizardPayload.productData.totalValue,
      },
    });

    console.log('✅ Wizard payload created successfully');
    console.log(`   Products in payload: ${wizardPayload.productData.products.length}`);
    console.log(`   Sections in payload: ${wizardPayload.sectionData.sections.length}`);
    console.log(`   Total value: $${wizardPayload.productData.totalValue.toLocaleString()}`);

    // Step 5: Update the proposal using the API
    console.log('\n📋 Step 5: Updating proposal via API...');

    const updateResponse = await auth.makeAuthenticatedRequest(
      `${BASE_URL}/api/proposals/${testProposal.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wizardPayload),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`API update failed: ${updateResponse.status} - ${JSON.stringify(errorData)}`);
    }

    const updateResult = await updateResponse.json();

    results.push({
      step: 'Update Proposal via API',
      success: true,
      message: `Proposal updated successfully via API`,
      data: {
        responseStatus: updateResponse.status,
        proposalId: updateResult.data?.id,
      },
    });

    console.log('✅ Proposal updated successfully via API');
    console.log(`   Response status: ${updateResponse.status}`);
    console.log(`   Updated proposal ID: ${updateResult.data?.id}`);

    // Step 6: Fetch the updated proposal to verify changes
    console.log('\n📋 Step 6: Fetching updated proposal to verify changes...');

    const fetchResponse = await auth.makeAuthenticatedRequest(
      `${BASE_URL}/api/proposals/${testProposal.id}`
    );

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch updated proposal: ${fetchResponse.status}`);
    }

    const fetchedProposal = await fetchResponse.json();

    results.push({
      step: 'Fetch Updated Proposal',
      success: true,
      message: `Fetched updated proposal successfully`,
      data: {
        responseStatus: fetchResponse.status,
        proposalId: fetchedProposal.data?.id,
      },
    });

    console.log('✅ Updated proposal fetched successfully');

    // Step 7: Verify the changes in the database
    console.log('\n📋 Step 7: Verifying changes in the database...');

    const dbProposal = await prisma.proposal.findUnique({
      where: { id: testProposal.id },
      include: {
        customer: true,
        products: {
          include: {
            product: true,
          },
        },
        sections: true,
      },
    });

    if (!dbProposal) {
      throw new Error('Proposal not found in database after update');
    }

    // Verify basic fields
    const basicFieldsMatch =
      dbProposal.title === wizardPayload.title &&
      dbProposal.description === wizardPayload.description &&
      dbProposal.priority === wizardPayload.priority &&
      dbProposal.value === wizardPayload.value;

    // Verify products
    const productsMatch = dbProposal.products.length === wizardPayload.productData.products.length;

    // Verify sections
    const sectionsMatch = dbProposal.sections.length === wizardPayload.sectionData.sections.length;

    // Verify metadata
    const metadata = dbProposal.metadata as any;
    const metadataHasProductData =
      metadata?.productData?.products?.length === wizardPayload.productData.products.length;

    results.push({
      step: 'Verify Database Changes',
      success: basicFieldsMatch && productsMatch && sectionsMatch && metadataHasProductData,
      message: `Database verification: Basic fields: ${basicFieldsMatch}, Products: ${productsMatch}, Sections: ${sectionsMatch}, Metadata: ${metadataHasProductData}`,
      data: {
        basicFieldsMatch,
        productsMatch,
        sectionsMatch,
        metadataHasProductData,
        dbProductCount: dbProposal.products.length,
        dbSectionCount: dbProposal.sections.length,
        expectedProductCount: wizardPayload.productData.products.length,
        expectedSectionCount: wizardPayload.sectionData.sections.length,
      },
    });

    console.log('✅ Database verification completed');
    console.log(`   Basic fields match: ${basicFieldsMatch ? '✅' : '❌'}`);
    console.log(
      `   Products match: ${productsMatch ? '✅' : '❌'} (${dbProposal.products.length}/${wizardPayload.productData.products.length})`
    );
    console.log(
      `   Sections match: ${sectionsMatch ? '✅' : '❌'} (${dbProposal.sections.length}/${wizardPayload.sectionData.sections.length})`
    );
    console.log(`   Metadata has product data: ${metadataHasProductData ? '✅' : '❌'}`);

    // Step 8: Display detailed product information
    console.log('\n📋 Step 8: Detailed product verification...');
    console.log('Expected products from wizard payload:');
    wizardPayload.productData.products.forEach((product, index) => {
      console.log(
        `   ${index + 1}. ${product.name} - Qty: ${product.quantity}, Price: $${product.unitPrice}, Total: $${product.total}`
      );
    });

    console.log('\nActual products in database:');
    dbProposal.products.forEach((product, index) => {
      console.log(
        `   ${index + 1}. ${product.product.name} - Qty: ${product.quantity}, Price: $${product.unitPrice}, Total: $${product.total}`
      );
    });

    // Step 9: Test the proposal detail page data structure
    console.log('\n📋 Step 9: Testing proposal detail page data structure...');

    // Simulate what the proposal detail page would receive
    const detailPageData = {
      proposal: dbProposal,
      productData: getProductData(dbProposal.metadata),
    };

    const detailPageProductCount =
      detailPageData.proposal.products.length || detailPageData.productData?.products?.length || 0;
    const detailPageTotalValue = calculateTotalValue(
      detailPageData.proposal,
      detailPageData.productData
    );

    results.push({
      step: 'Test Detail Page Data',
      success: detailPageProductCount === wizardPayload.productData.products.length,
      message: `Detail page shows ${detailPageProductCount} products, expected ${wizardPayload.productData.products.length}`,
      data: {
        detailPageProductCount,
        expectedProductCount: wizardPayload.productData.products.length,
        detailPageTotalValue,
        expectedTotalValue: wizardPayload.productData.totalValue,
      },
    });

    console.log('✅ Detail page data structure test completed');
    console.log(`   Detail page product count: ${detailPageProductCount}`);
    console.log(`   Detail page total value: $${detailPageTotalValue.toLocaleString()}`);

    // Step 10: Cleanup
    console.log('\n📋 Step 10: Cleaning up test data...');

    await prisma.proposal.delete({
      where: { id: testProposal.id },
    });

    results.push({
      step: 'Cleanup',
      success: true,
      message: 'Test proposal deleted successfully',
    });

    console.log('✅ Test data cleaned up successfully');

    // Final summary
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(60));

    const successfulSteps = results.filter(r => r.success).length;
    const totalSteps = results.length;

    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} Step ${index + 1}: ${result.step}`);
      console.log(`   ${result.message}`);
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    console.log(`Overall Result: ${successfulSteps}/${totalSteps} steps successful`);

    if (successfulSteps === totalSteps) {
      console.log('🎉 ALL TESTS PASSED! The proposal update fix is working correctly.');
      console.log('✅ Product data is properly saved to the database');
      console.log('✅ Proposal detail page will show the correct product information');
    } else {
      console.log('❌ SOME TESTS FAILED! There may still be issues with the update fix.');
    }
  } catch (error) {
    logError('Test failed', error, {
      component: 'TestProposalUpdateFix',
      operation: 'testProposalUpdateFix',
    });

    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');

    results.push({
      step: 'Error Handling',
      success: false,
      message: 'Test failed with error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Helper functions to simulate the proposal detail page logic
function getProductData(metadata: any) {
  if (!metadata?.productData) return null;
  return {
    products: Array.isArray(metadata.productData.products) ? metadata.productData.products : [],
    totalValue: metadata.productData.totalValue || 0,
  };
}

function calculateTotalValue(proposal: any, productData: any) {
  // Prioritize database products over metadata (same logic as ProposalDetailView)
  if (proposal?.products && proposal.products.length > 0) {
    return proposal.products.reduce((sum: number, product: any) => sum + (product.total || 0), 0);
  }
  if (productData?.products && productData.products.length > 0) {
    return productData.products.reduce(
      (sum: number, product: any) => sum + (product.total || 0),
      0
    );
  }
  return productData?.totalValue || proposal?.value || 0;
}

// Run the test
testProposalUpdateFix().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
