-- STIF Indicator Assessment Form (UK Market) - Schema upgrade
-- Adds structured fields for SME context, scoring dimensions, tiering, and optional tags

-- ENUM TYPES --------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sme_size_band_enum') THEN
        CREATE TYPE sme_size_band_enum AS ENUM ('micro', 'small', 'medium', 'upper_medium');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'primary_sector_enum') THEN
        CREATE TYPE primary_sector_enum AS ENUM (
            'agriculture_forestry_fishing',
            'mining_quarrying_utilities',
            'manufacturing',
            'construction',
            'wholesale_retail_repair',
            'transportation_storage',
            'accommodation_food',
            'information_communication',
            'financial_insurance',
            'real_estate',
            'professional_scientific_technical',
            'administrative_support',
            'education',
            'human_health_social_work',
            'arts_entertainment_recreation',
            'other_services'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'primary_framework_enum') THEN
        CREATE TYPE primary_framework_enum AS ENUM ('gri', 'esrs', 'ifrs', 'sector', 'other');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'esg_class_enum') THEN
        CREATE TYPE esg_class_enum AS ENUM ('environment', 'social', 'governance');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tri_level_enum') THEN
        CREATE TYPE tri_level_enum AS ENUM ('high', 'medium', 'low');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'regulatory_necessity_enum') THEN
        CREATE TYPE regulatory_necessity_enum AS ENUM ('mandatory', 'strongly_expected', 'optional');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tier_enum') THEN
        CREATE TYPE tier_enum AS ENUM ('core', 'recommended', 'optional');
    END IF;
END$$;

-- TABLE UPDATES ----------------------------------------------------------
ALTER TABLE IF EXISTS panel_review_indicator_reviews
    ADD COLUMN IF NOT EXISTS sme_size_band sme_size_band_enum,
    ADD COLUMN IF NOT EXISTS primary_sector primary_sector_enum,
    ADD COLUMN IF NOT EXISTS primary_framework primary_framework_enum,
    ADD COLUMN IF NOT EXISTS esg_class esg_class_enum,
    ADD COLUMN IF NOT EXISTS sdgs integer[],
    ADD COLUMN IF NOT EXISTS relevance tri_level_enum,
    ADD COLUMN IF NOT EXISTS regulatory_necessity regulatory_necessity_enum,
    ADD COLUMN IF NOT EXISTS operational_feasibility tri_level_enum,
    ADD COLUMN IF NOT EXISTS cost_to_collect tri_level_enum,
    ADD COLUMN IF NOT EXISTS misreporting_risk tri_level_enum,
    ADD COLUMN IF NOT EXISTS suggested_tier tier_enum,
    ADD COLUMN IF NOT EXISTS rationale text,
    ADD COLUMN IF NOT EXISTS optional_tags text[],
    ADD COLUMN IF NOT EXISTS notes text;

-- Postgres does not support IF NOT EXISTS directly on ADD CONSTRAINT, so guard with a DO block
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_panel_review_indicator_reviews_rationale_len'
          AND conrelid = 'panel_review_indicator_reviews'::regclass
    ) THEN
        ALTER TABLE panel_review_indicator_reviews
            ADD CONSTRAINT chk_panel_review_indicator_reviews_rationale_len
            CHECK (rationale IS NULL OR char_length(rationale) <= 150);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_panel_review_indicator_reviews_sdgs_range'
          AND conrelid = 'panel_review_indicator_reviews'::regclass
    ) THEN
        ALTER TABLE panel_review_indicator_reviews
            ADD CONSTRAINT chk_panel_review_indicator_reviews_sdgs_range
            CHECK (
                sdgs IS NULL
                OR sdgs <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]
            );
    END IF;
END$$;

-- Index helpers for querying new fields
CREATE INDEX IF NOT EXISTS idx_indicator_reviews_sme_size ON panel_review_indicator_reviews(sme_size_band);
CREATE INDEX IF NOT EXISTS idx_indicator_reviews_sector ON panel_review_indicator_reviews(primary_sector);
CREATE INDEX IF NOT EXISTS idx_indicator_reviews_sdgs ON panel_review_indicator_reviews USING GIN (sdgs);
CREATE INDEX IF NOT EXISTS idx_indicator_reviews_tags ON panel_review_indicator_reviews USING GIN (optional_tags);

-- Notes:
-- Existing columns is_necessary/clarity_rating/analysis remain for backward compatibility.
-- New UI should populate the structured fields above for every indicator review submission.
