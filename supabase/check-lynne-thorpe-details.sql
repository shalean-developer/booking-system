-- ============================================
-- DETAILED CHECK FOR LYNNE THORPE
-- ============================================
-- Check her 3 duplicate schedules to see:
-- 1. Which days_of_week each schedule has
-- 2. Which cleaner is assigned to which days
-- 3. Actual booking dates to see the pattern
-- ============================================

-- Check the schedule details including days_of_week
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.preferred_time,
  rs.days_of_week,
  CASE 
    WHEN rs.days_of_week IS NULL THEN 'No days set'
    WHEN array_length(rs.days_of_week, 1) = 1 THEN 
      CASE rs.days_of_week[1]
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
      END
    ELSE 
      (SELECT STRING_AGG(
        CASE 
          WHEN day = 0 THEN 'Sun'
          WHEN day = 1 THEN 'Mon'
          WHEN day = 2 THEN 'Tue'
          WHEN day = 3 THEN 'Wed'
          WHEN day = 4 THEN 'Thu'
          WHEN day = 5 THEN 'Fri'
          WHEN day = 6 THEN 'Sat'
        END,
        ', ' ORDER BY day
      )
      FROM unnest(COALESCE(rs.days_of_week, ARRAY[]::integer[])) as day)
  END as days_of_week_names,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.start_date,
  rs.created_at,
  ROUND(rs.total_amount / 100.0, 2) as total_amount_rands
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND rs.service_type = 'Standard'
  AND rs.bedrooms = 1
  AND rs.bathrooms = 1
  AND rs.frequency = 'custom-weekly'
  AND rs.preferred_time = '09:00:00'
  AND rs.is_active = true
ORDER BY rs.created_at;

-- Also show without grouping to see all details
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.preferred_time,
  rs.days_of_week,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.start_date,
  rs.created_at,
  ROUND(rs.total_amount / 100.0, 2) as total_amount_rands,
  COUNT(b.id) as total_bookings
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND rs.service_type = 'Standard'
  AND rs.bedrooms = 1
  AND rs.bathrooms = 1
  AND rs.frequency = 'custom-weekly'
  AND rs.preferred_time = '09:00:00'
  AND rs.is_active = true
GROUP BY rs.id, c.first_name, c.last_name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.preferred_time, rs.days_of_week, cl.name, rs.start_date, rs.created_at, rs.total_amount
ORDER BY rs.created_at;

-- Show actual booking dates grouped by day of week
SELECT 
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  TO_CHAR(b.booking_date, 'Day') as day_of_week,
  COUNT(*) as bookings_on_this_day,
  STRING_AGG(TO_CHAR(b.booking_date, 'YYYY-MM-DD'), ', ' ORDER BY b.booking_date) as dates
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND rs.service_type = 'Standard'
  AND rs.bedrooms = 1
  AND rs.bathrooms = 1
  AND rs.frequency = 'custom-weekly'
  AND rs.preferred_time = '09:00:00'
  AND rs.is_active = true
GROUP BY rs.id, cl.name, TO_CHAR(b.booking_date, 'Day')
ORDER BY rs.id, TO_CHAR(b.booking_date, 'Day');

