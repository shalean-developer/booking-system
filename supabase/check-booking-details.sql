-- Check the details of your booking
SELECT 
  id,
  cleaner_id,
  status,
  total_amount,
  cleaner_earnings,
  service_fee,
  booking_date,
  created_at,
  -- Calculate what earnings should be
  CASE 
    WHEN cleaner_id = 'manual' THEN ROUND((total_amount - COALESCE(service_fee, 0)) * 0.60)
    WHEN cleaner_id IS NULL THEN ROUND((total_amount - COALESCE(service_fee, 0)) * 0.60)
    ELSE NULL  -- Will calculate separately for assigned cleaners
  END as calculated_earnings,
  -- Show cleaner info if assigned
  CASE 
    WHEN cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID cleaner'
    WHEN cleaner_id = 'manual' THEN 'Manual assignment'
    WHEN cleaner_id IS NULL THEN 'No cleaner assigned'
    ELSE 'Other'
  END as cleaner_assignment_type
FROM bookings
ORDER BY created_at DESC;
