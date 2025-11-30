-- ============================================
-- FIX DECEMBER 2025 BOOKING PRICING
-- ============================================
-- Simple script to fix December 2025 bookings using schedule's stored pricing
-- Use this when schedules don't have November bookings
-- ============================================

-- Step 1: Preview what will be changed
SELECT 
  rs.id as schedule_id,
  rs.total_amount as schedule_total_cents,
  ROUND(rs.total_amount / 100.0, 2) as schedule_total_rands,
  COUNT(b.id) as december_bookings,
  ROUND(AVG(b.total_amount) / 100.0, 2) as current_avg_price_rands,
  CASE 
    WHEN COUNT(b.id) = 0 THEN 'NO DECEMBER BOOKINGS'
    WHEN ROUND(AVG(b.total_amount)) != rs.total_amount THEN 'NEEDS FIX'
    ELSE '✅ CORRECT'
  END as status
FROM recurring_schedules rs
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id 
  AND b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
WHERE rs.total_amount IS NOT NULL 
  AND rs.total_amount > 0
GROUP BY rs.id, rs.total_amount
HAVING COUNT(b.id) > 0 AND ROUND(AVG(b.total_amount)) != rs.total_amount
ORDER BY december_bookings DESC;

-- Step 2: Count bookings to fix
SELECT 
  COUNT(b.id) as bookings_to_fix,
  COUNT(DISTINCT b.recurring_schedule_id) as affected_schedules
FROM bookings b
INNER JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
WHERE b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
  AND rs.total_amount IS NOT NULL 
  AND rs.total_amount > 0
  AND b.total_amount != rs.total_amount;

-- Step 3: Update December bookings to match schedule pricing
UPDATE bookings b
SET 
  total_amount = rs.total_amount,
  cleaner_earnings = COALESCE(rs.cleaner_earnings, b.cleaner_earnings),
  price_snapshot = jsonb_set(
    COALESCE(b.price_snapshot, '{}'::jsonb),
    '{total}',
    to_jsonb(ROUND(rs.total_amount / 100.0, 2)),
    true
  ) || jsonb_build_object(
    'manual_pricing', true,
    'snapshot_date', NOW()::text,
    'pricing_fixed_from_schedule', true,
    'pricing_fixed_at', NOW()::text
  ),
  updated_at = NOW()
FROM recurring_schedules rs
WHERE b.recurring_schedule_id = rs.id
  AND b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
  AND rs.total_amount IS NOT NULL 
  AND rs.total_amount > 0
  AND b.total_amount != rs.total_amount;

-- Step 4: Verify the updates
SELECT 
  rs.id as schedule_id,
  COUNT(b.id) as december_bookings,
  ROUND(rs.total_amount / 100.0, 2) as schedule_price_rands,
  ROUND(AVG(b.total_amount) / 100.0, 2) as avg_booking_price_rands,
  CASE 
    WHEN ROUND(AVG(b.total_amount)) = rs.total_amount THEN '✅ MATCHED'
    ELSE '❌ STILL MISMATCHED'
  END as status
FROM recurring_schedules rs
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id 
  AND b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
WHERE rs.total_amount IS NOT NULL AND rs.total_amount > 0
GROUP BY rs.id, rs.total_amount
HAVING COUNT(b.id) > 0
ORDER BY december_bookings DESC;
