-- ============================================
-- DIAGNOSTIC: CHECK DATABASE STATE
-- ============================================
-- Run this to see what's actually in your database
-- ============================================

-- Check 1: Total bookings count
SELECT 
  'Total Bookings' as check_name,
  COUNT(*) as count
FROM bookings;

-- Check 2: Bookings with cleaner_earnings
SELECT 
  'Bookings with cleaner_earnings' as check_name,
  COUNT(*) as count,
  COUNT(CASE WHEN cleaner_earnings IS NOT NULL THEN 1 END) as with_earnings,
  COUNT(CASE WHEN cleaner_earnings IS NULL THEN 1 END) as without_earnings
FROM bookings;

-- Check 3: Bookings by status
SELECT 
  'Bookings by Status' as check_name,
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN cleaner_earnings IS NOT NULL THEN 1 END) as with_earnings
FROM bookings
GROUP BY status
ORDER BY count DESC;

-- Check 4: Bookings by cleaner_id type
SELECT 
  'Bookings by Cleaner ID Type' as check_name,
  CASE 
    WHEN cleaner_id IS NULL THEN 'NULL'
    WHEN cleaner_id = 'manual' THEN 'manual'
    WHEN cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'valid_uuid'
    ELSE 'other'
  END as cleaner_id_type,
  COUNT(*) as count
FROM bookings
GROUP BY 
  CASE 
    WHEN cleaner_id IS NULL THEN 'NULL'
    WHEN cleaner_id = 'manual' THEN 'manual'
    WHEN cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'valid_uuid'
    ELSE 'other'
  END;

-- Check 5: Sample bookings (if any exist)
SELECT 
  'Sample Bookings' as check_name,
  id,
  cleaner_id,
  status,
  total_amount,
  cleaner_earnings,
  booking_date,
  created_at
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

-- Check 6: Cleaners count
SELECT 
  'Total Cleaners' as check_name,
  COUNT(*) as count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_cleaners
FROM cleaners;
