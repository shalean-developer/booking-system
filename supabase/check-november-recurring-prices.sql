-- ============================================
-- CHECK NOVEMBER RECURRING BOOKING PRICING
-- ============================================
-- This script shows all November bookings from recurring schedules
-- to understand what the correct pricing should be
-- ============================================

-- Check 1: All November recurring bookings with their details
SELECT 
  b.id as booking_id,
  b.booking_date,
  b.customer_name,
  b.recurring_schedule_id,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  rs.extras,
  b.total_amount as booking_total_cents,
  ROUND(b.total_amount / 100.0, 2) as booking_total_rands,
  b.cleaner_earnings as booking_cleaner_earnings_cents,
  ROUND(b.cleaner_earnings / 100.0, 2) as booking_cleaner_earnings_rands,
  rs.total_amount as schedule_total_cents,
  ROUND(rs.total_amount / 100.0, 2) as schedule_total_rands,
  CASE 
    WHEN rs.total_amount IS NULL THEN '⚠️ SCHEDULE HAS NO PRICING'
    WHEN b.total_amount = rs.total_amount THEN '✅ MATCHES SCHEDULE'
    ELSE '❌ MISMATCH'
  END as status
FROM bookings b
LEFT JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
WHERE b.booking_date >= '2024-11-01' 
  AND b.booking_date < '2024-12-01'
  AND b.recurring_schedule_id IS NOT NULL
ORDER BY b.booking_date, b.customer_name;

-- Check 2: Summary by schedule - November pricing
SELECT 
  rs.id as schedule_id,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  array_length(rs.extras, 1) as extras_count,
  COUNT(b.id) as november_bookings,
  ROUND(AVG(b.total_amount) / 100.0, 2) as avg_november_price_rands,
  MIN(ROUND(b.total_amount / 100.0, 2)) as min_november_price_rands,
  MAX(ROUND(b.total_amount / 100.0, 2)) as max_november_price_rands,
  ROUND(rs.total_amount / 100.0, 2) as schedule_stored_price_rands,
  CASE 
    WHEN rs.total_amount IS NULL THEN '⚠️ NO SCHEDULE PRICING'
    WHEN ROUND(AVG(b.total_amount)) = rs.total_amount THEN '✅ MATCHES SCHEDULE'
    ELSE '❌ MISMATCH'
  END as status
FROM bookings b
INNER JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
WHERE b.booking_date >= '2024-11-01' 
  AND b.booking_date < '2024-12-01'
GROUP BY rs.id, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.extras, rs.total_amount
ORDER BY november_bookings DESC;

-- Check 3: Most common pricing values in November recurring bookings
SELECT 
  ROUND(total_amount / 100.0, 2) as price_rands,
  COUNT(*) as booking_count,
  COUNT(DISTINCT recurring_schedule_id) as schedule_count,
  ROUND(AVG(cleaner_earnings) / 100.0, 2) as avg_cleaner_earnings_rands
FROM bookings
WHERE booking_date >= '2024-11-01' 
  AND booking_date < '2024-12-01'
  AND recurring_schedule_id IS NOT NULL
GROUP BY ROUND(total_amount / 100.0, 2)
ORDER BY booking_count DESC;

-- Check 4: Compare November vs December pricing for same schedules
WITH november_avg AS (
  SELECT 
    recurring_schedule_id,
    COUNT(*) as nov_count,
    ROUND(AVG(total_amount)) as nov_avg_total_cents,
    ROUND(AVG(total_amount) / 100.0, 2) as nov_avg_total_rands,
    ROUND(AVG(cleaner_earnings)) as nov_avg_cleaner_earnings_cents,
    ROUND(AVG(cleaner_earnings) / 100.0, 2) as nov_avg_cleaner_earnings_rands
  FROM bookings
  WHERE booking_date >= '2024-11-01' 
    AND booking_date < '2024-12-01'
    AND recurring_schedule_id IS NOT NULL
  GROUP BY recurring_schedule_id
),
december_avg AS (
  SELECT 
    recurring_schedule_id,
    COUNT(*) as dec_count,
    ROUND(AVG(total_amount)) as dec_avg_total_cents,
    ROUND(AVG(total_amount) / 100.0, 2) as dec_avg_total_rands,
    ROUND(AVG(cleaner_earnings)) as dec_avg_cleaner_earnings_cents,
    ROUND(AVG(cleaner_earnings) / 100.0, 2) as dec_avg_cleaner_earnings_rands
  FROM bookings
  WHERE booking_date >= '2025-12-01' 
    AND booking_date < '2026-01-01'
    AND recurring_schedule_id IS NOT NULL
  GROUP BY recurring_schedule_id
)
SELECT 
  COALESCE(n.recurring_schedule_id, d.recurring_schedule_id) as schedule_id,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  n.nov_count,
  d.dec_count,
  n.nov_avg_total_rands,
  d.dec_avg_total_rands,
  CASE 
    WHEN n.nov_avg_total_cents = d.dec_avg_total_cents THEN '✅ SAME PRICING'
    WHEN n.nov_avg_total_cents IS NULL THEN '⚠️ NO NOVEMBER BOOKINGS'
    WHEN d.dec_avg_total_cents IS NULL THEN '⚠️ NO DECEMBER BOOKINGS'
    ELSE '❌ PRICING DIFFERENT'
  END as status,
  CASE 
    WHEN n.nov_avg_total_cents != d.dec_avg_total_cents THEN 
      ROUND((d.dec_avg_total_cents - n.nov_avg_total_cents) / 100.0, 2)
    ELSE 0
  END as difference_rands
FROM november_avg n
FULL OUTER JOIN december_avg d ON n.recurring_schedule_id = d.recurring_schedule_id
LEFT JOIN recurring_schedules rs ON COALESCE(n.recurring_schedule_id, d.recurring_schedule_id) = rs.id
ORDER BY 
  CASE 
    WHEN n.nov_avg_total_cents != d.dec_avg_total_cents THEN 1
    ELSE 2
  END,
  COALESCE(n.recurring_schedule_id, d.recurring_schedule_id);

