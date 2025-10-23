-- URGENT: Manual Booking Recovery for BK-1761196261961-hdv0frqw9
-- The booking does NOT exist in the database - needs to be manually recreated

-- =====================================================
-- STEP 1: VERIFY BOOKING IS MISSING
-- =====================================================

-- Confirm the booking doesn't exist
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM bookings WHERE id = 'BK-1761196261961-hdv0frqw9') 
    THEN 'BOOKING EXISTS - No recreation needed'
    ELSE 'BOOKING MISSING - Manual recreation required'
  END as status;

-- =====================================================
-- STEP 2: MANUAL BOOKING RECREATION
-- =====================================================

-- IMPORTANT: You need to get the actual customer details from the customer
-- This is a template - replace with actual customer information

-- First, check if customer exists in customers table
-- You'll need the customer's email to find them
/*
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  created_at
FROM customers 
WHERE email = 'customer@email.com'  -- Replace with actual customer email
ORDER BY created_at DESC
LIMIT 5;
*/

-- If customer exists, use their customer_id
-- If not, we'll create the booking without customer_id (NULL)

-- MANUAL BOOKING RECREATION (Replace with actual data):
/*
INSERT INTO bookings (
  id,
  customer_id,                    -- NULL if customer not found
  cleaner_id,                     -- NULL (no cleaner assigned yet)
  booking_date,                   -- Replace with actual booking date
  booking_time,                   -- Replace with actual booking time
  service_type,                   -- Replace with actual service type
  customer_name,                  -- Replace with actual customer name
  customer_email,                 -- Replace with actual customer email
  customer_phone,                 -- Replace with actual customer phone
  address_line1,                  -- Replace with actual address
  address_suburb,                 -- Replace with actual suburb
  address_city,                   -- Replace with actual city
  payment_reference,              -- Use booking ID as reference
  total_amount,                   -- Replace with actual amount in cents
  cleaner_earnings,               -- Replace with actual cleaner earnings
  frequency,                       -- NULL for one-time bookings
  service_fee,                    -- Replace with actual service fee
  frequency_discount,             -- 0 for one-time bookings
  price_snapshot,                 -- JSON snapshot of pricing
  status,                         -- 'confirmed' for recovered bookings
  created_at,
  -- Note: updated_at column doesn't exist
) VALUES (
  'BK-1761196261961-hdv0frqw9',  -- Keep the original booking ID
  NULL,                           -- Will need customer_id if customer exists
  NULL,                           -- No cleaner assigned yet
  '2025-01-20',                   -- Replace with actual booking date
  '10:00',                        -- Replace with actual booking time
  'deep-cleaning',                -- Replace with actual service type
  'Customer Name',                -- Replace with actual customer name
  'customer@email.com',           -- Replace with actual customer email
  '+27123456789',                 -- Replace with actual customer phone
  '123 Main Street',              -- Replace with actual address
  'Sandton',                      -- Replace with actual suburb
  'Johannesburg',                 -- Replace with actual city
  'BK-1761196261961-hdv0frqw9',   -- Use booking ID as payment reference
  5000,                           -- Replace with actual amount in cents
  4000,                           -- Replace with actual cleaner earnings
  NULL,                           -- One-time booking
  500,                            -- Replace with actual service fee
  0,                              -- No frequency discount
  '{"service":{"type":"deep-cleaning","bedrooms":3,"bathrooms":2},"extras":[],"frequency":"one-time","service_fee":500,"frequency_discount":0,"subtotal":4500,"total":5000,"snapshot_date":"2025-01-20T10:00:00Z"}',
  'confirmed',                    -- Mark as confirmed
  NOW()                           -- Set creation time to now
);
*/

-- =====================================================
-- STEP 3: VERIFY RECREATION
-- =====================================================

-- After recreating, verify the booking exists
SELECT 
  id,
  customer_name,
  customer_email,
  status,
  payment_reference,
  total_amount,
  booking_date,
  booking_time,
  created_at
FROM bookings 
WHERE id = 'BK-1761196261961-hdv0frqw9';

-- =====================================================
-- STEP 4: NEXT STEPS AFTER RECREATION
-- =====================================================

-- 1. Contact the customer to verify booking details
-- 2. Send confirmation email manually through admin dashboard
-- 3. Schedule the service appointment
-- 4. Process any necessary refunds/adjustments

-- =====================================================
-- STEP 5: CUSTOMER COMMUNICATION TEMPLATE
-- =====================================================

/*
Dear [Customer Name],

We apologize for the delay in confirming your booking. We experienced a technical issue that prevented your booking confirmation from being sent automatically.

Your booking details:
- Booking ID: BK-1761196261961-hdv0frqw9
- Service: [Service Type]
- Date: [Booking Date]
- Time: [Booking Time]
- Address: [Full Address]
- Total Amount: R[Amount]

We have now manually confirmed your booking and will proceed with scheduling your service.

If you have any questions or need to make changes, please contact us immediately.

Thank you for your patience.

Best regards,
Shalean Cleaning Services
*/

-- =====================================================
-- STEP 6: ADMIN NOTIFICATION
-- =====================================================

-- Log this recovery action
INSERT INTO booking_audit_log (
  booking_id, 
  action, 
  status, 
  customer_email, 
  payment_reference
) VALUES (
  'BK-1761196261961-hdv0frqw9',
  'manual_recreation',
  'success',
  'customer@email.com',  -- Replace with actual email
  'BK-1761196261961-hdv0frqw9'
);
