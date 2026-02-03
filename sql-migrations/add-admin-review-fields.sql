-- Add admin review fields to panel_review_submissions
-- Run this in Supabase SQL Editor

-- Add submitted_at column (alias for created_at for clarity)
ALTER TABLE panel_review_submissions 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill submitted_at from created_at
UPDATE panel_review_submissions 
SET submitted_at = created_at 
WHERE submitted_at IS NULL;

-- Add admin_notes column for admin comments
ALTER TABLE panel_review_submissions 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add reviewed_by column to track which admin approved/rejected
ALTER TABLE panel_review_submissions 
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES champions(id);

-- Add reviewed_at column to track when the review was done
ALTER TABLE panel_review_submissions 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Add review_status column to indicator reviews (for tracking individual indicator approval)
ALTER TABLE panel_review_indicator_reviews 
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected'));

-- Add updated_at column to indicator reviews if not exists
ALTER TABLE panel_review_indicator_reviews 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add index for faster queries on review_status
CREATE INDEX IF NOT EXISTS idx_indicator_reviews_status 
ON panel_review_indicator_reviews(review_status);

COMMENT ON COLUMN panel_review_submissions.admin_notes IS 'Admin comment when approving/rejecting the submission';
COMMENT ON COLUMN panel_review_submissions.reviewed_by IS 'The admin champion who reviewed the submission';
COMMENT ON COLUMN panel_review_submissions.reviewed_at IS 'Timestamp when the review was completed';
COMMENT ON COLUMN panel_review_submissions.submitted_at IS 'When the review was submitted (same as created_at)';
COMMENT ON COLUMN panel_review_indicator_reviews.review_status IS 'Status of individual indicator review: pending, accepted, rejected';
