-- Fix primary_framework constraint to accept both cases
-- Drop the existing constraint and recreate with proper values

-- First, let's see what constraints exist
-- ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_primary_framework_check;

-- Drop and recreate with proper case-insensitive values
DO $$
BEGIN
    -- Try to drop the constraint if it exists
    ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_primary_framework_check;
EXCEPTION
    WHEN undefined_object THEN
        -- Constraint doesn't exist, that's fine
        NULL;
END $$;

-- Also try alternate naming
DO $$
BEGIN
    ALTER TABLE indicators DROP CONSTRAINT IF EXISTS indicators_primary_framework_check1;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Add the updated constraint that accepts the framework values
ALTER TABLE indicators 
ADD CONSTRAINT indicators_primary_framework_check 
CHECK (primary_framework IS NULL OR primary_framework IN ('GRI', 'ESRS', 'SASB', 'SME Hub', 'Other', 'gri', 'esrs', 'sasb', 'sme hub', 'other'));

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'indicators'::regclass AND contype = 'c';
