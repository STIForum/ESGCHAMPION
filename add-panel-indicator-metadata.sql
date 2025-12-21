-- Add metadata fields to panels and indicators tables
-- Run this in Supabase SQL Editor

-- =====================================================
-- PANELS TABLE - Add new metadata fields
-- =====================================================

ALTER TABLE panels ADD COLUMN IF NOT EXISTS impact_level TEXT DEFAULT 'medium';
ALTER TABLE panels ADD COLUMN IF NOT EXISTS estimated_time TEXT DEFAULT '10-15 min';
ALTER TABLE panels ADD COLUMN IF NOT EXISTS icon TEXT;

-- =====================================================
-- INDICATORS TABLE - Add new metadata fields
-- =====================================================

ALTER TABLE indicators ADD COLUMN IF NOT EXISTS importance_level TEXT DEFAULT 'medium';
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'moderate';
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS time_estimate TEXT DEFAULT '3-5 min';
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS gri_standard TEXT;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS impact_rating INTEGER DEFAULT 4;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS framework_mapping TEXT;
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ESG Database';
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS sector_context TEXT DEFAULT 'All';
ALTER TABLE indicators ADD COLUMN IF NOT EXISTS data_source_detail TEXT;

-- =====================================================
-- Update existing panels with appropriate impact levels
-- =====================================================

UPDATE panels SET impact_level = 'high', icon = '🌍' WHERE name ILIKE '%climate%';
UPDATE panels SET impact_level = 'high', icon = '⚡' WHERE name ILIKE '%energy%';
UPDATE panels SET impact_level = 'medium', icon = '💧' WHERE name ILIKE '%water%';
UPDATE panels SET impact_level = 'medium', icon = '♻️' WHERE name ILIKE '%waste%' OR name ILIKE '%circular%';
UPDATE panels SET impact_level = 'medium', icon = '🌳' WHERE name ILIKE '%biodiversity%';

UPDATE panels SET impact_level = 'high', icon = '⚖️' WHERE name ILIKE '%human rights%';
UPDATE panels SET impact_level = 'medium', icon = '👥' WHERE name ILIKE '%labor%' OR name ILIKE '%workforce%';
UPDATE panels SET impact_level = 'high', icon = '🏥' WHERE name ILIKE '%health%' OR name ILIKE '%safety%';
UPDATE panels SET impact_level = 'medium', icon = '🌈' WHERE name ILIKE '%diversity%';
UPDATE panels SET impact_level = 'medium', icon = '🏘️' WHERE name ILIKE '%community%';

UPDATE panels SET impact_level = 'medium', icon = '🏛️' WHERE name ILIKE '%governance%' OR name ILIKE '%corporate%';
UPDATE panels SET impact_level = 'high', icon = '📜' WHERE name ILIKE '%ethics%' OR name ILIKE '%compliance%';
UPDATE panels SET impact_level = 'high', icon = '⚠️' WHERE name ILIKE '%risk%';
UPDATE panels SET impact_level = 'medium', icon = '📊' WHERE name ILIKE '%transparency%' OR name ILIKE '%reporting%';

-- =====================================================
-- Update existing indicators with metadata
-- =====================================================

-- Set importance based on name patterns
UPDATE indicators SET importance_level = 'high' WHERE name ILIKE '%scope 1%' OR name ILIKE '%scope 2%';
UPDATE indicators SET importance_level = 'high' WHERE name ILIKE '%human rights%' OR name ILIKE '%safety%';
UPDATE indicators SET importance_level = 'medium' WHERE importance_level IS NULL;

-- Set difficulty based on methodology complexity
UPDATE indicators SET difficulty = 'moderate' WHERE difficulty IS NULL;
UPDATE indicators SET difficulty = 'complex' WHERE name ILIKE '%scope 3%';
UPDATE indicators SET difficulty = 'easy' WHERE name ILIKE '%training%' OR name ILIKE '%policy%';

-- Set GRI standards for common indicators
UPDATE indicators SET gri_standard = 'GRI 305-1 / ISSB S2' WHERE name ILIKE '%scope 1%emission%';
UPDATE indicators SET gri_standard = 'GRI 305-2' WHERE name ILIKE '%scope 2%emission%';
UPDATE indicators SET gri_standard = 'GRI 305-3' WHERE name ILIKE '%scope 3%emission%';
UPDATE indicators SET gri_standard = 'GRI 302-1' WHERE name ILIKE '%energy consumption%';
UPDATE indicators SET gri_standard = 'GRI 303-3' WHERE name ILIKE '%water%withdrawal%';
UPDATE indicators SET gri_standard = 'GRI 306-3' WHERE name ILIKE '%waste%generated%';
UPDATE indicators SET gri_standard = 'GRI 403-9' WHERE name ILIKE '%injury%' OR name ILIKE '%LTIR%';
UPDATE indicators SET gri_standard = 'GRI 405-1' WHERE name ILIKE '%diversity%leadership%';
UPDATE indicators SET gri_standard = 'GRI 205-2' WHERE name ILIKE '%anti-corruption%' OR name ILIKE '%ethics%training%';

-- Set impact ratings (1-5)
UPDATE indicators SET impact_rating = 5 WHERE importance_level = 'high';
UPDATE indicators SET impact_rating = 4 WHERE importance_level = 'medium' AND impact_rating IS NULL;
UPDATE indicators SET impact_rating = 3 WHERE importance_level = 'low';

-- =====================================================
-- REVIEWS TABLE - Add extended review fields
-- =====================================================

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS clarity_rating INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_necessary TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS comments TEXT;

-- =====================================================
-- Update existing indicators with source data
-- =====================================================

UPDATE indicators SET source = 'SME Hub' WHERE name ILIKE '%scope%' OR name ILIKE '%emission%';
UPDATE indicators SET source = 'Company Records' WHERE name ILIKE '%training%' OR name ILIKE '%policy%';
UPDATE indicators SET source = 'Third-party Verification' WHERE name ILIKE '%audit%' OR name ILIKE '%certification%';

-- Set sector context
UPDATE indicators SET sector_context = 'All' WHERE sector_context IS NULL;
UPDATE indicators SET sector_context = 'Manufacturing' WHERE name ILIKE '%waste%' OR name ILIKE '%material%';
UPDATE indicators SET sector_context = 'Financial Services' WHERE name ILIKE '%investment%' OR name ILIKE '%portfolio%';
UPDATE indicators SET sector_context = 'Energy' WHERE name ILIKE '%energy%' OR name ILIKE '%renewable%';

-- Set framework mapping to match gri_standard
UPDATE indicators SET framework_mapping = gri_standard WHERE gri_standard IS NOT NULL;

-- Verify changes
SELECT 'Panel and indicator metadata added successfully!' as status;

SELECT name, impact_level, estimated_time, icon FROM panels LIMIT 5;
SELECT name, importance_level, difficulty, time_estimate, gri_standard, source, sector_context FROM indicators LIMIT 5;

