-- ============================================
-- FIND DUPLICATE RECURRING SCHEDULES
-- ============================================
-- This script identifies duplicate recurring schedules
-- that should be merged or removed
-- ============================================

-- Check 1: Find schedules with same customer, service, and frequency
-- These are likely duplicates
SELECT 
  rs.customer_id,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email as customer_email,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  rs.preferred_time,
  COUNT(*) as duplicate_count,
  STRING_AGG(rs.id::text, ', ' ORDER BY rs.created_at) as schedule_ids,
  STRING_AGG(rs.id::text, ', ' ORDER BY rs.created_at) as schedule_ids_list,
  MIN(rs.created_at) as first_created,
  MAX(rs.created_at) as last_created,
  STRING_AGG(
    CASE 
      WHEN rs.is_active THEN 'Active'
      ELSE 'Inactive'
    END, 
    ', ' 
    ORDER BY rs.created_at
  ) as statuses,
  STRING_AGG(
    COALESCE(cl.name, 'Unassigned'), 
    ', ' 
    ORDER BY rs.created_at
  ) as cleaners
FROM recurring_schedules rs
LEFT JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
WHERE rs.is_active = true
GROUP BY 
  rs.customer_id,
  c.first_name,
  c.last_name,
  c.email,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  rs.preferred_time
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, customer_name;

-- Check 2: Show details of each duplicate schedule
WITH duplicates AS (
  SELECT 
    rs.customer_id,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.frequency,
    rs.preferred_time,
    COUNT(*) as duplicate_count
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
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email as customer_email,
  rs.service_type,
  rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service_details,
  rs.frequency,
  rs.preferred_time,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.is_active,
  rs.start_date,
  rs.end_date,
  ROUND(rs.total_amount / 100.0, 2) as total_amount_rands,
  rs.created_at,
  (
    SELECT COUNT(*) 
    FROM bookings b 
    WHERE b.recurring_schedule_id = rs.id
  ) as booking_count,
  d.duplicate_count,
  CASE 
    WHEN rs.created_at = (
      SELECT MIN(rs2.created_at) 
      FROM recurring_schedules rs2 
      WHERE rs2.customer_id = rs.customer_id
        AND rs2.service_type = rs.service_type
        AND rs2.bedrooms = rs.bedrooms
        AND rs2.bathrooms = rs.bathrooms
        AND rs2.frequency = rs.frequency
        AND rs2.preferred_time = rs.preferred_time
    ) THEN 'KEEP (Oldest)'
    ELSE 'REMOVE (Duplicate)'
  END as recommendation
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
WHERE rs.is_active = true
ORDER BY 
  c.last_name,
  c.first_name,
  rs.service_type,
  rs.created_at;

-- Check 3: Count bookings per duplicate schedule
-- This helps decide which one to keep (keep the one with most bookings)
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
booking_counts AS (
  SELECT 
    rs.id as schedule_id,
    rs.customer_id,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.frequency,
    rs.preferred_time,
    COUNT(b.id) as total_bookings
  FROM recurring_schedules rs
  INNER JOIN duplicates d ON 
    rs.customer_id = d.customer_id
    AND rs.service_type = d.service_type
    AND rs.bedrooms = d.bedrooms
    AND rs.bathrooms = d.bathrooms
    AND rs.frequency = d.frequency
    AND rs.preferred_time = d.preferred_time
  LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
  WHERE rs.is_active = true
  GROUP BY rs.id, rs.customer_id, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.preferred_time
),
max_bookings_per_group AS (
  SELECT 
    customer_id,
    service_type,
    bedrooms,
    bathrooms,
    frequency,
    preferred_time,
    MAX(total_bookings) as max_bookings
  FROM booking_counts
  GROUP BY customer_id, service_type, bedrooms, bathrooms, frequency, preferred_time
)
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.created_at,
  bc.total_bookings,
  COUNT(b.id) FILTER (WHERE b.booking_date >= CURRENT_DATE) as future_bookings,
  CASE 
    WHEN bc.total_bookings = mb.max_bookings THEN 'KEEP (Most Bookings)'
    ELSE 'REMOVE'
  END as recommendation
FROM recurring_schedules rs
INNER JOIN duplicates d ON 
  rs.customer_id = d.customer_id
  AND rs.service_type = d.service_type
  AND rs.bedrooms = d.bedrooms
  AND rs.bathrooms = d.bathrooms
  AND rs.frequency = d.frequency
  AND rs.preferred_time = d.preferred_time
INNER JOIN booking_counts bc ON rs.id = bc.schedule_id
INNER JOIN max_bookings_per_group mb ON 
  rs.customer_id = mb.customer_id
  AND rs.service_type = mb.service_type
  AND rs.bedrooms = mb.bedrooms
  AND rs.bathrooms = mb.bathrooms
  AND rs.frequency = mb.frequency
  AND rs.preferred_time = mb.preferred_time
LEFT JOIN customers c ON rs.customer_id = c.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE rs.is_active = true
GROUP BY rs.id, c.first_name, c.last_name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.created_at, bc.total_bookings, mb.max_bookings
ORDER BY 
  c.last_name,
  c.first_name,
  bc.total_bookings DESC;

-- Check 4: Summary of duplicates
SELECT 
  COUNT(DISTINCT rs.customer_id) as customers_with_duplicates,
  COUNT(*) as total_duplicate_schedules,
  COUNT(*) - COUNT(DISTINCT 
    rs.customer_id || '|' || 
    rs.service_type || '|' || 
    rs.bedrooms || '|' || 
    rs.bathrooms || '|' || 
    rs.frequency || '|' || 
    rs.preferred_time
  ) as schedules_to_remove
FROM recurring_schedules rs
WHERE rs.is_active = true
  AND EXISTS (
    SELECT 1
    FROM recurring_schedules rs2
    WHERE rs2.customer_id = rs.customer_id
      AND rs2.service_type = rs.service_type
      AND rs2.bedrooms = rs.bedrooms
      AND rs2.bathrooms = rs.bathrooms
      AND rs2.frequency = rs.frequency
      AND rs2.preferred_time = rs.preferred_time
      AND rs2.id != rs.id
      AND rs2.is_active = true
  );

