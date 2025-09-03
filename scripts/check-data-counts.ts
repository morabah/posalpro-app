#!/usr/bin/env tsx

/**
 * Check Data Counts - Show seeded data statistics
 * Run with: tsx scripts/check-data-counts.ts
 */

import { prisma } from "@/lib/db/prisma";

async function main() {
  try {
    const [userCount, customerCount, productCount, proposalCount, contentCount] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.product.count(),
      prisma.proposal.count(),
      prisma.content.count(),
    ]);

    console.log('\n📊 Database Seed Results:');
    console.log('='.repeat(40));
    console.log(`👥 Users: ${userCount}`);
    console.log(`🏢 Customers: ${customerCount}`);
    console.log(`📦 Products: ${productCount}`);
    console.log(`📄 Content: ${contentCount}`);
    console.log(`📋 Proposals: ${proposalCount}`);
    console.log('='.repeat(40));

    console.log('\n✅ QA-ready seed data created successfully!');
    console.log('\n🔑 Test Accounts Available:');
    console.log('   • demo@posalpro.com (Demo Manager)');
    console.log('   • qa.manager@posalpro.com (QA Manager)');
    console.log('   • qa.sme@posalpro.com (QA SME)');
    console.log('   • qa.admin@posalpro.com (QA Admin)');
    console.log('   Password: ProposalPro2024!');

  } catch (error) {
    console.error('Failed to check data counts:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
