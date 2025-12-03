-- ============================================
-- SAFETY CHECK BEFORE REMOVING DUPLICATES
-- ============================================
-- This script checks if duplicates have different days_of_week
-- If they do, they might not be true duplicates!
-- ============================================

WITH duplicates AS (
  SELECT 
    rs.customer_id,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.frequency,
    rs.preferred_time
  FROM recurring_schedules rs
  WHERE rs.is_active = true
  GROUP BY 
    rs.customer_id,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.frequency,
    rs.preferred_time
  HAVING COUNT(*) > 1
)
SELECT 
  c.first_name || ' ' || c.last_name as customer_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.preferred_time,
  rs.id as schedule_id,
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
      FROM unnest(rs.days_of_week) as day)
  END as days_of_week_names,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.start_date,
  rs.created_at,
  COUNT(b.id) as total_bookings,
  COUNT(DISTINCT b.booking_date) as unique_booking_dates,
  STRING_AGG(DISTINCT TO_CHAR(b.booking_date, 'Day'), ', ' ORDER BY TO_CHAR(b.booking_date, 'Day')) as actual_booking_days
FROM recurring_schedules rs
INNER JOIN duplicates d ON 
  rs.customer_id = d.customer_id
  AND rs.service_type = d.service_type
  AND rs.bedrooms = d.bedrooms
  AND rs.bathrooms = d.bathrooms
  AND rs.frequency = d.frequency
  AND rs.preferred_time = d.preferred_time
LEFT JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE rs.is_active = true
GROUP BY 
  c.first_name, c.last_name, 
  rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.preferred_time,
  rs.id, rs.days_of_week, cl.name, rs.start_date, rs.created_at
ORDER BY 
  c.last_name, c.first_name, rs.service_type, rs.created_at;

-- Check if any duplicate groups have different days_of_week
WITH duplicates AS (
  SELECT 
    rs.customer_id,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.frequency,
    rs.preferred_time
  FROM recurring_schedules rs
  WHERE rs.is_active = true
  GROUP BY 
    rs.customer_id,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.frequency,
    rs.preferred_time
  HAVING COUNT(*) > 1
),
schedule_days AS (
  SELECT 
    rs.id as schedule_id,
    rs.customer_id,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.frequency,
    rs.preferred_time,
    rs.days_of_week,
    COALESCE(array_length(rs.days_of_week, 1), 0) as days_count,
    CASE 
      WHEN rs.days_of_week IS NULL THEN 'NULL'
      ELSE array_to_string(rs.days_of_week, ',')
    END as days_string
  FROM recurring_schedules rs
  INNER JOIN duplicates d ON 
    rs.customer_id = d.customer_id
    AND rs.service_type = d.service_type
    AND rs.bedrooms = d.bedrooms
    AND rs.bathrooms = d.bathrooms
    AND rs.frequency = d.frequency
    AND rs.preferred_time = d.preferred_time
  WHERE rs.is_active = true
)
SELECT 
  c.first_name || ' ' || c.last_name as customer_name,
  sd.service_type || ', ' || sd.bedrooms || ' bed, ' || sd.bathrooms || ' bath' as service,
  sd.frequency,
  COUNT(DISTINCT sd.days_string) as different_days_configs,
  STRING_AGG(DISTINCT sd.days_string, ' | ') as all_days_configs,
  CASE 
    WHEN COUNT(DISTINCT sd.days_string) > 1 THEN '⚠️ WARNING: Different days_of_week! May not be true duplicates!'
    ELSE '✅ Same days_of_week - safe to merge'
  END as safety_status
FROM schedule_days sd
LEFT JOIN customers c ON sd.customer_id = c.id
GROUP BY c.first_name, c.last_name, sd.service_type, sd.bedrooms, sd.bathrooms, sd.frequency
HAVING COUNT(DISTINCT sd.days_string) > 1
ORDER BY c.last_name, c.first_name;

