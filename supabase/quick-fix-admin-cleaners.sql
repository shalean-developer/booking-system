-- Quick Fix: Add admin policies for cleaners and bookings tables
-- Run this in your Supabase SQL Editor to fix "Failed to update cleaner" and "Failed to update booking" errors

-- Step 1: Create function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the current authenticated user's ID
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has admin role in customers table
  SELECT role INTO user_role
  FROM customers
  WHERE auth_user_id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing admin policies if they exist (to avoid conflicts)

-- Drop cleaners admin policies
DROP POLICY IF EXISTS "Admins can view all cleaners" ON cleaners;
DROP POLICY IF EXISTS "Admins can update all cleaners" ON cleaners;
DROP POLICY IF EXISTS "Admins can delete cleaners" ON cleaners;
DROP POLICY IF EXISTS "Admins can insert cleaners" ON cleaners;

-- Drop bookings admin policies
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can insert bookings" ON bookings;

-- Step 3: Create admin policies for CLEANERS table

CREATE POLICY "Admins can view all cleaners" ON cleaners
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all cleaners" ON cleaners
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete cleaners" ON cleaners
  FOR DELETE
  USING (is_admin());

CREATE POLICY "Admins can insert cleaners" ON cleaners
  FOR INSERT
  WITH CHECK (is_admin());

-- Step 4: Create admin policies for BOOKINGS table

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete bookings" ON bookings
  FOR DELETE
  USING (is_admin());

CREATE POLICY "Admins can insert bookings" ON bookings
  FOR INSERT
  WITH CHECK (is_admin());

-- Verification query (run this to test)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('cleaners', 'bookings')
ORDER BY tablename, policyname;

