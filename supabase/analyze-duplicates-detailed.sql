-- ============================================
-- DETAILED ANALYSIS OF DUPLICATES
-- ============================================
-- This script shows:
-- 1. Booking date ranges for each duplicate schedule
-- 2. Which months have bookings (Oct, Nov, Dec)
-- 3. Cleaner assignments
-- 4. Helps determine which schedule to keep
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
schedule_rankings AS (
  SELECT 
    rs.id as schedule_id,
    rs.customer_id,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.frequency,
    rs.preferred_time,
    rs.days_of_week,
    bc.total_bookings,
    rs.total_amount,
    rs.created_at,
    rs.start_date,
    rs.cleaner_id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        rs.customer_id,
        rs.service_type,
        rs.bedrooms,
        rs.bathrooms,
        rs.frequency,
        rs.preferred_time
      ORDER BY 
        bc.total_bookings DESC,
        CASE WHEN rs.total_amount IS NOT NULL AND rs.total_amount > 0 THEN 0 ELSE 1 END,
        rs.created_at ASC
    ) as rank_in_group
  FROM recurring_schedules rs
  INNER JOIN duplicates d ON 
    rs.customer_id = d.customer_id
    AND rs.service_type = d.service_type
    AND rs.bedrooms = d.bedrooms
    AND rs.bathrooms = d.bathrooms
    AND rs.frequency = d.frequency
    AND rs.preferred_time = d.preferred_time
  INNER JOIN booking_counts bc ON rs.id = bc.schedule_id
  WHERE rs.is_active = true
),
booking_date_analysis AS (
  SELECT 
    sr.schedule_id,
    sr.customer_id,
    COUNT(b.id) as total_bookings,
    MIN(b.booking_date) as first_booking_date,
    MAX(b.booking_date) as last_booking_date,
    COUNT(b.id) FILTER (WHERE b.booking_date >= '2024-10-01' AND b.booking_date < '2024-11-01') as october_bookings,
    COUNT(b.id) FILTER (WHERE b.booking_date >= '2024-11-01' AND b.booking_date < '2024-12-01') as november_bookings,
    COUNT(b.id) FILTER (WHERE b.booking_date >= '2024-12-01' AND b.booking_date < '2025-01-01') as december_2024_bookings,
    COUNT(b.id) FILTER (WHERE b.booking_date >= '2025-12-01' AND b.booking_date < '2026-01-01') as december_2025_bookings,
    STRING_AGG(DISTINCT TO_CHAR(b.booking_date, 'YYYY-MM-DD'), ', ' ORDER BY TO_CHAR(b.booking_date, 'YYYY-MM-DD')) as all_booking_dates
  FROM schedule_rankings sr
  LEFT JOIN bookings b ON b.recurring_schedule_id = sr.schedule_id
  GROUP BY sr.schedule_id, sr.customer_id
)
SELECT 
  sr.schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email as customer_email,
  sr.service_type || ', ' || sr.bedrooms || ' bed, ' || sr.bathrooms || ' bath' as service,
  sr.frequency,
  sr.preferred_time,
  CASE 
    WHEN sr.days_of_week IS NULL THEN 'No days set'
    WHEN array_length(sr.days_of_week, 1) = 1 THEN 
      CASE sr.days_of_week[1]
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
      FROM unnest(sr.days_of_week) as day)
  END as days_of_week_names,
  sr.days_of_week,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  sr.start_date as schedule_start_date,
  sr.created_at as schedule_created_at,
  ROUND(sr.total_amount / 100.0, 2) as total_amount_rands,
  bda.total_bookings,
  bda.first_booking_date,
  bda.last_booking_date,
  bda.october_bookings,
  bda.november_bookings,
  bda.december_2024_bookings,
  bda.december_2025_bookings,
  CASE 
    WHEN sr.rank_in_group = 1 THEN '✅ KEEP'
    ELSE '❌ REMOVE'
  END as current_recommendation,
  sr.rank_in_group,
  (
    SELECT COUNT(*) 
    FROM schedule_rankings sr2 
    WHERE sr2.customer_id = sr.customer_id
      AND sr2.service_type = sr.service_type
      AND sr2.bedrooms = sr.bedrooms
      AND sr2.bathrooms = sr.bathrooms
      AND sr2.frequency = sr.frequency
      AND sr2.preferred_time = sr.preferred_time
  ) as total_duplicates_in_group,
  bda.all_booking_dates
FROM schedule_rankings sr
LEFT JOIN customers c ON sr.customer_id = c.id
LEFT JOIN recurring_schedules rs ON sr.schedule_id = rs.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN booking_date_analysis bda ON sr.schedule_id = bda.schedule_id
ORDER BY 
  c.last_name,
  c.first_name,
  sr.service_type,
  sr.rank_in_group;

-- Special check for Lynne Thorpe (the customer with 3 duplicates)
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.preferred_time,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.start_date,
  rs.created_at,
  COUNT(b.id) as total_bookings,
  MIN(b.booking_date) as first_booking,
  MAX(b.booking_date) as last_booking,
  COUNT(b.id) FILTER (WHERE b.booking_date >= '2024-10-01' AND b.booking_date < '2024-11-01') as oct_bookings,
  COUNT(b.id) FILTER (WHERE b.booking_date >= '2024-11-01' AND b.booking_date < '2024-12-01') as nov_bookings,
  COUNT(b.id) FILTER (WHERE b.booking_date >= '2025-12-01' AND b.booking_date < '2026-01-01') as dec_bookings,
  STRING_AGG(DISTINCT TO_CHAR(b.booking_date, 'Day'), ', ') as booking_days_of_week,
  STRING_AGG(DISTINCT TO_CHAR(b.booking_date, 'YYYY-MM-DD'), ', ' ORDER BY TO_CHAR(b.booking_date, 'YYYY-MM-DD')) as all_dates
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
GROUP BY rs.id, c.first_name, c.last_name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.preferred_time, cl.name, rs.start_date, rs.created_at
ORDER BY rs.created_at;

