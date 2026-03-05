-- First, update all existing data to lowercase
UPDATE indicators SET primary_framework = LOWER(primary_framework) WHERE primary_framework IS NOT NULL;
UPDATE panels SET primary_framework = LOWER(primary_framework) WHERE primary_framework IS NOT NULL;

-- Drop the old CHECK constraints
ALTER TABLE panels DROP CONSTRAINT IF EXISTS panels_primary_framework_check;
ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_primary_framework_check;

-- Now add the foreign key constraints (optional - only if you want referential integrity)
ALTER TABLE panels
  ADD CONSTRAINT panels_primary_framework_fkey
  FOREIGN KEY (primary_framework) REFERENCES frameworks(code);

ALTER TABLE indicators
  ADD CONSTRAINT indicators_primary_framework_fkey
  FOREIGN KEY (primary_framework) REFERENCES frameworks(code);