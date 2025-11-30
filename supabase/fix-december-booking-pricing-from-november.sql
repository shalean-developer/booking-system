-- ============================================
-- FIX DECEMBER BOOKING PRICING FROM NOVEMBER
-- ============================================
-- This script updates all December recurring bookings to match
-- the pricing from November bookings of the same schedule
-- ============================================

-- Step 1: Preview what will be changed
-- Shows November pricing vs December pricing for each schedule
SELECT 
  rs.id as schedule_id,
  rs.customer_id,
  COUNT(DISTINCT nov_b.id) as november_bookings,
  COUNT(DISTINCT dec_b.id) as december_bookings,
  ROUND(AVG(nov_b.total_amount) / 100.0, 2) as november_avg_price_rands,
  ROUND(AVG(dec_b.total_amount) / 100.0, 2) as december_avg_price_rands,
  ROUND(AVG(nov_b.cleaner_earnings) / 100.0, 2) as november_avg_cleaner_earnings_rands,
  ROUND(AVG(dec_b.cleaner_earnings) / 100.0, 2) as december_avg_cleaner_earnings_rands,
  CASE 
    WHEN ROUND(AVG(nov_b.total_amount)) != ROUND(AVG(dec_b.total_amount)) THEN 'PRICING MISMATCH'
    ELSE 'SAME PRICING'
  END as status
FROM recurring_schedules rs
LEFT JOIN bookings nov_b ON nov_b.recurring_schedule_id = rs.id 
  AND nov_b.booking_date >= '2024-11-01' 
  AND nov_b.booking_date < '2024-12-01'
LEFT JOIN bookings dec_b ON dec_b.recurring_schedule_id = rs.id 
  AND dec_b.booking_date >= '2025-12-01' 
  AND dec_b.booking_date < '2026-01-01'
WHERE nov_b.id IS NOT NULL AND dec_b.id IS NOT NULL
GROUP BY rs.id, rs.customer_id
HAVING ROUND(AVG(nov_b.total_amount)) != ROUND(AVG(dec_b.total_amount))
ORDER BY november_bookings DESC;

-- Step 2: Count how many December bookings will be updated
WITH november_avg AS (
  SELECT 
    recurring_schedule_id,
    ROUND(AVG(total_amount)) as avg_total_amount
  FROM bookings
  WHERE booking_date >= '2024-11-01' 
    AND booking_date < '2024-12-01'
    AND recurring_schedule_id IS NOT NULL
  GROUP BY recurring_schedule_id
),
december_bookings AS (
  SELECT 
    b.id,
    b.recurring_schedule_id,
    b.total_amount
  FROM bookings b
  WHERE b.booking_date >= '2025-12-01' 
    AND b.booking_date < '2026-01-01'
    AND b.recurring_schedule_id IS NOT NULL
)
SELECT 
  COUNT(DISTINCT db.id) as december_bookings_to_fix,
  COUNT(DISTINCT db.recurring_schedule_id) as affected_schedules
FROM december_bookings db
INNER JOIN november_avg na ON db.recurring_schedule_id = na.recurring_schedule_id
WHERE db.total_amount != na.avg_total_amount;

-- Step 3: Update December bookings to match correct pricing
-- Priority: 1) November pricing if available, 2) Schedule's stored pricing
WITH november_pricing AS (
  SELECT 
    recurring_schedule_id,
    ROUND(AVG(total_amount)) as avg_total_amount,
    ROUND(AVG(cleaner_earnings)) as avg_cleaner_earnings
  FROM bookings
  WHERE booking_date >= '2024-11-01' 
    AND booking_date < '2024-12-01'
    AND recurring_schedule_id IS NOT NULL
  GROUP BY recurring_schedule_id
),
schedule_pricing AS (
  SELECT 
    rs.id as recurring_schedule_id,
    rs.total_amount,
    rs.cleaner_earnings
  FROM recurring_schedules rs
  WHERE rs.total_amount IS NOT NULL AND rs.total_amount > 0
),
correct_pricing AS (
  SELECT 
    COALESCE(np.recurring_schedule_id, sp.recurring_schedule_id) as recurring_schedule_id,
    COALESCE(np.avg_total_amount, sp.total_amount) as correct_total_amount,
    COALESCE(np.avg_cleaner_earnings, sp.cleaner_earnings) as correct_cleaner_earnings
  FROM november_pricing np
  FULL OUTER JOIN schedule_pricing sp ON np.recurring_schedule_id = sp.recurring_schedule_id
)
UPDATE bookings dec_b
SET 
  total_amount = cp.correct_total_amount,
  cleaner_earnings = COALESCE(cp.correct_cleaner_earnings, dec_b.cleaner_earnings),
  price_snapshot = jsonb_set(
    COALESCE(dec_b.price_snapshot, '{}'::jsonb),
    '{total}',
    to_jsonb(ROUND(cp.correct_total_amount / 100.0, 2)),
    true
  ) || jsonb_build_object(
    'manual_pricing', true,
    'snapshot_date', NOW()::text,
    'pricing_fixed_from_november', EXISTS(SELECT 1 FROM november_pricing np WHERE np.recurring_schedule_id = cp.recurring_schedule_id),
    'pricing_fixed_from_schedule', NOT EXISTS(SELECT 1 FROM november_pricing np WHERE np.recurring_schedule_id = cp.recurring_schedule_id),
    'pricing_fixed_at', NOW()::text
  ),
  updated_at = NOW()
FROM correct_pricing cp
WHERE dec_b.recurring_schedule_id = cp.recurring_schedule_id
  AND dec_b.booking_date >= '2025-12-01' 
  AND dec_b.booking_date < '2026-01-01'
  AND dec_b.recurring_schedule_id IS NOT NULL
  AND dec_b.total_amount != cp.correct_total_amount;

-- Step 4: Verify the updates
SELECT 
  rs.id as schedule_id,
  COUNT(DISTINCT nov_b.id) as november_bookings,
  COUNT(DISTINCT dec_b.id) as december_bookings,
  ROUND(AVG(nov_b.total_amount) / 100.0, 2) as november_avg_price_rands,
  ROUND(AVG(dec_b.total_amount) / 100.0, 2) as december_avg_price_rands,
  CASE 
    WHEN ROUND(AVG(nov_b.total_amount)) = ROUND(AVG(dec_b.total_amount)) THEN '✅ MATCHED'
    ELSE '❌ STILL MISMATCHED'
  END as status
FROM recurring_schedules rs
LEFT JOIN bookings nov_b ON nov_b.recurring_schedule_id = rs.id 
  AND nov_b.booking_date >= '2024-11-01' 
  AND nov_b.booking_date < '2024-12-01'
LEFT JOIN bookings dec_b ON dec_b.recurring_schedule_id = rs.id 
  AND dec_b.booking_date >= '2025-12-01' 
  AND dec_b.booking_date < '2026-01-01'
WHERE nov_b.id IS NOT NULL AND dec_b.id IS NOT NULL
GROUP BY rs.id
ORDER BY december_bookings DESC;

