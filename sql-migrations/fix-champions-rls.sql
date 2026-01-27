-- Fix Champions RLS Policy Issue
-- ===============================
-- Problem: After signUp, email confirmation may be required, so auth.uid() 
-- may not be available when trying to insert the champion profile.
-- Solution: Create a database trigger that automatically creates the champion 
-- profile when a user is created in auth.users.

-- Option 1: Create a trigger on auth.users (Recommended)
-- This automatically creates a champion profile when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.champions (id, email, full_name, credits, is_verified, is_admin, cla_accepted, nda_accepted)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        0,
        false,
        false,
        COALESCE((NEW.raw_user_meta_data->>'cla_accepted')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'nda_accepted')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), champions.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the champions table has proper RLS policies
-- First, ensure RLS is enabled
ALTER TABLE public.champions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them cleanly
DROP POLICY IF EXISTS "Champions can view all champions" ON public.champions;
DROP POLICY IF EXISTS "Champions can update own profile" ON public.champions;
DROP POLICY IF EXISTS "Champions can insert own profile" ON public.champions;
DROP POLICY IF EXISTS "Service role can insert champions" ON public.champions;

-- Create policies
-- Allow everyone to view champions (for leaderboards, etc.)
CREATE POLICY "Champions can view all champions" ON public.champions
    FOR SELECT USING (true);

-- Allow authenticated users to update their own profile
CREATE POLICY "Champions can update own profile" ON public.champions
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (if trigger doesn't create it)
-- This is a fallback in case the trigger fails
CREATE POLICY "Champions can insert own profile" ON public.champions
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.champions TO authenticated;
GRANT SELECT ON public.champions TO anon;

-- Note: If the above trigger approach doesn't work, you can alternatively
-- create an RPC function that bypasses RLS for creating the initial profile:

/*
-- Option 2: Create an RPC function to create champion profile (Alternative)
CREATE OR REPLACE FUNCTION public.create_champion_profile(
    p_id UUID,
    p_email TEXT,
    p_full_name TEXT DEFAULT '',
    p_company TEXT DEFAULT '',
    p_job_title TEXT DEFAULT '',
    p_cla_accepted BOOLEAN DEFAULT false,
    p_nda_accepted BOOLEAN DEFAULT false
)
RETURNS public.champions AS $$
DECLARE
    result public.champions;
BEGIN
    INSERT INTO public.champions (id, email, full_name, company, job_title, cla_accepted, nda_accepted, credits, is_verified, is_admin)
    VALUES (p_id, p_email, p_full_name, p_company, p_job_title, p_cla_accepted, p_nda_accepted, 0, false, false)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), champions.full_name),
        company = COALESCE(NULLIF(EXCLUDED.company, ''), champions.company),
        job_title = COALESCE(NULLIF(EXCLUDED.job_title, ''), champions.job_title)
    RETURNING * INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_champion_profile TO authenticated;
*/
