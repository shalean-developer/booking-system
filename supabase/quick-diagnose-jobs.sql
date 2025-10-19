-- ============================================
-- QUICK DIAGNOSTIC: Why aren't my bookings showing?
-- ============================================

-- 1️⃣ Show all bookings with their availability status
SELECT 
  '📋 BOOKING #' || ROW_NUMBER() OVER (ORDER BY booking_date) as num,
  id,
  booking_date,
  status,
  CASE WHEN cleaner_id IS NULL THEN 'NULL ✅' ELSE cleaner_id || ' ❌' END as cleaner_assigned,
  address_city,
  address_suburb,
  service_type
FROM bookings
ORDER BY booking_date DESC
LIMIT 10;

-- 2️⃣ Show all cleaners and their service areas
SELECT 
  '👤 CLEANER #' || ROW_NUMBER() OVER () as num,
  id,
  name,
  areas,
  is_available
FROM cleaners;

-- 3️⃣ Count bookings by status
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE cleaner_id IS NULL) as "unassigned",
  COUNT(*) FILTER (WHERE booking_date >= CURRENT_DATE) as "future_dates"
FROM bookings
GROUP BY status;

-- 4️⃣ Show bookings that SHOULD appear but might not due to area mismatch
SELECT 
  '⚠️ POTENTIAL MATCH ISSUE' as warning,
  b.id,
  b.booking_date,
  b.address_city,
  b.address_suburb,
  '📍 Does not match any cleaner areas' as issue
FROM bookings b
WHERE b.cleaner_id IS NULL
  AND b.status = 'pending'
  AND b.booking_date >= CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1
    FROM cleaners c,
    unnest(c.areas) as area
    WHERE LOWER(b.address_city) LIKE '%' || LOWER(area) || '%'
       OR LOWER(b.address_suburb) LIKE '%' || LOWER(area) || '%'
  );

