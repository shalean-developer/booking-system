-- Fix Quotes Table RLS for Admin Access
-- This script creates the necessary RLS policies so admins can view and manage quotes

-- Step 1: Create or replace the is_admin() function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Return false if no authenticated user
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get the user's role from customers table
  SELECT role INTO user_role
  FROM customers
  WHERE auth_user_id = auth.uid();
  
  -- Return true if role is 'admin'
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing problematic policies on quotes table
DROP POLICY IF EXISTS "Authenticated users can view quotes" ON quotes;
DROP POLICY IF EXISTS "Authenticated users can update quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can view all quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can update all quotes" ON quotes;
DROP POLICY IF EXISTS "Admins can delete quotes" ON quotes;

-- Step 3: Create new admin-specific policies

-- Allow admins to SELECT (view) all quotes
CREATE POLICY "Admins can view all quotes" ON quotes
  FOR SELECT
  USING (is_admin());

-- Allow admins to UPDATE quotes (change status, add notes)
CREATE POLICY "Admins can update all quotes" ON quotes
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow admins to DELETE quotes
CREATE POLICY "Admins can delete quotes" ON quotes
  FOR DELETE
  USING (is_admin());

-- Note: The "Public can create quotes" INSERT policy should already exist
-- from the original quotes-table.sql migration. If not, uncomment below:
-- CREATE POLICY "Public can create quotes" ON quotes
--   FOR INSERT WITH CHECK (true);

-- Step 4: Verify policies were created
SELECT 
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies 
WHERE tablename = 'quotes'
ORDER BY policyname;

-- Expected output should show:
-- 1. "Admins can delete quotes" (DELETE)
-- 2. "Admins can update all quotes" (UPDATE)
-- 3. "Admins can view all quotes" (SELECT)
-- 4. "Public can create quotes" (INSERT)

