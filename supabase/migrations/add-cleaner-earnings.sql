-- ============================================
-- ADD CLEANER EARNINGS COLUMN
-- ============================================
-- This migration adds cleaner_earnings column to bookings table
-- and calculates earnings for existing bookings
-- ============================================

-- Add cleaner_earnings column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS cleaner_earnings INTEGER;

COMMENT ON COLUMN bookings.cleaner_earnings IS 'Amount cleaner earns in cents (can be overridden by admin)';

-- Calculate and set cleaner_earnings for existing bookings
UPDATE bookings
SET cleaner_earnings = CASE
  -- Deep Cleaning and Move In/Out: Fixed R250
  WHEN LOWER(service_type) LIKE '%deep%' 
    OR LOWER(service_type) LIKE '%move%' 
    THEN 25000
  -- Standard and Airbnb: 60% of total
  ELSE ROUND(total_amount * 0.6)
END
WHERE cleaner_earnings IS NULL AND total_amount IS NOT NULL;

-- Verify the update
SELECT 
  service_type,
  COUNT(*) as count,
  AVG(total_amount) as avg_total_cents,
  AVG(cleaner_earnings) as avg_cleaner_earnings_cents,
  ROUND(AVG(total_amount) / 100, 2) as avg_total_rand,
  ROUND(AVG(cleaner_earnings) / 100, 2) as avg_cleaner_earnings_rand
FROM bookings
WHERE cleaner_earnings IS NOT NULL
GROUP BY service_type
ORDER BY service_type;

-- Show sample of updated bookings
SELECT 
  id,
  service_type,
  total_amount,
  cleaner_earnings,
  ROUND(total_amount / 100, 2) as total_rand,
  ROUND(cleaner_earnings / 100, 2) as cleaner_earnings_rand,
  ROUND((total_amount - cleaner_earnings) / 100, 2) as company_earnings_rand
FROM bookings
WHERE cleaner_earnings IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

