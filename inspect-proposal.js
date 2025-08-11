#!/usr/bin/env node

/**
 * Inspect Proposal Data Script
 * 
 * This script inspects the actual proposal data structure to understand
 * what's stored in the database and why the wizard data is missing.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectProposal(proposalId) {
  try {
    console.log(`🔍 Fetching proposal: ${proposalId}`);
    
    // Fetch the proposal with all relevant data
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        title: true,
        value: true,
        totalValue: true,
        metadata: true,
      },
    });

    if (!proposal) {
      console.error(`❌ Proposal not found: ${proposalId}`);
      return;
    }

    console.log(`\n📋 Proposal Details:`);
    console.log(`   - ID: ${proposal.id}`);
    console.log(`   - Title: ${proposal.title}`);
    console.log(`   - Value: $${proposal.value.toLocaleString()}`);
    console.log(`   - Total Value: $${(proposal.totalValue || 0).toLocaleString()}`);
    
    console.log(`\n📊 Metadata Structure:`);
    if (proposal.metadata) {
      console.log(`   - Metadata exists: ✅`);
      console.log(`   - Keys:`, Object.keys(proposal.metadata));
      
      if (proposal.metadata.wizardData) {
        console.log(`   - Wizard Data exists: ✅`);
        console.log(`   - Wizard Data keys:`, Object.keys(proposal.metadata.wizardData));
        
        if (proposal.metadata.wizardData.step1) {
          console.log(`   - Step 1:`, JSON.stringify(proposal.metadata.wizardData.step1, null, 2));
        }
        
        if (proposal.metadata.wizardData.step4) {
          console.log(`   - Step 4:`, JSON.stringify(proposal.metadata.wizardData.step4, null, 2));
        }
      } else {
        console.log(`   - Wizard Data exists: ❌`);
        console.log(`   - Full metadata:`, JSON.stringify(proposal.metadata, null, 2));
      }
    } else {
      console.log(`   - Metadata exists: ❌`);
    }

    // Also check if there are related products in the ProposalProduct table
    console.log(`\n🛍️  Related Products:`);
    const products = await prisma.proposalProduct.findMany({
      where: { proposalId: proposalId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            basePrice: true,
          }
        }
      }
    });

    if (products.length > 0) {
      console.log(`   - Found ${products.length} products:`);
      let totalValue = 0;
      products.forEach((pp, index) => {
        const itemTotal = (pp.quantity || 1) * (pp.unitPrice || 0);
        totalValue += itemTotal;
        console.log(`   ${index + 1}. ${pp.product.name} - Qty: ${pp.quantity}, Unit: $${pp.unitPrice}, Total: $${itemTotal.toLocaleString()}`);
      });
      console.log(`   - Total Products Value: $${totalValue.toLocaleString()}`);
    } else {
      console.log(`   - No products found`);
    }

  } catch (error) {
    console.error('❌ Error inspecting proposal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get proposal ID from command line argument
const proposalId = process.argv[2];

if (!proposalId) {
  console.error('Usage: node inspect-proposal.js <proposal-id>');
  console.error('Example: node inspect-proposal.js cme42eag600jrf7m83epx9qly');
  process.exit(1);
}

// Run the inspection
inspectProposal(proposalId);
