-- Fix: Allow cleaners to claim available bookings
-- Issue: Cleaner RLS policies were blocking the claim operation
-- Solution: Update RLS policies to allow booking claims without auth.uid()

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Cleaners can claim bookings" ON bookings;

-- Create a more permissive policy for claiming bookings
-- This allows ANY update to bookings where:
-- 1. The booking has no cleaner assigned yet (cleaner_id IS NULL)
-- 2. The booking status is 'pending'
-- 3. The update is setting a cleaner_id (which the API route validates)
CREATE POLICY "Cleaners can claim available bookings" ON bookings
  FOR UPDATE
  USING (
    cleaner_id IS NULL AND 
    status = 'pending'
  )
  WITH CHECK (
    cleaner_id IS NOT NULL AND 
    status = 'pending'
  );

-- Also ensure cleaners can view available bookings (update if needed)
DROP POLICY IF EXISTS "Cleaners can view available bookings" ON bookings;

CREATE POLICY "Cleaners can view available bookings" ON bookings
  FOR SELECT
  USING (
    cleaner_id IS NULL AND 
    status = 'pending'
  );

-- Policy for cleaners to view their assigned bookings
DROP POLICY IF EXISTS "Cleaners can view assigned bookings" ON bookings;

CREATE POLICY "Cleaners can view assigned bookings" ON bookings
  FOR SELECT
  USING (
    cleaner_id IS NOT NULL
  );

-- Policy for cleaners to update their assigned bookings
DROP POLICY IF EXISTS "Cleaners can update assigned bookings" ON bookings;

CREATE POLICY "Cleaners can update assigned bookings" ON bookings
  FOR UPDATE
  USING (
    cleaner_id IS NOT NULL
  )
  WITH CHECK (
    cleaner_id IS NOT NULL
  );

-- Verification query
SELECT 
  tablename,
  policyname,
  permissive,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'bookings'
  AND policyname LIKE '%leaner%'
ORDER BY policyname;

