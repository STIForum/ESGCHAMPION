-- =====================================================
-- FRAMEWORK MIGRATION: ESG Categories to Framework Model
-- =====================================================
-- This migration updates existing panels and indicators to use the
-- framework-based model (GRI, ESRS, IFRS) instead of ESG categories.

-- =====================================================
-- STEP 1: Ensure primary_framework column exists
-- =====================================================
DO $$
BEGIN
    -- Add primary_framework column to panels if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'panels' AND column_name = 'primary_framework'
    ) THEN
        ALTER TABLE panels ADD COLUMN primary_framework TEXT 
            CHECK (primary_framework IN ('gri', 'esrs', 'ifrs', 'GRI', 'ESRS', 'IFRS', 'SASB', 'SME Hub', 'Other'));
    END IF;

    -- Add primary_framework column to indicators if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'indicators' AND column_name = 'primary_framework'
    ) THEN
        ALTER TABLE indicators ADD COLUMN primary_framework TEXT
            CHECK (primary_framework IN ('gri', 'esrs', 'ifrs', 'GRI', 'ESRS', 'IFRS', 'SASB', 'SME Hub', 'Other'));
    END IF;
END
$$;

-- =====================================================
-- STEP 2: Normalize existing framework values to lowercase
-- =====================================================
-- Update panels
UPDATE panels SET primary_framework = LOWER(primary_framework)
WHERE primary_framework IS NOT NULL 
  AND primary_framework IN ('GRI', 'ESRS', 'IFRS');

-- Update indicators
UPDATE indicators SET primary_framework = LOWER(primary_framework)
WHERE primary_framework IS NOT NULL 
  AND primary_framework IN ('GRI', 'ESRS', 'IFRS');

-- =====================================================
-- STEP 3: Set default framework for panels without one
-- (Based on esg_classification or category)
-- =====================================================
-- Map legacy ESG categories to frameworks:
-- Environmental -> gri (GRI is strong on environmental reporting)
-- Social -> esrs (ESRS has comprehensive social metrics)
-- Governance -> ifrs (IFRS focuses on financial governance)

UPDATE panels
SET primary_framework = 
    CASE 
        WHEN LOWER(esg_classification) = 'environment' THEN 'gri'
        WHEN LOWER(esg_classification) = 'social' THEN 'esrs'
        WHEN LOWER(esg_classification) = 'governance' THEN 'ifrs'
        WHEN LOWER(category) = 'environmental' THEN 'gri'
        WHEN LOWER(category) = 'social' THEN 'esrs'
        WHEN LOWER(category) = 'governance' THEN 'ifrs'
        ELSE 'gri' -- Default to GRI
    END
WHERE primary_framework IS NULL OR primary_framework = '';

-- =====================================================
-- STEP 4: Update indicators to match their panel's framework
-- =====================================================
UPDATE indicators i
SET primary_framework = p.primary_framework
FROM panels p
WHERE i.panel_id = p.id
  AND (i.primary_framework IS NULL OR i.primary_framework = '');

-- =====================================================
-- STEP 5: Set default for any remaining NULL indicators
-- =====================================================
UPDATE indicators
SET primary_framework = 'gri'
WHERE primary_framework IS NULL OR primary_framework = '';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the migration:

-- Check panels framework distribution
SELECT primary_framework, COUNT(*) as count
FROM panels
GROUP BY primary_framework
ORDER BY count DESC;

-- Check indicators framework distribution
SELECT primary_framework, COUNT(*) as count
FROM indicators
GROUP BY primary_framework
ORDER BY count DESC;

-- Verify panel-indicator framework alignment
SELECT 
    p.name as panel_name, 
    p.primary_framework as panel_framework,
    COUNT(i.id) as indicator_count,
    COUNT(CASE WHEN i.primary_framework != p.primary_framework THEN 1 END) as mismatched
FROM panels p
LEFT JOIN indicators i ON i.panel_id = p.id
GROUP BY p.id, p.name, p.primary_framework
HAVING COUNT(CASE WHEN i.primary_framework != p.primary_framework THEN 1 END) > 0;
