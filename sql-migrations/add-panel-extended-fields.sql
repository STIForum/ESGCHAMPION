-- =====================================================
-- ADD EXTENDED FIELDS TO PANELS TABLE
-- Run this migration in Supabase SQL Editor
-- =====================================================

-- Add impact column (High, Medium, Foundational)
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS impact TEXT CHECK (impact IN ('High', 'Medium', 'Foundational'));

-- Add ESG classification column (separate from category for more specific ESG classification)
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS esg_classification TEXT CHECK (esg_classification IN ('Environment', 'Social', 'Governance'));

-- Add primary framework column (GRI, ESRS, SASB, SME Hub, Other)
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS primary_framework TEXT CHECK (primary_framework IN ('GRI', 'ESRS', 'SASB', 'SME Hub', 'Other'));

-- Add related SDGs as an array of text
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS related_sdgs TEXT[];

-- Add purpose column for panel purpose/intended use
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Add unicode column for unicode value
ALTER TABLE panels 
ADD COLUMN IF NOT EXISTS unicode TEXT;

-- Update the category CHECK constraint to accept new category values
-- First drop the existing constraint
ALTER TABLE panels DROP CONSTRAINT IF EXISTS panels_category_check;

-- Add new constraint with extended category values
ALTER TABLE panels 
ADD CONSTRAINT panels_category_check CHECK (category IN (
    'environmental', 'social', 'governance',
    'Energy & Resource Use',
    'Climate & GHG Emissions',
    'Water, Waste & Circularity',
    'Biodiversity & Land Use',
    'Pollution & Air Quality',
    'Workforce & Labour Practices',
    'Diversity, Equity & Inclusion (DEI)',
    'Human Rights & Supply Chain',
    'Community & Social Impact',
    'Health & Safety',
    'Ethics, Compliance & Anti-Corruption',
    'Risk Management & Resilience',
    'Data Privacy & Cybersecurity',
    'Product Responsibility & Quality',
    'ESG Strategy, Materiality & Innovation'
));

-- Grant permissions for the new columns (if using RLS)
-- The existing RLS policies should automatically cover the new columns

-- Update the updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure trigger exists
DROP TRIGGER IF EXISTS update_panels_updated_at ON panels;
CREATE TRIGGER update_panels_updated_at
    BEFORE UPDATE ON panels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

