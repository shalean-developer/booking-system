-- Debug script to check all bookings for John Doe (Farai Chitekedza)
-- This will help us understand why only 1 booking is being returned by the API

-- First, let's find John Doe's cleaner ID
SELECT 
    id,
    name,
    email,
    hire_date,
    created_at
FROM cleaners 
WHERE name ILIKE '%john%' OR name ILIKE '%farai%' OR email ILIKE '%chitekedza%';

-- Then, let's see ALL bookings for this cleaner (regardless of date/status)
SELECT 
    id,
    booking_date,
    booking_time,
    status,
    total_amount,
    cleaner_earnings,
    service_fee,
    customer_name,
    service_type,
    cleaner_id,
    created_at,
    cleaner_completed_at
FROM bookings 
WHERE cleaner_id = '847ae6c7-1aef-4973-9d09-88fd5671b1b8'  -- John Doe's ID from the logs
ORDER BY booking_date DESC, created_at DESC;

-- Let's also check if there are any bookings with different cleaner_id but same customer
SELECT 
    id,
    booking_date,
    booking_time,
    status,
    total_amount,
    cleaner_earnings,
    service_fee,
    customer_name,
    service_type,
    cleaner_id,
    created_at,
    cleaner_completed_at
FROM bookings 
WHERE customer_name ILIKE '%farai%' OR customer_email ILIKE '%chitekedza%'
ORDER BY booking_date DESC, created_at DESC;

-- Check if there are any bookings completed today
SELECT 
    id,
    booking_date,
    booking_time,
    status,
    total_amount,
    cleaner_earnings,
    service_fee,
    customer_name,
    service_type,
    cleaner_id,
    created_at,
    cleaner_completed_at
FROM bookings 
WHERE DATE(cleaner_completed_at) = CURRENT_DATE
   OR (status = 'completed' AND DATE(created_at) = CURRENT_DATE)
ORDER BY created_at DESC;
