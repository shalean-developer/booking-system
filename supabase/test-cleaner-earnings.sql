-- ============================================
-- TEST CLEANER EARNINGS CALCULATION
-- ============================================
-- This script tests the cleaner earnings calculation logic
-- Run this to verify earnings are calculated correctly
-- ============================================

-- Test 1: Check if there are any bookings with cleaner_earnings
SELECT 
  'Bookings with cleaner_earnings' as test_name,
  COUNT(*) as count,
  ROUND(AVG(cleaner_earnings) / 100, 2) as avg_earnings_rand
FROM bookings
WHERE cleaner_earnings IS NOT NULL;

-- Test 2: Check completed bookings specifically
SELECT 
  'Completed bookings with earnings' as test_name,
  COUNT(*) as count,
  ROUND(SUM(cleaner_earnings) / 100, 2) as total_earnings_rand
FROM bookings
WHERE status = 'completed' 
  AND cleaner_earnings IS NOT NULL;

-- Test 3: Check bookings by cleaner
SELECT 
  c.name as cleaner_name,
  c.hire_date,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
  ROUND(SUM(CASE WHEN b.status = 'completed' THEN b.cleaner_earnings ELSE 0 END) / 100, 2) as total_earnings_rand
FROM cleaners c
LEFT JOIN bookings b ON (
  b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
  AND c.id = b.cleaner_id::uuid
)
WHERE c.is_active = true
GROUP BY c.id, c.name, c.hire_date
ORDER BY total_earnings_rand DESC;

-- Test 4: Check recent bookings (last 30 days)
SELECT 
  'Recent bookings (30 days)' as test_name,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
  ROUND(SUM(CASE WHEN status = 'completed' THEN cleaner_earnings ELSE 0 END) / 100, 2) as total_earnings_rand
FROM bookings
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Test 5: Check today's bookings
SELECT 
  'Today\'s bookings' as test_name,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
  ROUND(SUM(CASE WHEN status = 'completed' THEN cleaner_earnings ELSE 0 END) / 100, 2) as total_earnings_rand
FROM bookings
WHERE booking_date = CURRENT_DATE;
