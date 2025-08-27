#!/usr/bin/env tsx

/**
 * Test Wizard Payload Structure
 *
 * This script investigates the data mismatch between wizard payload and API schema
 */

import { prisma } from '../src/lib/db/prisma';
import { logError } from '../src/lib/logger';

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

async function testWizardPayload() {
  console.log('🔍 Testing Wizard Payload Structure');
  console.log('='.repeat(50));

  try {
    // Get test data
    const customer = await prisma.customer.findFirst();
    const products = await prisma.product.findMany({ take: 2 });
    const user = await prisma.user.findFirst();

    if (!customer || !products.length || !user) {
      throw new Error('Missing test data');
    }

    console.log('✅ Test data retrieved');
    console.log(`  Customer: ${customer.name} (${customer.id})`);
    console.log(`  Products: ${products.length} found`);
    console.log(`  User: ${user.name} (${user.id})`);

    // Create the payload that the wizard would send
    const wizardPayload = {
      title: 'Test Proposal',
      description: 'Testing wizard payload structure',
      customerId: customer.id,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'MEDIUM' as const,
      value: 50000,
      currency: 'USD',
      projectType: 'RFQ',
      tags: ['test', 'wizard'],
      teamData: {
        teamLead: user.id,
        salesRepresentative: user.id,
        subjectMatterExperts: {
          TECHNICAL: user.id,
        },
        executiveReviewers: [],
      },
      contentData: {
        selectedTemplates: ['executive-summary'],
        customContent: [],
        contentLibrary: [
          {
            id: 'executive-summary',
            title: 'Executive Summary',
            category: 'Overview',
            isSelected: true,
          },
        ],
      },
      productData: {
        products: products.map((product, index) => ({
          id: `temp-${index}`,
          productId: product.id,
          name: product.name,
          quantity: index + 1,
          unitPrice: 10000 + index * 5000,
          total: (10000 + index * 5000) * (index + 1),
          discount: 0,
          category: product.category[0] || 'General',
          configuration: {},
          included: true,
        })),
        totalValue: products.reduce(
          (sum, _, index) => sum + (10000 + index * 5000) * (index + 1),
          0
        ),
        searchQuery: '',
        selectedCategory: '',
      },
      sectionData: {
        sections: [
          {
            id: 'section-1',
            type: 'TEXT',
            order: 1,
            title: 'Introduction',
            content: 'This is a test section.',
            isRequired: true,
          },
        ],
        sectionTemplates: [
          {
            id: 'intro',
            title: 'Introduction',
            content: 'Introduction section template...',
            category: 'Overview',
          },
        ],
      },
    };

    console.log('\n📋 Wizard Payload Structure:');
    console.log('='.repeat(50));
    console.log('Top-level fields:', Object.keys(wizardPayload));
    console.log('Nested data fields:', ['teamData', 'contentData', 'productData', 'sectionData']);

    console.log('\n🔍 Schema Validation Issues:');
    console.log('='.repeat(50));

    // Check what the schema expects vs what we're sending
    console.log('❌ PROBLEM: Schema expects nested structure under metadata');
    console.log('✅ SOLUTION: Transform flat structure to nested structure');

    // Create the correct payload structure
    const correctPayload = {
      title: wizardPayload.title,
      description: wizardPayload.description,
      customerId: wizardPayload.customerId,
      dueDate: wizardPayload.dueDate,
      priority: wizardPayload.priority,
      value: wizardPayload.value,
      currency: wizardPayload.currency,
      projectType: wizardPayload.projectType,
      tags: wizardPayload.tags,
      metadata: {
        teamData: wizardPayload.teamData,
        contentData: wizardPayload.contentData,
        productData: wizardPayload.productData,
        sectionData: wizardPayload.sectionData,
        submittedAt: new Date().toISOString(),
        wizardVersion: 'modern',
      },
    };

    console.log('\n✅ Correct Payload Structure:');
    console.log('='.repeat(50));
    console.log('Top-level fields:', Object.keys(correctPayload));
    console.log('Metadata fields:', Object.keys(correctPayload.metadata));

    // Test the API with both payloads
    console.log('\n🧪 Testing API with both payloads:');
    console.log('='.repeat(50));

    // Test 1: Wrong payload (flat structure)
    console.log('\n1️⃣ Testing with WRONG payload (flat structure):');
    try {
      const response1 = await fetch(`${BASE_URL}/api/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wizardPayload),
      });

      if (response1.ok) {
        console.log('❌ UNEXPECTED: Wrong payload worked!');
      } else {
        const error1 = await response1.json();
        console.log('✅ EXPECTED: Wrong payload failed');
        console.log('   Error:', error1.error || 'Unknown error');
      }
    } catch (error) {
      console.log('✅ EXPECTED: Wrong payload failed');
      console.log('   Error:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Test 2: Correct payload (nested structure)
    console.log('\n2️⃣ Testing with CORRECT payload (nested structure):');
    try {
      const response2 = await fetch(`${BASE_URL}/api/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(correctPayload),
      });

      if (response2.ok) {
        const result2 = await response2.json();
        console.log('✅ SUCCESS: Correct payload worked!');
        console.log('   Proposal ID:', result2.data?.id);
      } else {
        const error2 = await response2.json();
        console.log('❌ UNEXPECTED: Correct payload failed');
        console.log('   Error:', error2.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ UNEXPECTED: Correct payload failed');
      console.log('   Error:', error instanceof Error ? error.message : 'Unknown error');
    }

    console.log('\n📊 Summary:');
    console.log('='.repeat(50));
    console.log('The wizard is sending data in a flat structure, but the API schema');
    console.log('expects the wizard-specific data to be nested under a metadata field.');
    console.log('');
    console.log('SOLUTION: Transform the wizard payload before sending to API');
    console.log('  - Extract teamData, contentData, productData, sectionData');
    console.log('  - Nest them under a metadata field');
    console.log('  - Keep basic proposal fields at the top level');
  } catch (error) {
    logError('Test failed', error, {
      component: 'TestWizardPayload',
      operation: 'testWizardPayload',
    });
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Run the test
testWizardPayload().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
