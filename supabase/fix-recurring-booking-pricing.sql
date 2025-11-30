-- ============================================
-- FIX RECURRING BOOKING PRICING
-- ============================================
-- This script fixes bookings that were generated with incorrect pricing
-- by updating them to match the pricing stored in their recurring_schedules
-- ============================================

-- Step 1: Preview bookings that will be updated
-- Run this first to see what will be changed
SELECT 
  b.id as booking_id,
  b.booking_date,
  b.customer_name,
  rs.id as schedule_id,
  b.total_amount as current_total_cents,
  ROUND(b.total_amount / 100.0, 2) as current_total_rands,
  rs.total_amount as correct_total_cents,
  ROUND(rs.total_amount / 100.0, 2) as correct_total_rands,
  b.cleaner_earnings as current_cleaner_earnings_cents,
  rs.cleaner_earnings as correct_cleaner_earnings_cents,
  CASE 
    WHEN b.total_amount != rs.total_amount THEN 'PRICING MISMATCH'
    WHEN b.cleaner_earnings IS NULL AND rs.cleaner_earnings IS NOT NULL THEN 'MISSING CLEANER EARNINGS'
    ELSE 'OK'
  END as issue
FROM bookings b
INNER JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
WHERE 
  rs.total_amount IS NOT NULL 
  AND rs.total_amount > 0
  AND (
    b.total_amount != rs.total_amount 
    OR (b.cleaner_earnings IS NULL AND rs.cleaner_earnings IS NOT NULL)
    OR (b.cleaner_earnings IS NOT NULL AND rs.cleaner_earnings IS NOT NULL AND b.cleaner_earnings != rs.cleaner_earnings)
  )
ORDER BY b.booking_date DESC, b.created_at DESC;

-- Step 2: Count how many bookings will be updated
SELECT 
  COUNT(*) as bookings_to_fix,
  COUNT(DISTINCT b.recurring_schedule_id) as affected_schedules
FROM bookings b
INNER JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
WHERE 
  rs.total_amount IS NOT NULL 
  AND rs.total_amount > 0
  AND (
    b.total_amount != rs.total_amount 
    OR (b.cleaner_earnings IS NULL AND rs.cleaner_earnings IS NOT NULL)
    OR (b.cleaner_earnings IS NOT NULL AND rs.cleaner_earnings IS NOT NULL AND b.cleaner_earnings != rs.cleaner_earnings)
  );

-- Step 3: Update bookings with correct pricing from their schedules
-- This updates:
-- 1. total_amount to match schedule's total_amount
-- 2. cleaner_earnings to match schedule's cleaner_earnings (if set)
-- 3. price_snapshot.total to reflect the correct total
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
    'pricing_fixed_at', NOW()::text
  ),
  updated_at = NOW()
FROM recurring_schedules rs
WHERE 
  b.recurring_schedule_id = rs.id
  AND rs.total_amount IS NOT NULL 
  AND rs.total_amount > 0
  AND (
    b.total_amount != rs.total_amount 
    OR (b.cleaner_earnings IS NULL AND rs.cleaner_earnings IS NOT NULL)
    OR (b.cleaner_earnings IS NOT NULL AND rs.cleaner_earnings IS NOT NULL AND b.cleaner_earnings != rs.cleaner_earnings)
  );

-- Step 4: Verify the updates
SELECT 
  COUNT(*) as updated_bookings,
  COUNT(DISTINCT recurring_schedule_id) as affected_schedules,
  ROUND(AVG(total_amount) / 100.0, 2) as avg_total_rands,
  ROUND(AVG(cleaner_earnings) / 100.0, 2) as avg_cleaner_earnings_rands
FROM bookings
WHERE 
  recurring_schedule_id IS NOT NULL
  AND price_snapshot->>'pricing_fixed_at' IS NOT NULL;

-- Step 5: Show summary by schedule
SELECT 
  rs.id as schedule_id,
  rs.customer_id,
  COUNT(b.id) as bookings_count,
  ROUND(rs.total_amount / 100.0, 2) as schedule_price_rands,
  ROUND(AVG(b.total_amount) / 100.0, 2) as avg_booking_price_rands,
  CASE 
    WHEN ROUND(AVG(b.total_amount)) = rs.total_amount THEN '✅ CORRECT'
    ELSE '❌ MISMATCH'
  END as status
FROM recurring_schedules rs
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE rs.total_amount IS NOT NULL AND rs.total_amount > 0
GROUP BY rs.id, rs.customer_id, rs.total_amount
ORDER BY bookings_count DESC;

