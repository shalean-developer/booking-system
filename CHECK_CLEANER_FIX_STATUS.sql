-- =====================================================
-- DIAGNOSTIC: Check if Cleaner Claim Fix is Applied
-- =====================================================
-- Run this in Supabase SQL Editor to check the status
-- =====================================================

-- 1. Check if RLS is enabled on bookings table
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'bookings';

-- 2. Check existing RLS policies on bookings table
SELECT 
  policyname as "Policy Name",
  cmd as "Operation",
  CASE 
    WHEN policyname ILIKE '%claim%' THEN '✅ Claim Policy'
    WHEN policyname ILIKE '%available%cleaner%' THEN '✅ View Available'
    WHEN policyname ILIKE '%assigned%cleaner%' THEN '✅ View/Update Assigned'
    WHEN policyname ILIKE '%admin%' THEN '🔧 Admin Policy'
    WHEN policyname ILIKE '%customer%' THEN '👤 Customer Policy'
    ELSE '❓ Other'
  END as "Type",
  permissive as "Permissive",
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;

-- 3. Check for available bookings (unclaimed, pending)
SELECT 
  COUNT(*) as "Available Bookings",
  'These are bookings cleaners can claim' as "Description"
FROM bookings 
WHERE cleaner_id IS NULL 
  AND status = 'pending';

-- 4. Sample of available bookings
SELECT 
  id,
  customer_name,
  booking_date,
  booking_time,
  address_city,
  status,
  cleaner_id
FROM bookings 
WHERE cleaner_id IS NULL 
  AND status = 'pending'
ORDER BY booking_date, booking_time
LIMIT 5;

-- 5. Check if required policies exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'bookings' 
      AND policyname ILIKE '%claim%available%'
    ) THEN '✅ PASS'
    ELSE '❌ MISSING - Run CLEANER_CLAIM_JOB_QUICK_FIX.sql'
  END as "Claim Policy Status",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'bookings' 
      AND policyname ILIKE '%view%available%'
    ) THEN '✅ PASS'
    ELSE '❌ MISSING - Run CLEANER_CLAIM_JOB_QUICK_FIX.sql'
  END as "View Available Policy Status",
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'bookings' 
      AND policyname ILIKE '%assigned%'
      AND cmd = 'UPDATE'
    ) THEN '✅ PASS'
    ELSE '⚠️ CHECK - May need to run fix'
  END as "Update Assigned Policy Status";

-- =====================================================
-- EXPECTED RESULTS:
-- =====================================================
-- 1. RLS Enabled: true
-- 2. Should see 4 cleaner-related policies:
--    - "Cleaners can claim available bookings" (UPDATE)
--    - "Cleaners can view available bookings" (SELECT)
--    - "Cleaners can view assigned bookings" (SELECT)
--    - "Cleaners can update assigned bookings" (UPDATE)
-- 3. All policy status checks should show ✅ PASS
-- 
-- If you see ❌ MISSING, run: CLEANER_CLAIM_JOB_QUICK_FIX.sql
-- =====================================================

