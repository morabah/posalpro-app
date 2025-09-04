-- Fix data type inconsistencies: Convert string values to numeric types
-- This addresses the issue where value, totalValue, and completionRate are stored as strings instead of numbers

-- Step 1: Convert completionRate from string to numeric (Float)
-- Handle empty strings and null values
UPDATE "proposals"
SET "completionRate" = CASE
  WHEN "completionRate" = '' OR "completionRate" IS NULL THEN 0.0
  ELSE CAST("completionRate" AS DECIMAL)
END;

-- Step 2: Convert value from string to numeric (Float)
-- Handle empty strings by setting to 0
UPDATE "proposals"
SET "value" = CASE
  WHEN "value" = '' OR "value" IS NULL THEN 0.0
  ELSE CAST("value" AS DECIMAL)
END;

-- Step 3: Convert totalValue from string to numeric (Decimal)
-- Handle empty strings by setting to 0
UPDATE "proposals"
SET "totalValue" = CASE
  WHEN "totalValue" = '' OR "totalValue" IS NULL THEN NULL
  ELSE CAST("totalValue" AS DECIMAL)
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
