#!/usr/bin/env node

/**
 * Fix Proposal Value Script
 * 
 * This script recalculates and updates the proposal value for existing proposals
 * that were created before the new value calculation logic was implemented.
 * 
 * It applies the same logic as in our PATCH route:
 * - Uses step 4 product totals if products are selected
 * - Falls back to step 1 estimated value if no products selected
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProposalValue(proposalId) {
  try {
    console.log(`🔍 Fetching proposal: ${proposalId}`);
    
    // Fetch the proposal with its metadata
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        title: true,
        value: true,
        metadata: true,
      },
    });

    if (!proposal) {
      console.error(`❌ Proposal not found: ${proposalId}`);
      return;
    }

    console.log(`📋 Current proposal value: $${proposal.value.toLocaleString()}`);
    console.log(`📊 Proposal title: ${proposal.title}`);

    const metadata = proposal.metadata;
    if (!metadata || !metadata.wizardData) {
      console.log('⚠️  No wizard data found - keeping current value');
      return;
    }

    const wizardData = metadata.wizardData;

    // Apply the same value calculation logic as in the PATCH route
    const hasProducts = wizardData.step4?.products && 
                       wizardData.step4.products.some(p => p.included !== false) && 
                       wizardData.step4.products.length > 0;

    // Calculate step 4 total value
    const step4TotalValue = hasProducts 
      ? wizardData.step4.products
          .filter(p => p.included !== false)
          .reduce((sum, product) => sum + (product.totalPrice || (product.quantity || 1) * (product.unitPrice || 0)), 0)
      : 0;

    // Get step 1 estimated value
    const step1EstimatedValue = wizardData.step1?.details?.estimatedValue || wizardData.step1?.value || 0;

    // Determine which value to use: step 4 total or step 1 estimate
    const shouldUseEstimated = !hasProducts && step4TotalValue === 0 && step1EstimatedValue > 0;
    const finalProposalValue = shouldUseEstimated ? step1EstimatedValue : step4TotalValue;

    console.log(`\n📈 Value Calculation:`);
    console.log(`   - Has products: ${hasProducts}`);
    console.log(`   - Step 4 total: $${step4TotalValue.toLocaleString()}`);
    console.log(`   - Step 1 estimated: $${step1EstimatedValue.toLocaleString()}`);
    console.log(`   - Should use estimated: ${shouldUseEstimated}`);
    console.log(`   - Final calculated value: $${finalProposalValue.toLocaleString()}`);

    if (finalProposalValue > 0 && finalProposalValue !== proposal.value) {
      console.log(`\n🔄 Updating proposal value from $${proposal.value.toLocaleString()} to $${finalProposalValue.toLocaleString()}`);
      
      // Update the proposal with the calculated value
      await prisma.proposal.update({
        where: { id: proposalId },
        data: {
          value: finalProposalValue,
          totalValue: finalProposalValue, // Keep denormalized field in sync
          updatedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });

      console.log(`✅ Successfully updated proposal value!`);
    } else {
      console.log(`ℹ️  No update needed - value is already correct`);
    }

  } catch (error) {
    console.error('❌ Error fixing proposal value:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get proposal ID from command line argument
const proposalId = process.argv[2];

if (!proposalId) {
  console.error('Usage: node fix-proposal-value.js <proposal-id>');
  console.error('Example: node fix-proposal-value.js cme42eag600jrf7m83epx9qly');
  process.exit(1);
}

// Run the fix
fixProposalValue(proposalId);
