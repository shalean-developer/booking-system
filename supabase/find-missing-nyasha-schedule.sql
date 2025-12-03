-- ============================================
-- FIND NYASHA'S SCHEDULE FOR LYNNE THORPE
-- ============================================

-- Check if Nyasha's schedule exists (even if deleted/inactive)
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  cl.name as cleaner_name,
  rs.is_active,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.start_date,
  rs.created_at,
  COUNT(b.id) as booking_count
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND cl.name = 'Nyasha Mudani'
GROUP BY rs.id, c.first_name, c.last_name, cl.name, rs.is_active, rs.service_type, rs.bedrooms, rs.bathrooms, rs.start_date, rs.created_at;

-- Check all schedules for Lynne Thorpe
SELECT 
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.is_active,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.start_date,
  COUNT(b.id) as booking_count
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
GROUP BY rs.id, cl.name, rs.is_active, rs.service_type, rs.bedrooms, rs.bathrooms, rs.start_date
ORDER BY cl.name;

