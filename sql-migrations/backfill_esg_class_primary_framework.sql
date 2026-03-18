-- Backfill: copy esg_class and primary_framework from the indicators table
-- into panel_review_indicator_reviews rows where they were never submitted
-- (stored as NULL because the form didn't pre-populate them from indicator metadata).
--
-- Safe to run multiple times — only updates rows where the value is currently NULL.
-- Run this in the Supabase SQL editor.

UPDATE panel_review_indicator_reviews AS r
SET
    esg_class        = COALESCE(r.esg_class,        i.esg_class),
    primary_framework = COALESCE(r.primary_framework, i.primary_framework),
    updated_at        = now()
FROM indicators AS i
WHERE r.indicator_id = i.id
  AND (r.esg_class IS NULL OR r.primary_framework IS NULL);
