#!/usr/bin/env node

/**
 * Fix Numeric Data Inconsistencies
 *
 * This script fixes the issue where value, totalValue, and completionRate
 * are stored as strings instead of numeric values in the database.
 */

const { PrismaClient } = require('@prisma/client');

async function fixNumericData() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Starting numeric data fix...');

    // Get all proposals
    const proposals = await prisma.proposal.findMany({
      select: {
        id: true,
        value: true,
        totalValue: true,
        completionRate: true
      }
    });

    console.log(`📊 Found ${proposals.length} proposals to check`);

    let fixedCount = 0;

    for (const proposal of proposals) {
      const updates = {};

      // Fix value field
      if (typeof proposal.value === 'string') {
        const numericValue = parseFloat(proposal.value) || 0;
        updates.value = numericValue;
      }

      // Fix totalValue field
      if (typeof proposal.totalValue === 'string') {
        const numericTotalValue = proposal.totalValue ? parseFloat(proposal.totalValue) : null;
        updates.totalValue = numericTotalValue;
      }

      // Fix completionRate field
      if (typeof proposal.completionRate === 'string') {
        const numericCompletionRate = parseFloat(proposal.completionRate) || 0;
        updates.completionRate = numericCompletionRate;
      }

      // Update the proposal if there are changes
      if (Object.keys(updates).length > 0) {
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: updates
        });

        fixedCount++;
        console.log(`✅ Fixed proposal ${proposal.id}:`, updates);
      }
    }

    console.log(`🎉 Fixed ${fixedCount} out of ${proposals.length} proposals`);
    console.log('✅ Numeric data fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing numeric data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixNumericData();
