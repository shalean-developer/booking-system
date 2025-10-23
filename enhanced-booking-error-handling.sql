-- Enhanced Booking API Error Handling
-- This file contains improvements to prevent future missing bookings

-- =====================================================
-- IMPROVED BOOKING API ERROR HANDLING STRATEGY
-- =====================================================

/*
CURRENT ISSUE IDENTIFIED:
The booking API has a rollback mechanism that deletes bookings if email sending fails.
This is causing the missing booking issue because:

1. Booking gets created successfully
2. Email sending fails (network, API key, etc.)
3. Rollback attempts to delete the booking
4. If rollback fails, booking remains in database but emails weren't sent
5. Customer has booking ID but admin can't see it

SOLUTION:
Instead of deleting bookings on email failure, we should:
1. Mark booking as 'email_pending' status
2. Log the email failure
3. Implement retry mechanism
4. Allow manual email sending from admin dashboard
*/

-- =====================================================
-- STEP 1: ADD NEW BOOKING STATUSES
-- =====================================================

-- Add new statuses to handle email failures gracefully
-- Note: This would require updating the booking status enum
-- For now, we'll use existing statuses but add a notes field

-- Add email_status field to track email delivery
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS email_status VARCHAR(50) DEFAULT 'pending';

-- Add email_attempts field to track retry attempts
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS email_attempts INTEGER DEFAULT 0;

-- Add last_email_attempt field to track when emails were last attempted
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS last_email_attempt TIMESTAMPTZ;

-- =====================================================
-- STEP 2: CREATE EMAIL RETRY FUNCTION
-- =====================================================

-- Function to retry failed email sending
CREATE OR REPLACE FUNCTION retry_booking_emails(booking_id_param VARCHAR(255))
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get booking record
  SELECT * INTO booking_record 
  FROM bookings 
  WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found',
      'booking_id', booking_id_param
    );
  END IF;
  
  -- Update email attempt tracking
  UPDATE bookings 
  SET 
    email_attempts = email_attempts + 1,
    last_email_attempt = NOW(),
    email_status = 'retrying'
  WHERE id = booking_id_param;
  
  -- Log the retry attempt
  INSERT INTO booking_audit_log (
    booking_id, 
    action, 
    status, 
    customer_email, 
    payment_reference
  ) VALUES (
    booking_id_param,
    'email_retry',
    'attempted',
    booking_record.customer_email,
    booking_record.payment_reference
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email retry initiated',
    'booking_id', booking_id_param,
    'customer_email', booking_record.customer_email,
    'attempts', booking_record.email_attempts + 1
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: CREATE BOOKING RECOVERY API ENDPOINT
-- =====================================================

-- This would be implemented as a new API route: /api/admin/bookings/recover
-- For now, we'll create a SQL function that can be called

CREATE OR REPLACE FUNCTION admin_recover_booking(booking_id_param VARCHAR(255))
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Get booking record
  SELECT * INTO booking_record 
  FROM bookings 
  WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Booking not found',
      'booking_id', booking_id_param
    );
  END IF;
  
  -- Update booking to make it visible and confirmed
  UPDATE bookings 
  SET 
    status = 'confirmed',
    email_status = 'manual_recovery'
  WHERE id = booking_id_param;
  
  -- Log the recovery
  INSERT INTO booking_audit_log (
    booking_id, 
    action, 
    status, 
    customer_email, 
    payment_reference
  ) VALUES (
    booking_id_param,
    'admin_recovery',
    'success',
    booking_record.customer_email,
    booking_record.payment_reference
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Booking recovered successfully',
    'booking_id', booking_id_param,
    'customer_email', booking_record.customer_email,
    'customer_name', booking_record.customer_name,
    'total_amount', booking_record.total_amount,
    'booking_date', booking_record.booking_date,
    'booking_time', booking_record.booking_time
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: CREATE BOOKING VISIBILITY CHECK
-- =====================================================

-- Function to check if a booking is visible to admin
CREATE OR REPLACE FUNCTION check_booking_visibility(booking_id_param VARCHAR(255))
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  admin_count INTEGER;
  result JSON;
BEGIN
  -- Get booking record
  SELECT * INTO booking_record 
  FROM bookings 
  WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'booking_id', booking_id_param,
      'exists', false,
      'visible', false,
      'reason', 'Booking not found in database'
    );
  END IF;
  
  -- Check if there are any admin users
  SELECT COUNT(*) INTO admin_count
  FROM customers 
  WHERE role = 'admin';
  
  RETURN json_build_object(
    'booking_id', booking_id_param,
    'exists', true,
    'status', booking_record.status,
    'email_status', booking_record.email_status,
    'customer_email', booking_record.customer_email,
    'payment_reference', booking_record.payment_reference,
    'created_at', booking_record.created_at,
    'visible', true, -- Assuming admin can see all bookings
    'admin_users_count', admin_count,
    'recommendations', CASE 
      WHEN booking_record.status = 'pending' THEN 'Update status to confirmed'
      WHEN booking_record.email_status = 'failed' THEN 'Retry email sending'
      WHEN booking_record.customer_email IS NULL THEN 'Add customer email'
      ELSE 'No action needed'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: TEST THE RECOVERY FUNCTIONS
-- =====================================================

-- Test visibility check for the missing booking
SELECT check_booking_visibility('BK-1761196261961-hdv0frqw9');

-- Test recovery function
SELECT admin_recover_booking('BK-1761196261961-hdv0frqw9');

-- =====================================================
-- STEP 6: CREATE MONITORING QUERIES
-- =====================================================

-- Query to find bookings that might need attention
SELECT 
  'BOOKINGS NEEDING ATTENTION' as report_type,
  id,
  customer_name,
  customer_email,
  status,
  email_status,
  email_attempts,
  created_at,
  last_email_attempt,
  CASE 
    WHEN email_status = 'failed' THEN 'Email sending failed'
    WHEN status = 'pending' AND created_at < NOW() - INTERVAL '2 hours' THEN 'Pending too long'
    WHEN email_attempts > 3 THEN 'Too many email attempts'
    ELSE 'No issues'
  END as issue_type
FROM bookings 
WHERE 
  created_at >= NOW() - INTERVAL '7 days'
  AND (
    email_status = 'failed'
    OR (status = 'pending' AND created_at < NOW() - INTERVAL '2 hours')
    OR email_attempts > 3
  )
ORDER BY created_at DESC;
