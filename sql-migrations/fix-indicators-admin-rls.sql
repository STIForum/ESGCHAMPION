-- Fix indicators RLS policy for admin INSERT operations
-- The current "Admins can manage indicators" policy uses USING clause only,
-- which doesn't work properly for INSERT. We need WITH CHECK for INSERT.

-- Drop all existing indicator policies first
DROP POLICY IF EXISTS "Admins can manage indicators" ON indicators;
DROP POLICY IF EXISTS "Admins can view all indicators" ON indicators;
DROP POLICY IF EXISTS "Admins can insert indicators" ON indicators;
DROP POLICY IF EXISTS "Admins can update indicators" ON indicators;
DROP POLICY IF EXISTS "Admins can delete indicators" ON indicators;
DROP POLICY IF EXISTS "Anyone can view active indicators" ON indicators;

-- Recreate policies for different operations
-- Public SELECT policy (anyone can view active indicators)
CREATE POLICY "Anyone can view active indicators" ON indicators
    FOR SELECT USING (is_active = true);

-- SELECT policy for admins (can see all indicators, including inactive)
CREATE POLICY "Admins can view all indicators" ON indicators
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- INSERT policy for admins
CREATE POLICY "Admins can insert indicators" ON indicators
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- UPDATE policy for admins
CREATE POLICY "Admins can update indicators" ON indicators
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- DELETE policy for admins  
CREATE POLICY "Admins can delete indicators" ON indicators
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM champions WHERE id = auth.uid() AND is_admin = true)
    );

-- Verify the policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'indicators';
