-- ============================================
-- DIAGNOSE DECEMBER 2025 BOOKING PRICING
-- ============================================
-- This script shows all December bookings and their pricing
-- to help identify any issues
-- ============================================

-- Check 1: All December bookings with their schedule pricing
SELECT 
  b.id as booking_id,
  b.booking_date,
  b.customer_name,
  rs.id as schedule_id,
  b.total_amount as booking_total_cents,
  ROUND(b.total_amount / 100.0, 2) as booking_total_rands,
  rs.total_amount as schedule_total_cents,
  ROUND(rs.total_amount / 100.0, 2) as schedule_total_rands,
  CASE 
    WHEN rs.total_amount IS NULL THEN '⚠️ SCHEDULE HAS NO PRICING'
    WHEN b.total_amount = rs.total_amount THEN '✅ MATCHES SCHEDULE'
    ELSE '❌ MISMATCH'
  END as status
FROM bookings b
LEFT JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
WHERE b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
  AND b.recurring_schedule_id IS NOT NULL
ORDER BY b.booking_date, b.customer_name;

-- Check 2: Summary by schedule
SELECT 
  rs.id as schedule_id,
  COUNT(b.id) as december_bookings,
  ROUND(AVG(b.total_amount) / 100.0, 2) as avg_booking_price_rands,
  ROUND(rs.total_amount / 100.0, 2) as schedule_price_rands,
  CASE 
    WHEN rs.total_amount IS NULL THEN '⚠️ NO SCHEDULE PRICING'
    WHEN ROUND(AVG(b.total_amount)) = rs.total_amount THEN '✅ MATCHES'
    ELSE '❌ MISMATCH'
  END as status
FROM bookings b
INNER JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
WHERE b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
GROUP BY rs.id, rs.total_amount
ORDER BY december_bookings DESC;

-- Check 3: Schedules without pricing set
SELECT 
  rs.id as schedule_id,
  rs.customer_id,
  COUNT(b.id) as december_bookings,
  ROUND(AVG(b.total_amount) / 100.0, 2) as current_avg_price_rands,
  '⚠️ SCHEDULE NEEDS PRICING SET' as issue
FROM recurring_schedules rs
INNER JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
  AND (rs.total_amount IS NULL OR rs.total_amount = 0)
GROUP BY rs.id, rs.customer_id
ORDER BY december_bookings DESC;

-- Check 4: Most common pricing values in December bookings
SELECT 
  ROUND(total_amount / 100.0, 2) as price_rands,
  COUNT(*) as booking_count,
  COUNT(DISTINCT recurring_schedule_id) as schedule_count
FROM bookings
WHERE booking_date >= '2025-12-01' 
  AND booking_date < '2026-01-01'
  AND recurring_schedule_id IS NOT NULL
GROUP BY ROUND(total_amount / 100.0, 2)
ORDER BY booking_count DESC;

