-- Migration: Add new assessment fields to panel_review_indicator_reviews
-- Fields: geographic_footprint, estimated_time, support_required, stakeholder_priority

-- Add geographic_footprint column (single select: uk_only, uk_eu, global)
ALTER TABLE panel_review_indicator_reviews 
ADD COLUMN IF NOT EXISTS geographic_footprint TEXT;

-- Add estimated_time column (single select: less_30, 30_90, more_90)
ALTER TABLE panel_review_indicator_reviews 
ADD COLUMN IF NOT EXISTS estimated_time TEXT;

-- Add support_required column (single select: none, basic_guidance, external_consultant)
ALTER TABLE panel_review_indicator_reviews 
ADD COLUMN IF NOT EXISTS support_required TEXT;

-- Add stakeholder_priority column (multi-select array: customers, investors, regulators, employees)
ALTER TABLE panel_review_indicator_reviews 
ADD COLUMN IF NOT EXISTS stakeholder_priority TEXT[] DEFAULT '{}';

-- Add CHECK constraints for the new single-select fields
DO $$
BEGIN
    -- Geographic footprint constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'indicator_reviews_geographic_footprint_check'
    ) THEN
        ALTER TABLE panel_review_indicator_reviews
        ADD CONSTRAINT indicator_reviews_geographic_footprint_check
        CHECK (geographic_footprint IS NULL OR geographic_footprint IN ('uk_only', 'uk_eu', 'global'));
    END IF;

    -- Estimated time constraint  
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'indicator_reviews_estimated_time_check'
    ) THEN
        ALTER TABLE panel_review_indicator_reviews
        ADD CONSTRAINT indicator_reviews_estimated_time_check
        CHECK (estimated_time IS NULL OR estimated_time IN ('less_30', '30_90', 'more_90'));
    END IF;

    -- Support required constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'indicator_reviews_support_required_check'
    ) THEN
        ALTER TABLE panel_review_indicator_reviews
        ADD CONSTRAINT indicator_reviews_support_required_check
        CHECK (support_required IS NULL OR support_required IN ('none', 'basic_guidance', 'external_consultant'));
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN panel_review_indicator_reviews.geographic_footprint IS 'SME geographic footprint: uk_only, uk_eu, or global';
COMMENT ON COLUMN panel_review_indicator_reviews.estimated_time IS 'Estimated time to collect data: less_30 (<30 min), 30_90 (30-90 min), more_90 (>90 min)';
COMMENT ON COLUMN panel_review_indicator_reviews.support_required IS 'Level of support required: none, basic_guidance, external_consultant';
COMMENT ON COLUMN panel_review_indicator_reviews.stakeholder_priority IS 'Array of stakeholder priorities: customers, investors, regulators, employees';
