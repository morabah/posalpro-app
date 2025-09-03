#!/usr/bin/env tsx

/**
 * Add Test Customers - Minimal setup for QA testing
 * Run with: tsx scripts/add-test-customers.ts
 */

import { prisma } from "@/lib/db/prisma";

async function main() {
  try {
    console.log('🏢 Adding test customers for QA...');

    // Check if customers already exist
    const existingCount = await prisma.customer.count();
    if (existingCount > 0) {
      console.log(`ℹ️ ${existingCount} customers already exist. Skipping.`);
      return;
    }

    const customers = [
      {
        name: 'Test Company Inc',
        email: 'contact@testcompany.com',
        industry: 'Technology',
        tier: 'STANDARD' as const,
        status: 'ACTIVE' as const,
        description: 'Test customer for QA purposes',
        contacts: [{
          name: 'John Doe',
          email: 'john@testcompany.com',
          phone: '+1-555-0100',
          title: 'CTO',
          isPrimary: true,
        }]
      },
      {
        name: 'Demo Corp',
        email: 'contact@democorp.com',
        industry: 'Manufacturing',
        tier: 'PREMIUM' as const,
        status: 'ACTIVE' as const,
        description: 'Demo customer for testing',
        contacts: [{
          name: 'Jane Smith',
          email: 'jane@democorp.com',
          phone: '+1-555-0200',
          title: 'VP Operations',
          isPrimary: true,
        }]
      }
    ];

    for (const customerData of customers) {
      const customer = await prisma.customer.create({
        data: {
          name: customerData.name,
          email: customerData.email,
          industry: customerData.industry,
          tier: customerData.tier,
          status: customerData.status,
          tags: [customerData.industry],
          metadata: {
            description: customerData.description,
          },
        },
      });

      // Create customer contacts
      for (const contactData of customerData.contacts) {
        await prisma.customerContact.create({
          data: {
            customerId: customer.id,
            name: contactData.name,
            email: contactData.email,
            phone: contactData.phone,
            role: contactData.title,
            isPrimary: contactData.isPrimary,
          },
        });
      }

      console.log(`✅ Created customer: ${customer.name}`);
    }

    const finalCount = await prisma.customer.count();
    console.log(`\n📊 Total customers: ${finalCount}`);

    console.log('\n🚀 Now you can run the full seed:');
    console.log('npm run db:seed');

  } catch (error) {
    console.error('❌ Failed to add test customers:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
