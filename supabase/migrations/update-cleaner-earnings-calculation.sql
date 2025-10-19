-- ============================================
-- UPDATE CLEANER EARNINGS CALCULATION
-- ============================================
-- This migration recalculates cleaner_earnings for existing bookings
-- based on the new experience-based formula
-- ============================================

-- Recalculate cleaner_earnings for existing bookings based on new formula
-- earnings = (total_amount - service_fee) × commission_rate

UPDATE bookings b
SET cleaner_earnings = CASE
  WHEN b.cleaner_id IS NOT NULL AND c.hire_date IS NOT NULL THEN
    ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 
          get_cleaner_commission_rate(c.hire_date))
  WHEN b.cleaner_id IS NULL THEN
    -- For unassigned bookings, use 60% as default
    ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
  ELSE
    -- Fallback if no hire_date
    ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
END
FROM cleaners c
WHERE b.cleaner_id = c.id
  AND b.total_amount IS NOT NULL;

-- Verify the recalculation
SELECT 
  b.id,
  b.service_type,
  b.total_amount,
  b.service_fee,
  b.cleaner_earnings,
  c.name as cleaner_name,
  c.hire_date,
  get_cleaner_experience_months(c.hire_date) as experience_months,
  get_cleaner_commission_rate(c.hire_date) as commission_rate,
  ROUND((b.total_amount - COALESCE(b.service_fee, 0)) / 100, 2) as subtotal_rand,
  ROUND(b.cleaner_earnings / 100, 2) as cleaner_earnings_rand,
  ROUND((b.total_amount - b.cleaner_earnings) / 100, 2) as company_earnings_rand
FROM bookings b
LEFT JOIN cleaners c ON b.cleaner_id = c.id
WHERE b.total_amount IS NOT NULL
ORDER BY b.created_at DESC
LIMIT 10;

-- Show summary by experience level
SELECT 
  CASE 
    WHEN c.hire_date IS NULL THEN 'Unassigned'
    WHEN get_cleaner_experience_months(c.hire_date) >= 4 THEN 'Experienced (70%)'
    ELSE 'New (60%)'
  END as experience_level,
  COUNT(*) as booking_count,
  ROUND(AVG(b.total_amount) / 100, 2) as avg_total_rand,
  ROUND(AVG(b.service_fee) / 100, 2) as avg_service_fee_rand,
  ROUND(AVG(b.cleaner_earnings) / 100, 2) as avg_cleaner_earnings_rand,
  ROUND(AVG((b.total_amount - b.cleaner_earnings)) / 100, 2) as avg_company_earnings_rand
FROM bookings b
LEFT JOIN cleaners c ON b.cleaner_id = c.id
WHERE b.total_amount IS NOT NULL
GROUP BY 
  CASE 
    WHEN c.hire_date IS NULL THEN 'Unassigned'
    WHEN get_cleaner_experience_months(c.hire_date) >= 4 THEN 'Experienced (70%)'
    ELSE 'New (60%)'
  END
ORDER BY experience_level;

