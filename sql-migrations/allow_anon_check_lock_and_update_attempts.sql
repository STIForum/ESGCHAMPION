-- Allow anonymous users to check if an account is locked (SELECT specific columns)
CREATE POLICY "Allow anonymous users to check account lock status" 
ON public.champions
FOR SELECT 
TO anon
USING (true);

-- Allow anonymous users to update failed login attempts and lock status
CREATE POLICY "Allow anonymous users to update login attempts" 
ON public.champions
FOR UPDATE 
TO anon
USING (true)
WITH CHECK (true);

-- Note: These policies are broad for simplicity. 
-- For better security, you can restrict to specific columns:
-- UPDATE OF failed_login_attempts, locked_updated