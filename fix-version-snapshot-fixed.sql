-- Fix Version Snapshot Creation Issues (FIXED VERSION)

-- 1. Check for missing ProposalVersion table constraints
ALTER TABLE proposal_versions
ADD CONSTRAINT fk_proposal_versions_proposal
FOREIGN KEY ("proposalId") REFERENCES proposals(id) ON DELETE CASCADE;

-- 2. Ensure proper indexing for version snapshots
CREATE INDEX IF NOT EXISTS idx_proposal_versions_lookup
ON proposal_versions("proposalId", version DESC);

-- 3. Fix any orphaned version records
DELETE FROM proposal_versions
WHERE "proposalId" NOT IN (SELECT id FROM proposals);

-- 4. Add trigger to ensure version numbers are sequential
CREATE OR REPLACE FUNCTION maintain_version_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure version number is sequential
  IF NEW.version IS NULL OR NEW.version <= 0 THEN
    SELECT COALESCE(MAX(version), 0) + 1
    INTO NEW.version
    FROM proposal_versions
    WHERE "proposalId" = NEW."proposalId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger for version sequence maintenance
DROP TRIGGER IF EXISTS trigger_version_sequence ON proposal_versions;
CREATE TRIGGER trigger_version_sequence
  BEFORE INSERT ON proposal_versions
  FOR EACH ROW
  EXECUTE FUNCTION maintain_version_sequence();

-- 6. Fix any invalid version records
UPDATE proposal_versions
SET version = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "proposalId" ORDER BY "createdAt") as row_num
  FROM proposal_versions
) sub
WHERE proposal_versions.id = sub.id;

-- 7. Ensure all required fields are present
UPDATE proposal_versions
SET
  "changeType" = COALESCE("changeType", 'manual_update'),
  "changesSummary" = COALESCE("changesSummary", 'Proposal updated')
WHERE "changeType" IS NULL OR "changesSummary" IS NULL;

-- 8. Validate version snapshot data
SELECT
  COUNT(*) as total_versions,
  COUNT(*) FILTER (WHERE snapshot IS NOT NULL) as versions_with_snapshot,
  COUNT(*) FILTER (WHERE "changeType" IS NOT NULL) as versions_with_change_type,
  COUNT(*) FILTER (WHERE "changesSummary" IS NOT NULL) as versions_with_summary
FROM proposal_versions;

-- 9. Clean up any corrupted snapshot data (fixed JSON syntax)
UPDATE proposal_versions
SET snapshot = '{"error": "Snapshot data was corrupted and has been reset", "timestamp": "' || NOW() || '"}'::jsonb
WHERE snapshot IS NULL OR jsonb_typeof(snapshot) != 'object';

-- 10. Verify the fixes
SELECT
  pv."proposalId",
  COUNT(pv.id) as version_count,
  MAX(pv.version) as max_version,
  MIN(pv."createdAt") as first_version,
  MAX(pv."createdAt") as latest_version
FROM proposal_versions pv
JOIN proposals p ON pv."proposalId" = p.id
GROUP BY pv."proposalId"
ORDER BY version_count DESC
LIMIT 10;
