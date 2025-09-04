-- Fix data type inconsistencies: Convert string values to numeric types
-- This addresses the issue where value, totalValue, and completionRate are stored as strings instead of numbers

-- Step 1: Convert completionRate from string to numeric (Float)
-- Use NULLIF and COALESCE to handle empty strings
UPDATE "proposals"
SET "completionRate" = COALESCE(NULLIF("completionRate", '')::DECIMAL, 0.0);

-- Step 2: Convert value from string to numeric (Float)
-- Use NULLIF and COALESCE to handle empty strings
UPDATE "proposals"
SET "value" = COALESCE(NULLIF("value", '')::DECIMAL, 0.0);

-- Step 3: Convert totalValue from string to numeric (Decimal)
-- Use NULLIF to handle empty strings, keep as NULL if empty
UPDATE "proposals"
SET "totalValue" = CASE
  WHEN "totalValue" = '' THEN NULL
  ELSE "totalValue"::DECIMAL
END;

-- Step 4: Verify the conversion worked by checking a few records
-- This is optional and can be removed in production
DO $$
BEGIN
  RAISE NOTICE 'Data type conversion completed. Sample values:';
  RAISE NOTICE 'Completion Rate: %', (SELECT "completionRate" FROM "proposals" LIMIT 1);
  RAISE NOTICE 'Value: %', (SELECT "value" FROM "proposals" LIMIT 1);
  RAISE NOTICE 'Total Value: %', (SELECT "totalValue" FROM "proposals" LIMIT 1);
END $$;
