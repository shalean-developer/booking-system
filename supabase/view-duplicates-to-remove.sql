-- ============================================
-- VIEW DUPLICATES TO REMOVE (DETAILED)
-- ============================================
-- Run this to see exactly which schedules will be removed
-- Review carefully before running the removal script
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
    bc.total_bookings,
    rs.total_amount,
    rs.created_at,
    rs.start_date,
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
)
SELECT 
  sr.schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email as customer_email,
  sr.service_type || ', ' || sr.bedrooms || ' bed, ' || sr.bathrooms || ' bath' as service,
  sr.frequency,
  sr.preferred_time,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  sr.total_bookings,
  ROUND(sr.total_amount / 100.0, 2) as total_amount_rands,
  sr.created_at,
  sr.start_date,
  CASE 
    WHEN sr.rank_in_group = 1 THEN '✅ KEEP'
    ELSE '❌ REMOVE'
  END as action,
  (
    SELECT COUNT(*) 
    FROM schedule_rankings sr2 
    WHERE sr2.customer_id = sr.customer_id
      AND sr2.service_type = sr.service_type
      AND sr2.bedrooms = sr.bedrooms
      AND sr2.bathrooms = sr.bathrooms
      AND sr2.frequency = sr.frequency
      AND sr2.preferred_time = sr.preferred_time
  ) as total_duplicates_in_group
FROM schedule_rankings sr
LEFT JOIN customers c ON sr.customer_id = c.id
LEFT JOIN recurring_schedules rs ON sr.schedule_id = rs.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
ORDER BY 
  c.last_name,
  c.first_name,
  sr.service_type,
  sr.rank_in_group;

