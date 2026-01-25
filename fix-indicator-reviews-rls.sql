-- Fix RLS policies for panel_review_indicator_reviews
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policy
-- Drop any prior insert policies to avoid duplicate-name errors
DROP POLICY IF EXISTS "Users can insert own indicator reviews" ON panel_review_indicator_reviews;
DROP POLICY IF EXISTS "Users can insert indicator reviews" ON panel_review_indicator_reviews;

-- Create a more permissive INSERT policy
-- Allow authenticated users to insert indicator reviews
CREATE POLICY "Users can insert indicator reviews"
ON panel_review_indicator_reviews FOR INSERT
TO authenticated
WITH CHECK (true);

-- Keep the SELECT policy restrictive (users can only see their own or admin can see all)
DROP POLICY IF EXISTS "Users can view own indicator reviews" ON panel_review_indicator_reviews;
CREATE POLICY "Users can view own indicator reviews"
ON panel_review_indicator_reviews FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM panel_review_submissions 
        WHERE id = submission_id AND reviewer_user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM champions 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Also verify the table structure
-- Check if indicator_id foreign key might be causing issues
-- Remove NOT NULL constraint on analysis if it exists and is causing problems
ALTER TABLE panel_review_indicator_reviews 
ALTER COLUMN analysis DROP NOT NULL;

-- Verify the columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'panel_review_indicator_reviews' 
                   AND column_name = 'submission_id') THEN
        RAISE NOTICE 'submission_id column is missing!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'panel_review_indicator_reviews' 
                   AND column_name = 'indicator_id') THEN
        RAISE NOTICE 'indicator_id column is missing!';
    END IF;
END $$;

-- Show current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'panel_review_indicator_reviews';

