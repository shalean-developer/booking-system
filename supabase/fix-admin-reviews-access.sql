-- Fix Admin Reviews Access
-- Issue: Admin policy for cleaner_reviews was dropped, and customer_ratings has no admin policy
-- Solution: Create proper admin policies using the same approach as other admin policies

-- ============================================
-- Create admin check function (if it doesn't exist)
-- ============================================

-- Function to check if current user is an admin (same as other admin policies)
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

-- ============================================
-- Fix cleaner_reviews admin access
-- ============================================

-- Drop any existing admin policy first
DROP POLICY IF EXISTS "Admins can view all reviews" ON cleaner_reviews;

-- Create admin policy for cleaner_reviews using the same approach as other tables
CREATE POLICY "Admins can view all reviews" ON cleaner_reviews
  FOR SELECT
  USING (is_admin());

-- ============================================
-- Fix customer_ratings admin access
-- ============================================

-- Drop any existing admin policy first
DROP POLICY IF EXISTS "Admins can view all customer ratings" ON customer_ratings;

-- Create admin policy for customer_ratings
CREATE POLICY "Admins can view all customer ratings" ON customer_ratings
  FOR SELECT
  USING (is_admin());

-- ============================================
-- Verify the policies were created
-- ============================================

-- Check cleaner_reviews policies
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'cleaner_reviews'
ORDER BY policyname;

-- Check customer_ratings policies
SELECT 
  policyname, 
  cmd, 
  qual 
FROM pg_policies 
WHERE tablename = 'customer_ratings'
ORDER BY policyname;

-- ============================================
-- Test queries (optional - uncomment to test)
-- ============================================

-- Test admin access to cleaner_reviews
-- SELECT COUNT(*) as total_reviews FROM cleaner_reviews;

-- Test admin access to customer_ratings  
-- SELECT COUNT(*) as total_ratings FROM customer_ratings;
