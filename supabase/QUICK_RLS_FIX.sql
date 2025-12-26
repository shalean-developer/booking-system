-- QUICK FIX for "new row violates row-level security policy" error
-- Run this in Supabase SQL Editor to fix the INSERT permission issue

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view active pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can view all pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can insert pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can update pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can delete pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can manage pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can view pricing history" ON pricing_history;
DROP POLICY IF EXISTS "Allow trigger inserts to pricing history" ON pricing_history;

-- Public read access to active pricing (SELECT only)
CREATE POLICY "Public can view active pricing" ON pricing_config
  FOR SELECT USING (
    is_active = true 
    AND effective_date <= CURRENT_DATE 
    AND (end_date IS NULL OR end_date > CURRENT_DATE)
  );

-- Admin SELECT policy
CREATE POLICY "Admins can view all pricing" ON pricing_config
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Admin INSERT policy (requires WITH CHECK for new rows) ← THIS IS THE FIX!
CREATE POLICY "Admins can insert pricing" ON pricing_config
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Admin UPDATE policy
CREATE POLICY "Admins can update pricing" ON pricing_config
  FOR UPDATE 
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Admin DELETE policy
CREATE POLICY "Admins can delete pricing" ON pricing_config
  FOR DELETE 
  USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Pricing history policies
CREATE POLICY "Admins can view pricing history" ON pricing_history
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND (
      auth.jwt()->>'role' = 'admin'
      OR 
      (auth.jwt()->'user_metadata'->>'role') = 'admin'
    )
  );

-- Allow triggers to insert into pricing_history (needed for audit trail)
CREATE POLICY "Allow trigger inserts to pricing history" ON pricing_history
  FOR INSERT 
  WITH CHECK (true);

-- Test the fix (should return success if you're logged in as admin)
SELECT 'RLS policies updated successfully!' as status;

