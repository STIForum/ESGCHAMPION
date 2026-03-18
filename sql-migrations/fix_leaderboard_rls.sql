-- ============================================================
-- FIX: Leaderboard shows 0 credits for all other champions
-- ROOT CAUSE: RLS on panel_review_submissions and
--   panel_review_indicator_reviews only allows users to read
--   their own rows, so the JS leaderboard score computation
--   returns 0 for everyone else.
-- ============================================================

-- 1. Allow any authenticated user to READ approved submissions
--    (needed for leaderboard score computation)
DROP POLICY IF EXISTS "Champions can read approved submissions for leaderboard" ON public.panel_review_submissions;
CREATE POLICY "Champions can read approved submissions for leaderboard"
    ON public.panel_review_submissions
    FOR SELECT
    TO authenticated
    USING (status = 'approved');

-- Keep existing policy so users can still read their own pending/rejected too
DROP POLICY IF EXISTS "Champions can read own submissions" ON public.panel_review_submissions;
CREATE POLICY "Champions can read own submissions"
    ON public.panel_review_submissions
    FOR SELECT
    TO authenticated
    USING (champion_id = auth.uid());

-- 2. Allow any authenticated user to READ indicator reviews that
--    belong to approved submissions (needed for score computation)
DROP POLICY IF EXISTS "Champions can read indicator reviews for approved submissions" ON public.panel_review_indicator_reviews;
CREATE POLICY "Champions can read indicator reviews for approved submissions"
    ON public.panel_review_indicator_reviews
    FOR SELECT
    TO authenticated
    USING (
        submission_id IN (
            SELECT id FROM public.panel_review_submissions
            WHERE status = 'approved'
        )
    );

-- Keep existing policy so users can still read their own pending reviews too
DROP POLICY IF EXISTS "Champions can read own indicator reviews" ON public.panel_review_indicator_reviews;
CREATE POLICY "Champions can read own indicator reviews"
    ON public.panel_review_indicator_reviews
    FOR SELECT
    TO authenticated
    USING (champion_id = auth.uid());
