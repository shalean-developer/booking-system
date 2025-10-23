-- Fix RLS permission error for cleaner_reviews in customer dashboard
-- Issue: Admin policy references auth.users which regular customers can't query
-- Solution: Remove admin policy - customers only need to see their own reviews

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all reviews" ON cleaner_reviews;

-- Verify remaining policies (should only show customer policies now)
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'cleaner_reviews'
ORDER BY policyname;
