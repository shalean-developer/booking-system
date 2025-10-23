-- Check for missing booking BK-1761196261961-hdv0frqw9
-- Run this in Supabase SQL Editor

-- 1. Check if booking exists by ID
SELECT 
  id,
  customer_name,
  customer_email,
  customer_phone,
  booking_date,
  booking_time,
  status,
  payment_reference,
  total_amount,
  created_at,
  updated_at
FROM bookings 
WHERE id = 'BK-1761196261961-hdv0frqw9';

-- 2. Check for bookings with similar reference numbers
SELECT 
  id,
  customer_name,
  customer_email,
  payment_reference,
  status,
  created_at
FROM bookings 
WHERE payment_reference LIKE '%1761196261961%' 
   OR payment_reference LIKE '%hdv0frqw9%'
ORDER BY created_at DESC;

-- 3. Check recent bookings around the time this booking was created
-- (assuming it was created recently)
SELECT 
  id,
  customer_name,
  customer_email,
  payment_reference,
  status,
  created_at
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if there are any bookings with NULL or missing data
SELECT 
  id,
  customer_name,
  customer_email,
  payment_reference,
  status,
  created_at
FROM bookings 
WHERE customer_name IS NULL 
   OR customer_email IS NULL 
   OR payment_reference IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check RLS policies on bookings table
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;

-- 6. Check if RLS is enabled on bookings table
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'bookings';
