-- Fix RLS Policies for Services Table
-- This fixes the "permission denied for table users" error
-- Safe to run multiple times - drops existing policies first

-- Step 1: Drop existing policies (safe if they don't exist)
DROP POLICY IF EXISTS "Public can view active services" ON services;
DROP POLICY IF EXISTS "Admins can manage services" ON services;

-- Step 2: Create public read access policy (no auth.users query needed)
CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);

-- Step 3: Create admin management policy using JWT claims (no auth.users query)
CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
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

-- Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'services'
ORDER BY policyname;

