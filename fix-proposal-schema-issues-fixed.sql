-- Fix Proposal Schema Data Issues (FIXED VERSION)
-- Execute these SQL queries to fix the data structure mismatches

-- 1. Fix value field: Convert Decimal to Number-compatible format
UPDATE proposals
SET "value" = CASE
  WHEN "value" IS NOT NULL THEN "value"::numeric
  ELSE NULL
END;

-- 2. Fix projectType: Set default value for null entries
UPDATE proposals
SET "projectType" = 'consulting'
WHERE "projectType" IS NULL;

-- 3. Fix sections type: Convert invalid enum values (without type casting)
UPDATE proposal_sections
SET type = CASE
  WHEN type = 'PRODUCTS' THEN 'TEXT'
  WHEN type = 'PRICING' THEN 'TEXT'
  ELSE type
END;

-- 4. Fix product configuration: Ensure it's a valid JSON object
UPDATE proposal_products
SET configuration = '{}'
WHERE configuration IS NULL OR configuration::text = 'null';

-- 5. Fix unitPrice, discount, total fields: Ensure they're numeric
UPDATE proposal_products
SET
  "unitPrice" = COALESCE("unitPrice", 0),
  discount = COALESCE(discount, 0),
  total = COALESCE(total, 0);

-- 6. Update proposal stats for consistency (fixed column name case)
UPDATE proposals
SET
  "productCount" = (SELECT COUNT(*) FROM proposal_products WHERE "proposalId" = proposals.id),
  "sectionCount" = (SELECT COUNT(*) FROM proposal_sections WHERE "proposalId" = proposals.id),
  "statsUpdatedAt" = NOW();

-- 7. Clean up invalid assignedTo relationships (convert arrays to single user)
-- This is complex and may need custom handling based on your business logic

-- Verify fixes
SELECT
  COUNT(*) as total_proposals,
  COUNT(*) FILTER (WHERE "value" IS NOT NULL) as proposals_with_value,
  COUNT(*) FILTER (WHERE "projectType" IS NOT NULL) as proposals_with_project_type
FROM proposals;

SELECT
  type,
  COUNT(*) as count
FROM proposal_sections
GROUP BY type
ORDER BY type;
