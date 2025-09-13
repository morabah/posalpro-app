-- DropIndex
DROP INDEX "idx_customers_country";

-- RenameIndex
ALTER INDEX "idx_proposal_products_proposal_id_section_id" RENAME TO "proposal_products_proposalId_sectionId_idx";
