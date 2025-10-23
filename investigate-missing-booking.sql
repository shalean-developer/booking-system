-- Comprehensive Investigation Script for Missing Booking BK-1761196261961-hdv0frqw9
-- Run this in Supabase SQL Editor to diagnose the issue

-- =====================================================
-- 1. DIRECT BOOKING SEARCH
-- =====================================================

-- Check if booking exists by exact ID
SELECT 
  'EXACT ID SEARCH' as search_type,
  id,
  customer_name,
  customer_email,
  customer_phone,
  booking_date,
  booking_time,
  status,
  payment_reference,
  total_amount,
  created_at,
  cleaner_id
FROM bookings 
WHERE id = 'BK-1761196261961-hdv0frqw9';

-- Check for bookings with similar reference numbers
SELECT 
  'SIMILAR REFERENCE SEARCH' as search_type,
  id,
  customer_name,
  customer_email,
  payment_reference,
  status,
  created_at
FROM bookings 
WHERE payment_reference LIKE '%1761196261961%' 
   OR payment_reference LIKE '%hdv0frqw9%'
   OR id LIKE '%1761196261961%'
   OR id LIKE '%hdv0frqw9%'
ORDER BY created_at DESC;

-- =====================================================
-- 2. RECENT BOOKINGS ANALYSIS
-- =====================================================

-- Check recent bookings (last 24 hours)
SELECT 
  'RECENT BOOKINGS (24h)' as search_type,
  id,
  customer_name,
  customer_email,
  payment_reference,
  status,
  created_at,
  created_at
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- Check bookings with specific status patterns
SELECT 
  'STATUS ANALYSIS' as search_type,
  status,
  COUNT(*) as count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY status
ORDER BY count DESC;

-- =====================================================
-- 3. RLS POLICY INVESTIGATION
-- =====================================================

-- Check if RLS is enabled on bookings table
SELECT 
  'RLS STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'bookings';

-- Check all RLS policies on bookings table
SELECT 
  'RLS POLICIES' as check_type,
  policyname,
  cmd as operation,
  permissive,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;

-- =====================================================
-- 4. ADMIN ACCESS VERIFICATION
-- =====================================================

-- Check admin users in customers table
SELECT 
  'ADMIN USERS' as check_type,
  id,
  first_name,
  last_name,
  email,
  role,
  auth_user_id,
  created_at
FROM customers 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Check if there are any customers with auth_user_id
SELECT 
  'CUSTOMER AUTH LINKING' as check_type,
  COUNT(*) as total_customers,
  COUNT(auth_user_id) as customers_with_auth,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_customers
FROM customers;

-- =====================================================
-- 5. BOOKING CREATION PATTERNS
-- =====================================================

-- Check booking creation patterns
SELECT 
  'BOOKING PATTERNS' as check_type,
  DATE(created_at) as creation_date,
  COUNT(*) as bookings_created,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY creation_date DESC;

-- Check for bookings with NULL or missing critical data
SELECT 
  'MISSING DATA CHECK' as check_type,
  id,
  customer_name,
  customer_email,
  payment_reference,
  status,
  created_at
FROM bookings 
WHERE customer_name IS NULL 
   OR customer_email IS NULL 
   OR payment_reference IS NULL
   OR total_amount IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 6. PAYMENT REFERENCE ANALYSIS
-- =====================================================

-- Check payment reference patterns
SELECT 
  'PAYMENT REFERENCE PATTERNS' as check_type,
  payment_reference,
  COUNT(*) as count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM bookings 
WHERE payment_reference IS NOT NULL
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY payment_reference
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- =====================================================
-- 7. ERROR PATTERN DETECTION
-- =====================================================

-- Check for bookings that might have been created but not properly committed
SELECT 
  'POTENTIAL ROLLBACK CANDIDATES' as check_type,
  id,
  customer_name,
  customer_email,
  status,
  created_at,
  CASE 
    WHEN status = 'pending' THEN 'May need attention'
    WHEN status = 'failed' THEN 'Failed booking'
    WHEN customer_email IS NULL THEN 'Missing email'
    ELSE 'No issues detected'
  END as issue_type
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- =====================================================
-- 8. MANUAL RECOVERY QUERIES
-- =====================================================

-- If booking is found but hidden, this query can make it visible
-- (Run only if booking exists but admin can't see it)
/*
UPDATE bookings 
SET status = 'confirmed'
WHERE id = 'BK-1761196261961-hdv0frqw9'
  AND status = 'pending';
*/

-- Check if booking exists in any form
SELECT 
  'FINAL VERIFICATION' as check_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM bookings WHERE id = 'BK-1761196261961-hdv0frqw9') 
    THEN 'BOOKING EXISTS IN DATABASE'
    ELSE 'BOOKING NOT FOUND IN DATABASE'
  END as result;
