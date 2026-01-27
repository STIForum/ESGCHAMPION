-- =====================================================
-- ADD EXTENDED FIELDS TO INDICATORS TABLE
-- Run this migration in Supabase SQL Editor
-- =====================================================

-- First, create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add code column for indicator codes (GRI 305-1, ESRS E1-1, etc.)
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS code TEXT;

-- Add primary framework
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS primary_framework TEXT CHECK (primary_framework IN ('GRI', 'ESRS', 'SASB', 'SME Hub', 'Other'));

-- Add framework version
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS framework_version TEXT;

-- Add why it matters to SMEs
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS why_it_matters TEXT;

-- Add impact level
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS impact_level TEXT CHECK (impact_level IN ('High', 'Medium', 'Foundational'));

-- Add difficulty level
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('Easy', 'Moderate', 'Complex'));

-- Add estimated time to validate
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS estimated_time TEXT;

-- Add ESG classification
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS esg_class TEXT CHECK (esg_class IN ('Environment', 'Social', 'Governance'));

-- Add related SDGs as array
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS related_sdgs TEXT[];

-- Add validation question
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS validation_question TEXT;

-- Add response type
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS response_type TEXT CHECK (response_type IN ('Multiple Choice', 'Yes-No', 'Short Text', 'Long Text'));

-- Add tags
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS tags TEXT;

-- Add icon/unicode
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add formula required flag
ALTER TABLE indicators 
ADD COLUMN IF NOT EXISTS formula_required BOOLEAN DEFAULT FALSE;

-- Ensure trigger exists for updated_at
DROP TRIGGER IF EXISTS update_indicators_updated_at ON indicators;
CREATE TRIGGER update_indicators_updated_at
    BEFORE UPDATE ON indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

