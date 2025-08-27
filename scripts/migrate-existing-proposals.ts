#!/usr/bin/env tsx

/**
 * Migration Script: Fix Existing Proposals Data (TypeScript)
 *
 * This script migrates existing proposals to include productData in metadata
 * by extracting data from ProposalProduct table and updating the metadata field.
 *
 * Usage: npx tsx scripts/migrate-existing-proposals.ts
 */

import { PrismaClient } from '@prisma/client';
import { logDebug, logError, logInfo } from '../src/lib/logger';

const prisma = new PrismaClient();

interface ProductData {
  products: Array<{
    id: string;
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    discount: number;
    category: string;
    configuration?: Record<string, unknown>;
    included: boolean;
  }>;
  totalValue: number;
  searchQuery: string;
  selectedCategory: string;
}

interface UpdatedMetadata {
  productData: ProductData;
  wizardVersion: string;
  migratedAt: string;
  [key: string]: unknown;
}

async function migrateExistingProposals() {
  logInfo('Starting migration of existing proposals', {
    component: 'MigrationScript',
    operation: 'migrateExistingProposals',
    userStory: 'US-3.1',
    hypothesis: 'H4',
  });

  try {
    // Get all proposals with products
    const proposals = await prisma.proposal.findMany({
      where: {
        products: {
          some: {},
        },
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                sku: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            industry: true,
          },
        },
      },
    });

    logInfo('Found proposals to migrate', {
      component: 'MigrationScript',
      operation: 'migrateExistingProposals',
      proposalCount: proposals.length,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    console.log(`📊 Found ${proposals.length} proposals to migrate`);

    let migratedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const proposal of proposals) {
      // Skip proposals that already have productData in metadata
      const existingMetadata = (proposal.metadata as Record<string, unknown>) || {};
      if (existingMetadata.productData) {
        console.log(`⏭️ Skipping proposal ${proposal.id}: already has productData in metadata`);
        skippedCount++;
        continue;
      }
      try {
        logDebug('Migrating proposal', {
          component: 'MigrationScript',
          operation: 'migrateProposal',
          proposalId: proposal.id,
          proposalTitle: proposal.title,
          productCount: proposal.products.length,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        console.log(`\n🔄 Migrating proposal: ${proposal.title} (${proposal.id})`);

        // Extract existing metadata or create new
        const existingMetadata = (proposal.metadata as Record<string, unknown>) || {};

        // Transform ProposalProduct records to productData format
        const productData: ProductData = {
          products: proposal.products.map(pp => ({
            id: pp.id,
            productId: pp.productId,
            name: pp.product.name,
            quantity: pp.quantity,
            unitPrice: parseFloat(pp.unitPrice.toString()),
            total: parseFloat(pp.total.toString()),
            discount: parseFloat(pp.discount.toString()),
            category: pp.product.category[0] || 'General',
            configuration: (pp.configuration as Record<string, unknown>) || {},
            included: true,
          })),
          totalValue: proposal.products.reduce(
            (sum, pp) => sum + parseFloat(pp.total.toString()),
            0
          ),
          searchQuery: '',
          selectedCategory: '',
        };

        // Update metadata with productData
        const updatedMetadata: UpdatedMetadata = {
          ...existingMetadata,
          productData: productData,
          wizardVersion: 'modern',
          migratedAt: new Date().toISOString(),
        };

        // Update the proposal
        await prisma.proposal.update({
          where: { id: proposal.id },
          data: {
            metadata: updatedMetadata,
          },
        });

        logInfo('Proposal migrated successfully', {
          component: 'MigrationScript',
          operation: 'migrateProposal',
          proposalId: proposal.id,
          productCount: productData.products.length,
          totalValue: productData.totalValue,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        console.log(
          `✅ Migrated proposal ${proposal.id}: ${productData.products.length} products, total value: $${productData.totalValue}`
        );
        migratedCount++;
      } catch (error) {
        logError('Failed to migrate proposal', {
          component: 'MigrationScript',
          operation: 'migrateProposal',
          proposalId: proposal.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });

        console.error(
          `❌ Error migrating proposal ${proposal.id}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        errorCount++;
      }
    }

    logInfo('Migration completed', {
      component: 'MigrationScript',
      operation: 'migrateExistingProposals',
      migratedCount,
      skippedCount,
      errorCount,
      totalCount: proposals.length,
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migratedCount} proposals`);
    console.log(`⏭️ Skipped (already migrated): ${skippedCount} proposals`);
    console.log(`❌ Errors: ${errorCount} proposals`);
    console.log(`📊 Total processed: ${proposals.length} proposals`);
  } catch (error) {
    logError('Migration failed', {
      component: 'MigrationScript',
      operation: 'migrateExistingProposals',
      error: error instanceof Error ? error.message : 'Unknown error',
      userStory: 'US-3.1',
      hypothesis: 'H4',
    });

    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateExistingProposals()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export { migrateExistingProposals };
