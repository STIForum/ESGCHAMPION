-- FIX INFINITE RECURSION IN CHAMPIONS RLS POLICIES
-- =================================================
-- The error "infinite recursion detected in policy for relation 'champions'"
-- occurs when a policy on 'champions' tries to query 'champions' to check is_admin.

-- Step 1: Drop ALL existing policies on champions table
DROP POLICY IF EXISTS "Champions can view all champions" ON public.champions;
DROP POLICY IF EXISTS "Champions can update own profile" ON public.champions;
DROP POLICY IF EXISTS "Champions can insert own profile" ON public.champions;
DROP POLICY IF EXISTS "Service role can insert champions" ON public.champions;
DROP POLICY IF EXISTS "Admins can manage champions" ON public.champions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.champions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.champions;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.champions;

-- Step 2: Create simple non-recursive policies
-- Allow anyone to SELECT (for leaderboards, profiles)
CREATE POLICY "Allow public read access" ON public.champions
    FOR SELECT USING (true);

-- Allow authenticated users to INSERT their own profile
CREATE POLICY "Allow users to insert own profile" ON public.champions
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow authenticated users to UPDATE their own profile
CREATE POLICY "Allow users to update own profile" ON public.champions
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to DELETE their own profile (if needed)
CREATE POLICY "Allow users to delete own profile" ON public.champions
    FOR DELETE USING (auth.uid() = id);

-- Step 3: Create the trigger for auto-creating champion on signup
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
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.champions.full_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Manually create champion record for existing user
INSERT INTO public.champions (id, email, full_name, credits, is_verified, is_admin)
VALUES (
    '412ff744-ad69-4f17-b599-9c71e47269b3',
    'kparobo6829@gmail.com',
    'emmy whyte',
    0,
    true,
    false
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    is_verified = true;

-- Step 5: Grant proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.champions TO authenticated;
GRANT SELECT ON public.champions TO anon;

-- Step 6: For admin checks, create a security definer function instead
-- This avoids the recursion by using a function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT is_admin INTO admin_status FROM public.champions WHERE id = user_id;
    RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
