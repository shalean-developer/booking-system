-- ============================================
-- FIX CLEANER EARNINGS FOR EXISTING BOOKINGS
-- ============================================
-- This migration ensures all existing bookings have cleaner_earnings populated
-- Uses the same calculation logic as the booking creation API
-- ============================================

-- Update bookings that don't have cleaner_earnings set
-- Only process bookings with valid UUID cleaner_ids (not 'manual')
UPDATE bookings b
SET cleaner_earnings = CASE
  -- If cleaner has hire_date, use experience-based calculation
  WHEN b.cleaner_id IS NOT NULL AND c.hire_date IS NOT NULL THEN
    ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE(NOW(), c.hire_date)) * 12 + EXTRACT(MONTH FROM AGE(NOW(), c.hire_date)) >= 4 
            THEN 0.70  -- 70% for 4+ months experience
            ELSE 0.60  -- 60% for < 4 months experience
          END)
  -- Default 60% for cleaners without hire_date
  ELSE ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
END
FROM cleaners c
WHERE b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'  -- Valid UUID format
  AND b.cleaner_id::uuid = c.id
  AND b.total_amount IS NOT NULL
  AND b.cleaner_earnings IS NULL;

-- Also update bookings with cleaner_id = 'manual' (unassigned)
UPDATE bookings
SET cleaner_earnings = ROUND((total_amount - COALESCE(service_fee, 0)) * 0.60)
WHERE cleaner_id = 'manual'
  AND total_amount IS NOT NULL
  AND cleaner_earnings IS NULL;

-- Verify the update
SELECT 
  'Updated Bookings' as status,
  COUNT(*) as count,
  ROUND(AVG(total_amount) / 100, 2) as avg_total_rand,
  ROUND(AVG(cleaner_earnings) / 100, 2) as avg_cleaner_earnings_rand
FROM bookings
WHERE cleaner_earnings IS NOT NULL
  AND total_amount IS NOT NULL;

-- Show sample of updated bookings
SELECT 
  b.id,
  b.service_type,
  b.status,
  b.total_amount,
  b.service_fee,
  b.cleaner_earnings,
  c.name as cleaner_name,
  c.hire_date,
  ROUND((b.total_amount - COALESCE(b.service_fee, 0)) / 100, 2) as subtotal_rand,
  ROUND(b.cleaner_earnings / 100, 2) as cleaner_earnings_rand,
  ROUND((b.total_amount - b.cleaner_earnings) / 100, 2) as company_earnings_rand
FROM bookings b
LEFT JOIN cleaners c ON (
  b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
  AND b.cleaner_id::uuid = c.id
)
WHERE b.total_amount IS NOT NULL
  AND b.cleaner_earnings IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 10;
