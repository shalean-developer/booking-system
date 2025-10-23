-- Root Cause Fix: Improve Booking Creation Error Handling
-- This script adds better monitoring and error handling to prevent future missing bookings

-- =====================================================
-- STEP 1: CREATE BOOKING AUDIT LOG TABLE
-- =====================================================

-- Create a table to track all booking creation attempts
CREATE TABLE IF NOT EXISTS booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'email_sent', 'email_failed', 'rollback'
  status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'partial'
  error_message TEXT,
  customer_email VARCHAR(255),
  payment_reference VARCHAR(255),
  admin_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_booking_id ON booking_audit_log(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_action ON booking_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_status ON booking_audit_log(status);
CREATE INDEX IF NOT EXISTS idx_booking_audit_log_created_at ON booking_audit_log(created_at);

-- =====================================================
-- STEP 2: CREATE BOOKING RECOVERY FUNCTION
-- =====================================================

-- Function to recover failed bookings
CREATE OR REPLACE FUNCTION recover_failed_booking(booking_id_param VARCHAR(255))
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
BEGIN
  -- Check if booking exists
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
  
  -- Update booking status to confirmed if it's pending
  IF booking_record.status = 'pending' THEN
    UPDATE bookings 
    SET 
      status = 'confirmed'
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
      'recovered',
      'success',
      booking_record.customer_email,
      booking_record.payment_reference
    );
    
    RETURN json_build_object(
      'success', true,
      'message', 'Booking recovered successfully',
      'booking_id', booking_id_param,
      'old_status', booking_record.status,
      'new_status', 'confirmed'
    );
  ELSE
    RETURN json_build_object(
      'success', true,
      'message', 'Booking already has correct status',
      'booking_id', booking_id_param,
      'status', booking_record.status
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 3: CREATE BOOKING MONITORING VIEW
-- =====================================================

-- Create a view to monitor booking creation issues
CREATE OR REPLACE VIEW booking_creation_monitor AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_bookings,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
  ROUND(
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as success_rate_percent
FROM bookings 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- STEP 4: CREATE FAILED BOOKING ALERT FUNCTION
-- =====================================================

-- Function to identify potentially failed bookings
CREATE OR REPLACE FUNCTION check_failed_bookings()
RETURNS TABLE (
  booking_id VARCHAR(255),
  customer_email VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMPTZ,
  hours_since_creation NUMERIC,
  issue_description VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id::VARCHAR(255),
    b.customer_email::VARCHAR(255),
    b.status::VARCHAR(50),
    b.created_at,
    EXTRACT(EPOCH FROM (NOW() - b.created_at)) / 3600 as hours_since_creation,
    CASE 
      WHEN b.status = 'pending' AND b.created_at < NOW() - INTERVAL '2 hours' 
      THEN 'Booking pending for more than 2 hours'::VARCHAR(255)
      WHEN b.status = 'failed' 
      THEN 'Booking marked as failed'::VARCHAR(255)
      WHEN b.customer_email IS NULL 
      THEN 'Missing customer email'::VARCHAR(255)
      WHEN b.payment_reference IS NULL 
      THEN 'Missing payment reference'::VARCHAR(255)
      ELSE 'No issues detected'::VARCHAR(255)
    END as issue_description
  FROM bookings b
  WHERE 
    b.created_at >= NOW() - INTERVAL '24 hours'
    AND (
      b.status = 'pending' AND b.created_at < NOW() - INTERVAL '2 hours'
      OR b.status = 'failed'
      OR b.customer_email IS NULL
      OR b.payment_reference IS NULL
    )
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: IMPROVE RLS POLICIES FOR ADMIN ACCESS
-- =====================================================

-- Ensure admin can see all bookings regardless of status
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.auth_user_id = auth.uid()
      AND c.role = 'admin'
    )
  );

-- =====================================================
-- STEP 6: CREATE BOOKING INTEGRITY CHECK FUNCTION
-- =====================================================

-- Function to check booking data integrity
CREATE OR REPLACE FUNCTION check_booking_integrity(booking_id_param VARCHAR(255))
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  issues TEXT[] := '{}';
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
      'issues', ARRAY['Booking not found']
    );
  END IF;
  
  -- Check for data integrity issues
  IF booking_record.customer_name IS NULL OR booking_record.customer_name = '' THEN
    issues := issues || 'Missing customer name';
  END IF;
  
  IF booking_record.customer_email IS NULL OR booking_record.customer_email = '' THEN
    issues := issues || 'Missing customer email';
  END IF;
  
  IF booking_record.payment_reference IS NULL OR booking_record.payment_reference = '' THEN
    issues := issues || 'Missing payment reference';
  END IF;
  
  IF booking_record.total_amount IS NULL OR booking_record.total_amount <= 0 THEN
    issues := issues || 'Invalid total amount';
  END IF;
  
  IF booking_record.booking_date IS NULL THEN
    issues := issues || 'Missing booking date';
  END IF;
  
  IF booking_record.booking_time IS NULL THEN
    issues := issues || 'Missing booking time';
  END IF;
  
  RETURN json_build_object(
    'booking_id', booking_id_param,
    'exists', true,
    'status', booking_record.status,
    'customer_email', booking_record.customer_email,
    'payment_reference', booking_record.payment_reference,
    'total_amount', booking_record.total_amount,
    'created_at', booking_record.created_at,
    'issues', issues,
    'integrity_score', CASE 
      WHEN array_length(issues, 1) IS NULL THEN 100
      ELSE 100 - (array_length(issues, 1) * 20)
    END
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: TEST THE NEW FUNCTIONS
-- =====================================================

-- Test the recovery function with the missing booking
SELECT recover_failed_booking('BK-1761196261961-hdv0frqw9');

-- Test the integrity check
SELECT check_booking_integrity('BK-1761196261961-hdv0frqw9');

-- Check for any failed bookings
SELECT * FROM check_failed_bookings();

-- View booking creation monitor
SELECT * FROM booking_creation_monitor LIMIT 7;
