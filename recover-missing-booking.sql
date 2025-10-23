-- Recovery Script for Missing Booking BK-1761196261961-hdv0frqw9
-- This script can manually recreate the booking if it's completely missing

-- =====================================================
-- STEP 1: CHECK IF BOOKING EXISTS
-- =====================================================

-- First, verify if booking exists
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM bookings WHERE id = 'BK-1761196261961-hdv0frqw9') 
    THEN 'BOOKING EXISTS - No recovery needed'
    ELSE 'BOOKING MISSING - Recovery required'
  END as status;

-- =====================================================
-- STEP 2: MANUAL BOOKING RECREATION (if needed)
-- =====================================================

-- If the booking is completely missing, we need to recreate it
-- This requires customer information - you'll need to get this from the customer

-- Example recreation (replace with actual customer data):
/*
INSERT INTO bookings (
  id,
  customer_id,
  cleaner_id,
  booking_date,
  booking_time,
  service_type,
  customer_name,
  customer_email,
  customer_phone,
  address_line1,
  address_suburb,
  address_city,
  payment_reference,
  total_amount,
  cleaner_earnings,
  frequency,
  service_fee,
  frequency_discount,
  price_snapshot,
  status,
  created_at,
  created_at
) VALUES (
  'BK-1761196261961-hdv0frqw9',
  NULL, -- Will need customer_id if customer exists
  NULL, -- No cleaner assigned yet
  '2025-01-20', -- Replace with actual booking date
  '10:00', -- Replace with actual booking time
  'deep-cleaning', -- Replace with actual service type
  'Customer Name', -- Replace with actual customer name
  'customer@email.com', -- Replace with actual customer email
  '+27123456789', -- Replace with actual customer phone
  '123 Main Street', -- Replace with actual address
  'Sandton', -- Replace with actual suburb
  'Johannesburg', -- Replace with actual city
  'BK-1761196261961-hdv0frqw9', -- Use booking ID as payment reference
  5000, -- Replace with actual amount in cents
  4000, -- Replace with actual cleaner earnings
  NULL, -- One-time booking
  500, -- Replace with actual service fee
  0, -- Replace with actual frequency discount
  '{"service":{"type":"deep-cleaning","bedrooms":3,"bathrooms":2},"extras":[],"frequency":"one-time","service_fee":500,"frequency_discount":0,"subtotal":4500,"total":5000,"snapshot_date":"2025-01-20T10:00:00Z"}',
  'confirmed',
  NOW(),
  NOW()
);
*/

-- =====================================================
-- STEP 3: UPDATE EXISTING BOOKING STATUS (if booking exists but hidden)
-- =====================================================

-- If booking exists but has wrong status, update it
UPDATE bookings 
SET 
  status = 'confirmed'
WHERE id = 'BK-1761196261961-hdv0frqw9'
  AND status IN ('pending', 'draft', 'failed');

-- =====================================================
-- STEP 4: VERIFY RECOVERY
-- =====================================================

-- Check if booking is now visible
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  payment_reference,
  total_amount,
  created_at,
  created_at
FROM bookings 
WHERE id = 'BK-1761196261961-hdv0frqw9';

-- =====================================================
-- STEP 5: MANUAL EMAIL SENDING (if needed)
-- =====================================================

-- If booking is recovered, you may need to manually send emails
-- This would typically be done through the admin dashboard or a separate script

-- Check if there are any email logs or failed email attempts
SELECT 
  'EMAIL RECOVERY' as action,
  'Manual email sending may be required' as note,
  'Use admin dashboard or contact customer directly' as recommendation;
