-- ============================================
-- CHECK NOVEMBER VS DECEMBER PRICING
-- ============================================
-- This script helps diagnose pricing differences
-- between November and December bookings
-- ============================================

-- Check 1: Do we have November bookings?
SELECT 
  COUNT(*) as november_bookings_count,
  COUNT(DISTINCT recurring_schedule_id) as schedules_with_november_bookings,
  ROUND(AVG(total_amount) / 100.0, 2) as avg_november_price_rands,
  MIN(ROUND(total_amount / 100.0, 2)) as min_november_price_rands,
  MAX(ROUND(total_amount / 100.0, 2)) as max_november_price_rands
FROM bookings
WHERE booking_date >= '2024-11-01' 
  AND booking_date < '2024-12-01'
  AND recurring_schedule_id IS NOT NULL;

-- Check 2: Do we have December bookings?
SELECT 
  COUNT(*) as december_bookings_count,
  COUNT(DISTINCT recurring_schedule_id) as schedules_with_december_bookings,
  ROUND(AVG(total_amount) / 100.0, 2) as avg_december_price_rands,
  MIN(ROUND(total_amount / 100.0, 2)) as min_december_price_rands,
  MAX(ROUND(total_amount / 100.0, 2)) as max_december_price_rands
FROM bookings
WHERE booking_date >= '2025-12-01' 
  AND booking_date < '2026-01-01'
  AND recurring_schedule_id IS NOT NULL;

-- Check 3: Compare November vs December pricing per schedule
WITH november_avg AS (
  SELECT 
    recurring_schedule_id,
    COUNT(*) as nov_count,
    ROUND(AVG(total_amount)) as nov_avg_total_cents,
    ROUND(AVG(total_amount) / 100.0, 2) as nov_avg_total_rands,
    MIN(ROUND(total_amount / 100.0, 2)) as nov_min_rands,
    MAX(ROUND(total_amount / 100.0, 2)) as nov_max_rands
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
    MIN(ROUND(total_amount / 100.0, 2)) as dec_min_rands,
    MAX(ROUND(total_amount / 100.0, 2)) as dec_max_rands
  FROM bookings
  WHERE booking_date >= '2025-12-01' 
    AND booking_date < '2026-01-01'
    AND recurring_schedule_id IS NOT NULL
  GROUP BY recurring_schedule_id
)
SELECT 
  COALESCE(n.recurring_schedule_id, d.recurring_schedule_id) as schedule_id,
  n.nov_count,
  d.dec_count,
  n.nov_avg_total_rands,
  d.dec_avg_total_rands,
  CASE 
    WHEN n.nov_avg_total_cents = d.dec_avg_total_cents THEN '✅ MATCH'
    WHEN n.nov_avg_total_cents IS NULL THEN '⚠️ NO NOVEMBER BOOKINGS'
    WHEN d.dec_avg_total_cents IS NULL THEN '⚠️ NO DECEMBER BOOKINGS'
    ELSE '❌ MISMATCH'
  END as status,
  CASE 
    WHEN n.nov_avg_total_cents != d.dec_avg_total_cents THEN 
      ROUND((d.dec_avg_total_cents - n.nov_avg_total_cents) / 100.0, 2)
    ELSE 0
  END as difference_rands
FROM november_avg n
FULL OUTER JOIN december_avg d ON n.recurring_schedule_id = d.recurring_schedule_id
ORDER BY 
  CASE 
    WHEN n.nov_avg_total_cents != d.dec_avg_total_cents THEN 1
    ELSE 2
  END,
  COALESCE(n.recurring_schedule_id, d.recurring_schedule_id);

-- Check 4: Show individual bookings that need fixing
WITH november_avg AS (
  SELECT 
    recurring_schedule_id,
    ROUND(AVG(total_amount)) as avg_total_amount,
    ROUND(AVG(cleaner_earnings)) as avg_cleaner_earnings
  FROM bookings
  WHERE booking_date >= '2024-11-01' 
    AND booking_date < '2024-12-01'
    AND recurring_schedule_id IS NOT NULL
  GROUP BY recurring_schedule_id
)
SELECT 
  b.id as booking_id,
  b.booking_date,
  b.customer_name,
  b.recurring_schedule_id,
  b.total_amount as current_total_cents,
  ROUND(b.total_amount / 100.0, 2) as current_total_rands,
  na.avg_total_amount as november_avg_total_cents,
  ROUND(na.avg_total_amount / 100.0, 2) as november_avg_total_rands,
  CASE 
    WHEN b.total_amount != na.avg_total_amount THEN 'NEEDS FIX'
    ELSE 'OK'
  END as status
FROM bookings b
INNER JOIN november_avg na ON b.recurring_schedule_id = na.recurring_schedule_id
WHERE b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
  AND b.recurring_schedule_id IS NOT NULL
  AND b.total_amount != na.avg_total_amount
ORDER BY b.booking_date, b.customer_name;

