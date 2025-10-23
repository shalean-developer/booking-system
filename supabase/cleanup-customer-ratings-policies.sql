-- Clean up duplicate and conflicting customer_ratings policies
-- Issue: Multiple policies with same names and conflicting permissions
-- Solution: Remove duplicates and consolidate policies

-- ============================================
-- Remove duplicate and conflicting policies
-- ============================================

-- Drop all existing customer_ratings policies to start clean
DROP POLICY IF EXISTS "Admins can delete customer_ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Admins can insert customer_ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Admins can update all customer_ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Admins can view all customer ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Admins can view all customer_ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Allow cleaners to insert customer ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Allow cleaners to view customer ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Cleaners can create customer ratings" ON customer_ratings;
DROP POLICY IF EXISTS "Cleaners can view own ratings" ON customer_ratings;

-- ============================================
-- Create clean, consolidated policies
-- ============================================

-- Admin policies (full access)
CREATE POLICY "Admins can view all customer ratings" ON customer_ratings
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert customer ratings" ON customer_ratings
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update customer ratings" ON customer_ratings
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete customer ratings" ON customer_ratings
  FOR DELETE
  USING (is_admin());

-- Cleaner policies (limited access)
CREATE POLICY "Cleaners can view own ratings" ON customer_ratings
  FOR SELECT
  USING (
    cleaner_id::text = current_setting('app.current_cleaner_id', true)
  );

CREATE POLICY "Cleaners can create ratings" ON customer_ratings
  FOR INSERT
  WITH CHECK (
    cleaner_id::text = current_setting('app.current_cleaner_id', true)
  );

-- ============================================
-- Verify the clean policies
-- ============================================

-- Check customer_ratings policies
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'customer_ratings'
ORDER BY policyname, cmd;

-- Check cleaner_reviews policies (should be clean already)
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'cleaner_reviews'
ORDER BY policyname, cmd;
