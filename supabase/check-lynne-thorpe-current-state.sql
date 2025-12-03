-- ============================================
-- CHECK LYNNE THORPE'S CURRENT SCHEDULES
-- ============================================
-- This will show all schedules for Lynne Thorpe, including inactive ones
-- ============================================

-- Check all schedules (active and inactive)
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.preferred_time,
  rs.days_of_week,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.is_active,
  rs.start_date,
  rs.end_date,
  rs.created_at,
  ROUND(rs.total_amount / 100.0, 2) as total_amount_rands,
  ROUND(rs.cleaner_earnings / 100.0, 2) as cleaner_earnings_rands,
  COUNT(b.id) as booking_count
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
GROUP BY rs.id, c.first_name, c.last_name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.preferred_time, rs.days_of_week, cl.name, rs.is_active, rs.start_date, rs.end_date, rs.created_at, rs.total_amount, rs.cleaner_earnings
ORDER BY rs.is_active DESC, rs.created_at;

-- Check only active schedules
SELECT 
  'ACTIVE SCHEDULES' as status,
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.preferred_time,
  rs.start_date,
  COUNT(b.id) as booking_count
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND rs.is_active = true
GROUP BY rs.id, cl.name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.preferred_time, rs.start_date
ORDER BY cl.name;

-- Check total count of all recurring schedules
SELECT 
  COUNT(*) as total_schedules,
  COUNT(*) FILTER (WHERE is_active = true) as active_schedules,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_schedules
FROM recurring_schedules;

-- Check if Nyasha's schedule exists (by cleaner name)
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  cl.name as cleaner_name,
  rs.is_active,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.start_date,
  rs.created_at
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
WHERE cl.name = 'Nyasha Mudani'
  AND c.email = 'lynthorpe@gmail.com'
ORDER BY rs.created_at;

-- Check all schedules with Nyasha Mudani (any customer)
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  cl.name as cleaner_name,
  rs.is_active,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.start_date
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
WHERE cl.name = 'Nyasha Mudani'
ORDER BY c.last_name, c.first_name, rs.created_at;

