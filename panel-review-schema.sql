-- Panel Review Submissions Schema
-- Run this in Supabase SQL Editor

-- =====================================================
-- TABLE: panel_review_submissions
-- =====================================================
CREATE TABLE IF NOT EXISTS panel_review_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
    reviewer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: panel_review_indicator_reviews
-- =====================================================
CREATE TABLE IF NOT EXISTS panel_review_indicator_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES panel_review_submissions(id) ON DELETE CASCADE,
    indicator_id UUID REFERENCES indicators(id) ON DELETE CASCADE,
    is_necessary TEXT CHECK (is_necessary IN ('yes', 'no', 'not_sure')),
    clarity_rating INTEGER CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
    analysis TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_panel_review_submissions_panel_id ON panel_review_submissions(panel_id);
CREATE INDEX IF NOT EXISTS idx_panel_review_submissions_reviewer ON panel_review_submissions(reviewer_user_id);
CREATE INDEX IF NOT EXISTS idx_panel_review_submissions_status ON panel_review_submissions(status);
CREATE INDEX IF NOT EXISTS idx_panel_review_indicator_reviews_submission ON panel_review_indicator_reviews(submission_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE panel_review_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE panel_review_indicator_reviews ENABLE ROW LEVEL SECURITY;

-- Panel Review Submissions Policies
DROP POLICY IF EXISTS "Users can insert own submissions" ON panel_review_submissions;
CREATE POLICY "Users can insert own submissions"
ON panel_review_submissions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_user_id);

DROP POLICY IF EXISTS "Users can view own submissions" ON panel_review_submissions;
CREATE POLICY "Users can view own submissions"
ON panel_review_submissions FOR SELECT
TO authenticated
USING (auth.uid() = reviewer_user_id);

DROP POLICY IF EXISTS "Admins can view all submissions" ON panel_review_submissions;
CREATE POLICY "Admins can view all submissions"
ON panel_review_submissions FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM champions 
        WHERE id = auth.uid() AND is_admin = true
    )
);

DROP POLICY IF EXISTS "Admins can update submissions" ON panel_review_submissions;
CREATE POLICY "Admins can update submissions"
ON panel_review_submissions FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM champions 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Panel Review Indicator Reviews Policies
DROP POLICY IF EXISTS "Users can insert own indicator reviews" ON panel_review_indicator_reviews;
CREATE POLICY "Users can insert own indicator reviews"
ON panel_review_indicator_reviews FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM panel_review_submissions 
        WHERE id = submission_id AND reviewer_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can view own indicator reviews" ON panel_review_indicator_reviews;
CREATE POLICY "Users can view own indicator reviews"
ON panel_review_indicator_reviews FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM panel_review_submissions 
        WHERE id = submission_id AND reviewer_user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can view all indicator reviews" ON panel_review_indicator_reviews;
CREATE POLICY "Admins can view all indicator reviews"
ON panel_review_indicator_reviews FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM champions 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- =====================================================
-- TRIGGER: Update updated_at on panel_review_submissions
-- =====================================================
CREATE OR REPLACE FUNCTION update_panel_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_panel_review_updated_at ON panel_review_submissions;
CREATE TRIGGER trigger_update_panel_review_updated_at
    BEFORE UPDATE ON panel_review_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_panel_review_updated_at();

