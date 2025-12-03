-- ============================================
-- REMOVE DUPLICATE RECURRING SCHEDULES
-- ============================================
-- WARNING: This script will DELETE duplicate schedules!
-- 
-- Before running:
-- 1. Run view-duplicates-to-remove.sql to review what will be removed
-- 2. Verify the schedules marked for removal are correct
-- 3. Consider backing up your database first
--
-- This script will:
-- - Transfer all bookings from duplicate schedules to the schedule being kept
-- - Delete the duplicate schedules
-- ============================================

BEGIN;

-- Step 1: Identify schedules to keep and remove
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
    bc.total_bookings,
    rs.total_amount,
    rs.created_at,
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
schedules_to_remove AS (
  SELECT schedule_id
  FROM schedule_rankings
  WHERE rank_in_group > 1
),
schedules_to_keep AS (
  SELECT 
    sr.schedule_id as keep_id,
    sr.customer_id,
    sr.service_type,
    sr.bedrooms,
    sr.bathrooms,
    sr.frequency,
    sr.preferred_time
  FROM schedule_rankings sr
  WHERE sr.rank_in_group = 1
)

-- Step 2: Update bookings to point to the schedule being kept
UPDATE bookings b
SET recurring_schedule_id = stk.keep_id
FROM schedules_to_remove str
INNER JOIN recurring_schedules rs ON str.schedule_id = rs.id
INNER JOIN schedules_to_keep stk ON 
  rs.customer_id = stk.customer_id
  AND rs.service_type = stk.service_type
  AND rs.bedrooms = stk.bedrooms
  AND rs.bathrooms = stk.bathrooms
  AND rs.frequency = stk.frequency
  AND rs.preferred_time = stk.preferred_time
WHERE b.recurring_schedule_id = str.schedule_id;

-- Step 3: Delete the duplicate schedules
DELETE FROM recurring_schedules
WHERE id IN (
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
      bc.total_bookings,
      rs.total_amount,
      rs.created_at,
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
  SELECT schedule_id
  FROM schedule_rankings
  WHERE rank_in_group > 1
);

-- Step 4: Show summary
SELECT 
  'Duplicates removed successfully' as status,
  (
    SELECT COUNT(*)
    FROM (
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
      SELECT 1 FROM duplicates
    ) as remaining_duplicates
  ) as remaining_duplicate_groups;

COMMIT;

