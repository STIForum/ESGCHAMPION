  -- Drop the foreign key constraints that are causing the error
ALTER TABLE panels DROP CONSTRAINT IF EXISTS panels_primary_framework_fkey;
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_primary_framework_fkey;

-- Also drop any remaining CHECK constraints (if they still exist)
ALTER TABLE panels DROP CONSTRAINT IF EXISTS panels_primary_framework_check;
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_primary_framework_check;