-- ============================================================================
-- STIF ESG Champions Platform — Invitations Table Fixes (v2)
-- Migration: 20260311_invitations_fixes_v2.sql
--
-- v2 changes: deduplicate existing pending rows BEFORE creating the unique
-- index. The index creation in v1 failed because 5 (email, invited_by) pairs
-- already had multiple pending rows in production:
--
--   oliviyadavid95@gmail.com  / f9945826  — 2 rows (idx 3, 39)
--   test12@gmail.com          / f9945826  — 2 rows (idx 5, 28)
--   thaison.nguyen2022@gmail.com / 7d1e1c60 — 2 rows (idx 16, 43)
--   binbong2017@gmail.com     / 7d1e1c60  — 2 rows (idx 27, 37)
--   daphnejane1622@gmail.com  / f9945826  — 2 rows (idx 9, 30)
--
-- Strategy: keep the NEWEST row per (email, invited_by, 'pending') pair
-- (latest created_at), delete all older duplicates.
-- ============================================================================


-- ─── STEP 1: Deduplicate existing pending rows ───────────────────────────────
-- Delete all but the most recently created pending row for each
-- (email, invited_by) pair. Safe to re-run — uses NOT IN with MAX(created_at).
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM public.invitations
WHERE status = 'pending'
AND id NOT IN (
    SELECT DISTINCT ON (email, invited_by) id
    FROM   public.invitations
    WHERE  status = 'pending'
    ORDER  BY email, invited_by, created_at DESC
);

-- Confirm 0 duplicates remain before proceeding:
DO $$
DECLARE
    dup_count integer;
BEGIN
    SELECT count(*) INTO dup_count
    FROM (
        SELECT email, invited_by, count(*) AS cnt
        FROM   public.invitations
        WHERE  status = 'pending'
        GROUP  BY email, invited_by
        HAVING count(*) > 1
    ) dupes;

    IF dup_count > 0 THEN
        RAISE EXCEPTION 'Deduplication failed — % duplicate (email, invited_by) pairs still exist. Aborting.', dup_count;
    END IF;
END $$;


-- ─── STEP 2: DATA_FIX_001 — expire the already-stale row ────────────────────
UPDATE public.invitations
SET    status = 'expired'
WHERE  email      = 'gracejdc07@gmail.com'
AND    status     = 'pending'
AND    expires_at < now();

-- Also expire any other pending rows whose expiry has already passed
UPDATE public.invitations
SET    status = 'expired'
WHERE  status     = 'pending'
AND    expires_at < now();


-- ─── STEP 3: BUG_INVITE_005 — partial unique index ───────────────────────────
-- Now safe to create since duplicates have been removed.
-- Prevents future duplicate pending invitations for the same (email, inviter).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS invitations_unique_pending_per_inviter
    ON public.invitations (email, invited_by)
    WHERE status = 'pending';


-- ─── STEP 4: BUG_INVITE_004 — email format CHECK constraint ─────────────────
ALTER TABLE public.invitations
    ADD CONSTRAINT invitations_email_format_check
    CHECK (
        email ~* '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$'
    );


-- ─── STEP 5: BUG_INVITE_006 — add sent_at column ────────────────────────────
ALTER TABLE public.invitations
    ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone DEFAULT NULL;

CREATE INDEX IF NOT EXISTS invitations_unsent_pending_idx
    ON public.invitations (created_at)
    WHERE status = 'pending' AND sent_at IS NULL;


-- ─── STEP 6: BUG_INVITE_007 — schedule daily expiry ────────────────────────
-- pg_cron is not enabled on this project. Use a Supabase scheduled Edge
-- Function instead (no SQL needed here).
--
-- Setup in Supabase dashboard:
--   1. Edge Functions → Deploy a function named: expire-invitations
--   2. Cron Schedules → New schedule → cron "5 0 * * *" → expire-invitations
--
-- The Edge Function should run:
--   UPDATE public.invitations
--   SET    status = 'expired'
--   WHERE  status = 'pending'
--   AND    expires_at < now();
-- ─────────────────────────────────────────────────────────────────────────────
-- (no SQL to execute for this step)


-- ─── VERIFICATION ────────────────────────────────────────────────────────────

-- 1. Should return 0 rows — no duplicate pending pairs
SELECT email, invited_by, count(*) AS cnt
FROM   public.invitations
WHERE  status = 'pending'
GROUP  BY email, invited_by
HAVING count(*) > 1;

-- 2. Should return 0 — no expired rows still marked pending
SELECT count(*) AS still_pending_but_expired
FROM   public.invitations
WHERE  status = 'pending'
AND    expires_at < now();

-- 3. Confirm sent_at column exists
SELECT column_name, data_type, is_nullable
FROM   information_schema.columns
WHERE  table_name  = 'invitations'
AND    column_name = 'sent_at';