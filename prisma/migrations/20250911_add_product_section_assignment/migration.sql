-- Migration: Add section assignment to proposal products and enforce case-insensitive unique section titles per proposal
-- Notes:
-- - Prisma does not support expression-based unique constraints in the schema yet.
--   We add a raw index on lower(title) scoped by proposalId.

-- 1) Add nullable sectionId column and foreign key to proposal_sections
ALTER TABLE "proposal_products"
ADD COLUMN IF NOT EXISTS "sectionId" TEXT;

DO $$
BEGIN
  ALTER TABLE "proposal_products"
    ADD CONSTRAINT "proposal_products_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "proposal_sections"("id")
    ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

-- 2) Helpful composite index for filtering by proposal and section
CREATE INDEX IF NOT EXISTS "idx_proposal_products_proposal_id_section_id"
  ON "proposal_products" ("proposalId", "sectionId");

-- 3) Case-insensitive unique section titles per proposal for PRODUCTS sections only
--    (enforce uniqueness on lower(title) within a proposal for type = 'PRODUCTS')
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_sections_proposal_lower_title'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS "uniq_sections_proposal_lower_title"';
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS "uniq_products_sections_lower_title"
  ON "proposal_sections" ("proposalId", lower("title"))
  WHERE "type" = 'PRODUCTS';
