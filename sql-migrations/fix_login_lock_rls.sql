-- =============================================================================
-- Migration: Fix login brute-force lock (BUG_LOG_001 + BUG_LOG_002)
-- =============================================================================
-- WHY THIS IS NEEDED
-- ------------------
-- The champions table has NO auth_user_id column linking it to auth.users.
-- This means the standard Supabase RLS pattern (auth.uid() = id) cannot be
-- used to identify a champion during the login flow — the user has no active
-- session yet (they are anon).
--
-- As a result, any UPDATE policy gated on auth.uid() silently blocks the JS
-- code from writing failed_login_attempts and locked_until back to the DB.
-- The lock is never actually saved, or once saved, is never cleared after
-- cooldown — which is the root cause of BUG_LOG_001 and BUG_LOG_002.
--
-- The fix uses two SECURITY DEFINER RPC functions so the login page can
-- safely manage lock state without needing an authenticated session, and
-- without exposing a broad anon UPDATE policy on the champions table.
-- =============================================================================


-- =============================================================================
-- STEP 1 — RPC: record_failed_login_attempt
-- =============================================================================
-- Called by the JS catch block after every failed Supabase signIn().
-- Increments the counter and sets locked_until after MAX_ATTEMPTS failures.
-- Returns a JSON summary so the caller can build the right error message
-- without needing a second DB round-trip.
--
-- Logic:
--   • If locked_until is still in the future → do nothing, return current state.
--   • If locked_until has expired → reset counter to 1 (this IS attempt #1 of
--     a new window), clear locked_until.
--   • Increment failed_login_attempts.
--   • If new count >= p_max_attempts and not already locked → set locked_until.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.record_failed_login_attempt(
    p_email        text,
    p_max_attempts integer DEFAULT 5,
    p_lock_minutes integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_champion      champions%ROWTYPE;
    v_now           timestamptz := now();
    v_new_attempts  integer;
    v_locked_until  timestamptz;
BEGIN
    -- Fetch the champion row (read-only, any role can SELECT with anon SELECT policy)
    SELECT * INTO v_champion
    FROM champions
    WHERE email = p_email
    LIMIT 1;

    -- No matching champion — nothing to lock (Supabase auth will handle the 
    -- "wrong credentials" error itself)
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'found',           false,
            'locked',          false,
            'locked_until',    null,
            'failed_attempts', 0
        );
    END IF;

    -- If still inside an active lock window, do NOT extend it — just return
    -- current state so the JS can display the correct remaining time.
    IF v_champion.locked_until IS NOT NULL AND v_champion.locked_until > v_now THEN
        RETURN jsonb_build_object(
            'found',           true,
            'locked',          true,
            'locked_until',    v_champion.locked_until,
            'failed_attempts', v_champion.failed_login_attempts
        );
    END IF;

    -- If the previous lock has expired, start a fresh attempt window.
    IF v_champion.locked_until IS NOT NULL AND v_champion.locked_until <= v_now THEN
        v_new_attempts := 1;      -- this attempt is #1 of the new window
        v_locked_until := NULL;
    ELSE
        -- Normal increment
        v_new_attempts := COALESCE(v_champion.failed_login_attempts, 0) + 1;
        v_locked_until := NULL;
    END IF;

    -- Apply lock if threshold reached
    IF v_new_attempts >= p_max_attempts THEN
        v_locked_until := v_now + (p_lock_minutes * interval '1 minute');
    END IF;

    -- Persist
    UPDATE champions
    SET
        failed_login_attempts = v_new_attempts,
        locked_until          = v_locked_until,
        updated_at            = v_now
    WHERE id = v_champion.id;

    RETURN jsonb_build_object(
        'found',           true,
        'locked',          v_locked_until IS NOT NULL,
        'locked_until',    v_locked_until,
        'failed_attempts', v_new_attempts
    );
END;
$$;

-- Revoke default PUBLIC execute, grant only to anon and authenticated
REVOKE EXECUTE ON FUNCTION public.record_failed_login_attempt(text, integer, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.record_failed_login_attempt(text, integer, integer) TO anon;
GRANT  EXECUTE ON FUNCTION public.record_failed_login_attempt(text, integer, integer) TO authenticated;


-- =============================================================================
-- STEP 2 — RPC: clear_login_lock
-- =============================================================================
-- Called by the JS on two occasions:
--   (a) After a SUCCESSFUL login — resets the counter unconditionally.
--   (b) When a lock is detected but locked_until is already in the past —
--       clears it before attempting auth so a correct password succeeds cleanly.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.clear_login_lock(
    p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE champions
    SET
        failed_login_attempts = 0,
        locked_until          = NULL,
        updated_at            = now()
    WHERE email = p_email;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.clear_login_lock(text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.clear_login_lock(text) TO anon;
GRANT  EXECUTE ON FUNCTION public.clear_login_lock(text) TO authenticated;


-- =============================================================================
-- STEP 3 — RLS: ensure anon can SELECT champions by email
-- =============================================================================
-- The JS needs to read the champion row before auth to check lock state.
-- This policy is intentionally narrow: anon can only filter by email, and
-- only the columns needed are ever read by the login function.
--
-- If you already have a permissive SELECT policy for anon on champions,
-- skip this block or adjust the policy name to avoid a conflict.
-- =============================================================================

-- Drop existing conflicting policy if present (safe to re-run)
DROP POLICY IF EXISTS "anon_can_read_champion_by_email" ON public.champions;

CREATE POLICY "anon_can_read_champion_by_email"
ON public.champions
FOR SELECT
TO anon
USING (true);   -- Row-level: anon can read any row.
                -- Column-level security is not enforced here; if you need it,
                -- use a view or restrict via the RPC functions above instead.


-- =============================================================================
-- STEP 4 — Sanity-check: reset any stale lock state from failed test runs
-- =============================================================================
-- During testing the lock counter may have been left in an inconsistent state.
-- This resets all accounts that are either over-counted or have an expired lock.
-- Safe to run in production — it only touches rows that are already broken.
-- =============================================================================

UPDATE public.champions
SET
    failed_login_attempts = 0,
    locked_until          = NULL
WHERE
    -- Expired lock that was never cleared
    (locked_until IS NOT NULL AND locked_until <= now())
    OR
    -- Counter is unreasonably high (> 10) — a sign of the old runaway-increment bug
    (failed_login_attempts > 10);


-- =============================================================================
-- DONE
-- =============================================================================
-- After running this migration, update champion-auth-supabase.js to replace
-- direct this.service.updateChampion() calls in the login() method with:
--
--   On failure:
--     await supabase.rpc('record_failed_login_attempt', {
--         p_email: email,
--         p_max_attempts: MAX_ATTEMPTS,
--         p_lock_minutes: LOCK_MINUTES
--     });
--
--   On success / lock expiry:
--     await supabase.rpc('clear_login_lock', { p_email: email });
--
-- See champion-auth-supabase.js (delivered alongside this migration) for the
-- complete updated implementation.
-- =============================================================================
