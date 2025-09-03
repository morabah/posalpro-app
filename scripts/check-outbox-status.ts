#!/usr/bin/env tsx

/**
 * Check Outbox Job Status
 * Run with: tsx scripts/check-outbox-status.ts
 */

import { prisma } from "@/lib/db/prisma";

async function main() {
  try {
    const jobs = await prisma.outbox.findMany({
      select: {
        id: true,
        type: true,
        status: true,
        attempts: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n📊 Outbox Job Status:');
    console.log('='.repeat(80));
    console.table(jobs);

    // Summary stats
    const stats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      done: jobs.filter(j => j.status === 'done').length,
      error: jobs.filter(j => j.status === 'error').length,
    };

    console.log('\n📈 Summary Statistics:');
    console.log('='.repeat(40));
    console.log(`Total Jobs: ${stats.total}`);
    console.log(`✅ Completed: ${stats.done}`);
    console.log(`⏳ Pending: ${stats.pending}`);
    console.log(`🔄 Processing: ${stats.processing}`);
    console.log(`❌ Failed: ${stats.error}`);

  } catch (error) {
    console.error('Failed to check outbox status:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
