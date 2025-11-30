-- ============================================
-- FIX DECEMBER 2025 BOOKING PRICING
-- ============================================
-- This script calculates correct pricing for December bookings
-- based on schedule details and updates them
-- ============================================
-- NOTE: This requires the pricing calculation logic from the app
-- For now, this shows what needs to be updated manually
-- ============================================

-- Step 1: Show current pricing vs what it should be
-- This shows schedules that need pricing calculated
SELECT 
  rs.id as schedule_id,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  rs.extras,
  COUNT(b.id) as december_bookings,
  ROUND(AVG(b.total_amount) / 100.0, 2) as current_avg_price_rands,
  rs.total_amount as schedule_stored_price_cents,
  ROUND(rs.total_amount / 100.0, 2) as schedule_stored_price_rands,
  CASE 
    WHEN rs.total_amount IS NOT NULL AND rs.total_amount > 0 THEN 
      'Use schedule stored price: R' || ROUND(rs.total_amount / 100.0, 2)
    ELSE 
      'Need to calculate based on: ' || rs.service_type || ', ' || 
      rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath, ' || rs.frequency
  END as action_needed
FROM recurring_schedules rs
INNER JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
GROUP BY rs.id, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.extras, rs.total_amount
ORDER BY december_bookings DESC;

-- Step 2: If schedules have stored pricing, update bookings to match
-- Run this ONLY if schedules have total_amount set correctly
UPDATE bookings b
SET 
  total_amount = rs.total_amount,
  cleaner_earnings = COALESCE(rs.cleaner_earnings, 
    ROUND((rs.total_amount - 5000) * 0.60)), -- Calculate if not set: (total - service_fee) * 60%
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

-- Step 3: Show what pricing should be for schedules without stored pricing
-- This helps you manually set the correct pricing on schedules
SELECT 
  rs.id as schedule_id,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  array_length(rs.extras, 1) as extras_count,
  COUNT(b.id) as december_bookings,
  ROUND(AVG(b.total_amount) / 100.0, 2) as current_price_rands,
  'Set total_amount on this schedule to correct price' as instruction
FROM recurring_schedules rs
INNER JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE b.booking_date >= '2025-12-01' 
  AND b.booking_date < '2026-01-01'
  AND (rs.total_amount IS NULL OR rs.total_amount = 0)
GROUP BY rs.id, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.extras
ORDER BY december_bookings DESC;

