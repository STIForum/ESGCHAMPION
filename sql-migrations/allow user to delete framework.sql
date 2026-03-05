-- Allow authenticated users with admin privileges to delete frameworks
CREATE POLICY "Admins can delete frameworks"
ON public.frameworks
FOR DELETE
USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM public.champions 
    WHERE id = auth.uid() AND is_admin = true
  )
);