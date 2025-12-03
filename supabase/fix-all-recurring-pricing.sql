-- ============================================
-- FIX ALL RECURRING SCHEDULE AND BOOKING PRICING
-- ============================================
-- This script calculates pricing for all recurring schedules
-- and updates both schedules and bookings to match
-- ============================================
-- NOTE: This requires manual calculation or use the API endpoint instead
-- The API endpoint automatically calculates pricing
-- ============================================

-- Step 1: Show schedules that need pricing set
SELECT 
  rs.id as schedule_id,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  array_length(rs.extras, 1) as extras_count,
  rs.total_amount as current_total_cents,
  ROUND(rs.total_amount / 100.0, 2) as current_total_rands,
  CASE 
    WHEN rs.total_amount IS NULL OR rs.total_amount = 0 THEN '⚠️ NEEDS PRICING'
    ELSE '✅ HAS PRICING'
  END as status
FROM recurring_schedules rs
WHERE rs.is_active = true
ORDER BY 
  CASE WHEN rs.total_amount IS NULL OR rs.total_amount = 0 THEN 0 ELSE 1 END,
  rs.created_at DESC;

-- Step 2: Count schedules and bookings that need fixing
SELECT 
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.total_amount IS NULL OR rs.total_amount = 0) as schedules_needing_pricing,
  COUNT(DISTINCT rs.id) FILTER (WHERE rs.total_amount IS NOT NULL AND rs.total_amount > 0) as schedules_with_pricing,
  COUNT(DISTINCT b.id) FILTER (
    WHERE b.recurring_schedule_id IS NOT NULL 
    AND rs.total_amount IS NOT NULL 
    AND rs.total_amount > 0
    AND b.total_amount != rs.total_amount
  ) as bookings_needing_update
FROM recurring_schedules rs
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE rs.is_active = true;

-- Step 3: Update bookings to match their schedule's pricing
-- (Only works for schedules that already have total_amount set)
UPDATE bookings b
SET 
  total_amount = rs.total_amount,
  cleaner_earnings = COALESCE(rs.cleaner_earnings, 
    ROUND((rs.total_amount - 5000) * 0.60)), -- Calculate: (total - service_fee) * 60%
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
  AND rs.total_amount IS NOT NULL 
  AND rs.total_amount > 0
  AND b.total_amount != rs.total_amount;

-- Step 4: Verify updates
SELECT 
  rs.id as schedule_id,
  rs.service_type,
  COUNT(b.id) as booking_count,
  ROUND(rs.total_amount / 100.0, 2) as schedule_price_rands,
  ROUND(AVG(b.total_amount) / 100.0, 2) as avg_booking_price_rands,
  CASE 
    WHEN rs.total_amount IS NULL OR rs.total_amount = 0 THEN '⚠️ SCHEDULE NEEDS PRICING'
    WHEN ROUND(AVG(b.total_amount)) = rs.total_amount THEN '✅ MATCHED'
    ELSE '❌ MISMATCH'
  END as status
FROM recurring_schedules rs
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE rs.is_active = true
GROUP BY rs.id, rs.service_type, rs.total_amount
ORDER BY 
  CASE WHEN rs.total_amount IS NULL OR rs.total_amount = 0 THEN 0 ELSE 1 END,
  booking_count DESC;

