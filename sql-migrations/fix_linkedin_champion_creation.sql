-- ================================================
-- LinkedIn OAuth Champion Record Creation Fix
-- ================================================
-- This migration fixes the issue where LinkedIn OAuth users
-- don't get a champion record created automatically.
--
-- Problems fixed:
-- 1. RLS policies that prevent authenticated users from creating their own champion record
-- 2. Missing trigger to auto-create champion record when auth.users is created
-- 3. Ensures champion record is returned after INSERT/UPDATE

-- ================================================
-- Step 1: Drop existing policies if they exist
-- ================================================

DROP POLICY IF EXISTS "Champions can view own profile" ON champions;
DROP POLICY IF EXISTS "Champions can update own profile" ON champions;
DROP POLICY IF EXISTS "Champions can insert own profile" ON champions;
DROP POLICY IF EXISTS "Anyone can read champions" ON champions;
DROP POLICY IF EXISTS "Enable read access for all users" ON champions;

-- ================================================
-- Step 2: Create comprehensive RLS policies
-- ================================================

-- Allow authenticated users to SELECT their own champion record
CREATE POLICY "Champions can view own profile"
ON champions
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow authenticated users to INSERT their own champion record
-- This is CRITICAL for LinkedIn OAuth users
CREATE POLICY "Champions can insert own profile"
ON champions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to UPDATE their own champion record
CREATE POLICY "Champions can update own profile"
ON champions
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow public read access for leaderboards, profiles, etc.
-- (Optional - remove if you want profiles to be private)
CREATE POLICY "Anyone can read champions"
ON champions
FOR SELECT
TO public
USING (true);

-- ================================================
-- Step 3: Create function to auto-create champion record
-- ================================================

-- This function automatically creates a champion record when a new auth.users record is created
-- Especially important for OAuth providers like LinkedIn

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_full_name text;
  user_avatar text;
BEGIN
  -- Get user email
  user_email := NEW.email;
  
  -- Try to extract name from metadata (LinkedIn provides this)
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );
  
  -- Try to extract avatar from metadata
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    ''
  );
  
  -- Insert champion record with data from auth.users metadata
  INSERT INTO public.champions (
    id,
    email,
    full_name,
    avatar_url,
    company,
    job_title,
    linkedin_url,
    mobile_number,
    office_phone,
    website,
    is_verified,
    user_type,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_email,
    user_full_name,
    user_avatar,
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'job_title', ''),
    COALESCE(NEW.raw_user_meta_data->>'linkedin_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'office_phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'website', ''),
    (NEW.email_confirmed_at IS NOT NULL),
    'champion',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;  -- Don't fail if record already exists
  
  RETURN NEW;
END;
$$;

-- ================================================
-- Step 4: Create trigger on auth.users
-- ================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires AFTER a new user is inserted
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- Step 5: Backfill missing champion records
-- ================================================

-- This creates champion records for any auth.users that don't have a champion record yet
-- Useful for fixing existing LinkedIn users who are affected by this bug

INSERT INTO public.champions (
  id,
  email,
  full_name,
  avatar_url,
  is_verified,
  user_type,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    ''
  ),
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture',
    ''
  ),
  (u.email_confirmed_at IS NOT NULL),
  'champion',
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.champions c ON c.id = u.id
WHERE c.id IS NULL  -- Only insert if champion record doesn't exist
  AND u.raw_user_meta_data->>'user_type' IS NULL  -- Skip business users
  OR u.raw_user_meta_data->>'user_type' = 'champion';

-- ================================================
-- Step 6: Grant necessary permissions
-- ================================================

-- Ensure authenticated users can read/write to champions table
GRANT SELECT, INSERT, UPDATE ON public.champions TO authenticated;

-- Allow the trigger function to execute
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;

-- ================================================
-- Verification Queries
-- ================================================

-- Run these queries to verify the fix worked:

-- 1. Check RLS policies are in place
-- SELECT * FROM pg_policies WHERE tablename = 'champions';

-- 2. Check trigger exists
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 3. Find auth.users without champion records (should be empty after backfill)
-- SELECT u.id, u.email, u.created_at
-- FROM auth.users u
-- LEFT JOIN public.champions c ON c.id = u.id
-- WHERE c.id IS NULL;

-- 4. Test creating a champion record manually (should succeed)
-- INSERT INTO public.champions (id, email, full_name)
-- VALUES (auth.uid(), 'test@example.com', 'Test User');

-- ================================================
-- Rollback Instructions (if needed)
-- ================================================

/*
-- To rollback this migration:

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP POLICY IF EXISTS "Champions can view own profile" ON champions;
DROP POLICY IF EXISTS "Champions can update own profile" ON champions;
DROP POLICY IF EXISTS "Champions can insert own profile" ON champions;
DROP POLICY IF EXISTS "Anyone can read champions" ON champions;
*/
