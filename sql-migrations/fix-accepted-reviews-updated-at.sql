-- =====================================================
-- ESG Champions Platform - Fix Accepted Reviews Table
-- Run this if you get errors about missing updated_at column
-- =====================================================

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accepted_reviews' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE accepted_reviews ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$;

-- Create trigger for accepted_reviews updated_at if it doesn't exist
DROP TRIGGER IF EXISTS accepted_reviews_updated_at ON accepted_reviews;

CREATE TRIGGER accepted_reviews_updated_at
    BEFORE UPDATE ON accepted_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Also ensure created_at has default
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'accepted_reviews' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE accepted_reviews ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$;

