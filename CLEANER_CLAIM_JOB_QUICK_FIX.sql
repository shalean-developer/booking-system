-- =====================================================
-- QUICK FIX: Cleaner Claim Job Button
-- =====================================================
-- Run this in Supabase SQL Editor to fix the claim button
-- Issue: RLS policies were blocking cleaners from claiming jobs
-- =====================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Cleaners can claim bookings" ON bookings;
DROP POLICY IF EXISTS "Cleaners can view available bookings" ON bookings;
DROP POLICY IF EXISTS "Cleaners can view assigned bookings" ON bookings;
DROP POLICY IF EXISTS "Cleaners can update assigned bookings" ON bookings;

-- Allow claiming available bookings
CREATE POLICY "Cleaners can claim available bookings" ON bookings
  FOR UPDATE
  USING (cleaner_id IS NULL AND status = 'pending')
  WITH CHECK (cleaner_id IS NOT NULL AND status = 'pending');

-- Allow viewing available bookings
CREATE POLICY "Cleaners can view available bookings" ON bookings
  FOR SELECT
  USING (cleaner_id IS NULL AND status = 'pending');

-- Allow viewing assigned bookings
CREATE POLICY "Cleaners can view assigned bookings" ON bookings
  FOR SELECT
  USING (cleaner_id IS NOT NULL);

-- Allow updating assigned bookings
CREATE POLICY "Cleaners can update assigned bookings" ON bookings
  FOR UPDATE
  USING (cleaner_id IS NOT NULL)
  WITH CHECK (cleaner_id IS NOT NULL);

-- =====================================================
-- Verification (check policies were created)
-- =====================================================
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%claim%' THEN '✅ Allows claiming'
    WHEN policyname LIKE '%available%' THEN '✅ Shows available jobs'
    WHEN policyname LIKE '%assigned%' THEN '✅ Manages assigned jobs'
    ELSE '?' 
  END as purpose
FROM pg_policies 
WHERE tablename = 'bookings'
  AND policyname ILIKE '%cleaner%'
ORDER BY policyname;

-- =====================================================
-- Success! The Claim Job button should now work! 🎉
-- =====================================================

